import { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, delay, jidNormalizedUser, downloadMediaMessage } from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import pino from 'pino'
import fs from 'fs'
import path from 'path'
import chalk from 'chalk'
import { fileURLToPath } from 'url'
import moment from 'moment-timezone'
import NodeCache from 'node-cache'
import PhoneNumber from 'awesome-phonenumber'
import readline from 'readline'
import qrcode from 'qrcode-terminal' 

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export class CrimsonBot {
    constructor(config) {
        this.config = config
        this.sock = null
        this.msgRetryCounterCache = new NodeCache()
        this.connectionAttempts = 0
        this.maxConnectionAttempts = 10
        this.isConnected = false
        this.startTime = Date.now()
        this.messageQueue = []
        this.processingQueue = false
        this.activeChats = new Map()
        this.userSessions = new Map()
        this.commandCooldowns = new Map()
        this.antiSpamMap = new Map()
        this.blockedUsers = new Set()
        this.mutedChats = new Set()
        this.groupSettings = new Map()
        this.userStats = new Map()
        this.messageHistory = new Map()
        this.tempData = new Map()
        this.autoReadMessages = config.autoRead || false
        this.autoTyping = config.autoTyping || false
        this.autoRecording = config.autoRecording || false
        this.presenceUpdate = config.presenceUpdate || true
        this.markOnlineOnConnect = config.markOnlineOnConnect || true
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        })
        this.logger = pino({
            level: config.logLevel || 'silent',
            transport: {
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    ignore: 'hostname',
                    translateTime: 'SYS:standard'
                }
            }
        })
        this.pairingCodeRequested = false
        this.usePairingCode = false
        this.pairingPhoneNumber = ''
    }

    question(text) {
        return new Promise(resolve => this.rl.question(text, resolve))
    }

    async initialize() {
        try {
            console.log(chalk.cyan.bold(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   ██████╗██████╗ ██╗███╗   ███╗███████╗ ██████╗ ███╗ ║
║  ██╔════╝██╔══██╗██║████╗ ████║██╔════╝██╔═══██╗████║║
║  ██║     ██████╔╝██║██╔████╔██║███████╗██║   ██║██╔██║║
║  ██║     ██╔══██╗██║██║╚██╔╝██║╚════██║██║   ██║██║╚██║║
║  ╚██████╗██║  ██║██║██║ ╚═╝ ██║███████║╚██████╔╝██║ ██║║
║   ╚═════╝╚═╝  ╚═╝╚═╝╚═╝     ╚═╝╚══════╝ ╚═════╝ ╚═╝ ╚═╝║
║                                                       ║
║              🤖 Crimson WhatsApp Bot 🤖              ║
║              Version: 3.0.1 - Ultimate               ║
║              Developer: Crimson Team                 ║
║              Status: Initializing...                 ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
            `))

            await this.printSystemInfo()
            await this.connectToWhatsApp()
        } catch (error) {
            this.logger.error('Initialization error:', error)
            console.error(chalk.red('❌ Failed to initialize bot:'), error.message)
            process.exit(1)
        }
    }

    async printSystemInfo() {
        const os = await import('os')
        console.log(chalk.yellow('📊 System Information:'))
        console.log(chalk.white('  Platform:'), chalk.green(os.platform()))
        console.log(chalk.white('  Architecture:'), chalk.green(os.arch()))
        console.log(chalk.white('  CPU Cores:'), chalk.green(os.cpus().length))
        console.log(chalk.white('  Total Memory:'), chalk.green(`${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB`))
        console.log(chalk.white('  Free Memory:'), chalk.green(`${(os.freemem() / 1024 / 1024 / 1024).toFixed(2)} GB`))
        console.log(chalk.white('  Node Version:'), chalk.green(process.version))
        console.log(chalk.white('  Bot Owner:'), chalk.green(this.config.ownerNumber))
        console.log(chalk.white('  Bot Number:'), chalk.green(this.config.botNumber))
        console.log(chalk.white('  Prefix:'), chalk.green(this.config.prefix))
        console.log('')
    }

    async connectToWhatsApp() {
        try {
            const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, 'auth'))
            const { version, isLatest } = await fetchLatestBaileysVersion()

            console.log(chalk.blue(`📱 Using WA version: ${version.join('.')} (Latest: ${isLatest})`))

            // التحقق من حالة التسجيل فقط مرة واحدة
            const isRegistered = !!state.creds.registered
            
            // طلب طريقة الاتصال فقط إذا لم يتم التسجيل من قبل
            if (!isRegistered && this.connectionAttempts === 0) {
                console.log(chalk.cyan('\n╔══════════════════════════════════════╗'))
                console.log(chalk.cyan('║   Choose Connection Method           ║'))
                console.log(chalk.cyan('╚══════════════════════════════════════╝\n'))
                console.log(chalk.yellow('1. QR Code'))
                console.log(chalk.yellow('2. Pairing Number'))
                console.log('')

                const connectionMethod = await this.question(chalk.green('Choose (1 or 2): '))

                if (connectionMethod.trim() === '2') {
                    this.pairingPhoneNumber = await this.question(chalk.green('\nEnter your WhatsApp number (with country code, no +): '))
                    this.pairingPhoneNumber = this.pairingPhoneNumber.trim().replace(/[^0-9]/g, '')
                    
                    if (this.pairingPhoneNumber.length < 10) {
                        console.log(chalk.red('❌ Invalid phone number. Must be at least 10 digits.'))
                        process.exit(1)
                    }
                    
                    console.log('')
                    this.usePairingCode = true
                }
            }

            // إنشاء socket
            this.sock = makeWASocket({
                version,
                logger: this.logger,
                printQRInTerminal: false, // تعطيل الطريقة المدمجة لعرض QR
                mobile: false,
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, this.logger)
                },
                msgRetryCounterCache: this.msgRetryCounterCache,
                generateHighQualityLinkPreview: true,
                browser: ['Crimson Bot', 'Chrome', '3.0.1'],
                defaultQueryTimeoutMs: 60000,
                keepAliveIntervalMs: 30000,
                markOnlineOnConnect: this.markOnlineOnConnect,
                syncFullHistory: false,
                fireInitQueries: true,
                emitOwnEvents: true,
                shouldSyncHistoryMessage: () => false,
                getMessage: async (key) => {
                    return { conversation: '' }
                },
                patchMessageBeforeSending: (message) => {
                    const requiresPatch = !!(
                        message.buttonsMessage ||
                        message.templateMessage ||
                        message.listMessage
                    )
                    if (requiresPatch) {
                        message = {
                            viewOnceMessage: {
                                message: {
                                    messageContextInfo: {
                                        deviceListMetadataVersion: 2,
                                        deviceListMetadata: {},
                                    },
                                    ...message,
                                },
                            },
                        }
                    }
                    return message
                }
            })

            await this.setupEventHandlers(saveCreds)

        } catch (error) {
            this.logger.error('Connection error:', error)
            console.error(chalk.red('❌ Failed to connect:'), error.message)
            await this.handleReconnection()
        }
    }

    async setupEventHandlers(saveCreds) {
        this.sock.ev.on('connection.update', async (update) => {
            await this.handleConnectionUpdate(update)
        })

        this.sock.ev.on('creds.update', saveCreds)

        this.sock.ev.on('messages.upsert', async ({ messages, type }) => {
            await this.handleMessagesUpsert(messages, type)
        })

        this.sock.ev.on('messages.update', async (updates) => {
            await this.handleMessagesUpdate(updates)
        })

        this.sock.ev.on('messages.delete', async (item) => {
            await this.handleMessagesDelete(item)
        })

        this.sock.ev.on('presence.update', async (update) => {
            await this.handlePresenceUpdate(update)
        })

        this.sock.ev.on('chats.update', async (chats) => {
            await this.handleChatsUpdate(chats)
        })

        this.sock.ev.on('contacts.update', async (contacts) => {
            await this.handleContactsUpdate(contacts)
        })

        this.sock.ev.on('groups.update', async (updates) => {
            await this.handleGroupsUpdate(updates)
        })

        this.sock.ev.on('group-participants.update', async (update) => {
            await this.handleGroupParticipantsUpdate(update)
        })

        this.sock.ev.on('call', async (calls) => {
            await this.handleCalls(calls)
        })

        this.sock.ev.on('blocklist.set', async ({ blocklist }) => {
            await this.handleBlocklistSet(blocklist)
        })

        this.sock.ev.on('blocklist.update', async ({ blocklist, type }) => {
            await this.handleBlocklistUpdate(blocklist, type)
        })
    }

    async handleConnectionUpdate(update) {
        const { connection, lastDisconnect, qr, isNewLogin, receivedPendingNotifications } = update

        if (qr && !this.usePairingCode) {
            console.log(chalk.yellow('📱 QR Code received! Scan with WhatsApp:'))
            // استخدام مكتبة qrcode-terminal لعرض QR code
            qrcode.generate(qr, { small: true })
        }

        if (connection === 'connecting') {
            console.log(chalk.blue('🔄 Connecting to WhatsApp...'))
        }

        // طلب pairing code بعد بدء الاتصال مباشرة
        if (connection === 'connecting' && this.usePairingCode && !this.pairingCodeRequested && this.pairingPhoneNumber) {
            this.pairingCodeRequested = true
            try {
                // الانتظار قليلاً للتأكد من جاهزية الاتصال
                await delay(5000)
                
                const code = await this.sock.requestPairingCode(this.pairingPhoneNumber)
                
                console.log(chalk.green.bold('\n✓ Pairing Code Generated Successfully!'))
                console.log(chalk.cyan('═════════════════════════════════════════════════════'))
                console.log(chalk.white('   Your pairing code is:'))
                console.log(chalk.green.bold(`   ${code}`))
                console.log(chalk.cyan('═════════════════════════════════════════════════════'))
                console.log(chalk.yellow('\n📱 How to use this code:'))
                console.log(chalk.white('1. Open WhatsApp on your phone'))
                console.log(chalk.white('2. Go to Settings > Linked Devices'))
                console.log(chalk.white('3. Tap "Link a Device"'))
                console.log(chalk.white('4. Select "Link with phone number instead"'))
                console.log(chalk.white('5. Enter the pairing code shown above'))
                console.log(chalk.cyan('\n⏳ Waiting for you to complete the pairing process...\n'))
            } catch (error) {
                console.error(chalk.red('❌ Failed to request pairing code:'), error.message)
                console.log(chalk.yellow('⚠️  Tip: Make sure the number is correct and WhatsApp is installed'))
                // إعادة تعيين للسماح بمحاولة جديدة
                this.pairingCodeRequested = false
            }
        }

        if (connection === 'open') {
            this.isConnected = true
            this.connectionAttempts = 0
            this.usePairingCode = false
            this.pairingCodeRequested = false
            
            console.log(chalk.green.bold('✓ Successfully connected to WhatsApp!'))
            console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
            console.log(chalk.green('🤖 Crimson Bot is now ONLINE'))
            console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))

            if (this.rl) {
                this.rl.close()
            }

            await this.onConnected()
        }

        if (connection === 'close') {
            this.isConnected = false
            const shouldReconnect = (lastDisconnect?.error instanceof Boom)
                ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut
                : true

            const statusCode = lastDisconnect?.error instanceof Boom
                ? lastDisconnect.error.output.statusCode
                : 'Unknown'

            console.log(chalk.red('❌ Connection closed. Code:'), statusCode)

            // معالجة خاصة لخطأ 428
            if (statusCode === 428) {
                console.log(chalk.yellow('⚠️  Connection issue detected. Retrying...'))
                this.pairingCodeRequested = false
            }

            if (statusCode === DisconnectReason.loggedOut || statusCode === 401) {
                console.log(chalk.red('❌ Logged out. Please delete auth folder and restart.'))
                process.exit(0)
            }

            if (shouldReconnect) {
                // إعادة تعيين طلب كود الربط قبل محاولة إعادة الاتصال
                this.pairingCodeRequested = false
                await this.handleReconnection()
            }
        }

        if (isNewLogin) {
            console.log(chalk.green('✓ New login detected'))
        }

        if (receivedPendingNotifications) {
            console.log(chalk.blue('📬 Received pending notifications'))
        }
    }

    async handleReconnection() {
        if (this.connectionAttempts >= this.maxConnectionAttempts) {
            console.log(chalk.red(`❌ Max reconnection attempts (${this.maxConnectionAttempts}) reached`))
            console.log(chalk.yellow('⚠️  Please check your internet connection and try again'))
            process.exit(1)
        }

        const delayMs = Math.min(5000 * this.connectionAttempts, 30000)
        console.log(chalk.yellow(`⏳ Reconnecting in ${delayMs / 1000} seconds... (Attempt ${this.connectionAttempts + 1}/${this.maxConnectionAttempts})`))

        await delay(delayMs)
        this.connectionAttempts++
        await this.connectToWhatsApp()
    }

    async onConnected() {
        try {
            if (this.presenceUpdate) {
                await this.sock.sendPresenceUpdate('available')
            }

            const botInfo = this.sock.user
            console.log(chalk.cyan('\n📱 Bot Information:'))
            console.log(chalk.white('  Name:'), chalk.green(botInfo.name || 'Crimson Bot'))
            console.log(chalk.white('  JID:'), chalk.green(botInfo.id))
            console.log(chalk.white('  Number:'), chalk.green(this.formatPhoneNumber(botInfo.id)))
            console.log('')

            await this.sendStartupMessage()

        } catch (error) {
            this.logger.error('Error in onConnected:', error)
        }
    }

    async sendStartupMessage() {
        try {
            const ownerJid = this.config.ownerNumber + '@s.whatsapp.net'
            const message = `╔═══════════════════════════╗
║   🤖 CRIMSON BOT ONLINE   ║
╚═══════════════════════════╝

✓ Bot has successfully started!
⏰ Time: ${moment().tz('Africa/Nouakchott').format('DD/MM/YYYY HH:mm:ss')}
📱 Bot Number: ${this.config.botNumber}
👑 Owner: ${this.config.ownerNumber}
🔧 Prefix: ${this.config.prefix}
💾 Version: 3.0.1
📊 Status: Fully Operational

━━━━━━━━━━━━━━━━━━━━━━━━━
Type ${this.config.prefix}menu to see commands
━━━━━━━━━━━━━━━━━━━━━━━━━`

            await this.sock.sendMessage(ownerJid, { text: message })
            console.log(chalk.green('✓ Startup message sent to owner'))
        } catch (error) {
            this.logger.error('Error sending startup message:', error)
        }
    }

    async handleMessagesUpsert(messages, type) {
        if (type !== 'notify') return

        for (const m of messages) {
            try {
                if (!m.message) continue
                if (m.key.fromMe && !this.config.processOwnMessages) continue

                await this.processMessage(m)

            } catch (error) {
                this.logger.error('Error processing message:', error)
                console.error(chalk.red('❌ Error processing message:'), error.message)
            }
        }
    }

    async processMessage(m) {
        const messageData = await this.extractMessageData(m)

        if (!messageData) return

        const { from, sender, body, messageType } = messageData

        this.updateMessageHistory(from, sender, body)

        if (this.autoReadMessages) {
            await this.sock.readMessages([m.key])
        }

        if (this.isBlocked(sender)) {
            console.log(chalk.yellow(`⚠️  Blocked user attempted to message: ${sender}`))
            return
        }

        if (this.isMuted(from)) {
            return
        }

        if (await this.checkAntiSpam(sender, from)) {
            console.log(chalk.yellow(`⚠️  Anti-spam triggered for: ${sender}`))
            return
        }

        await this.updateUserStats(sender, messageType)

        this.messageQueue.push({ m, messageData })
        await this.processMessageQueue()
    }

    async extractMessageData(m) {
        try {
            const from = m.key.remoteJid
            const sender = m.key.fromMe ? this.sock.user.id : (m.key.participant || from)
            const isGroup = from?.endsWith('@g.us')

            const messageType = Object.keys(m.message)[0]
            let body = ''

            if (messageType === 'conversation') {
                body = m.message.conversation
            } else if (messageType === 'extendedTextMessage') {
                body = m.message.extendedTextMessage.text
            } else if (messageType === 'imageMessage') {
                body = m.message.imageMessage.caption || ''
            } else if (messageType === 'videoMessage') {
                body = m.message.videoMessage.caption || ''
            } else if (messageType === 'documentMessage') {
                body = m.message.documentMessage.caption || ''
            }

            const pushName = m.pushName || 'User'
            const isCmd = body.startsWith(this.config.prefix)
            const command = isCmd ? body.slice(this.config.prefix.length).trim().split(/ +/).shift().toLowerCase() : ''
            const args = body.trim().split(/ +/).slice(1)
            const text = args.join(' ')

            const senderNumber = sender.split('@')[0]
            const isOwner = (this.config.owners?.includes(senderNumber)) || senderNumber === this.config.ownerNumber
            const isSubOwner = this.config.subOwners?.includes(senderNumber) || false
            const isModerator = this.config.moderators?.includes(senderNumber) || false

            let isAdmin = false
            let isBotAdmin = false
            let groupMetadata = null
            let groupAdmins = []

            if (isGroup) {
                try {
                    groupMetadata = await this.sock.groupMetadata(from)
                    groupAdmins = groupMetadata.participants.filter(p => p.admin !== null).map(p => p.id)
                    isAdmin = groupAdmins.includes(sender)
                    isBotAdmin = groupAdmins.includes(this.sock.user.id)
                } catch (error) {
                    this.logger.error('Error fetching group metadata:', error)
                }
            }

            const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage || null
            const mentionedJid = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || []

            return {
                m,
                from,
                sender,
                senderNumber,
                pushName,
                body,
                messageType,
                isGroup,
                groupMetadata,
                groupAdmins,
                isOwner,
                isSubOwner,
                isModerator,
                isAdmin,
                isBotAdmin,
                isCmd,
                command,
                args,
                text,
                quoted,
                mentionedJid,
                isMedia: ['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage', 'stickerMessage'].includes(messageType)
            }
        } catch (error) {
            this.logger.error('Error extracting message data:', error)
            return null
        }
    }

    async processMessageQueue() {
        if (this.processingQueue || this.messageQueue.length === 0) return

        this.processingQueue = true

        while (this.messageQueue.length > 0) {
            const { m, messageData } = this.messageQueue.shift()

            try {
                if (messageData.isCmd) {
                    await this.executeCommand(m, messageData)
                } else {
                    await this.handleNonCommand(m, messageData)
                }
            } catch (error) {
                this.logger.error('Error in message queue processing:', error)
                await this.sendErrorMessage(messageData.from, error)
            }

            await delay(100)
        }

        this.processingQueue = false
    }

    async executeCommand(m, data) {
        const { command, from, sender } = data

        if (await this.checkCommandCooldown(sender, command)) {
            await this.reply(from, '⏰ Please wait before using this command again', m)
            return
        }

        console.log(chalk.cyan(`📝 Command: ${command} | From: ${sender.split('@')[0]} | Group: ${data.isGroup}`))

        await this.setCommandCooldown(sender, command)
    }

    async handleNonCommand(m, data) {
        // Handle non-command messages
    }

    async handleMessagesUpdate(updates) {
        for (const update of updates) {
            const { key, update: updateData } = update

            if (updateData.reaction) {
                await this.handleReaction(key, updateData.reaction)
            }
        }
    }

    async handleMessagesDelete(item) {
        if (item.keys) {
            for (const key of item.keys) {
                console.log(chalk.yellow(`🗑️  Message deleted: ${key.id}`))
            }
        }
    }

    async handleReaction(key, reaction) {
        console.log(chalk.magenta(`👍 Reaction ${reaction.text} from ${reaction.key.remoteJid}`))
    }

    async handleGroupParticipantsUpdate(update) {
        const { id, participants, action } = update

        try {
            const groupMetadata = await this.sock.groupMetadata(id)
            const groupName = groupMetadata.subject

            for (const participant of participants) {
                const number = participant.split('@')[0]

                if (action === 'add') {
                    console.log(chalk.green(`➕ ${number} joined ${groupName}`))
                    await this.sendWelcomeMessage(id, participant, groupName)
                } else if (action === 'remove') {
                    console.log(chalk.red(`➖ ${number} left ${groupName}`))
                    await this.sendGoodbyeMessage(id, participant, groupName)
                } else if (action === 'promote') {
                    console.log(chalk.blue(`⬆️  ${number} promoted in ${groupName}`))
                } else if (action === 'demote') {
                    console.log(chalk.yellow(`⬇️  ${number} demoted in ${groupName}`))
                }
            }
        } catch (error) {
            this.logger.error('Error handling group participants update:', error)
        }
    }

    async sendWelcomeMessage(groupId, participant, groupName) {
        const welcomeText = `╔════════════════════════╗
║   👋 Welcome!   ║
╚════════════════════════╝

Welcome @${participant.split('@')[0]}!
Welcome to ${groupName}

Hope you have a great time with us!`

        try {
            await this.sock.sendMessage(groupId, {
                text: welcomeText,
                mentions: [participant]
            })
        } catch (error) {
            this.logger.error('Error sending welcome message:', error)
        }
    }

    async sendGoodbyeMessage(groupId, participant, groupName) {
        const goodbyeText = `╔════════════════════════╗
║   👋 Goodbye!   ║
╚════════════════════════╝

@${participant.split('@')[0]} left the group

Good luck!`

        try {
            await this.sock.sendMessage(groupId, {
                text: goodbyeText,
                mentions: [participant]
            })
        } catch (error) {
            this.logger.error('Error sending goodbye message:', error)
        }
    }

    async handleGroupsUpdate(updates) {
        for (const update of updates) {
            console.log(chalk.blue('📢 Group updated:'), update.id)
        }
    }

    async handlePresenceUpdate(update) {}
    async handleChatsUpdate(chats) {}
    async handleContactsUpdate(contacts) {}

    async handleCalls(calls) {
        for (const call of calls) {
            if (call.status === 'offer' && this.config.rejectCalls) {
                await this.sock.rejectCall(call.id, call.from)
                console.log(chalk.yellow(`📞 Rejected call from ${call.from}`))
            }
        }
    }

    async handleBlocklistSet(blocklist) {
        console.log(chalk.yellow(`🚫 Blocklist set: ${blocklist.length} users`))
        blocklist.forEach(jid => this.blockedUsers.add(jid))
    }

    async handleBlocklistUpdate(blocklist, type) {
        if (type === 'add') {
            blocklist.forEach(jid => {
                this.blockedUsers.add(jid)
                console.log(chalk.yellow(`🚫 Blocked: ${jid}`))
            })
        } else if (type === 'remove') {
            blocklist.forEach(jid => {
                this.blockedUsers.delete(jid)
                console.log(chalk.green(`✓ Unblocked: ${jid}`))
            })
        }
    }

    async checkAntiSpam(sender, chatId) {
        const key = `${sender}-${chatId}`
        const now = Date.now()
        const spamData = this.antiSpamMap.get(key) || { count: 0, firstMessage: now }

        if (now - spamData.firstMessage < 5000) {
            spamData.count++
            if (spamData.count > 5) {
                this.antiSpamMap.set(key, { count: 0, firstMessage: now + 30000 })
                return true
            }
        } else {
            spamData.count = 1
            spamData.firstMessage = now
        }

        this.antiSpamMap.set(key, spamData)
        return false
    }

    async checkCommandCooldown(sender, command) {
        const key = `${sender}-${command}`
        const cooldown = this.commandCooldowns.get(key)
        return cooldown && Date.now() < cooldown
    }

    async setCommandCooldown(sender, command, duration = 3000) {
        const key = `${sender}-${command}`
        this.commandCooldowns.set(key, Date.now() + duration)
        setTimeout(() => this.commandCooldowns.delete(key), duration)
    }

    isBlocked(jid) {
        return this.blockedUsers.has(jid)
    }

    isMuted(chatId) {
        return this.mutedChats.has(chatId)
    }

    updateMessageHistory(chatId, sender, message) {
        const key = `${chatId}-${sender}`
        const history = this.messageHistory.get(key) || []
        history.push({ message, timestamp: Date.now() })
        if (history.length > 50) history.shift()
        this.messageHistory.set(key, history)
    }

    async updateUserStats(sender, messageType) {
        const stats = this.userStats.get(sender) || {
            totalMessages: 0,
            textMessages: 0,
            mediaMessages: 0,
            commands: 0,
            firstSeen: Date.now(),
            lastSeen: Date.now()
        }

        stats.totalMessages++
        stats.lastSeen = Date.now()

        if (['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage', 'stickerMessage'].includes(messageType)) {
            stats.mediaMessages++
        } else {
            stats.textMessages++
        }

        this.userStats.set(sender, stats)
    }

    getUserStats(sender) {
        return this.userStats.get(sender) || null
    }

    getUptime() {
        const uptime = Date.now() - this.startTime
        const days = Math.floor(uptime / (1000 * 60 * 60 * 24))
        const hours = Math.floor((uptime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((uptime % (1000 * 60)) / 1000)
        return { days, hours, minutes, seconds, total: uptime }
    }

    async sendMessage(jid, content, options = {}) {
        try {
            if (this.autoTyping) {
                await this.sock.sendPresenceUpdate('composing', jid)
                await delay(500)
            }

            const result = await this.sock.sendMessage(jid, content, options)

            if (this.presenceUpdate) {
                await this.sock.sendPresenceUpdate('paused', jid)
            }

            return result
        } catch (error) {
            this.logger.error('Error sending message:', error)
            throw error
        }
    }

    async reply(jid, text, quoted, options = {}) {
        return await this.sendMessage(jid, { text, ...options }, { quoted, ...options })
    }

    async sendText(jid, text, options = {}) {
        return await this.sendMessage(jid, { text }, options)
    }

    async sendImage(jid, imageBuffer, caption = '', options = {}) {
        return await this.sendMessage(jid, { image: imageBuffer, caption, ...options })
    }

    async sendVideo(jid, videoBuffer, caption = '', options = {}) {
        return await this.sendMessage(jid, { video: videoBuffer, caption, ...options })
    }

    async sendAudio(jid, audioBuffer, options = {}) {
        return await this.sendMessage(jid, { audio: audioBuffer, mimetype: 'audio/mp4', ...options })
    }

    async sendDocument(jid, documentBuffer, filename, mimetype, options = {}) {
        return await this.sendMessage(jid, { document: documentBuffer, fileName: filename, mimetype, ...options })
    }

    async sendSticker(jid, stickerBuffer, options = {}) {
        return await this.sendMessage(jid, { sticker: stickerBuffer, ...options })
    }

    async sendLocation(jid, latitude, longitude, name = '', address = '', options = {}) {
        return await this.sendMessage(jid, {
            location: { degreesLatitude: latitude, degreesLongitude: longitude, name, address },
            ...options
        })
    }

    async sendContact(jid, contactNumber, contactName, options = {}) {
        const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${contactName}\nTEL;type=CELL;type=VOICE;waid=${contactNumber}:+${contactNumber}\nEND:VCARD`
        return await this.sendMessage(jid, {
            contacts: { displayName: contactName, contacts: [{ vcard }] },
            ...options
        })
    }

    async sendErrorMessage(jid, error) {
        const errorText = `❌ An error occurred:\n${error.message || 'Unknown error'}\n\nPlease try again or contact the developer.`
        try {
            await this.sendText(jid, errorText)
        } catch (e) {
            this.logger.error('Error sending error message:', e)
        }
    }

    async getGroupMetadata(groupJid) {
        try {
            return await this.sock.groupMetadata(groupJid)
        } catch (error) {
            this.logger.error('Error getting group metadata:', error)
            return null
        }
    }

    async getGroupAdmins(groupJid) {
        try {
            const metadata = await this.getGroupMetadata(groupJid)
            return metadata.participants.filter(p => p.admin !== null).map(p => p.id)
        } catch (error) {
            this.logger.error('Error getting group admins:', error)
            return []
        }
    }

    async groupUpdateSubject(groupJid, subject) {
        try {
            await this.sock.groupUpdateSubject(groupJid, subject)
            return true
        } catch (error) {
            this.logger.error('Error updating group subject:', error)
            return false
        }
    }

    async groupUpdateDescription(groupJid, description) {
        try {
            await this.sock.groupUpdateDescription(groupJid, description)
            return true
        } catch (error) {
            this.logger.error('Error updating group description:', error)
            return false
        }
    }

    async groupSettingUpdate(groupJid, setting) {
        try {
            await this.sock.groupSettingUpdate(groupJid, setting)
            return true
        } catch (error) {
            this.logger.error('Error updating group settings:', error)
            return false
        }
    }

    async groupParticipantsUpdate(groupJid, participants, action) {
        try {
            return await this.sock.groupParticipantsUpdate(groupJid, participants, action)
        } catch (error) {
            this.logger.error('Error updating group participants:', error)
            return null
        }
    }

    async groupAdd(groupJid, participants) {
        return await this.groupParticipantsUpdate(groupJid, participants, 'add')
    }

    async groupRemove(groupJid, participants) {
        return await this.groupParticipantsUpdate(groupJid, participants, 'remove')
    }

    async groupPromote(groupJid, participants) {
        return await this.groupParticipantsUpdate(groupJid, participants, 'promote')
    }

    async groupDemote(groupJid, participants) {
        return await this.groupParticipantsUpdate(groupJid, participants, 'demote')
    }

    async groupLeave(groupJid) {
        try {
            await this.sock.groupLeave(groupJid)
            return true
        } catch (error) {
            this.logger.error('Error leaving group:', error)
            return false
        }
    }

    async groupInviteCode(groupJid) {
        try {
            return await this.sock.groupInviteCode(groupJid)
        } catch (error) {
            this.logger.error('Error getting group invite code:', error)
            return null
        }
    }

    async groupRevokeInvite(groupJid) {
        try {
            return await this.sock.groupRevokeInvite(groupJid)
        } catch (error) {
            this.logger.error('Error revoking group invite:', error)
            return null
        }
    }

    async groupAcceptInvite(inviteCode) {
        try {
            return await this.sock.groupAcceptInvite(inviteCode)
        } catch (error) {
            this.logger.error('Error accepting group invite:', error)
            return null
        }
    }

    async blockUser(jid) {
        try {
            await this.sock.updateBlockStatus(jid, 'block')
            this.blockedUsers.add(jid)
            console.log(chalk.yellow(`🚫 Blocked user: ${jid}`))
            return true
        } catch (error) {
            this.logger.error('Error blocking user:', error)
            return false
        }
    }

    async unblockUser(jid) {
        try {
            await this.sock.updateBlockStatus(jid, 'unblock')
            this.blockedUsers.delete(jid)
            console.log(chalk.green(`✓ Unblocked user: ${jid}`))
            return true
        } catch (error) {
            this.logger.error('Error unblocking user:', error)
            return false
        }
    }

    async getProfilePicture(jid) {
        try {
            return await this.sock.profilePictureUrl(jid, 'image')
        } catch (error) {
            return null
        }
    }

    async updateProfilePicture(jid, imageBuffer) {
        try {
            await this.sock.updateProfilePicture(jid, imageBuffer)
            return true
        } catch (error) {
            this.logger.error('Error updating profile picture:', error)
            return false
        }
    }

    async updateProfileName(name) {
        try {
            await this.sock.updateProfileName(name)
            return true
        } catch (error) {
            this.logger.error('Error updating profile name:', error)
            return false
        }
    }

    async updateProfileStatus(status) {
        try {
            await this.sock.updateProfileStatus(status)
            return true
        } catch (error) {
            this.logger.error('Error updating profile status:', error)
            return false
        }
    }

    async downloadMediaMessage(message) {
        try {
            const buffer = await downloadMediaMessage(message, 'buffer', {}, {
                logger: this.logger,
                reuploadRequest: this.sock.updateMediaMessage
            })
            return buffer
        } catch (error) {
            this.logger.error('Error downloading media:', error)
            return null
        }
    }

    async downloadAndSaveMedia(message, filename) {
        try {
            const buffer = await this.downloadMediaMessage(message)
            if (!buffer) return null

            const filePath = path.join(__dirname, 'downloads', filename)
            fs.writeFileSync(filePath, buffer)
            return filePath
        } catch (error) {
            this.logger.error('Error saving media:', error)
            return null
        }
    }

    async sendPresenceUpdate(type, jid) {
        try {
            await this.sock.sendPresenceUpdate(type, jid)
        } catch (error) {
            this.logger.error('Error sending presence update:', error)
        }
    }

    async setStatus(status) {
        try {
            await this.sock.updateProfileStatus(status)
            console.log(chalk.green(`✓ Status updated: ${status}`))
            return true
        } catch (error) {
            this.logger.error('Error setting status:', error)
            return false
        }
    }

    async setDisplayName(name) {
        try {
            await this.sock.updateProfileName(name)
            console.log(chalk.green(`✓ Display name updated: ${name}`))
            return true
        } catch (error) {
            this.logger.error('Error setting display name:', error)
            return false
        }
    }

    formatPhoneNumber(jid) {
        const number = jid.split('@')[0]
        return '+' + number
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

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
    }

    isValidJid(jid) {
        return /^[0-9]+@(s\.whatsapp\.net|g\.us)$/.test(jid)
    }

    normalizeJid(jid) {
        return jidNormalizedUser(jid)
    }

    isGroupJid(jid) {
        return jid?.endsWith('@g.us')
    }

    isUserJid(jid) {
        return jid?.endsWith('@s.whatsapp.net')
    }

    extractNumberFromJid(jid) {
        return jid?.split('@')[0] || ''
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }

    saveData(key, value) {
        this.tempData.set(key, { value, timestamp: Date.now() })
    }

    getData(key) {
        const data = this.tempData.get(key)
        return data ? data.value : null
    }

    deleteData(key) {
        return this.tempData.delete(key)
    }

    clearExpiredData(maxAge = 3600000) {
        const now = Date.now()
        for (const [key, data] of this.tempData.entries()) {
            if (now - data.timestamp > maxAge) {
                this.tempData.delete(key)
            }
        }
    }

    log(message, level = 'info') {
        const timestamp = moment().format('YYYY-MM-DD HH:mm:ss')
        const colors = {
            info: chalk.blue,
            success: chalk.green,
            warning: chalk.yellow,
            error: chalk.red,
            debug: chalk.gray
        }

        const color = colors[level] || chalk.white
        console.log(color(`[${timestamp}] [${level.toUpperCase()}] ${message}`))
    }

    logCommand(command, sender, chatId, success = true) {
        const status = success ? chalk.green('✓') : chalk.red('✗')
        const timestamp = moment().format('HH:mm:ss')
        console.log(`${status} [${timestamp}] ${chalk.cyan(command)} - ${chalk.yellow(sender.split('@')[0])} - ${chatId}`)
    }

    async getSystemStats() {
        const os = await import('os')
        return {
            platform: os.platform(),
            arch: os.arch(),
            cpus: os.cpus().length,
            totalMemory: os.totalmem(),
            freeMemory: os.freemem(),
            uptime: os.uptime(),
            nodeVersion: process.version,
            botUptime: this.getUptime(),
            isConnected: this.isConnected,
            totalMessages: this.messageHistory.size,
            totalUsers: this.userStats.size,
            activeChats: this.activeChats.size,
            blockedUsers: this.blockedUsers.size,
            mutedChats: this.mutedChats.size
        }
    }

    async cleanup() {
        console.log(chalk.yellow('\n🧹 Cleaning up...'))
        try {
            this.messageQueue = []
            this.activeChats.clear()
            this.commandCooldowns.clear()
            this.antiSpamMap.clear()
            console.log(chalk.green('✓ Memory cleared'))
        } catch (error) {
            this.logger.error('Error during cleanup:', error)
        }
    }

    async shutdown(signal = 'SIGTERM') {
        console.log(chalk.yellow(`\n⚠️  Received ${signal}, shutting down gracefully...`))

        try {
            if (this.isConnected) {
                const ownerJid = this.config.ownerNumber + '@s.whatsapp.net'
                await this.sendText(ownerJid, `🤖 Crimson Bot is shutting down...\n⏰ ${moment().format('DD/MM/YYYY HH:mm:ss')}`)
            }

            await this.cleanup()

            if (this.sock) {
                await this.sock.logout()
                console.log(chalk.green('✓ Logged out successfully'))
            }

            console.log(chalk.green.bold('✓ Shutdown complete'))
            process.exit(0)
        } catch (error) {
            this.logger.error('Error during shutdown:', error)
            process.exit(1)
        }
    }

    setupProcessHandlers() {
        process.on('SIGINT', () => this.shutdown('SIGINT'))
        process.on('SIGTERM', () => this.shutdown('SIGTERM'))
        process.on('uncaughtException', (error) => {
            console.error(chalk.red('❌ Uncaught Exception:'), error)
            this.logger.error('Uncaught Exception:', error)
        })
        process.on('unhandledRejection', (reason, promise) => {
            console.error(chalk.red('❌ Unhandled Rejection:'), reason)
            this.logger.error('Unhandled Rejection:', reason)
        })
    }
}

export default CrimsonBot
