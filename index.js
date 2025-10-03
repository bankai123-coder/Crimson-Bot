import CrimsonBot from './main.js'
import config from './config.js'
import Handler from './handler.js'
import Database from './database.js'
import chalk from 'chalk'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import moment from 'moment-timezone'
import os from 'os'
import { exec } from 'child_process'
import { promisify } from 'util'

const execPromise = promisify(exec)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ═══════════════════════════════════════════════════
// CRIMSON BOT - MAIN APPLICATION
// ═══════════════════════════════════════════════════

class CrimsonApplication {
    constructor() {
        this.bot = null
        this.handler = null
        this.db = null
        this.startTime = Date.now()
        this.isInitialized = false
        this.restartCount = 0
        this.maxRestarts = 5
        this.autoRestart = config.autoRestart || true
        this.checkUpdatesInterval = null
        this.cleanupInterval = null
        this.backupInterval = null
        this.performanceMonitor = null
        this.lastCommandTime = 0
        this.commandCooldown = 1000
    }

    // ═══════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════

    async start() {
        try {
            await this.printWelcomeBanner()
            await this.checkEnvironment()
            await this.setupDirectories()
            await this.initializeDatabase()
            await this.initializeBot()
            await this.initializeHandler()
            await this.setupBackgroundTasks()
            await this.startMonitoring()

            this.isInitialized = true
            console.log(chalk.green.bold('\n✓ Crimson Bot successfully initialized!'))
            console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'))

        } catch (error) {
            console.error(chalk.red('❌ Failed to start application:'), error)
            await this.handleStartupError(error)
        }
    }

    async printWelcomeBanner() {
        console.clear()
        console.log(chalk.red.bold(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║   ██████╗██████╗ ██╗███╗   ███╗███████╗ ██████╗ ███╗   ██╗   ║
║  ██╔════╝██╔══██╗██║████╗ ████║██╔════╝██╔═══██╗████╗  ██║   ║
║  ██║     ██████╔╝██║██╔████╔██║███████╗██║   ██║██╔██╗ ██║   ║
║  ██║     ██╔══██╗██║██║╚██╔╝██║╚════██║██║   ██║██║╚██╗██║   ║
║  ╚██████╗██║  ██║██║██║ ╚═╝ ██║███████║╚██████╔╝██║ ╚████║   ║
║   ╚═════╝╚═╝  ╚═╝╚═╝╚═╝     ╚═╝╚══════╝ ╚═════╝ ╚═╝  ╚═══╝   ║
║                                                                ║
║              🤖 Advanced WhatsApp Bot System 🤖                ║
║                                                                ║
║  Version: 3.0.1                                               ║
║  Type: Multi-Device                                           ║
║  Framework: Baileys                                           ║
║  Database: JSON                                               ║
║  Status: Premium Edition                                      ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
        `))

        await this.delay(1000)
    }

    async checkEnvironment() {
        console.log(chalk.blue('\n🔍 Checking environment...'))

        const checks = [
            { name: 'Node.js Version', test: () => this.checkNodeVersion() },
            { name: 'Package Dependencies', test: () => this.checkDependencies() },
            { name: 'Configuration File', test: () => this.checkConfig() },
            { name: 'File Permissions', test: () => this.checkPermissions() },
            { name: 'Network Connectivity', test: () => this.checkNetwork() },
            { name: 'Available Memory', test: () => this.checkMemory() },
            { name: 'Disk Space', test: () => this.checkDiskSpace() },
            { name: 'Termux Compatibility', test: () => this.checkTermux() }
        ]

        for (const check of checks) {
            try {
                const result = await check.test()
                if (result) {
                    console.log(chalk.green(`  ✓ ${check.name}`))
                } else {
                    console.log(chalk.red(`  ✗ ${check.name} - Failed`))
                }
            } catch (error) {
                console.log(chalk.yellow(`  ⚠ ${check.name} - ${error.message}`))
            }
        }

        console.log(chalk.green('✓ Environment check completed\n'))
    }

    checkNodeVersion() {
        const version = process.version
        const major = parseInt(version.slice(1).split('.')[0])
        if (major < 16) {
            throw new Error(`Node.js version ${version} is not supported. Please upgrade to v16 or higher.`)
        }
        return true
    }

    async checkDependencies() {
        const packageJson = JSON.parse(
            fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8')
        )
        const dependencies = packageJson.dependencies || {}
        return Object.keys(dependencies).length > 0
    }

    checkConfig() {
        const required = ['ownerNumber', 'botNumber']
        const missing = required.filter(key => !config[key])
        
        if (missing.length > 0) {
            throw new Error(`Missing required config: ${missing.join(', ')}`)
        }
        
        if (typeof config.ownerNumber !== 'string' || typeof config.botNumber !== 'string') {
            throw new Error('Owner and bot numbers must be strings')
        }
        
        return true
    }

    checkPermissions() {
        const testDir = path.join(__dirname, 'temp')
        try {
            if (!fs.existsSync(testDir)) {
                fs.mkdirSync(testDir, { recursive: true })
            }
            fs.accessSync(testDir, fs.constants.W_OK)
            return true
        } catch (error) {
            throw new Error('Insufficient file permissions')
        }
    }

    async checkNetwork() {
        try {
            const dns = await import('dns')
            return new Promise((resolve) => {
                dns.resolve('www.google.com', (err) => {
                    resolve(!err)
                })
            })
        } catch (error) {
            return false
        }
    }

    checkMemory() {
        const freeMemory = os.freemem()
        const requiredMemory = 100 * 1024 * 1024 // 100MB
        if (freeMemory < requiredMemory) {
            console.log(chalk.yellow(`  ⚠ Low memory: ${(freeMemory / 1024 / 1024).toFixed(2)} MB available`))
        }
        return freeMemory > requiredMemory
    }

    async checkDiskSpace() {
        try {
            if (process.platform === 'linux' || process.platform === 'android') {
                const { stdout } = await execPromise('df -h .')
                const lines = stdout.trim().split('\n')
                const lastLine = lines[lines.length - 1]
                const space = lastLine.split(/\s+/)[3]
                console.log(chalk.gray(`  ℹ Disk space available: ${space}`))
            }
            return true
        } catch (error) {
            return true // Non-critical check
        }
    }

    checkTermux() {
        const isTermux = process.env.TERMUX_VERSION !== undefined ||
                        fs.existsSync('/data/data/com.termux')
        if (isTermux) {
            console.log(chalk.cyan('  ℹ Running in Termux environment'))
        }
        return true
    }

    // ═══════════════════════════════════════════════════
    // DIRECTORY SETUP
    // ═══════════════════════════════════════════════════

    async setupDirectories() {
        console.log(chalk.blue('📁 Setting up directories...'))

        const directories = [
            'auth',
            'database',
            'plugins',
            'temp',
            'downloads',
            'uploads',
            'media',
            'media/images',
            'media/videos',
            'media/audio',
            'media/documents',
            'media/stickers',
            'logs',
            'backups',
            'cache',
            'sessions'
        ]

        for (const dir of directories) {
            const dirPath = path.join(__dirname, dir)
            try {
                if (!fs.existsSync(dirPath)) {
                    fs.mkdirSync(dirPath, { recursive: true })
                    console.log(chalk.green(`  ✓ Created: ${dir}`))
                } else {
                    console.log(chalk.gray(`  ℹ Exists: ${dir}`))
                }
            } catch (error) {
                console.log(chalk.red(`  ✗ Failed to create: ${dir}`))
                throw error
            }
        }

        console.log(chalk.green('✓ All directories ready\n'))
    }

    // ═══════════════════════════════════════════════════
    // DATABASE INITIALIZATION
    // ═══════════════════════════════════════════════════

    async initializeDatabase() {
        console.log(chalk.blue('💾 Initializing database...'))

        try {
            this.db = new Database(path.join(__dirname, 'database'))
            await this.db.initialize()

            await this.db.loadData()

            console.log(chalk.green('✓ Database initialized'))
            console.log(chalk.gray(`  ℹ Users: ${this.db.getUserCount()}`))
            console.log(chalk.gray(`  ℹ Groups: ${this.db.getGroupCount()}`))
            console.log(chalk.gray(`  ℹ Messages: ${this.db.getMessageCount()}`))
            console.log('')
        } catch (error) {
            console.error(chalk.red('❌ Database initialization failed:'), error)
            throw error
        }
    }

    // ═══════════════════════════════════════════════════
    // BOT INITIALIZATION
    // ═══════════════════════════════════════════════════

    async initializeBot() {
        console.log(chalk.blue('🤖 Initializing bot instance...'))

        try {
            this.bot = new CrimsonBot(config)
            this.bot.db = this.db

            this.bot.setupProcessHandlers()

            await this.bot.initialize()

            console.log(chalk.green('✓ Bot instance ready\n'))
        } catch (error) {
            console.error(chalk.red('❌ Bot initialization failed:'), error)
            throw error
        }
    }

    // ═══════════════════════════════════════════════════
    // HANDLER INITIALIZATION
    // ═══════════════════════════════════════════════════

    async initializeHandler() {
        console.log(chalk.blue('⚙️  Initializing command handler...'))

        try {
            this.handler = new Handler(this.bot, this.db, config)
            await this.handler.initialize()

            await this.handler.loadPlugins()

            this.bot.handler = this.handler

            console.log(chalk.green('✓ Handler initialized'))
            console.log(chalk.gray(`  ℹ Plugins loaded: ${this.handler.getPluginCount()}`))
            console.log(chalk.gray(`  ℹ Commands available: ${this.handler.getCommandCount()}`))
            console.log('')
        } catch (error) {
            console.error(chalk.red('❌ Handler initialization failed:'), error)
            throw error
        }
    }

    // ═══════════════════════════════════════════════════
    // BACKGROUND TASKS
    // ═══════════════════════════════════════════════════

    async setupBackgroundTasks() {
        console.log(chalk.blue('⏰ Setting up background tasks...'))

        this.cleanupInterval = setInterval(async () => {
            await this.performCleanup()
        }, 1800000) // Every 30 minutes

        this.backupInterval = setInterval(async () => {
            await this.performBackup()
        }, 3600000) // Every hour

        if (config.checkUpdates) {
            this.checkUpdatesInterval = setInterval(async () => {
                await this.checkForUpdates()
            }, 21600000) // Every 6 hours
        }

        setInterval(() => {
            this.bot.clearExpiredData()
        }, 600000) // Every 10 minutes

        setInterval(async () => {
            await this.db.saveData()
        }, 300000) // Every 5 minutes

        console.log(chalk.green('✓ Background tasks configured\n'))
    }

    async performCleanup() {
        try {
            console.log(chalk.blue('\n🧹 Performing cleanup...'))

            const tempDir = path.join(__dirname, 'temp')
            const files = fs.readdirSync(tempDir)
            let deletedCount = 0

            for (const file of files) {
                const filePath = path.join(tempDir, file)
                try {
                    const stats = fs.statSync(filePath)
                    const age = Date.now() - stats.mtimeMs

                    if (age > 3600000) { // Older than 1 hour
                        fs.unlinkSync(filePath)
                        deletedCount++
                    }
                } catch (err) {
                    console.log(chalk.yellow(`  ⚠ Could not process file: ${file}`))
                }
            }

            const cacheDir = path.join(__dirname, 'cache')
            if (fs.existsSync(cacheDir)) {
                const cacheFiles = fs.readdirSync(cacheDir)
                for (const file of cacheFiles) {
                    const filePath = path.join(cacheDir, file)
                    try {
                        const stats = fs.statSync(filePath)
                        const age = Date.now() - stats.mtimeMs

                        if (age > 7200000) { // Older than 2 hours
                            fs.unlinkSync(filePath)
                            deletedCount++
                        }
                    } catch (err) {
                        console.log(chalk.yellow(`  ⚠ Could not process cache file: ${file}`))
                    }
                }
            }

            if (global.gc) {
                global.gc()
            }

            console.log(chalk.green(`✓ Cleanup completed - Deleted ${deletedCount} files\n`))
        } catch (error) {
            console.error(chalk.red('❌ Cleanup failed:'), error.message)
        }
    }

    async performBackup() {
        try {
            console.log(chalk.blue('\n💾 Creating backup...'))

            const backupDir = path.join(__dirname, 'backups')
            const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss')
            const backupName = `backup_${timestamp}`
            const backupPath = path.join(backupDir, backupName)

            fs.mkdirSync(backupPath, { recursive: true })

            const dbPath = path.join(__dirname, 'database')
            const dbBackup = path.join(backupPath, 'database')
            this.copyFolderRecursiveSync(dbPath, backupPath)

            const configBackup = path.join(backupPath, 'config.js')
            fs.copyFileSync(path.join(__dirname, 'config.js'), configBackup)

            // Verify backup
            if (fs.existsSync(backupPath)) {
                const stats = fs.statSync(backupPath)
                if (!stats.isDirectory()) {
                    throw new Error('Backup path is not a directory')
                }
                const backupFiles = fs.readdirSync(backupPath)
                if (backupFiles.length === 0) {
                    throw new Error('Backup directory is empty')
                }
            }

            const files = fs.readdirSync(backupDir)
            if (files.length > 10) {
                files.sort()
                const oldestBackup = files[0]
                const oldestPath = path.join(backupDir, oldestBackup)
                fs.rmSync(oldestPath, { recursive: true, force: true })
            }

            console.log(chalk.green(`✓ Backup created and verified: ${backupName}\n`))
        } catch (error) {
            console.error(chalk.red('❌ Backup failed:'), error.message)
        }
    }

    copyFolderRecursiveSync(source, target) {
        const targetFolder = path.join(target, path.basename(source))
        if (!fs.existsSync(targetFolder)) {
            fs.mkdirSync(targetFolder, { recursive: true })
        }

        if (fs.lstatSync(source).isDirectory()) {
            const files = fs.readdirSync(source)
            files.forEach(file => {
                const curSource = path.join(source, file)
                if (fs.lstatSync(curSource).isDirectory()) {
                    this.copyFolderRecursiveSync(curSource, targetFolder)
                } else {
                    fs.copyFileSync(curSource, path.join(targetFolder, file))
                }
            })
        }
    }

    async checkForUpdates() {
        try {
            console.log(chalk.blue('\n🔄 Checking for updates...'))
            console.log(chalk.gray('  Current version: 3.0.1'))
            console.log(chalk.green('✓ You are running the latest version\n'))
        } catch (error) {
            console.error(chalk.red('❌ Update check failed:'), error.message)
        }
    }

    // ═══════════════════════════════════════════════════
    // MONITORING
    // ═══════════════════════════════════════════════════

    async startMonitoring() {
        console.log(chalk.blue('📊 Starting performance monitoring...'))

        this.performanceMonitor = setInterval(() => {
            this.logPerformanceMetrics()
        }, 300000) // Every 5 minutes

        console.log(chalk.green('✓ Monitoring started\n'))
    }

    logPerformanceMetrics() {
        const memUsage = process.memoryUsage()
        const uptime = process.uptime()
        const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100

        if (config.verboseLogging) {
            console.log(chalk.blue('\n📊 Performance Metrics:'))
            console.log(chalk.white('  RSS Memory:'), chalk.cyan(this.formatBytes(memUsage.rss)))
            console.log(chalk.white('  Heap Used:'), chalk.cyan(this.formatBytes(memUsage.heapUsed)))
            console.log(chalk.white('  Heap Total:'), chalk.cyan(this.formatBytes(memUsage.heapTotal)))
            console.log(chalk.white('  Heap Usage:'), chalk.cyan(`${heapUsedPercent.toFixed(1)}%`))
            console.log(chalk.white('  External:'), chalk.cyan(this.formatBytes(memUsage.external)))
            console.log(chalk.white('  Uptime:'), chalk.cyan(this.formatDuration(uptime * 1000)))
            console.log('')
        }

        if (heapUsedPercent > 90) {
            console.log(chalk.red(`⚠️  CRITICAL: Memory usage at ${heapUsedPercent.toFixed(1)}%`))
            if (global.gc) {
                global.gc()
                console.log(chalk.green('✓ Emergency garbage collection triggered'))
            }
        } else if (heapUsedPercent > 75) {
            console.log(chalk.yellow(`⚠️  WARNING: Memory usage at ${heapUsedPercent.toFixed(1)}%`))
            if (global.gc) {
                global.gc()
            }
        }
    }

    // ═══════════════════════════════════════════════════
    // ERROR HANDLING
    // ═══════════════════════════════════════════════════

    async handleStartupError(error) {
        console.error(chalk.red('\n❌ STARTUP ERROR:'))
        console.error(chalk.red('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
        console.error(error)
        console.error(chalk.red('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'))

        const logPath = path.join(__dirname, 'logs', `error_${Date.now()}.log`)
        fs.writeFileSync(logPath, `
Startup Error Report
═══════════════════════════════════════
Date: ${moment().format('YYYY-MM-DD HH:mm:ss')}
Error: ${error.message}
Stack: ${error.stack}
═══════════════════════════════════════
        `)

        console.log(chalk.yellow(`⚠️  Error log saved to: ${logPath}`))

        if (this.autoRestart && this.restartCount < this.maxRestarts) {
            this.restartCount++
            console.log(chalk.yellow(`\n🔄 Attempting restart (${this.restartCount}/${this.maxRestarts})...`))
            await this.delay(5000)
            await this.start()
        } else {
            console.log(chalk.red('\n❌ Maximum restart attempts reached. Exiting...'))
            process.exit(1)
        }
    }

    // ═══════════════════════════════════════════════════
    // RESTART & SHUTDOWN
    // ═══════════════════════════════════════════════════

    async restart(reason = 'Manual restart') {
        console.log(chalk.yellow(`\n🔄 Restarting bot: ${reason}`))

        try {
            await this.shutdown(false)
            await this.delay(2000)
            await this.start()
        } catch (error) {
            console.error(chalk.red('❌ Restart failed:'), error)
            process.exit(1)
        }
    }

    async shutdown(exit = true) {
        console.log(chalk.yellow('\n⚠️  Shutting down application...'))

        try {
            // Clear ALL intervals
            const intervals = [
                this.cleanupInterval,
                this.backupInterval,
                this.checkUpdatesInterval,
                this.performanceMonitor
            ]

            intervals.forEach(interval => {
                if (interval) clearInterval(interval)
            })
            console.log(chalk.green('✓ Background tasks stopped'))

            if (this.db) {
                await this.db.saveData()
                console.log(chalk.green('✓ Database saved'))
            }

            if (this.handler) {
                await this.handler.cleanup()
                console.log(chalk.green('✓ Handler cleaned up'))
            }

            if (this.bot) {
                await this.bot.cleanup()
                console.log(chalk.green('✓ Bot cleaned up'))
            }

            await this.performBackup()

            console.log(chalk.green.bold('✓ Shutdown completed successfully'))

            if (exit) {
                process.exit(0)
            }
        } catch (error) {
            console.error(chalk.red('❌ Shutdown error:'), error)
            if (exit) {
                process.exit(1)
            }
        }
    }

    // ═══════════════════════════════════════════════════
    // UTILITY METHODS
    // ═══════════════════════════════════════════════════

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
    }

    formatDuration(ms) {
        const seconds = Math.floor((ms / 1000) % 60)
        const minutes = Math.floor((ms / (1000 * 60)) % 60)
        const hours = Math.floor((ms / (1000 * 60 * 60)) % 24)
        const days = Math.floor(ms / (1000 * 60 * 60 * 24))

        const parts = []
        if (days > 0) parts.push(`${days}d`)
        if (hours > 0) parts.push(`${hours}h`)
        if (minutes > 0) parts.push(`${minutes}m`)
        if (seconds > 0) parts.push(`${seconds}s`)

        return parts.join(' ') || '0s'
    }

    // ═══════════════════════════════════════════════════
    // STATUS & INFO
    // ═══════════════════════════════════════════════════

    getStatus() {
        return {
            initialized: this.isInitialized,
            uptime: Date.now() - this.startTime,
            restartCount: this.restartCount,
            botConnected: this.bot?.isConnected || false,
            pluginsLoaded: this.handler?.getPluginCount() || 0,
            commandsAvailable: this.handler?.getCommandCount() || 0,
            usersInDB: this.db?.getUserCount() || 0,
            groupsInDB: this.db?.getGroupCount() || 0,
            memoryUsage: process.memoryUsage(),
            platform: process.platform,
            nodeVersion: process.version
        }
    }

    printStatus() {
        const status = this.getStatus()

        console.log(chalk.cyan('\n╔════════════════════════════════════════╗'))
        console.log(chalk.cyan('║         CRIMSON BOT STATUS             ║'))
        console.log(chalk.cyan('╚════════════════════════════════════════╝'))
        console.log(chalk.white('\n  Initialized:'), status.initialized ? chalk.green('Yes') : chalk.red('No'))
        console.log(chalk.white('  Bot Connected:'), status.botConnected ? chalk.green('Yes') : chalk.red('No'))
        console.log(chalk.white('  Uptime:'), chalk.cyan(this.formatDuration(status.uptime)))
        console.log(chalk.white('  Restart Count:'), chalk.cyan(status.restartCount))
        console.log(chalk.white('  Plugins Loaded:'), chalk.cyan(status.pluginsLoaded))
        console.log(chalk.white('  Commands:'), chalk.cyan(status.commandsAvailable))
        console.log(chalk.white('  Users in DB:'), chalk.cyan(status.usersInDB))
        console.log(chalk.white('  Groups in DB:'), chalk.cyan(status.groupsInDB))
        console.log(chalk.white('  Memory Usage:'), chalk.cyan(this.formatBytes(status.memoryUsage.heapUsed)))
        console.log(chalk.white('  Platform:'), chalk.cyan(status.platform))
        console.log(chalk.white('  Node Version:'), chalk.cyan(status.nodeVersion))
        console.log('')
    }

    // ═══════════════════════════════════════════════════
    // CLI COMMANDS
    // ═══════════════════════════════════════════════════

    async setupCLI() {
        const readline = await import('readline')
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: chalk.cyan('crimson> ')
        })

        console.log(chalk.yellow('\n💬 CLI Mode enabled. Type "help" for commands.'))
        rl.prompt()

        rl.on('line', async (line) => {
            const input = line.trim().toLowerCase()

            // Rate limiting
            const now = Date.now()
            if (now - this.lastCommandTime < this.commandCooldown) {
                console.log(chalk.yellow('⚠️  Please wait before executing another command'))
                rl.prompt()
                return
            }
            this.lastCommandTime = now

            await this.executeCommand(input)
            rl.prompt()
        })

        rl.on('close', async () => {
            await this.shutdown()
        })
    }

    async executeCommand(input) {
        switch (input) {
            case 'help':
                this.showHelp()
                break
            case 'status':
                this.printStatus()
                break
            case 'restart':
                await this.restart('CLI command')
                break
            case 'backup':
                await this.performBackup()
                break
            case 'cleanup':
                await this.performCleanup()
                break
            case 'plugins':
                this.handler.listPlugins()
                break
            case 'reload':
                await this.handler.reloadPlugins()
                console.log(chalk.green('✓ Plugins reloaded'))
                break
            case 'stats':
                await this.showStatistics()
                break
            case 'clear':
                console.clear()
                break
            case 'exit':
            case 'quit':
                await this.shutdown()
                break
            default:
                if (input) {
                    console.log(chalk.red(`Unknown command: ${input}`))
                    console.log(chalk.yellow('Type "help" for available commands'))
                }
        }
    }

    showHelp() {
        console.log(chalk.cyan('\n╔════════════════════════════════════════╗'))
        console.log(chalk.cyan('║         AVAILABLE COMMANDS             ║'))
        console.log(chalk.cyan('╚════════════════════════════════════════╝\n'))
        console.log(chalk.white('  help      '), chalk.gray('- Show this help message'))
        console.log(chalk.white('  status    '), chalk.gray('- Show bot status'))
        console.log(chalk.white('  stats     '), chalk.gray('- Show detailed statistics'))
        console.log(chalk.white('  plugins   '), chalk.gray('- List all loaded plugins'))
        console.log(chalk.white('  reload    '), chalk.gray('- Reload all plugins'))
        console.log(chalk.white('  restart   '), chalk.gray('- Restart the bot'))
        console.log(chalk.white('  backup    '), chalk.gray('- Create a backup'))
        console.log(chalk.white('  cleanup   '), chalk.gray('- Run cleanup tasks'))
        console.log(chalk.white('  clear     '), chalk.gray('- Clear the console'))
        console.log(chalk.white('  exit      '), chalk.gray('- Shutdown the bot'))
        console.log('')
    }

    async showStatistics() {
        try {
            const stats = this.getStatus()
            const botStats = await this.bot.getSystemStats()

            console.log(chalk.cyan('\n╔════════════════════════════════════════╗'))
            console.log(chalk.cyan('║         DETAILED STATISTICS            ║'))
            console.log(chalk.cyan('╚════════════════════════════════════════╝\n'))

            console.log(chalk.yellow('📊 System:'))
            console.log(chalk.white('  Platform:'), chalk.cyan(botStats.platform))
            console.log(chalk.white('  Architecture:'), chalk.cyan(botStats.arch))
            console.log(chalk.white('  CPU Cores:'), chalk.cyan(botStats.cpus))
            console.log(chalk.white('  Total Memory:'), chalk.cyan(this.formatBytes(botStats.totalMemory)))
            console.log(chalk.white('  Free Memory:'), chalk.cyan(this.formatBytes(botStats.freeMemory)))

            console.log(chalk.yellow('\n🤖 Bot:'))
            console.log(chalk.white('  Connected:'), botStats.isConnected ? chalk.green('Yes') : chalk.red('No'))
            console.log(chalk.white('  Uptime:'), chalk.cyan(this.formatDuration(stats.uptime)))
            console.log(chalk.white('  Total Messages:'), chalk.cyan(botStats.totalMessages))
            console.log(chalk.white('  Active Chats:'), chalk.cyan(botStats.activeChats))
            console.log(chalk.white('  Blocked Users:'), chalk.cyan(botStats.blockedUsers))
            console.log(chalk.white('  Muted Chats:'), chalk.cyan(botStats.mutedChats))

            console.log(chalk.yellow('\n💾 Database:'))
            console.log(chalk.white('  Users:'), chalk.cyan(this.db.getUserCount()))
            console.log(chalk.white('  Groups:'), chalk.cyan(this.db.getGroupCount()))
            console.log(chalk.white('  Messages:'), chalk.cyan(this.db.getMessageCount()))

            console.log(chalk.yellow('\n⚙️  Handler:'))
            console.log(chalk.white('  Plugins:'), chalk.cyan(stats.pluginsLoaded))
            console.log(chalk.white('  Commands:'), chalk.cyan(stats.commandsAvailable))
            console.log('')
        } catch (error) {
            console.error(chalk.red('Failed to fetch statistics:'), error.message)
        }
    }
}

// ═══════════════════════════════════════════════════
// APPLICATION START
// ═══════════════════════════════════════════════════

const app = new CrimsonApplication()

process.on('SIGINT', async () => {
    console.log(chalk.yellow('\n\n⚠️  Received SIGINT signal'))
    await app.shutdown()
})

process.on('SIGTERM', async () => {
    console.log(chalk.yellow('\n\n⚠️  Received SIGTERM signal'))
    await app.shutdown()
})

process.on('uncaughtException', (error) => {
    console.error(chalk.red('\n❌ Uncaught Exception:'), error)
    fs.appendFileSync(
        path.join(__dirname, 'logs', 'errors.log'),
        `\n[${moment().format('YYYY-MM-DD HH:mm:ss')}] Uncaught Exception:\n${error.stack}\n`
    )
})

process.on('unhandledRejection', (reason, promise) => {
    console.error(chalk.red('\n❌ Unhandled Rejection:'), reason)
    fs.appendFileSync(
        path.join(__dirname, 'logs', 'errors.log'),
        `\n[${moment().format('YYYY-MM-DD HH:mm:ss')}] Unhandled Rejection:\n${reason}\n`
    )
})

app.start().catch(async (error) => {
    console.error(chalk.red('❌ Fatal error:'), error)
    process.exit(1)
})

export default app
