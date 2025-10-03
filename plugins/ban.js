import fs from 'fs';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const BANNED_USERS_PATH = path.join(__dirname, '../data/banned.json');

// تهيئة ملف المحظورين
function initBannedUsers() {
    if (!fs.existsSync(BANNED_USERS_PATH)) {
        fs.writeFileSync(BANNED_USERS_PATH, JSON.stringify([], null, 2));
    }
    return JSON.parse(fs.readFileSync(BANNED_USERS_PATH));
}

let handler = async (m, { conn, args, text, isAdmin, isGroup, groupMetadata, sender }) => {
    if (!isGroup) {
        return await conn.reply(m.chat, '❌ هذا الأمر للمجموعات فقط!', m);
    }

    if (!isAdmin) {
        return await conn.reply(m.chat, '❌ هذا الأمر للمشرفين فقط!', m);
    }

    let userToBan;
    
    // التحقق من المستخدمين المذكورين
    if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
        userToBan = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
    }
    // التحقق من الرسالة المرد عليها
    else if (m.message?.extendedTextMessage?.contextInfo?.participant) {
        userToBan = m.message.extendedTextMessage.contextInfo.participant;
    }
    // التحقق من الوسم في النص
    else if (args[0] && args[0].includes('@')) {
        userToBan = args[0] + '@s.whatsapp.net';
    }
    
    if (!userToBan) {
        return await conn.reply(m.chat, 
            `🚫 *أمر الحظر*\n\n` +
            `*الاستخدام:*\n` +
            `• رد على رسالة المستخدم + .ban\n` +
            `• .ban @منشن_المستخدم\n` +
            `• .ban 1234567890\n\n` +
            `*مثال:*\n` +
            `.ban @username\n` +
            `.ban 1234567890`, m);
    }

    try {
        // إضافة المستخدم إلى قائمة المحظورين
        const bannedUsers = initBannedUsers();
        
        if (!bannedUsers.includes(userToBan)) {
            bannedUsers.push(userToBan);
            fs.writeFileSync(BANNED_USERS_PATH, JSON.stringify(bannedUsers, null, 2));
            
            await conn.reply(m.chat, 
                `🚫 *تم حظر المستخدم*\n\n` +
                `*المستخدم:* @${userToBan.split('@')[0]}\n` +
                `*بواسطة:* @${sender.split('@')[0]}\n` +
                `*الوقت:* ${new Date().toLocaleString('ar-SA')}\n\n` +
                `تم حظر المستخدم من استخدام البوت.`,
                { mentions: [userToBan, sender] }
            );
        } else {
            await conn.reply(m.chat, 
                `⚠️ *المستخدم محظور مسبقاً*\n\n` +
                `@${userToBan.split('@')[0]} موجود بالفعل في قائمة المحظورين.`,
                { mentions: [userToBan] }
            );
        }
    } catch (error) {
        console.error('خطأ في أمر الحظر:', error);
        await conn.reply(m.chat, '❌ فشل في حظر المستخدم!', m);
    }
}

// دالة التحقق إذا كان المستخدم محظوراً
export function isUserBanned(userId) {
    try {
        const bannedUsers = initBannedUsers();
        return bannedUsers.includes(userId);
    } catch (error) {
        console.error('خطأ في التحقق من الحظر:', error);
        return false;
    }
}

// دالة فك حظر المستخدم
export function unbanUser(userId) {
    try {
        const bannedUsers = initBannedUsers();
        const index = bannedUsers.indexOf(userId);
        
        if (index > -1) {
            bannedUsers.splice(index, 1);
            fs.writeFileSync(BANNED_USERS_PATH, JSON.stringify(bannedUsers, null, 2));
            return true;
        }
        return false;
    } catch (error) {
        console.error('خطأ في فك الحظر:', error);
        return false;
    }
}

// أمر فك الحظر
let unbanHandler = async (m, { conn, args, text, isAdmin, isGroup, sender }) => {
    if (!isGroup) {
        return await conn.reply(m.chat, '❌ هذا الأمر للمجموعات فقط!', m);
    }

    if (!isAdmin) {
        return await conn.reply(m.chat, '❌ هذا الأمر للمشرفين فقط!', m);
    }

    let userToUnban;
    
    if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
        userToUnban = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
    } else if (args[0] && args[0].includes('@')) {
        userToUnban = args[0] + '@s.whatsapp.net';
    }
    
    if (!userToUnban) {
        return await conn.reply(m.chat, 
            `🔓 *أمر فك الحظر*\n\n` +
            `*الاستخدام:*\n` +
            `• .unban @منشن_المستخدم\n` +
            `• .unban 1234567890\n\n` +
            `*مثال:*\n` +
            `.unban @username`, m);
    }

    try {
        if (unbanUser(userToUnban)) {
            await conn.reply(m.chat, 
                `🔓 *تم فك حظر المستخدم*\n\n` +
                `*المستخدم:* @${userToUnban.split('@')[0]}\n` +
                `*بواسطة:* @${sender.split('@')[0]}\n` +
                `*الوقت:* ${new Date().toLocaleString('ar-SA')}\n\n` +
                `يمكن للمستخدم الآن استخدام البوت مرة أخرى.`,
                { mentions: [userToUnban, sender] }
            );
        } else {
            await conn.reply(m.chat, 
                `⚠️ *المستخدم غير محظور*\n\n` +
                `@${userToUnban.split('@')[0]} غير موجود في قائمة المحظورين.`,
                { mentions: [userToUnban] }
            );
        }
    } catch (error) {
        console.error('خطأ في أمر فك الحظر:', error);
        await conn.reply(m.chat, '❌ فشل في فك حظر المستخدم!', m);
    }
}

// تصدير كل ال handlers
handler.help = ['ban']
handler.tags = ['group', 'admin']
handler.command = ['ban', 'حظر']
handler.description = 'حظر المستخدمين من استخدام البوت'
handler.usage = '.ban <@منشن|رد|رقم>'

unbanHandler.help = ['unban']
unbanHandler.tags = ['group', 'admin']
unbanHandler.command = ['unban', 'فك_حظر']
unbanHandler.description = 'فك حظر المستخدمين'
unbanHandler.usage = '.unban <@منشن|رقم>'

// الصلاحيات - للمشرفين فقط
handler.group = true
handler.private = false
handler.owner = false
handler.admin = true
handler.botAdmin = false

unbanHandler.group = true
unbanHandler.private = false
unbanHandler.owner = false
unbanHandler.admin = true
unbanHandler.botAdmin = false

export { handler as default, unbanHandler, isUserBanned, unbanUser }
