import fs from 'fs'
import path from 'path'
import chalk from 'chalk'
import { promisify } from 'util'

const writeFile = promisify(fs.writeFile)
const readFile = promisify(fs.readFile)
const mkdir = promisify(fs.mkdir)

// ═══════════════════════════════════════════════════
// CRIMSON DATABASE - JSON-BASED DATABASE SYSTEM
// ═══════════════════════════════════════════════════

class CrimsonDatabase {
    constructor(dbPath) {
        this.dbPath = dbPath
        this.data = {
            users: new Map(),
            groups: new Map(),
            messages: [],
            settings: {},
            stats: {},
            commands: [],
            economy: new Map(),
            levels: new Map(),
            warnings: new Map(),
            bans: new Map(),
            mutes: new Map(),
            blacklist: new Set(),
            premium: new Set(),
            registered: new Set(),
            afk: new Map(),
            notes: new Map(),
            reminders: [],
            polls: new Map(),
            games: new Map(),
            inventory: new Map(),
            shop: [],
            transactions: [],
            marriages: new Map(),
            clans: new Map(),
            achievements: new Map(),
            dailyStreak: new Map(),
            plugins: new Map(),
            customData: new Map()
        }
        this.cache = new Map()
        this.saveQueue = []
        this.isSaving = false
        this.autoSaveInterval = null
        this.initialized = false
    }

    // ═══════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════

    async initialize() {
        console.log(chalk.blue('💾 Initializing database...'))

        try {
            if (!fs.existsSync(this.dbPath)) {
                await mkdir(this.dbPath, { recursive: true })
            }

            await this.loadData()
            await this.setupAutoSave()
            
            this.initialized = true
            console.log(chalk.green('✓ Database initialized'))
        } catch (error) {
            console.error(chalk.red('❌ Database initialization failed:'), error)
            throw error
        }
    }

    async loadData() {
        const files = {
            users: 'users.json',
            groups: 'groups.json',
            messages: 'messages.json',
            settings: 'settings.json',
            stats: 'stats.json',
            commands: 'commands.json',
            economy: 'economy.json',
            levels: 'levels.json',
            warnings: 'warnings.json',
            bans: 'bans.json',
            mutes: 'mutes.json',
            blacklist: 'blacklist.json',
            premium: 'premium.json',
            registered: 'registered.json',
            afk: 'afk.json',
            notes: 'notes.json',
            reminders: 'reminders.json',
            polls: 'polls.json',
            games: 'games.json',
            inventory: 'inventory.json',
            shop: 'shop.json',
            transactions: 'transactions.json',
            marriages: 'marriages.json',
            clans: 'clans.json',
            achievements: 'achievements.json',
            dailyStreak: 'daily_streak.json',
            plugins: 'plugins.json',
            customData: 'custom_data.json'
        }

        for (const [key, filename] of Object.entries(files)) {
            await this.loadFile(key, filename)
        }
    }

    async loadFile(key, filename) {
        const filePath = path.join(this.dbPath, filename)

        try {
            if (fs.existsSync(filePath)) {
                const content = await readFile(filePath, 'utf8')
                const parsed = JSON.parse(content)

                if (this.data[key] instanceof Map) {
                    this.data[key] = new Map(Object.entries(parsed))
                } else if (this.data[key] instanceof Set) {
                    this.data[key] = new Set(parsed)
                } else if (Array.isArray(this.data[key])) {
                    this.data[key] = parsed
                } else {
                    this.data[key] = parsed
                }
            }
        } catch (error) {
            console.log(chalk.yellow(`  ⚠ Failed to load ${filename}, using empty data`))
        }
    }

    async saveData() {
        if (this.isSaving) {
            this.saveQueue.push(true)
            return
        }

        this.isSaving = true

        try {
            const files = {
                users: 'users.json',
                groups: 'groups.json',
                messages: 'messages.json',
                settings: 'settings.json',
                stats: 'stats.json',
                commands: 'commands.json',
                economy: 'economy.json',
                levels: 'levels.json',
                warnings: 'warnings.json',
                bans: 'bans.json',
                mutes: 'mutes.json',
                blacklist: 'blacklist.json',
                premium: 'premium.json',
                registered: 'registered.json',
                afk: 'afk.json',
                notes: 'notes.json',
                reminders: 'reminders.json',
                polls: 'polls.json',
                games: 'games.json',
                inventory: 'inventory.json',
                shop: 'shop.json',
                transactions: 'transactions.json',
                marriages: 'marriages.json',
                clans: 'clans.json',
                achievements: 'achievements.json',
                dailyStreak: 'daily_streak.json',
                plugins: 'plugins.json',
                customData: 'custom_data.json'
            }

            for (const [key, filename] of Object.entries(files)) {
                await this.saveFile(key, filename)
            }

            this.isSaving = false

            if (this.saveQueue.length > 0) {
                this.saveQueue = []
                await this.saveData()
            }
        } catch (error) {
            this.isSaving = false
            console.error(chalk.red('❌ Failed to save database:'), error)
        }
    }

    async saveFile(key, filename) {
        const filePath = path.join(this.dbPath, filename)

        try {
            let content

            if (this.data[key] instanceof Map) {
                content = Object.fromEntries(this.data[key])
            } else if (this.data[key] instanceof Set) {
                content = Array.from(this.data[key])
            } else {
                content = this.data[key]
            }

            await writeFile(filePath, JSON.stringify(content, null, 2), 'utf8')
        } catch (error) {
            console.error(chalk.red(`Failed to save ${filename}:`), error.message)
        }
    }

    setupAutoSave() {
        this.autoSaveInterval = setInterval(async () => {
            await this.saveData()
        }, 300000) // Save every 5 minutes
    }

    // ═══════════════════════════════════════════════════
    // USER MANAGEMENT
    // ═══════════════════════════════════════════════════

    getUser(userId) {
        if (!this.data.users.has(userId)) {
            this.data.users.set(userId, this.createDefaultUser(userId))
        }
        return this.data.users.get(userId)
    }

    createDefaultUser(userId) {
        return {
            id: userId,
            name: '',
            registered: false,
            registeredAt: null,
            premium: false,
            premiumUntil: null,
            banned: false,
            banReason: '',
            bannedAt: null,
            bannedUntil: null,
            warnings: 0,
            lastWarning: null,
            afk: false,
            afkReason: '',
            afkSince: null,
            balance: 1000,
            bank: 0,
            level: 1,
            xp: 0,
            totalMessages: 0,
            totalCommands: 0,
            lastDaily: null,
            dailyStreak: 0,
            lastWork: null,
            inventory: [],
            achievements: [],
            married: false,
            partner: null,
            marriedAt: null,
            clan: null,
            joinedClan: null,
            createdAt: Date.now(),
            lastSeen: Date.now(),
            language: 'ar',
            customData: {}
        }
    }

    updateUser(userId, data) {
        const user = this.getUser(userId)
        Object.assign(user, data)
        this.data.users.set(userId, user)
        return user
    }

    deleteUser(userId) {
        return this.data.users.delete(userId)
    }

    getAllUsers() {
        return Array.from(this.data.users.values())
    }

    getUserCount() {
        return this.data.users.size
    }

    isRegisteredUser(userId) {
        const user = this.getUser(userId)
        return user.registered
    }

    async registerUser(userId, name) {
        const user = this.getUser(userId)
        user.registered = true
        user.name = name
        user.registeredAt = Date.now()
        this.data.users.set(userId, user)
        this.data.registered.add(userId)
        return user
    }

    // ═══════════════════════════════════════════════════
    // GROUP MANAGEMENT
    // ═══════════════════════════════════════════════════

    getGroup(groupId) {
        if (!this.data.groups.has(groupId)) {
            this.data.groups.set(groupId, this.createDefaultGroup(groupId))
        }
        return this.data.groups.get(groupId)
    }

    createDefaultGroup(groupId) {
        return {
            id: groupId,
            name: '',
            welcome: true,
            goodbye: true,
            antiLink: false,
            antiBot: false,
            antiViewOnce: false,
            antiDelete: false,
            muted: false,
            mutedUntil: null,
            nsfw: false,
            levelUp: true,
            economy: true,
            games: true,
            members: [],
            admins: [],
            banned: [],
            warnings: new Map(),
            customCommands: [],
            language: 'ar',
            createdAt: Date.now(),
            lastActivity: Date.now(),
            totalMessages: 0,
            customData: {}
        }
    }

    updateGroup(groupId, data) {
        const group = this.getGroup(groupId)
        Object.assign(group, data)
        this.data.groups.set(groupId, group)
        return group
    }

    deleteGroup(groupId) {
        return this.data.groups.delete(groupId)
    }

    getAllGroups() {
        return Array.from(this.data.groups.values())
    }

    getGroupCount() {
        return this.data.groups.size
    }

    isGroupBlacklisted(groupId) {
        return this.data.blacklist.has(groupId)
    }

    // ═══════════════════════════════════════════════════
    // ECONOMY SYSTEM
    // ═══════════════════════════════════════════════════

    getBalance(userId) {
        const user = this.getUser(userId)
        return { balance: user.balance, bank: user.bank }
    }

    addMoney(userId, amount) {
        const user = this.getUser(userId)
        user.balance += amount
        this.data.users.set(userId, user)
        return user.balance
    }

    removeMoney(userId, amount) {
        const user = this.getUser(userId)
        if (user.balance < amount) return false
        user.balance -= amount
        this.data.users.set(userId, user)
        return user.balance
    }

    transferMoney(fromId, toId, amount) {
        const from = this.getUser(fromId)
        const to = this.getUser(toId)

        if (from.balance < amount) return false

        from.balance -= amount
        to.balance += amount

        this.data.users.set(fromId, from)
        this.data.users.set(toId, to)

        this.logTransaction(fromId, toId, amount, 'transfer')

        return true
    }

    depositToBank(userId, amount) {
        const user = this.getUser(userId)
        if (user.balance < amount) return false

        user.balance -= amount
        user.bank += amount
        this.data.users.set(userId, user)
        return true
    }

    withdrawFromBank(userId, amount) {
        const user = this.getUser(userId)
        if (user.bank < amount) return false

        user.bank -= amount
        user.balance += amount
        this.data.users.set(userId, user)
        return true
    }

    logTransaction(from, to, amount, type) {
        this.data.transactions.push({
            from,
            to,
            amount,
            type,
            timestamp: Date.now()
        })

        if (this.data.transactions.length > 10000) {
            this.data.transactions = this.data.transactions.slice(-5000)
        }
    }

    // ═══════════════════════════════════════════════════
    // LEVEL SYSTEM
    // ═══════════════════════════════════════════════════

    getLevel(userId) {
        const user = this.getUser(userId)
        return { level: user.level, xp: user.xp }
    }

    addXP(userId, amount) {
        const user = this.getUser(userId)
        user.xp += amount

        const requiredXP = this.calculateRequiredXP(user.level)

        if (user.xp >= requiredXP) {
            user.level++
            user.xp -= requiredXP
            this.data.users.set(userId, user)
            return { levelUp: true, newLevel: user.level }
        }

        this.data.users.set(userId, user)
        return { levelUp: false, level: user.level, xp: user.xp }
    }

    calculateRequiredXP(level) {
        return level * 100 + 50
    }

    getLeaderboard(type = 'level', limit = 10) {
        const users = this.getAllUsers()

        users.sort((a, b) => {
            if (type === 'level') {
                return b.level - a.level || b.xp - a.xp
            } else if (type === 'balance') {
                return (b.balance + b.bank) - (a.balance + a.bank)
            } else if (type === 'messages') {
                return b.totalMessages - a.totalMessages
            }
            return 0
        })

        return users.slice(0, limit)
    }

    // ═══════════════════════════════════════════════════
    // WARNINGS & BANS
    // ═══════════════════════════════════════════════════

    addWarning(userId, reason, by) {
        const user = this.getUser(userId)
        user.warnings++
        user.lastWarning = {
            reason,
            by,
            timestamp: Date.now()
        }
        this.data.users.set(userId, user)
        return user.warnings
    }

    removeWarning(userId) {
        const user = this.getUser(userId)
        if (user.warnings > 0) {
            user.warnings--
            this.data.users.set(userId, user)
        }
        return user.warnings
    }

    clearWarnings(userId) {
        const user = this.getUser(userId)
        user.warnings = 0
        user.lastWarning = null
        this.data.users.set(userId, user)
        return true
    }

    banUser(userId, reason, duration = null) {
        const user = this.getUser(userId)
        user.banned = true
        user.banReason = reason
        user.bannedAt = Date.now()
        user.bannedUntil = duration ? Date.now() + duration : null
        this.data.users.set(userId, user)
        return true
    }

    unbanUser(userId) {
        const user = this.getUser(userId)
        user.banned = false
        user.banReason = ''
        user.bannedAt = null
        user.bannedUntil = null
        this.data.users.set(userId, user)
        return true
    }

    isBanned(userId) {
        const user = this.getUser(userId)
        if (!user.banned) return false

        if (user.bannedUntil && Date.now() > user.bannedUntil) {
            this.unbanUser(userId)
            return false
        }

        return true
    }

    // ═══════════════════════════════════════════════════
    // BLACKLIST
    // ═══════════════════════════════════════════════════

    addBlacklist(id) {
        this.data.blacklist.add(id)
        return true
    }

    removeBlacklist(id) {
        return this.data.blacklist.delete(id)
    }

    isBlacklisted(id) {
        return this.data.blacklist.has(id)
    }

    getBlacklist() {
        return Array.from(this.data.blacklist)
    }

    // ═══════════════════════════════════════════════════
    // PREMIUM
    // ═══════════════════════════════════════════════════

    addPremium(userId, duration = null) {
        const user = this.getUser(userId)
        user.premium = true
        user.premiumUntil = duration ? Date.now() + duration : null
        this.data.users.set(userId, user)
        this.data.premium.add(userId)
        return true
    }

    removePremium(userId) {
        const user = this.getUser(userId)
        user.premium = false
        user.premiumUntil = null
        this.data.users.set(userId, user)
        this.data.premium.delete(userId)
        return true
    }

    isPremiumUser(userId) {
        const user = this.getUser(userId)
        if (!user.premium) return false

        if (user.premiumUntil && Date.now() > user.premiumUntil) {
            this.removePremium(userId)
            return false
        }

        return true
    }

    getPremiumUsers() {
        return Array.from(this.data.premium)
    }

    // ═══════════════════════════════════════════════════
    // AFK SYSTEM
    // ═══════════════════════════════════════════════════

    setAFK(userId, reason = '') {
        const user = this.getUser(userId)
        user.afk = true
        user.afkReason = reason
        user.afkSince = Date.now()
        this.data.users.set(userId, user)
        this.data.afk.set(userId, { reason, since: Date.now() })
        return true
    }

    removeAFK(userId) {
        const user = this.getUser(userId)
        const afkDuration = Date.now() - user.afkSince
        user.afk = false
        user.afkReason = ''
        user.afkSince = null
        this.data.users.set(userId, user)
        this.data.afk.delete(userId)
        return afkDuration
    }

    isAFK(userId) {
        const user = this.getUser(userId)
        return user.afk
    }

    getAFKReason(userId) {
        const user = this.getUser(userId)
        return user.afkReason
    }

    // ═══════════════════════════════════════════════════
    // NOTES SYSTEM
    // ═══════════════════════════════════════════════════

    addNote(groupId, tag, content, by) {
        if (!this.data.notes.has(groupId)) {
            this.data.notes.set(groupId, new Map())
        }

        const groupNotes = this.data.notes.get(groupId)
        groupNotes.set(tag, {
            content,
            by,
            createdAt: Date.now(),
            uses: 0
        })

        this.data.notes.set(groupId, groupNotes)
        return true
    }

    getNote(groupId, tag) {
        const groupNotes = this.data.notes.get(groupId)
        if (!groupNotes) return null

        const note = groupNotes.get(tag)
        if (note) {
            note.uses++
            groupNotes.set(tag, note)
            this.data.notes.set(groupId, groupNotes)
        }

        return note
    }

    deleteNote(groupId, tag) {
        const groupNotes = this.data.notes.get(groupId)
        if (!groupNotes) return false

        const result = groupNotes.delete(tag)
        this.data.notes.set(groupId, groupNotes)
        return result
    }

    getNotes(groupId) {
        const groupNotes = this.data.notes.get(groupId)
        return groupNotes ? Array.from(groupNotes.entries()) : []
    }

    // ═══════════════════════════════════════════════════
    // REMINDERS
    // ═══════════════════════════════════════════════════

    addReminder(userId, text, time) {
        const reminder = {
            id: Date.now(),
            userId,
            text,
            time,
            createdAt: Date.now(),
            sent: false
        }

        this.data.reminders.push(reminder)
        return reminder
    }

    getReminders(userId = null) {
        if (userId) {
            return this.data.reminders.filter(r => r.userId === userId && !r.sent)
        }
        return this.data.reminders.filter(r => !r.sent)
    }

    getDueReminders() {
        const now = Date.now()
        return this.data.reminders.filter(r => !r.sent && r.time <= now)
    }

    markReminderSent(reminderId) {
        const reminder = this.data.reminders.find(r => r.id === reminderId)
        if (reminder) {
            reminder.sent = true
            return true
        }
        return false
    }

    deleteReminder(reminderId) {
        const index = this.data.reminders.findIndex(r => r.id === reminderId)
        if (index > -1) {
            this.data.reminders.splice(index, 1)
            return true
        }
        return false
    }

    // ═══════════════════════════════════════════════════
    // POLLS SYSTEM
    // ═══════════════════════════════════════════════════

    createPoll(groupId, question, options, duration) {
        const pollId = Date.now()
        const poll = {
            id: pollId,
            groupId,
            question,
            options: options.map(opt => ({ text: opt, votes: [] })),
            createdAt: Date.now(),
            expiresAt: Date.now() + duration,
            active: true,
            voters: []
        }

        this.data.polls.set(pollId, poll)
        return poll
    }

    vote(pollId, userId, optionIndex) {
        const poll = this.data.polls.get(pollId)
        if (!poll || !poll.active) return null

        if (poll.voters.includes(userId)) {
            return { error: 'already_voted' }
        }

        if (optionIndex < 0 || optionIndex >= poll.options.length) {
            return { error: 'invalid_option' }
        }

        poll.options[optionIndex].votes.push(userId)
        poll.voters.push(userId)
        this.data.polls.set(pollId, poll)

        return poll
    }

    getPoll(pollId) {
        return this.data.polls.get(pollId)
    }

    closePoll(pollId) {
        const poll = this.data.polls.get(pollId)
        if (poll) {
            poll.active = false
            this.data.polls.set(pollId, poll)
            return poll
        }
        return null
    }

    // ═══════════════════════════════════════════════════
    // INVENTORY SYSTEM
    // ═══════════════════════════════════════════════════

    addItem(userId, item, quantity = 1) {
        const user = this.getUser(userId)
        const existing = user.inventory.find(i => i.name === item)

        if (existing) {
            existing.quantity += quantity
        } else {
            user.inventory.push({
                name: item,
                quantity,
                addedAt: Date.now()
            })
        }

        this.data.users.set(userId, user)
        return true
    }

    removeItem(userId, item, quantity = 1) {
        const user = this.getUser(userId)
        const existing = user.inventory.find(i => i.name === item)

        if (!existing || existing.quantity < quantity) {
            return false
        }

        existing.quantity -= quantity

        if (existing.quantity === 0) {
            user.inventory = user.inventory.filter(i => i.name !== item)
        }

        this.data.users.set(userId, user)
        return true
    }

    getInventory(userId) {
        const user = this.getUser(userId)
        return user.inventory
    }

    hasItem(userId, item, quantity = 1) {
        const user = this.getUser(userId)
        const existing = user.inventory.find(i => i.name === item)
        return existing && existing.quantity >= quantity
    }

    // ═══════════════════════════════════════════════════
    // SHOP SYSTEM
    // ═══════════════════════════════════════════════════

    addShopItem(item) {
        this.data.shop.push({
            id: Date.now(),
            ...item,
            addedAt: Date.now()
        })
        return true
    }

    removeShopItem(itemId) {
        const index = this.data.shop.findIndex(i => i.id === itemId)
        if (index > -1) {
            this.data.shop.splice(index, 1)
            return true
        }
        return false
    }

    getShop() {
        return this.data.shop
    }

    buyItem(userId, itemId) {
        const item = this.data.shop.find(i => i.id === itemId)
        if (!item) return { error: 'item_not_found' }

        const user = this.getUser(userId)
        if (user.balance < item.price) {
            return { error: 'insufficient_balance' }
        }

        user.balance -= item.price
        this.addItem(userId, item.name, 1)
        this.logTransaction(userId, 'shop', item.price, 'purchase')

        return { success: true, item }
    }

    // ═══════════════════════════════════════════════════
    // MARRIAGE SYSTEM
    // ═══════════════════════════════════════════════════

    marry(userId1, userId2) {
        const user1 = this.getUser(userId1)
        const user2 = this.getUser(userId2)

        if (user1.married || user2.married) {
            return { error: 'already_married' }
        }

        user1.married = true
        user1.partner = userId2
        user1.marriedAt = Date.now()

        user2.married = true
        user2.partner = userId1
        user2.marriedAt = Date.now()

        this.data.users.set(userId1, user1)
        this.data.users.set(userId2, user2)

        this.data.marriages.set(userId1, userId2)
        this.data.marriages.set(userId2, userId1)

        return { success: true }
    }

    divorce(userId) {
        const user = this.getUser(userId)
        if (!user.married) {
            return { error: 'not_married' }
        }

        const partnerId = user.partner
        const partner = this.getUser(partnerId)

        user.married = false
        user.partner = null
        user.marriedAt = null

        partner.married = false
        partner.partner = null
        partner.marriedAt = null

        this.data.users.set(userId, user)
        this.data.users.set(partnerId, partner)

        this.data.marriages.delete(userId)
        this.data.marriages.delete(partnerId)

        return { success: true }
    }

    // ═══════════════════════════════════════════════════
    // CLAN SYSTEM
    // ═══════════════════════════════════════════════════

    createClan(clanName, leaderId) {
        if (this.data.clans.has(clanName)) {
            return { error: 'clan_exists' }
        }

        const user = this.getUser(leaderId)
        if (user.clan) {
            return { error: 'already_in_clan' }
        }

        const clan = {
            name: clanName,
            leader: leaderId,
            members: [leaderId],
            createdAt: Date.now(),
            level: 1,
            xp: 0,
            balance: 0,
            wars: 0,
            wins: 0,
            losses: 0
        }

        this.data.clans.set(clanName, clan)

        user.clan = clanName
        user.joinedClan = Date.now()
        this.data.users.set(leaderId, user)

        return { success: true, clan }
    }

    joinClan(clanName, userId) {
        const clan = this.data.clans.get(clanName)
        if (!clan) {
            return { error: 'clan_not_found' }
        }

        const user = this.getUser(userId)
        if (user.clan) {
            return { error: 'already_in_clan' }
        }

        clan.members.push(userId)
        this.data.clans.set(clanName, clan)

        user.clan = clanName
        user.joinedClan = Date.now()
        this.data.users.set(userId, user)

        return { success: true }
    }

    leaveClan(userId) {
        const user = this.getUser(userId)
        if (!user.clan) {
            return { error: 'not_in_clan' }
        }

        const clan = this.data.clans.get(user.clan)
        if (clan.leader === userId) {
            return { error: 'leader_cannot_leave' }
        }

        clan.members = clan.members.filter(m => m !== userId)
        this.data.clans.set(user.clan, clan)

        user.clan = null
        user.joinedClan = null
        this.data.users.set(userId, user)

        return { success: true }
    }

    // ═══════════════════════════════════════════════════
    // ACHIEVEMENTS
    // ═══════════════════════════════════════════════════

    addAchievement(userId, achievement) {
        const user = this.getUser(userId)
        if (!user.achievements.includes(achievement)) {
            user.achievements.push(achievement)
            this.data.users.set(userId, user)
            return true
        }
        return false
    }

    hasAchievement(userId, achievement) {
        const user = this.getUser(userId)
        return user.achievements.includes(achievement)
    }

    getAchievements(userId) {
        const user = this.getUser(userId)
        return user.achievements
    }

    // ═══════════════════════════════════════════════════
    // DAILY SYSTEM
    // ═══════════════════════════════════════════════════

    claimDaily(userId) {
        const user = this.getUser(userId)
        const now = Date.now()
        const oneDay = 86400000

        if (user.lastDaily && now - user.lastDaily < oneDay) {
            return { error: 'already_claimed', nextDaily: user.lastDaily + oneDay }
        }

        const isStreak = user.lastDaily && now - user.lastDaily < oneDay * 2

        if (isStreak) {
            user.dailyStreak++
        } else {
            user.dailyStreak = 1
        }

        const baseReward = 500
        const streakBonus = user.dailyStreak * 50
        const totalReward = baseReward + streakBonus

        user.balance += totalReward
        user.lastDaily = now

        this.data.users.set(userId, user)

        return {
            success: true,
            reward: totalReward,
            streak: user.dailyStreak
        }
    }

    // ═══════════════════════════════════════════════════
    // STATISTICS
    // ═══════════════════════════════════════════════════

    incrementUserMessages(userId) {
        const user = this.getUser(userId)
        user.totalMessages++
        user.lastSeen = Date.now()
        this.data.users.set(userId, user)
    }

    incrementGroupMessages(groupId) {
        const group = this.getGroup(groupId)
        group.totalMessages++
        group.lastActivity = Date.now()
        this.data.groups.set(groupId, group)
    }

    logCommand(data) {
        this.data.commands.push({
            ...data,
            timestamp: Date.now()
        })

        if (this.data.commands.length > 10000) {
            this.data.commands = this.data.commands.slice(-5000)
        }

        const user = this.getUser(data.sender)
        user.totalCommands++
        this.data.users.set(data.sender, user)
    }

    getCommandStats() {
        const stats = {}
        for (const cmd of this.data.commands) {
            stats[cmd.command] = (stats[cmd.command] || 0) + 1
        }
        return stats
    }

    getMessageCount() {
        return this.data.messages.length
    }

    // ═══════════════════════════════════════════════════
    // SETTINGS
    // ═══════════════════════════════════════════════════

    getSetting(key, defaultValue = null) {
        return this.data.settings[key] || defaultValue
    }

    setSetting(key, value) {
        this.data.settings[key] = value
    }

    isMaintenanceMode() {
        return this.getSetting('maintenance', false)
    }

    setMaintenanceMode(enabled) {
        this.setSetting('maintenance', enabled)
    }

    // ═══════════════════════════════════════════════════
    // SPAM PROTECTION
    // ═══════════════════════════════════════════════════

    getSpamData(userId) {
        return this.cache.get(`spam_${userId}`)
    }

    setSpamData(userId, data) {
        this.cache.set(`spam_${userId}`, data)
        setTimeout(() => {
            this.cache.delete(`spam_${userId}`)
        }, 60000)
    }

    // ═══════════════════════════════════════════════════
    // PLUGIN SETTINGS
    // ═══════════════════════════════════════════════════

    updatePluginStatus(pluginName, enabled) {
        this.data.plugins.set(pluginName, { enabled })
    }

    getPluginStatus(pluginName) {
        return this.data.plugins.get(pluginName)?.enabled !== false
    }

    // ═══════════════════════════════════════════════════
    // CUSTOM DATA
    // ═══════════════════════════════════════════════════

    setCustomData(key, value) {
        this.data.customData.set(key, value)
    }

    getCustomData(key) {
        return this.data.customData.get(key)
    }

    deleteCustomData(key) {
        return this.data.customData.delete(key)
    }

    // ═══════════════════════════════════════════════════
    // BACKUP & CLEANUP
    // ═══════════════════════════════════════════════════

    async createBackup() {
        const backupPath = path.join(this.dbPath, '..', 'backups')
        if (!fs.existsSync(backupPath)) {
            await mkdir(backupPath, { recursive: true })
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const backupFile = path.join(backupPath, `backup_${timestamp}.json`)

        const backup = {
            timestamp: Date.now(),
            version: '3.0.0',
            data: {
                users: Object.fromEntries(this.data.users),
                groups: Object.fromEntries(this.data.groups),
                settings: this.data.settings,
                stats: this.data.stats
            }
        }

        await writeFile(backupFile, JSON.stringify(backup, null, 2))
        console.log(chalk.green(`✓ Backup created: ${backupFile}`))
    }

    cleanup() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval)
        }

        this.cache.clear()
        console.log(chalk.green('✓ Database cleanup completed'))
    }
}

export default CrimsonDatabase
