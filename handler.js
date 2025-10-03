import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import chalk from 'chalk'
import { promisify } from 'util'
import chokidar from 'chokidar'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const readdir = promisify(fs.readdir)
const stat = promisify(fs.stat)

// ═══════════════════════════════════════════════════
// CRIMSON HANDLER - PLUGIN SYSTEM
// ═══════════════════════════════════════════════════

class CrimsonHandler {
    constructor(bot, db, config) {
        this.bot = bot
        this.db = db
        this.config = config
        this.plugins = new Map()
        this.commands = new Map()
        this.categories = new Map()
        this.aliases = new Map()
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
        this.loadQueue = []
        this.isProcessingQueue = false
        this.reloadCount = 0
        this.maxReloads = 10
        this.reloadResetTime = 60000 // 1 minute
        this.lastReloadTime = Date.now()
        this.cache = new Map()
        this.cacheExpiry = 300000 // 5 minutes
    }

    // ═══════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════

    async initialize() {
        console.log(chalk.blue('⚙️  Initializing handler...'))

        await this.setupMiddleware()
        await this.setupHooks()
        await this.setupPermissions()
        await this.loadPlugins()
        await this.startPluginWatcher()
        
        // Setup cache cleanup interval
        setInterval(() => this.cleanupCache(), this.cacheExpiry)

        console.log(chalk.green('✓ Handler initialized successfully'))
    }

    async setupMiddleware() {
        this.middleware.push(
            this.checkBlacklist.bind(this),
            this.checkMaintenance.bind(this),
            this.checkAntiSpam.bind(this),
            this.checkCooldown.bind(this),
            this.checkPermissions.bind(this),
            this.logCommand.bind(this),
            this.validateArgs.bind(this)
        )
    }

    async setupHooks() {
        this.hooks.beforeCommand.push(async (m, cmd, args) => {
            await this.updateCommandStats(cmd.command)
        })

        this.hooks.afterCommand.push(async (m, cmd, result) => {
            await this.saveCommandHistory(m, cmd, result)
        })

        this.hooks.onError.push(async (m, cmd, error) => {
            await this.handleCommandError(m, cmd, error)
        })

        this.hooks.onSuccess.push(async (m, cmd) => {
            await this.incrementSuccessCount(cmd.command)
        })
    }

    async setupPermissions() {
        this.permissions.set('owner', (data) => data.isOwner)
        this.permissions.set('sub_owner', (data) => data.isSubOwner || data.isOwner)
        this.permissions.set('moderator', (data) => data.isModerator || data.isSubOwner || data.isOwner)
        this.permissions.set('admin', (data) => data.isAdmin || data.isModerator || data.isSubOwner || data.isOwner)
        this.permissions.set('group', (data) => data.isGroup)
        this.permissions.set('private', (data) => !data.isGroup)
        this.permissions.set('botAdmin', (data) => data.isBotAdmin)
        this.permissions.set('premium', async (data) => await this.db.isPremiumUser(data.sender))
        this.permissions.set('registered', async (data) => await this.db.isRegisteredUser(data.sender))
    }

    // ═══════════════════════════════════════════════════
    // PLUGIN LOADING
    // ═══════════════════════════════════════════════════

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

        let loaded = 0
        let failed = 0

        // Load plugins in parallel for better performance
        const loadPromises = files.map(async (file) => {
            try {
                await this.loadPlugin(file)
                loaded++
            } catch (error) {
                failed++
                this.failedPlugins.set(file, error.message)
                console.log(chalk.red(`  ✗ Failed to load: ${path.basename(file)}`))
                console.log(chalk.red(`    Error: ${error.message}`))
            }
        })

        await Promise.all(loadPromises)

        console.log(chalk.green(`\n✓ Plugins loaded: ${loaded}`))
        if (failed > 0) {
            console.log(chalk.red(`✗ Plugins failed: ${failed}`))
        }

        this.categorizePlugins()
        this.buildAliasMap()
    }

    async getPluginFiles(dir, fileList = []) {
        const files = await readdir(dir)

        for (const file of files) {
            const filePath = path.join(dir, file)
            const fileStat = await stat(filePath)

            if (fileStat.isDirectory()) {
                await this.getPluginFiles(filePath, fileList)
            } else if (file.endsWith('.js') && !file.startsWith('_')) {
                fileList.push(filePath)
            }
        }

        return fileList
    }

    async loadPlugin(filePath) {
        try {
            const fileName = path.basename(filePath)
            const pluginName = fileName.replace('.js', '')

            if (this.plugins.has(pluginName)) {
                await this.unloadPlugin(pluginName)
            }

            // Clear module cache to ensure fresh import
            const modulePath = `${filePath}?update=${Date.now()}`
            if (require.cache[require.resolve(modulePath)]) {
                delete require.cache[require.resolve(modulePath)]
            }

            const module = await import(modulePath)
            const plugin = module.default

            if (!plugin) {
                throw new Error('Plugin does not export default')
            }

            if (!plugin.command && !plugin.commands) {
                throw new Error('Plugin must have command or commands property')
            }

            // Validate plugin structure
            if (typeof plugin !== 'function') {
                throw new Error('Plugin must be a function')
            }

            plugin.filePath = filePath
            plugin.fileName = fileName
            plugin.loadedAt = Date.now()
            plugin.disabled = plugin.disabled || false

            const commands = Array.isArray(plugin.command) ? plugin.command : [plugin.command]
            if (plugin.commands) {
                commands.push(...plugin.commands)
            }

            // Validate command names
            for (const cmd of commands) {
                if (typeof cmd !== 'string' || cmd.length === 0) {
                    throw new Error(`Invalid command name: ${cmd}`)
                }
                
                if (this.commands.has(cmd)) {
                    console.log(chalk.yellow(`  ⚠ Command '${cmd}' already exists, overwriting`))
                }
                this.commands.set(cmd, plugin)
            }

            this.plugins.set(pluginName, plugin)
            this.initializePluginStats(pluginName)

            console.log(chalk.green(`  ✓ Loaded: ${fileName} (${commands.length} command${commands.length > 1 ? 's' : ''})`))

            return plugin
        } catch (error) {
            throw new Error(`Failed to load plugin: ${error.message}`)
        }
    }

    async unloadPlugin(pluginName) {
        const plugin = this.plugins.get(pluginName)
        if (!plugin) return

        const commands = Array.isArray(plugin.command) ? plugin.command : [plugin.command]
        if (plugin.commands) {
            commands.push(...plugin.commands)
        }

        for (const cmd of commands) {
            this.commands.delete(cmd)
        }

        this.plugins.delete(pluginName)
        this.pluginStats.delete(pluginName)

        if (plugin.filePath) {
            const modulePath = require.resolve(plugin.filePath)
            if (require.cache[modulePath]) {
                delete require.cache[modulePath]
            }
        }
    }

    async reloadPlugin(pluginName) {
        // Check reload rate limit
        const now = Date.now()
        if (now - this.lastReloadTime > this.reloadResetTime) {
            this.reloadCount = 0
            this.lastReloadTime = now
        }

        if (this.reloadCount >= this.maxReloads) {
            const waitTime = Math.ceil((this.lastReloadTime + this.reloadResetTime - now) / 1000)
            throw new Error(`Reload rate limit exceeded. Please wait ${waitTime} seconds.`)
        }

        this.reloadCount++

        const plugin = this.plugins.get(pluginName)
        if (!plugin || !plugin.filePath) {
            throw new Error('Plugin not found or no file path')
        }

        await this.unloadPlugin(pluginName)
        await this.loadPlugin(plugin.filePath)

        console.log(chalk.green(`✓ Reloaded: ${pluginName}`))
    }

    async reloadPlugins() {
        console.log(chalk.blue('\n🔄 Reloading all plugins...'))

        const pluginNames = Array.from(this.plugins.keys())
        let reloaded = 0
        let failed = 0

        // Reset reload count for full reload
        this.reloadCount = 0
        this.lastReloadTime = Date.now()

        // Reload plugins in parallel
        const reloadPromises = pluginNames.map(async (name) => {
            try {
                await this.reloadPlugin(name)
                reloaded++
            } catch (error) {
                failed++
                console.log(chalk.red(`  ✗ Failed to reload: ${name}`))
                console.log(chalk.red(`    Error: ${error.message}`))
            }
        })

        await Promise.all(reloadPromises)

        console.log(chalk.green(`\n✓ Reloaded: ${reloaded} plugins`))
        if (failed > 0) {
            console.log(chalk.red(`✗ Failed: ${failed} plugins`))
        }
    }

    categorizePlugins() {
        this.categories.clear()

        for (const [name, plugin] of this.plugins.entries()) {
            const category = plugin.tags?.[0] || plugin.category || 'general'
            
            if (!this.categories.has(category)) {
                this.categories.set(category, [])
            }

            this.categories.get(category).push(name)
        }
    }

    buildAliasMap() {
        this.aliases.clear()

        for (const [cmd, plugin] of this.commands.entries()) {
            const allCommands = [
                ...(Array.isArray(plugin.command) ? plugin.command : [plugin.command]),
                ...(plugin.commands || [])
            ]

            for (const command of allCommands) {
                if (command !== cmd) {
                    this.aliases.set(command, cmd)
                }
            }
        }
    }

    // ═══════════════════════════════════════════════════
    // HOT RELOAD - PLUGIN WATCHER
    // ═══════════════════════════════════════════════════

    async startPluginWatcher() {
        if (this.isWatching) return

        console.log(chalk.blue('👁️  Starting plugin watcher...'))

        const pluginsDir = path.join(__dirname, 'plugins')

        this.watcher = chokidar.watch(pluginsDir, {
            ignored: /(^|[\/\\])\../,
            persistent: true,
            ignoreInitial: true,
            awaitWriteFinish: {
                stabilityThreshold: 500,
                pollInterval: 100
            }
        })

        this.watcher
            .on('add', (filePath) => this.handlePluginAdd(filePath))
            .on('change', (filePath) => this.handlePluginChange(filePath))
            .on('unlink', (filePath) => this.handlePluginRemove(filePath))
            .on('error', (error) => {
                console.error(chalk.red('Plugin watcher error:'), error.message)
            })

        this.isWatching = true
        console.log(chalk.green('✓ Plugin watcher started'))
    }

    async handlePluginAdd(filePath) {
        if (!filePath.endsWith('.js') || path.basename(filePath).startsWith('_')) return

        console.log(chalk.blue(`\n📦 New plugin detected: ${path.basename(filePath)}`))
        
        try {
            await this.loadPlugin(filePath)
            console.log(chalk.green(`✓ Hot loaded: ${path.basename(filePath)}`))
        } catch (error) {
            console.log(chalk.red(`✗ Failed to hot load: ${error.message}`))
        }
    }

    async handlePluginChange(filePath) {
        if (!filePath.endsWith('.js') || path.basename(filePath).startsWith('_')) return

        const pluginName = path.basename(filePath).replace('.js', '')
        
        console.log(chalk.blue(`\n🔄 Plugin modified: ${pluginName}`))

        try {
            await this.reloadPlugin(pluginName)
            console.log(chalk.green(`✓ Hot reloaded: ${pluginName}`))
        } catch (error) {
            console.log(chalk.red(`✗ Failed to hot reload: ${error.message}`))
        }
    }

    async handlePluginRemove(filePath) {
        if (!filePath.endsWith('.js')) return

        const pluginName = path.basename(filePath).replace('.js', '')
        
        console.log(chalk.yellow(`\n🗑️  Plugin removed: ${pluginName}`))

        try {
            await this.unloadPlugin(pluginName)
            console.log(chalk.green(`✓ Unloaded: ${pluginName}`))
        } catch (error) {
            console.log(chalk.red(`✗ Failed to unload: ${error.message}`))
        }
    }

    stopPluginWatcher() {
        if (this.watcher) {
            this.watcher.close()
            this.isWatching = false
            console.log(chalk.yellow('⚠️  Plugin watcher stopped'))
        }
    }

    // ═══════════════════════════════════════════════════
    // COMMAND EXECUTION
    // ═══════════════════════════════════════════════════

    async handle(m, messageData) {
        if (!messageData.isCmd) return

        const { command, args, text } = messageData

        const plugin = this.getPlugin(command)
        if (!plugin || plugin.disabled) return

        try {
            for (const hook of this.hooks.beforeCommand) {
                await hook(m, plugin, args)
            }

            for (const middleware of this.middleware) {
                const result = await middleware(m, messageData, plugin)
                if (result === false) return
            }

            const context = this.buildContext(m, messageData, plugin)

            const startTime = Date.now()
            const result = await plugin(m, context)
            const executionTime = Date.now() - startTime

            // Update execution time stats
            this.updateExecutionTimeStats(plugin, executionTime)

            for (const hook of this.hooks.afterCommand) {
                await hook(m, plugin, result)
            }

            for (const hook of this.hooks.onSuccess) {
                await hook(m, plugin)
            }

        } catch (error) {
            console.error(chalk.red(`❌ Command error [${command}]:`, error.message))

            for (const hook of this.hooks.onError) {
                await hook(m, plugin, error)
            }

            await this.sendErrorMessage(messageData.from, error, command)
        }
    }

    getPlugin(command) {
        // Check cache first
        if (this.cache.has(`plugin:${command}`)) {
            const cached = this.cache.get(`plugin:${command}`)
            if (Date.now() < cached.expiry) {
                return cached.value
            }
            this.cache.delete(`plugin:${command}`)
        }

        let plugin = null

        if (this.commands.has(command)) {
            plugin = this.commands.get(command)
        } else if (this.aliases.has(command)) {
            const mainCommand = this.aliases.get(command)
            plugin = this.commands.get(mainCommand)
        }

        // Cache the result
        if (plugin) {
            this.cache.set(`plugin:${command}`, {
                value: plugin,
                expiry: Date.now() + 60000 // Cache for 1 minute
            })
        }

        return plugin
    }

    buildContext(m, messageData, plugin) {
        return {
            conn: this.bot.sock,
            bot: this.bot,
            db: this.db,
            handler: this,
            config: this.config,
            command: messageData.command,
            usedPrefix: this.config.prefix,
            prefix: this.config.prefix,
            args: messageData.args,
            text: messageData.text,
            body: messageData.body,
            from: messageData.from,
            sender: messageData.sender,
            pushName: messageData.pushName,
            isGroup: messageData.isGroup,
            isOwner: messageData.isOwner,
            isSubOwner: messageData.isSubOwner,
            isModerator: messageData.isModerator,
            isAdmin: messageData.isAdmin,
            isBotAdmin: messageData.isBotAdmin,
            groupMetadata: messageData.groupMetadata,
            groupAdmins: messageData.groupAdmins,
            quoted: messageData.quoted,
            mentionedJid: messageData.mentionedJid,
            isMedia: messageData.isMedia,
            messageType: messageData.messageType,
            reply: async (text, options) => await this.bot.reply(messageData.from, text, m, options),
            send: async (content, options) => await this.bot.sendMessage(messageData.from, content, options),
            react: async (emoji) => await this.react(m, emoji),
            delete: async () => await this.deleteMessage(m),
            download: async () => await this.bot.downloadMediaMessage(m),
            // Add utility functions
            sanitizeInput: (input) => this.sanitizeInput(input),
            getCache: (key) => this.getCache(key),
            setCache: (key, value, ttl = 60000) => this.setCache(key, value, ttl),
            deleteCache: (key) => this.deleteCache(key)
        }
    }

    // ═══════════════════════════════════════════════════
    // MIDDLEWARE
    // ═══════════════════════════════════════════════════

    async checkBlacklist(m, data, plugin) {
        if (data.isOwner) return true

        // Check cache first
        const blacklistCacheKey = `blacklist:${data.sender}`
        if (this.cache.has(blacklistCacheKey)) {
            const cached = this.cache.get(blacklistCacheKey)
            if (Date.now() < cached.expiry) {
                return !cached.value
            }
            this.cache.delete(blacklistCacheKey)
        }

        const isBlacklisted = await this.db.isBlacklisted(data.sender)
        
        // Cache the result
        this.cache.set(blacklistCacheKey, {
            value: isBlacklisted,
            expiry: Date.now() + 300000 // Cache for 5 minutes
        })

        if (isBlacklisted) {
            console.log(chalk.yellow(`⚠️  Blacklisted user: ${data.sender}`))
            return false
        }

        if (data.isGroup) {
            const groupBlacklistCacheKey = `groupBlacklist:${data.from}`
            
            if (this.cache.has(groupBlacklistCacheKey)) {
                const cached = this.cache.get(groupBlacklistCacheKey)
                if (Date.now() < cached.expiry) {
                    return !cached.value
                }
                this.cache.delete(groupBlacklistCacheKey)
            }

            const isGroupBlacklisted = await this.db.isGroupBlacklisted(data.from)
            
            // Cache the result
            this.cache.set(groupBlacklistCacheKey, {
                value: isGroupBlacklisted,
                expiry: Date.now() + 300000 // Cache for 5 minutes
            })

            if (isGroupBlacklisted) {
                console.log(chalk.yellow(`⚠️  Blacklisted group: ${data.from}`))
                return false
            }
        }

        return true
    }

    async checkMaintenance(m, data, plugin) {
        if (data.isOwner) return true

        // Check cache first
        const maintenanceCacheKey = 'maintenance'
        if (this.cache.has(maintenanceCacheKey)) {
            const cached = this.cache.get(maintenanceCacheKey)
            if (Date.now() < cached.expiry) {
                if (cached.value) {
                    await this.bot.reply(data.from, '⚠️ البوت في وضع الصيانة حالياً. يرجى المحاولة لاحقاً.', m)
                }
                return !cached.value
            }
            this.cache.delete(maintenanceCacheKey)
        }

        const inMaintenance = await this.db.isMaintenanceMode()
        
        // Cache the result
        this.cache.set(maintenanceCacheKey, {
            value: inMaintenance,
            expiry: Date.now() + 60000 // Cache for 1 minute
        })

        if (inMaintenance) {
            await this.bot.reply(data.from, '⚠️ البوت في وضع الصيانة حالياً. يرجى المحاولة لاحقاً.', m)
            return false
        }

        return true
    }

    async checkAntiSpam(m, data, plugin) {
        if (data.isOwner || data.isSubOwner) return true

        const spamData = await this.db.getSpamData(data.sender)
        const now = Date.now()

        if (spamData && now - spamData.lastCommand < 2000) {
            spamData.count++
            
            if (spamData.count >= 5) {
                await this.db.setSpamData(data.sender, { count: 0, lastCommand: now + 30000 })
                await this.bot.reply(data.from, '⚠️ تم اكتشاف سبام! يرجى الانتظار 30 ثانية.', m)
                return false
            }
        } else {
            await this.db.setSpamData(data.sender, { count: 1, lastCommand: now })
        }

        return true
    }

    async checkCooldown(m, data, plugin) {
        if (data.isOwner || data.isSubOwner) return true

        if (!plugin.cooldown) return true

        const key = `${data.sender}-${data.command}`
        const cooldownData = this.cooldowns.get(key)

        if (cooldownData && Date.now() < cooldownData) {
            const remaining = Math.ceil((cooldownData - Date.now()) / 1000)
            await this.bot.reply(data.from, `⏰ يرجى الانتظار ${remaining} ثانية قبل استخدام هذا الأمر مرة أخرى.`, m)
            return false
        }

        const cooldownTime = plugin.cooldown * 1000
        this.cooldowns.set(key, Date.now() + cooldownTime)

        setTimeout(() => {
            this.cooldowns.delete(key)
        }, cooldownTime)

        return true
    }

    async checkPermissions(m, data, plugin) {
        if (!plugin.owner && !plugin.admin && !plugin.group && !plugin.private && !plugin.botAdmin && !plugin.premium) {
            return true
        }

        if (plugin.owner && !data.isOwner) {
            await this.bot.reply(data.from, '❌ هذا الأمر للمالك فقط.', m)
            return false
        }

        if (plugin.sub_owner && !data.isSubOwner && !data.isOwner) {
            await this.bot.reply(data.from, '❌ هذا الأمر للمالكين الفرعيين فقط.', m)
            return false
        }

        if (plugin.moderator && !data.isModerator && !data.isSubOwner && !data.isOwner) {
            await this.bot.reply(data.from, '❌ هذا الأمر للمشرفين فقط.', m)
            return false
        }

        if (plugin.admin && data.isGroup && !data.isAdmin && !data.isOwner) {
            await this.bot.reply(data.from, '❌ هذا الأمر لمشرفي المجموعة فقط.', m)
            return false
        }

        if (plugin.group && !data.isGroup) {
            await this.bot.reply(data.from, '❌ هذا الأمر للمجموعات فقط.', m)
            return false
        }

        if (plugin.private && data.isGroup) {
            await this.bot.reply(data.from, '❌ هذا الأمر للمحادثات الخاصة فقط.', m)
            return false
        }

        if (plugin.botAdmin && data.isGroup && !data.isBotAdmin) {
            await this.bot.reply(data.from, '❌ يجب أن أكون مشرفاً لتنفيذ هذا الأمر.', m)
            return false
        }

        if (plugin.premium) {
            const premiumCacheKey = `premium:${data.sender}`
            
            // Check cache first
            if (this.cache.has(premiumCacheKey)) {
                const cached = this.cache.get(premiumCacheKey)
                if (Date.now() < cached.expiry) {
                    if (!cached.value && !data.isOwner) {
                        await this.bot.reply(data.from, '❌ هذا الأمر للمشتركين المميزين فقط.', m)
                        return false
                    }
                    return cached.value || data.isOwner
                }
                this.cache.delete(premiumCacheKey)
            }

            const isPremium = await this.db.isPremiumUser(data.sender)
            
            // Cache the result
            this.cache.set(premiumCacheKey, {
                value: isPremium,
                expiry: Date.now() + 300000 // Cache for 5 minutes
            })

            if (!isPremium && !data.isOwner) {
                await this.bot.reply(data.from, '❌ هذا الأمر للمشتركين المميزين فقط.', m)
                return false
            }
        }

        if (plugin.registered) {
            const registeredCacheKey = `registered:${data.sender}`
            
            // Check cache first
            if (this.cache.has(registeredCacheKey)) {
                const cached = this.cache.get(registeredCacheKey)
                if (Date.now() < cached.expiry) {
                    if (!cached.value) {
                        await this.bot.reply(data.from, `❌ يجب التسجيل أولاً. استخدم ${this.config.prefix}register`, m)
                        return false
                    }
                    return cached.value
                }
                this.cache.delete(registeredCacheKey)
            }

            const isRegistered = await this.db.isRegisteredUser(data.sender)
            
            // Cache the result
            this.cache.set(registeredCacheKey, {
                value: isRegistered,
                expiry: Date.now() + 300000 // Cache for 5 minutes
            })

            if (!isRegistered) {
                await this.bot.reply(data.from, `❌ يجب التسجيل أولاً. استخدم ${this.config.prefix}register`, m)
                return false
            }
        }

        return true
    }

    async logCommand(m, data, plugin) {
        const logData = {
            command: data.command,
            sender: data.sender,
            chat: data.from,
            isGroup: data.isGroup,
            args: data.args,
            timestamp: Date.now()
        }

        await this.db.logCommand(logData)

        console.log(chalk.cyan(
            `📝 [${data.command}] ${data.pushName} (${data.sender.split('@')[0]}) | ${data.isGroup ? 'Group' : 'Private'}`
        ))

        return true
    }

    async validateArgs(m, data, plugin) {
        if (!plugin.args && !plugin.minArgs) return true

        const requiredArgs = plugin.minArgs || (plugin.args ? 1 : 0)

        if (data.args.length < requiredArgs) {
            let usage = plugin.usage || `${this.config.prefix}${data.command}`
            if (plugin.example) {
                usage += `\n\n*مثال:*\n${plugin.example}`
            }

            await this.bot.reply(data.from, `❌ استخدام خاطئ!\n\n*الاستخدام الصحيح:*\n${usage}`, m)
            return false
        }

        return true
    }

    // ═══════════════════════════════════════════════════
    // UTILITIES
    // ═══════════════════════════════════════════════════

    async react(m, emoji) {
        try {
            await this.bot.sock.sendMessage(m.key.remoteJid, {
                react: {
                    text: emoji,
                    key: m.key
                }
            })
        } catch (error) {
            console.error(chalk.red('Failed to send reaction:', error.message))
        }
    }

    async deleteMessage(m) {
        try {
            await this.bot.sock.sendMessage(m.key.remoteJid, {
                delete: m.key
            })
        } catch (error) {
            console.error(chalk.red('Failed to delete message:', error.message))
        }
    }

    async sendErrorMessage(chatId, error, command) {
        const errorText = `❌ حدث خطأ أثناء تنفيذ الأمر *${command}*

*الخطأ:* ${error.message}

يرجى المحاولة مرة أخرى أو التواصل مع المطور.`

        try {
            await this.bot.sendText(chatId, errorText)
        } catch (e) {
            console.error(chalk.red('Failed to send error message:', e.message))
        }
    }

    // ═══════════════════════════════════════════════════
    // CACHE UTILITIES
    // ═══════════════════════════════════════════════════

    getCache(key) {
        if (this.cache.has(key)) {
            const cached = this.cache.get(key)
            if (Date.now() < cached.expiry) {
                return cached.value
            }
            this.cache.delete(key)
        }
        return null
    }

    setCache(key, value, ttl = 60000) {
        this.cache.set(key, {
            value,
            expiry: Date.now() + ttl
        })
    }

    deleteCache(key) {
        return this.cache.delete(key)
    }

    cleanupCache() {
        const now = Date.now()
        for (const [key, value] of this.cache.entries()) {
            if (now >= value.expiry) {
                this.cache.delete(key)
            }
        }
    }

    // ═══════════════════════════════════════════════════
    // INPUT SANITIZATION
    // ═══════════════════════════════════════════════════

    sanitizeInput(input) {
        if (typeof input !== 'string') return input
        
        return input
            .replace(/javascript:/gi, '')
            .replace(/on\w+=/gi, '')
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .trim()
    }

    // ═══════════════════════════════════════════════════
    // STATISTICS
    // ═══════════════════════════════════════════════════

    initializePluginStats(pluginName) {
        this.pluginStats.set(pluginName, {
            timesUsed: 0,
            successCount: 0,
            failureCount: 0,
            lastUsed: null,
            averageExecutionTime: 0,
            totalExecutionTime: 0,
            executionTimes: []
        })
    }

    async updateCommandStats(command) {
        const currentCount = this.commandUsage.get(command) || 0
        this.commandUsage.set(command, currentCount + 1)
    }

    updateExecutionTimeStats(plugin, executionTime) {
        const pluginName = plugin.fileName?.replace('.js', '') || 'unknown'
        const stats = this.pluginStats.get(pluginName)
        
        if (stats) {
            stats.executionTimes.push(executionTime)
            stats.totalExecutionTime += executionTime
            stats.averageExecutionTime = stats.totalExecutionTime / stats.executionTimes.length
            
            // Keep only the last 100 execution times
            if (stats.executionTimes.length > 100) {
                stats.executionTimes.shift()
            }
        }
    }

    async saveCommandHistory(m, plugin, result) {
        // Save to database
    }

    async handleCommandError(m, plugin, error) {
        console.error(chalk.red(`Command error: ${error.message}`))
        
        const pluginName = plugin.fileName?.replace('.js', '') || 'unknown'
        const stats = this.pluginStats.get(pluginName)
        if (stats) {
            stats.failureCount++
        }
    }

    async incrementSuccessCount(command) {
        const plugin = this.getPlugin(command)
        if (!plugin) return

        const pluginName = plugin.fileName?.replace('.js', '') || 'unknown'
        const stats = this.pluginStats.get(pluginName)
        if (stats) {
            stats.successCount++
            stats.timesUsed++
            stats.lastUsed = Date.now()
        }
    }

    // ═══════════════════════════════════════════════════
    // GETTERS
    // ═══════════════════════════════════════════════════

    getPluginCount() {
        return this.plugins.size
    }

    getCommandCount() {
        return this.commands.size
    }

    getCategoryCount() {
        return this.categories.size
    }

    getPlugins() {
        return Array.from(this.plugins.values())
    }

    getCommands() {
        return Array.from(this.commands.keys())
    }

    getCategories() {
        return Array.from(this.categories.keys())
    }

    getPluginsByCategory(category) {
        return this.categories.get(category) || []
    }

    getPluginInfo(pluginName) {
        return this.plugins.get(pluginName)
    }

    getCommandInfo(command) {
        return this.getPlugin(command)
    }

    getPluginStats(pluginName) {
        return this.pluginStats.get(pluginName)
    }

    getCommandUsage(command) {
        return this.commandUsage.get(command) || 0
    }

    getTopCommands(limit = 10) {
        return Array.from(this.commandUsage.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
    }

    getFailedPlugins() {
        return Array.from(this.failedPlugins.entries())
    }

    // ═══════════════════════════════════════════════════
    // PLUGIN MANAGEMENT
    // ═══════════════════════════════════════════════════

    listPlugins() {
        console.log(chalk.cyan('\n╔════════════════════════════════════════╗'))
        console.log(chalk.cyan('║         LOADED PLUGINS                 ║'))
        console.log(chalk.cyan('╚════════════════════════════════════════╝\n'))

        for (const [category, plugins] of this.categories.entries()) {
            console.log(chalk.yellow(`\n📁 ${category.toUpperCase()}:`))
            for (const pluginName of plugins) {
                const plugin = this.plugins.get(pluginName)
                const commands = Array.isArray(plugin.command) ? plugin.command : [plugin.command]
                const status = plugin.disabled ? chalk.red('[DISABLED]') : chalk.green('[ENABLED]')
                console.log(chalk.white(`  • ${pluginName}`), chalk.gray(`(${commands.join(', ')})`), status)
            }
        }

        console.log(chalk.cyan('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
        console.log(chalk.white('Total Plugins:'), chalk.green(this.getPluginCount()))
        console.log(chalk.white('Total Commands:'), chalk.green(this.getCommandCount()))
        console.log(chalk.white('Categories:'), chalk.green(this.getCategoryCount()))
        console.log('')
    }

    async enablePlugin(pluginName) {
        const plugin = this.plugins.get(pluginName)
        if (!plugin) {
            throw new Error('Plugin not found')
        }

        plugin.disabled = false
        await this.db.updatePluginStatus(pluginName, true)
        console.log(chalk.green(`✓ Enabled plugin: ${pluginName}`))
    }

    async disablePlugin(pluginName) {
        const plugin = this.plugins.get(pluginName)
        if (!plugin) {
            throw new Error('Plugin not found')
        }

        plugin.disabled = true
        await this.db.updatePluginStatus(pluginName, false)
        console.log(chalk.yellow(`⚠️  Disabled plugin: ${pluginName}`))
    }

    isPluginEnabled(pluginName) {
        const plugin = this.plugins.get(pluginName)
        return plugin ? !plugin.disabled : false
    }

    // ═══════════════════════════════════════════════════
    // CLEANUP
    // ═══════════════════════════════════════════════════

    async cleanup() {
        console.log(chalk.blue('🧹 Cleaning up handler...'))

        this.stopPluginWatcher()

        this.cooldowns.clear()
        this.loadQueue = []
        this.cache.clear()

        console.log(chalk.green('✓ Handler cleanup completed'))
    }
}

export default CrimsonHandler
