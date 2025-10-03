import fs from 'fs';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const ANTILINK_PATH = path.join(__dirname, '../data/antilink.json');

// تهيئة ملف الإعدادات
function initConfig() {
    if (!fs.existsSync(ANTILINK_PATH)) {
        const defaultConfig = {
            enabled: false,
            action: 'delete', // delete, warn, kick
            strictMode: false
        };
        fs.writeFileSync(ANTILINK_PATH, JSON.stringify(defaultConfig, null, 2));
    }
    return JSON.parse(fs.readFileSync(ANTILINK_PATH));
}

let handler = async (m, { conn, args, text, isAdmin, isGroup, groupMetadata, sender }) => {
    if (!isGroup) {
        return await conn.reply(m.chat, '❌ هذا الأمر للمجموعات فقط!', m);
    }

    if (!isAdmin) {
        return await conn.reply(m.chat, '❌ هذا الأمر للمشرفين فقط!', m);
    }

    const config = initConfig();
    const action = args[0]?.toLowerCase();

    if (!action) {
        const status = config.enabled ? '✅ مفعل' : '❌ معطل';
        return await conn.reply(m.chat, 
            `🔗 *نظام منع الروابط*\n\n` +
            `*الحالة:* ${status}\n` +
            `*الإجراء:* ${config.action}\n` +
            `*الوضع الصارم:* ${config.strictMode ? '✅' : '❌'}\n\n` +
            `*الأوامر:*\n` +
            `• .antilink on - تفعيل النظام\n` +
            `• .antilink off - تعطيل النظام\n` +
            `• .antilink set <delete|warn|kick> - تحديد الإجراء\n` +
            `• .antilink strict on/off - الوضع الصارم\n` +
            `• .antilink status - عرض الإعدادات`, m);
    }

    try {
        switch (action) {
            case 'on':
                config.enabled = true;
                fs.writeFileSync(ANTILINK_PATH, JSON.stringify(config, null, 2));
                await conn.reply(m.chat, '✅ تم تفعيل نظام منع الروابط', m);
                break;

            case 'off':
                config.enabled = false;
                fs.writeFileSync(ANTILINK_PATH, JSON.stringify(config, null, 2));
                await conn.reply(m.chat, '❌ تم تعطيل نظام منع الروابط', m);
                break;

            case 'set':
                const newAction = args[1]?.toLowerCase();
                if (!['delete', 'warn', 'kick'].includes(newAction)) {
                    return await conn.reply(m.chat, '❌ الإجراء غير صالح. الاختيارات: delete, warn, kick', m);
                }
                config.action = newAction;
                fs.writeFileSync(ANTILINK_PATH, JSON.stringify(config, null, 2));
                await conn.reply(m.chat, `✅ تم تغيير الإجراء إلى: ${newAction}`, m);
                break;

            case 'strict':
                const strictMode = args[1]?.toLowerCase();
                if (!['on', 'off'].includes(strictMode)) {
                    return await conn.reply(m.chat, '❌ استخدم: .antilink strict on/off', m);
                }
                config.strictMode = strictMode === 'on';
                fs.writeFileSync(ANTILINK_PATH, JSON.stringify(config, null, 2));
                await conn.reply(m.chat, `✅ الوضع الصارم: ${config.strictMode ? 'مفعل' : 'معطل'}`, m);
                break;

            case 'status':
                const status = config.enabled ? '✅ مفعل' : '❌ معطل';
                await conn.reply(m.chat, 
                    `⚙️ *إعدادات منع الروابط*\n\n` +
                    `*الحالة:* ${status}\n` +
                    `*الإجراء:* ${config.action}\n` +
                    `*الوضع الصارم:* ${config.strictMode ? '✅' : '❌'}\n` +
                    `*المجموعة:* ${groupMetadata?.subject || 'غير معروفة'}`, m);
                break;

            default:
                await conn.reply(m.chat, '❌ أمر غير معروف. استخدم .antilink للمساعدة', m);
        }
    } catch (error) {
        console.error('خطأ في أمر منع الروابط:', error);
        await conn.reply(m.chat, '❌ حدث خطأ أثناء معالجة الأمر', m);
    }
}

// دالة للكشف عن الروابط
export function detectLinks(message, groupId) {
    try {
        const config = initConfig();
        if (!config.enabled) return null;

        const text = message.message?.conversation || 
                    message.message?.extendedTextMessage?.text ||
                    message.message?.imageMessage?.caption ||
                    message.message?.videoMessage?.caption || '';

        if (!text) return null;

        const linkPatterns = {
            whatsappGroup: /chat\.whatsapp\.com\/[A-Za-z0-9]{20,}/i,
            whatsappChannel: /wa\.me\/channel\/[A-Za-z0-9]{20,}/i,
            telegram: /t\.me\/[A-Za-z0-9_]+/i,
            youtube: /youtube\.com|youtu\.be/i,
            instagram: /instagram\.com/i,
            tiktok: /tiktok\.com/i,
            facebook: /facebook\.com|fb\.com/i,
            twitter: /twitter\.com|x\.com/i,
            allLinks: config.strictMode ? /https?:\/\/\S+|www\.\S+|(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/\S*)?/i : null
        };

        const detectedLinks = [];

        for (const [type, pattern] of Object.entries(linkPatterns)) {
            if (pattern && pattern.test(text)) {
                detectedLinks.push(type);
            }
        }

        return detectedLinks.length > 0 ? { links: detectedLinks, action: config.action } : null;
    } catch (error) {
        console.error('خطأ في كشف الروابط:', error);
        return null;
    }
}

// دالة معالجة الروابط المكتشفة
export async function handleLinkDetection(sock, message, detectionResult) {
    try {
        if (!detectionResult) return;

        const { links, action } = detectionResult;
        const chatId = message.key.remoteJid;
        const senderId = message.key.participant || message.key.remoteJid;
        const messageId = message.key.id;

        // حذف الرسالة
        if (action === 'delete' || action === 'warn' || action === 'kick') {
            try {
                await sock.sendMessage(chatId, {
                    delete: {
                        remoteJid: chatId,
                        fromMe: false,
                        id: messageId,
                        participant: senderId
                    }
                });
            } catch (error) {
                console.error('خطأ في حذف الرسالة:', error);
            }
        }

        // إرسال تحذير
        const warningMessage = `⚠️ *تم كشف روابط محظورة*\n\n` +
                              `*المستخدم:* @${senderId.split('@')[0]}\n` +
                              `*الروابط:* ${links.join(', ')}\n` +
                              `*الإجراء:* ${action === 'delete' ? 'حذف الرسالة' : action === 'warn' ? 'تحذير' : 'طرد'}`;

        await sock.sendMessage(chatId, {
            text: warningMessage,
            mentions: [senderId]
        });

        // طرد المستخدم إذا كان الإجراء kick
        if (action === 'kick') {
            try {
                await sock.groupParticipantsUpdate(chatId, [senderId], "remove");
            } catch (error) {
                console.error('خطأ في طرد المستخدم:', error);
            }
        }

    } catch (error) {
        console.error('خطأ في معالجة الروابط:', error);
    }
}

handler.help = ['antilink']
handler.tags = ['group', 'admin']
handler.command = ['antilink', 'منع_روابط']
handler.description = 'نظام منع الروابط في المجموعات'
handler.usage = '.antilink <on/off/set/strict/status>'

// الصلاحيات - للمشرفين فقط
handler.group = true
handler.private = false
handler.owner = false
handler.admin = true
handler.botAdmin = true

export default handler
