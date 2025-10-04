import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import chalk from 'chalk'
import { promisify } from 'util'
import chokidar from 'chokidar'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const readdir = promisify(fs.readdir)
const stat = promisify(fs.stat)

class CrimsonHandler {
    constructor(bot, db, config) {
        this.bot = bot
        this.db = db
        this.config = config
        this.plugins = new Map()
        this.commands = new Map()
        this.categories = new Map()
        this.cooldowns = new Map()
        this.permissions = new Map()
        this.middleware = []
        this.hooks = {
            beforeCommand: [],
            afterCommand: [],
            onError: [],
            onSuccess: []
        }
        this.pluginStats = new Map()
        this.commandUsage = new Map()
        this.failedPlugins = new Map()
        this.watcher = null
        this.isWatching = false
    }

    async initialize() {
        console.log(chalk.blue('⚙️  Initializing Crimson Handler...'))
        await this.setup()
        await this.loadPlugins()
        await this.startPluginWatcher()
        console.log(chalk.green('✓ Crimson Handler initialized successfully'))
    }

    async setup() {
        this.middleware.push(
            this.checkBlacklist.bind(this),
            this.checkMaintenance.bind(this),
            this.checkCooldown.bind(this),
            this.checkPermissions.bind(this),
            this.logCommand.bind(this),
            this.validateArgs.bind(this)
        )

        this.hooks.beforeCommand.push(async (m, cmd) => this.updateCommandStats(cmd.command[0]))
        this.hooks.afterCommand.push(async (m, cmd, result) => this.saveCommandHistory(m, cmd, result))
        this.hooks.onError.push(async (m, cmd, error) => this.handleCommandError(m, cmd, error))
        this.hooks.onSuccess.push(async (m, cmd) => this.incrementSuccessCount(cmd.command[0]))

        this.permissions.set('owner', (data) => data.isOwner)
        this.permissions.set('admin', (data) => data.isAdmin || data.isOwner)
        this.permissions.set('group', (data) => data.isGroup)
        this.permissions.set('private', (data) => !data.isGroup)
        this.permissions.set('botAdmin', (data) => data.isBotAdmin)
    }

    async loadPlugins() {
        console.log(chalk.blue('\n📦 Loading plugins...'))
        const pluginsDir = path.join(__dirname, 'plugins')
        if (!fs.existsSync(pluginsDir)) {
            fs.mkdirSync(pluginsDir, { recursive: true })
            console.log(chalk.yellow('  ⚠ Plugins directory created'))
            return
        }

        const files = await this.getPluginFiles(pluginsDir)
        if (files.length === 0) {
            console.log(chalk.yellow('  ⚠ No plugins found'))
            return
        }

        let loaded = 0, failed = 0
        for (const file of files) {
            try {
                await this.loadPlugin(file)
                loaded++
            } catch (error) {
                failed++
                this.failedPlugins.set(file, error.message)
                console.error(chalk.red(`  ✗ Failed to load: ${path.basename(file)}`), error)
            }
        }

        console.log(chalk.green(`\n✓ Plugins loaded: ${loaded}`))
        if (failed > 0) console.log(chalk.red(`✗ Plugins failed: ${failed}`))

        this.categorizePlugins()
    }

    async getPluginFiles(dir, fileList = []) {
        for (const file of await readdir(dir)) {
            const filePath = path.join(dir, file)
            if ((await stat(filePath)).isDirectory()) {
                await this.getPluginFiles(filePath, fileList)
            } else if (file.endsWith('.js') && !file.startsWith('_')) {
                fileList.push(filePath)
            }
        }
        return fileList
    }

    async loadPlugin(filePath) {
        const fileName = path.basename(filePath)
        const pluginName = fileName.replace('.js', '')

        if (this.plugins.has(pluginName)) await this.unloadPlugin(pluginName)

        const module = await import(`file://${filePath}?update=${Date.now()}`)
        const plugin = module.default

        if (!plugin || !plugin.command) throw new Error('Invalid plugin structure')

        plugin.filePath = filePath
        plugin.fileName = fileName

        const commands = Array.isArray(plugin.command) ? plugin.command : [plugin.command]
        for (const cmd of commands) {
            if (this.commands.has(cmd)) console.log(chalk.yellow(`  ⚠ Overwriting command '${cmd}'`))
            this.commands.set(cmd, plugin)
        }

        this.plugins.set(pluginName, plugin)
        this.initializePluginStats(pluginName)
        console.log(chalk.green(`  ✓ Loaded: ${fileName} (${commands.length} cmd(s))`))
    }

    async unloadPlugin(pluginName) {
        const plugin = this.plugins.get(pluginName)
        if (!plugin) return

        const commands = Array.isArray(plugin.command) ? plugin.command : [plugin.command]
        for (const cmd of commands) this.commands.delete(cmd)

        this.plugins.delete(pluginName)
        this.pluginStats.delete(pluginName)
        console.log(chalk.yellow(`  ✓ Unloaded: ${pluginName}`))
    }

    async reloadPlugin(pluginName) {
        const plugin = this.plugins.get(pluginName)
        if (!plugin || !plugin.filePath) throw new Error('Plugin not found')
        await this.loadPlugin(plugin.filePath) // unload is called from loadPlugin
        console.log(chalk.green(`✓ Reloaded: ${pluginName}`))
    }

    categorizePlugins() {
        this.categories.clear()
        for (const [name, plugin] of this.plugins.entries()) {
            const category = plugin.category || 'general'
            if (!this.categories.has(category)) this.categories.set(category, [])
            this.categories.get(category).push(name)
        }
    }

    async startPluginWatcher() {
        if (this.isWatching) return
        console.log(chalk.blue('👁️  Starting plugin watcher...'))
        const pluginsDir = path.join(__dirname, 'plugins')
        this.watcher = chokidar.watch(pluginsDir, { persistent: true, ignoreInitial: true, awaitWriteFinish: { stabilityThreshold: 500 }})
            .on('add', async filePath => this.handlePluginEvent(filePath, 'add'))
            .on('change', async filePath => this.handlePluginEvent(filePath, 'change'))
            .on('unlink', async filePath => this.handlePluginEvent(filePath, 'unlink'))
        this.isWatching = true
        console.log(chalk.green('✓ Plugin watcher started'))
    }

    async handlePluginEvent(filePath, event) {
        if (!filePath.endsWith('.js') || path.basename(filePath).startsWith('_')) return
        const pluginName = path.basename(filePath, '.js')
        const eventHandlers = {
            add: { msg: `📦 New plugin: ${pluginName}`, action: this.loadPlugin, argument: filePath, success: `✓ Hot loaded` },
            change: { msg: `🔄 Plugin modified: ${pluginName}`, action: this.reloadPlugin, argument: pluginName, success: `✓ Hot reloaded` },
            unlink: { msg: `🗑️  Plugin removed: ${pluginName}`, action: this.unloadPlugin, argument: pluginName, success: `✓ Unloaded` }
        }
        const handler = eventHandlers[event]
        if (!handler) return

        console.log(chalk.blue(`\n${handler.msg}`))
        try {
            await handler.action.call(this, handler.argument)
            console.log(chalk.green(`${handler.success}: ${pluginName}`))
        } catch (error) {
            console.error(chalk.red(`✗ Failed to ${event} plugin: ${pluginName}`), error)
        }
    }

    async handleCommand(m, data) {
        const plugin = this.getPlugin(data.command)
        if (!plugin) return

        try {
            for (const hook of this.hooks.beforeCommand) await hook(m, plugin, data.args)
            for (const middleware of this.middleware) {
                if (await middleware(m, data, plugin) === false) return
            }

            const context = this.buildContext(m, data, plugin)
            const result = await plugin.handler(m, context)

            for (const hook of this.hooks.afterCommand) await hook(m, plugin, result)
            for (const hook of this.hooks.onSuccess) await hook(m, plugin)

        } catch (error) {
            console.error(chalk.red(`❌ Command error [${data.command}]:`), error)
            for (const hook of this.hooks.onError) await hook(m, plugin, error)
            await this.sendErrorMessage(data.from, error, data.command)
        }
    }

    getPlugin(command) {
        return this.commands.get(command) || null
    }

    buildContext(m, data, plugin) {
        return {
            ...data,
            conn: this.bot.sock,
            bot: this.bot,
            db: this.db,
            handler: this,
            config: this.config,
            usedPrefix: data.body.charAt(0),
            reply: (text, options) => this.bot.reply(data.from, text, m, options),
            send: (content, options) => this.bot.sendMessage(data.from, content, options),
            react: (emoji) => this.react(m, emoji),
            delete: () => this.deleteMessage(m),
            download: () => this.bot.downloadMediaMessage(m)
        }
    }
    
    async checkBlacklist(m, data) {
        if (data.isOwner) return true
        const isBlacklisted = await this.db.isBlacklisted(data.sender) || (data.isGroup && await this.db.isGroupBlacklisted(data.from))
        if (isBlacklisted) {
            console.log(chalk.yellow(`⚠️  Blocked request from: ${data.sender} in ${data.from}`))
            return false
        }
        return true
    }

    async checkMaintenance(m, data) {
        if (data.isOwner) return true
        if (await this.db.isMaintenanceMode()) {
            await this.bot.reply(data.from, '⚠️ Bot is in maintenance. Please try again later.', m)
            return false
        }
        return true
    }

    async checkCooldown(m, data, plugin) {
        if (data.isOwner || !plugin.cooldown) return true

        const key = `${data.sender}-${data.command}`
        const cooldownEnd = this.cooldowns.get(key)

        if (cooldownEnd && Date.now() < cooldownEnd) {
            const remaining = Math.ceil((cooldownEnd - Date.now()) / 1000)
            await this.bot.reply(data.from, `⏰ Please wait ${remaining}s before using this command again.`, m)
            return false
        }

        this.cooldowns.set(key, Date.now() + (plugin.cooldown * 1000))
        setTimeout(() => this.cooldowns.delete(key), plugin.cooldown * 1000)

        return true
    }

    async checkPermissions(m, data, plugin) {
        const checks = {
            group: { check: () => !data.isGroup, msg: '❌ Group command only.' },
            private: { check: () => data.isGroup, msg: '❌ Private command only.' },
            owner: { check: () => !data.isOwner, msg: '❌ Owner command only.' },
            admin: { check: () => data.isGroup && !data.isAdmin, msg: '❌ Admin command only.' },
            botAdmin: { check: () => data.isGroup && !data.isBotAdmin, msg: '❌ Bot must be admin.' }
        }
        for (const perm in checks) {
            if (plugin[perm] && checks[perm].check()) {
                await this.bot.reply(data.from, checks[perm].msg, m)
                return false
            }
        }
        return true
    }

    async logCommand(m, data) {
        console.log(chalk.cyan(`📝 [${data.command}] from ${data.pushName} in ${data.isGroup ? 'Group' : 'Private'}`))
        return true
    }

    async validateArgs(m, data, plugin) {
        const requiredArgs = plugin.minArgs || (plugin.args ? 1 : 0)
        if (data.args.length < requiredArgs) {
            let usage = `❌ Incorrect usage!\n*Usage:* ${plugin.usage || `${data.body.charAt(0)}${data.command}`}`
            if (plugin.example) usage += `\n*Example:* ${plugin.example}`
            await this.bot.reply(data.from, usage, m)
            return false
        }
        return true
    }

    async react(m, emoji) {
        try { await this.bot.sock.sendMessage(m.key.remoteJid, { react: { text: emoji, key: m.key } }) }
        catch (e) { console.error(chalk.red('Failed to react:'), e) }
    }

    async deleteMessage(m) {
        try { await this.bot.sock.sendMessage(m.key.remoteJid, { delete: m.key }) }
        catch (e) { console.error(chalk.red('Failed to delete:'), e) }
    }

    async sendErrorMessage(chatId, error, command) {
        const errorText = `❌ Error in *${command}*:\n${error.message}`
        try { await this.bot.sendText(chatId, errorText) }
        catch (e) { console.error(chalk.red('Failed to send error message:'), e) }
    }

    initializePluginStats(pluginName) {
        this.pluginStats.set(pluginName, { used: 0, success: 0, failed: 0, lastUsed: null })
    }

    updateCommandStats(command) {
        const currentCount = this.commandUsage.get(command) || 0
        this.commandUsage.set(command, currentCount + 1)
    }

    saveCommandHistory(m, plugin, result) {
        // This could be expanded to save to a database
    }

    handleCommandError(m, plugin, error) {
        const stats = this.pluginStats.get(plugin.fileName.replace('.js', ''))
        if (stats) stats.failed++
    }

    incrementSuccessCount(command) {
        const plugin = this.getPlugin(command)
        if (!plugin) return
        const stats = this.pluginStats.get(plugin.fileName.replace('.js', ''))
        if (stats) {
            stats.success++
            stats.used++
            stats.lastUsed = Date.now()
        }
    }

    listPlugins() {
        console.log(chalk.cyan('\n╔═══════════ LOADED PLUGINS ═══════════╗\n'))
        for (const [category, plugins] of this.categories.entries()) {
            console.log(chalk.yellow(`📁 ${category.toUpperCase()}:`))
            for (const pluginName of plugins) {
                const plugin = this.plugins.get(pluginName)
                console.log(chalk.white(`  • ${pluginName}`), chalk.gray(`(${plugin.command.join(', ')})`))
            }
        }
        console.log(chalk.cyan('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
    }

    async cleanup() {
        console.log(chalk.blue('🧹 Cleaning up handler...'))
        if (this.watcher) await this.watcher.close()
        this.cooldowns.clear()
        console.log(chalk.green('✓ Handler cleanup completed'))
    }
}

export default CrimsonHandler
