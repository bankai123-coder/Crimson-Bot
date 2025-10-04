// ═══════════════════════════════════════════════════
// CRIMSON BOT - CONFIGURATION FILE
// ═══════════════════════════════════════════════════

const config = {
    // ═══════════════════════════════════════════════════
    // BOT INFORMATION
    // ═══════════════════════════════════════════════════

    botName: 'CRIMSON-BOT',
    botNumber: '22234001933',
    ownerNumber: '22232157828',

    // ═══════════════════════════════════════════════════
    // OWNERS & PERMISSIONS
    // ═══════════════════════════════════════════════════

    owners: ['22232157828'],

    subOwners: [
        // Add sub-owner numbers here
        // '1234567890',
    ],

    moderators: [
        // Add moderator numbers here
        // '0987654321',
    ],

    premiumUsers: [
        // Add premium user numbers here
    ],

    // ═══════════════════════════════════════════════════
    // BOT SETTINGS
    // ═══════════════════════════════════════════════════

    prefix: '.',

    multiPrefix: false, // Enable multiple prefixes
    prefixes: ['.', '!', '#', '/'], // Multiple prefixes if enabled

    timezone: 'Africa/Nouakchott',

    language: 'ar', // ar, en, fr

    // ═══════════════════════════════════════════════════
    // FEATURES
    // ═══════════════════════════════════════════════════

    autoRead: true, // Auto read messages
    autoTyping: true, // Show typing indicator
    autoRecording: false, // Show recording indicator
    presenceUpdate: true, // Update presence (online/offline)
    markOnlineOnConnect: true, // Mark as online when connected

    processOwnMessages: false, // Process bot's own messages

    antiCall: true, // Reject calls automatically
    rejectCalls: true,

    antiSpam: true,
    antiLink: false,

    autoRestart: true, // Auto restart on crash

    checkUpdates: true, // Check for updates

    verboseLogging: false, // Detailed logs
    logLevel: 'silent', // 'trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent'

    // ═══════════════════════════════════════════════════
    // LIMITS & RESTRICTIONS
    // ═══════════════════════════════════════════════════

    maxMessageLength: 10000,
    maxMediaSize: 100 * 1024 * 1024, // 100MB

    commandCooldown: 3, // seconds

    maxCommandsPerMinute: 20,

    maxGroupSize: 1000, // Max members to join group

    // ═══════════════════════════════════════════════════
    // WELCOME & GOODBYE
    // ═══════════════════════════════════════════════════

    welcomeMessage: true,
    goodbyeMessage: true,

    welcomeText: `╔════════════════════════╗
║   👋 مرحباً بك   ║
╚════════════════════════╝

مرحباً @user!
أهلاً بك في *@group*

نتمنى لك وقتاً ممتعاً معنا! 🎉`,

    goodbyeText: `╔════════════════════════╗
║   👋 وداعاً   ║
╚════════════════════════╝

@user غادر المجموعة

نتمنى لك التوفيق! 🌟`,

    // ═══════════════════════════════════════════════════
    // AUTO REPLY
    // ═══════════════════════════════════════════════════

    autoReply: false,

    autoReplyMessages: {
        'السلام عليكم': 'وعليكم السلام ورحمة الله وبركاته 🌸',
        'صباح الخير': 'صباح النور 🌅',
        'مساء الخير': 'مساء النور 🌙',
        'شكرا': 'العفو ❤️',
        'بوت': 'نعم، أنا هنا! 🤖'
    },

    // ═══════════════════════════════════════════════════
    // BLACKLIST
    // ═══════════════════════════════════════════════════

    blacklistedUsers: [
        // Add blacklisted user numbers here
    ],

    blacklistedGroups: [
        // Add blacklisted group JIDs here
    ],

    blacklistedWords: [
        // Add blacklisted words here
    ],

    // ═══════════════════════════════════════════════════
    // DATABASE SETTINGS
    // ═══════════════════════════════════════════════════

    database: {
        type: 'json',
        path: './database',
        autoSave: true,
        saveInterval: 300000, // 5 minutes
        backup: true,
        backupInterval: 3600000, // 1 hour
        maxBackups: 10
    },

    // ═══════════════════════════════════════════════════
    // SESSION SETTINGS
    // ═══════════════════════════════════════════════════

    sessionName: 'crimson-session',
    multiDevice: true,

    // ═══════════════════════════════════════════════════
    // MENU SETTINGS
    // ═══════════════════════════════════════════════════

    menuType: 'list', // 'text', 'image', 'video', 'list', 'button'

    menuHeader: `╔═══════════════════════════════╗
║   🤖 CRIMSON BOT MENU 🤖      ║
╚═══════════════════════════════╝`,

    menuFooter: `
━━━━━━━━━━━━━━━━━━━━━━━━━
💻 Developer: Crimson Team
📱 Version: 3.0.0
⏰ Uptime: %uptime%
━━━━━━━━━━━━━━━━━━━━━━━━━`,

    menuImage: null, // URL or buffer

    // ═══════════════════════════════════════════════════
    // PLUGIN SETTINGS
    // ═══════════════════════════════════════════════════

    pluginsFolder: './plugins',

    disabledPlugins: [
        // Add plugin names to disable
    ],

    pluginCategories: {
        main: '🏠 الرئيسية',
        group: '👥 المجموعات',
        owner: '👑 المالك',
        admin: '🛡️ الإدارة',
        download: '📥 التحميل',
        search: '🔍 البحث',
        fun: '🎮 الترفيه',
        tools: '🔧 الأدوات',
        media: '🎨 الوسائط',
        info: 'ℹ️ المعلومات',
        economy: '💰 الاقتصاد',
        game: '🎲 الألعاب',
        ai: '🤖 الذكاء الاصطناعي',
        anime: '🎌 الأنمي',
        music: '🎵 الموسيقى',
        other: '📦 أخرى'
    },

    // ═══════════════════════════════════════════════════
    // API KEYS (Add your keys here)
    // ═══════════════════════════════════════════════════

    apiKeys: {
        openai: '', // OpenAI API key
        gemini: '', // Google Gemini API key
        youtube: '', // YouTube Data API key
        spotify: '', // Spotify API key
        weather: '', // Weather API key
        translate: '', // Translation API key
        imgbb: '', // ImgBB API key
        removebg: '', // Remove.bg API key
        deepai: '', // DeepAI API key
        rapidapi: '', // RapidAPI key
        github: '', // GitHub token,
    },

    // ═══════════════════════════════════════════════════
    // SOCIAL MEDIA
    // ═══════════════════════════════════════════════════

    socialMedia: {
        github: 'https://github.com/bankai123-coder/Crimson-Bot.git',
        youtube: 'https://youtube.com/@crimsonbot',
        instagram: 'https://instagram.com/crimsonbot',
        telegram: 'https://t.me/crimsonbot',
        website: 'https://crimsonbot.com'
    },

    // ═══════════════════════════════════════════════════
    // MESSAGES
    // ═══════════════════════════════════════════════════

    messages: {
        wait: '⏳ جاري المعالجة...',
        done: '✅ تم بنجاح!',
        error: '❌ حدث خطأ!',
        ownerOnly: '❌ هذا الأمر للمالك فقط.',
        groupOnly: '❌ هذا الأمر للمجموعات فقط.',
        privateOnly: '❌ هذا الأمر للمحادثات الخاصة فقط.',
        adminOnly: '❌ هذا الأمر للمشرفين فقط.',
        botAdminOnly: '❌ يجب أن أكون مشرفاً لتنفيذ هذا الأمر.',
        premiumOnly: '❌ هذا الأمر للمشتركين المميزين فقط.',
        registeredOnly: '❌ يجب التسجيل أولاً.',
        cooldown: '⏰ يرجى الانتظار قبل استخدام هذا الأمر مرة أخرى.',
        maintenance: '⚠️ البوت في وضع الصيانة حالياً.',
        blacklisted: '🚫 تم حظرك من استخدام البوت.'
    },

    // ═══════════════════════════════════════════════════
    // GAME SETTINGS
    // ═══════════════════════════════════════════════════

    games: {
        enabled: true,
        economy: true,
        currency: '💎',
        currencyName: 'جوهرة',
        startBalance: 1000,
        dailyReward: 500,
        workReward: { min: 100, max: 500 },
        gambleMin: 10,
        gambleMax: 10000
    },

    // ═══════════════════════════════════════════════════
    // DOWNLOAD SETTINGS
    // ═══════════════════════════════════════════════════

    download: {
        maxSize: 500 * 1024 * 1024, // 500MB
        allowedTypes: ['video', 'audio', 'image', 'document'],
        quality: 'medium', // 'low', 'medium', 'high'
        downloadPath: './downloads',
        autoDelete: true,
        deleteAfter: 3600000 // 1 hour
    },

    // ═══════════════════════════════════════════════════
    // STICKER SETTINGS
    // ═══════════════════════════════════════════════════

    sticker: {
        packName: 'Crimson Bot',
        author: 'Created by Crimson',
        quality: 100
    },

    // ═══════════════════════════════════════════════════
    // GROUP SETTINGS
    // ═══════════════════════════════════════════════════

    groupSettings: {
        antiLink: false,
        antiBot: false,
        antiViewOnce: false,
        antiDelete: false,
        welcome: true,
        goodbye: true,
        autokick: false,
        automute: false,
        levelUp: true,
        nsfw: false
    },

    // ═══════════════════════════════════════════════════
    // LEVEL SYSTEM
    // ═══════════════════════════════════════════════════

    levelSystem: {
        enabled: true,
        xpPerMessage: 10,
        xpPerMedia: 25,
        levelUpReward: 100,
        rankRoles: {
            1: 'مبتدئ 🌱',
            5: 'متدرب 📚',
            10: 'محترف ⭐',
            25: 'خبير 💎',
            50: 'أسطورة 👑',
            100: 'إله 🔥'
        }
    },

    // ═══════════════════════════════════════════════════
    // ADVANCED SETTINGS
    // ═══════════════════════════════════════════════════

    advanced: {
        cacheEnabled: true,
        cacheTTL: 3600, // seconds
        maxCacheSize: 100, // MB

        rateLimiting: true,
        maxRequestsPerMinute: 60,

        queueEnabled: true,
        maxQueueSize: 100,

        proxyEnabled: false,
        proxyUrl: '',

        debugMode: false,
        testMode: false,

        performanceMonitoring: true,

        memoryLimit: 500, // MB
        autoCleanup: true,
        cleanupInterval: 1800000, // 30 minutes

        errorReporting: true,
        errorWebhook: '',

        analyticsEnabled: true,

        backupEnabled: true,
        backupSchedule: '0 0 * * *', // Daily at midnight

        updateCheck: true,
        autoUpdate: false
    },

    // ═══════════════════════════════════════════════════
    // NOTIFICATIONS
    // ═══════════════════════════════════════════════════

    notifications: {
        startupMessage: true,
        errorNotifications: true,
        warningNotifications: true,
        updateNotifications: true,
        maintenanceNotifications: true
    },

    // ═══════════════════════════════════════════════════
    // CUSTOM SETTINGS
    // ═══════════════════════════════════════════════════

    custom: {
        // Add your custom settings here
        maxWarnings: 3,
        muteDefaultDuration: 3600000, // 1 hour
        banDefaultDuration: 86400000, // 24 hours

        afkTimeout: 300000, // 5 minutes

        quizTimeout: 30000, // 30 seconds
        gameTimeout: 60000, // 1 minute

        maxPollOptions: 10,
        pollDefaultDuration: 86400000, // 24 hours
    }
};

// ═══════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════

export function getConfig(key) {
    const keys = key.split('.');
    let value = config;

    for (const k of keys) {
        if (value[k] !== undefined) {
            value = value[k];
        } else {
            return null;
        }
    }

    return value;
}

export function setConfig(key, value) {
    const keys = key.split('.');
    let obj = config;

    for (let i = 0; i < keys.length - 1; i++) {
        if (!obj[keys[i]]) {
            obj[keys[i]] = {};
        }
        obj = obj[keys[i]];
    }

    obj[keys[keys.length - 1]] = value;
}

export function isOwner(number) {
    return config.owners.includes(number) || number === config.ownerNumber;
}

export function isSubOwner(number) {
    return config.subOwners.includes(number) || isOwner(number);
}

export function isModerator(number) {
    return config.moderators.includes(number) || isSubOwner(number);
}

export function isPremium(number) {
    return config.premiumUsers.includes(number) || isOwner(number);
}

export function isBlacklisted(number) {
    return config.blacklistedUsers.includes(number);
}

export function addBlacklist(number) {
    if (!config.blacklistedUsers.includes(number)) {
        config.blacklistedUsers.push(number);
        return true;
    }
    return false;
}

export function removeBlacklist(number) {
    const index = config.blacklistedUsers.indexOf(number);
    if (index > -1) {
        config.blacklistedUsers.splice(index, 1);
        return true;
    }
    return false;
}

export default config;
