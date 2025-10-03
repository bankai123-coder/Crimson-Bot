import fs from 'fs';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const AUTOREAD_PATH = path.join(__dirname, '../data/autoread.json');

// تهيئة ملف الإعدادات
function initConfig() {
    if (!fs.existsSync(AUTOREAD_PATH)) {
        const defaultConfig = {
            enabled: false,
            ignoreMentions: true // تجاهل الرسائل التي تذكر البوت
        };
        fs.writeFileSync(AUTOREAD_PATH, JSON.stringify(defaultConfig, null, 2));
    }
    return JSON.parse(fs.readFileSync(AUTOREAD_PATH));
}

let handler = async (m, { conn, args, text, isOwner }) => {
    if (!isOwner) {
        return await conn.reply(m.chat, '❌ هذا الأمر للمالك فقط!', m);
    }

    const config = initConfig();
    const action = args[0]?.toLowerCase();

    if (!action) {
        const status = config.enabled ? '✅ مفعل' : '❌ معطل';
        return await conn.reply(m.chat, 
            `📖 *نظام القراءة التلقائية*\n\n` +
            `*الحالة:* ${status}\n` +
            `*تجاهل المنشنز:* ${config.ignoreMentions ? '✅' : '❌'}\n\n` +
            `*الأوامر:*\n` +
            `• .autoread on - تفعيل النظام\n` +
            `• .autoread off - تعطيل النظام\n` +
            `• .autoread mentions on/off - تجاهل المنشنز\n` +
            `• .autoread status - عرض الإعدادات\n\n` +
            `*الوظيفة:* قراءة الرسائل تلقائياً مع إمكانية تجاهل الرسائل التي تذكر البوت`, m);
    }

    try {
        switch (action) {
            case 'on':
                config.enabled = true;
                fs.writeFileSync(AUTOREAD_PATH, JSON.stringify(config, null, 2));
                await conn.reply(m.chat, '✅ تم تفعيل القراءة التلقائية', m);
                break;

            case 'off':
                config.enabled = false;
                fs.writeFileSync(AUTOREAD_PATH, JSON.stringify(config, null, 2));
                await conn.reply(m.chat, '❌ تم تعطيل القراءة التلقائية', m);
                break;

            case 'mentions':
                const mentionsSetting = args[1]?.toLowerCase();
                if (!['on', 'off'].includes(mentionsSetting)) {
                    return await conn.reply(m.chat, '❌ استخدم: .autoread mentions on/off', m);
                }
                config.ignoreMentions = mentionsSetting === 'on';
                fs.writeFileSync(AUTOREAD_PATH, JSON.stringify(config, null, 2));
                await conn.reply(m.chat, `✅ تجاهل المنشنز: ${config.ignoreMentions ? 'مفعل' : 'معطل'}`, m);
                break;

            case 'status':
                const status = config.enabled ? '✅ مفعل' : '❌ معطل';
                await conn.reply(m.chat, 
                    `⚙️ *إعدادات القراءة التلقائية*\n\n` +
                    `*الحالة:* ${status}\n` +
                    `*تجاهل المنشنز:* ${config.ignoreMentions ? '✅' : '❌'}\n` +
                    `*آخر تحديث:* ${new Date().toLocaleString('ar-SA')}`, m);
                break;

            default:
                await conn.reply(m.chat, '❌ أمر غير معروف. استخدم .autoread للمساعدة', m);
        }
    } catch (error) {
        console.error('خطأ في أمر القراءة التلقائية:', error);
        await conn.reply(m.chat, '❌ حدث خطأ أثناء معالجة الأمر', m);
    }
}

// دالة التحقق من تفعيل النظام
export function isAutoreadEnabled() {
    try {
        const config = initConfig();
        return config.enabled;
    } catch (error) {
        console.error('خطأ في التحقق من القراءة التلقائية:', error);
        return false;
    }
}

// دالة التحقق إذا كانت الرسالة تذكر البوت
export function isBotMentioned(message, botNumber) {
    try {
        if (!message.message) return false;

        // التحقق من المنسشنز في contextInfo (يعمل لجميع أنواع الرسائل)
        const messageTypes = [
            'extendedTextMessage', 'imageMessage', 'videoMessage', 'stickerMessage',
            'documentMessage', 'audioMessage', 'contactMessage', 'locationMessage'
        ];

        // التحقق من المنسشنز الصريحة في مصفوفة mentionedJid
        for (const type of messageTypes) {
            if (message.message[type]?.contextInfo?.mentionedJid) {
                const mentionedJid = message.message[type].contextInfo.mentionedJid;
                if (mentionedJid.some(jid => jid === botNumber)) {
                    return true;
                }
            }
        }

        // التحقق من المنشنز النصية في أنواع الرسائل المختلفة
        const textContent = 
            message.message.conversation || 
            message.message.extendedTextMessage?.text ||
            message.message.imageMessage?.caption ||
            message.message.videoMessage?.caption || '';

        if (textContent) {
            // التحقق من صيغة @mention
            const botUsername = botNumber.split('@')[0];
            if (textContent.includes(`@${botUsername}`)) {
                return true;
            }

            // التحقق من أسماء البوت (اختياري، يمكن تخصيصه)
            const botNames = ['بوت', 'bot', 'knight', 'knight bot', 'crimson', 'crimson bot'];
            const words = textContent.toLowerCase().split(/\s+/);
            if (botNames.some(name => words.includes(name))) {
                return true;
            }
        }

        return false;
    } catch (error) {
        console.error('خطأ في التحقق من المنشنز:', error);
        return false;
    }
}

// دالة معالجة القراءة التلقائية
export async function handleAutoread(sock, message) {
    try {
        const config = initConfig();
        if (!config.enabled) return false;

        // الحصول على رقم البوت
        const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';

        // التحقق إذا كانت الرسالة تذكر البوت
        const isBotMentionedMsg = config.ignoreMentions && isBotMentioned(message, botNumber);

        // إذا كانت الرسالة تذكر البوت، لا تقرأها
        if (isBotMentionedMsg) {
            return false; // لم يتم قراءة الرسالة
        } else {
            // للرسائل العادية، قم بقراءتها بشكل طبيعي
            const key = { 
                remoteJid: message.key.remoteJid, 
                id: message.key.id, 
                participant: message.key.participant 
            };
            await sock.readMessages([key]);
            return true; // تم قراءة الرسالة
        }
    } catch (error) {
        console.error('خطأ في القراءة التلقائية:', error);
        return false;
    }
}

handler.help = ['autoread']
handler.tags = ['owner']
handler.command = ['autoread', 'قراءة_تلقائية']
handler.description = 'نظام القراءة التلقائية للرسائل'
handler.usage = '.autoread <on/off/mentions/status>'

// الصلاحيات - للمالك فقط
handler.group = false
handler.private = true
handler.owner = true
handler.admin = false
handler.premium = false

export default handler
