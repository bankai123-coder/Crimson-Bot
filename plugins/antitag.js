import fs from 'fs';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const ANTITAG_PATH = path.join(__dirname, '../data/antitag.json');

// تهيئة ملف الإعدادات
function initConfig() {
    if (!fs.existsSync(ANTITAG_PATH)) {
        const defaultConfig = {
            enabled: false,
            action: 'delete', // delete, warn, kick
            threshold: 5 // عدد التاغات الذي يعتبر تاغ جماعي
        };
        fs.writeFileSync(ANTITAG_PATH, JSON.stringify(defaultConfig, null, 2));
    }
    return JSON.parse(fs.readFileSync(ANTITAG_PATH));
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
            `🏷️ *نظام منع التاغ الجماعي*\n\n` +
            `*الحالة:* ${status}\n` +
            `*الإجراء:* ${config.action}\n` +
            `*الحد الأدنى:* ${config.threshold} منشن\n\n` +
            `*الأوامر:*\n` +
            `• .antitag on - تفعيل النظام\n` +
            `• .antitag off - تعطيل النظام\n` +
            `• .antitag set <delete|warn|kick> - تحديد الإجراء\n` +
            `• .antitag threshold <عدد> - تحديد الحد الأدنى\n` +
            `• .antitag status - عرض الإعدادات`, m);
    }

    try {
        switch (action) {
            case 'on':
                config.enabled = true;
                fs.writeFileSync(ANTITAG_PATH, JSON.stringify(config, null, 2));
                await conn.reply(m.chat, '✅ تم تفعيل نظام منع التاغ الجماعي', m);
                break;

            case 'off':
                config.enabled = false;
                fs.writeFileSync(ANTITAG_PATH, JSON.stringify(config, null, 2));
                await conn.reply(m.chat, '❌ تم تعطيل نظام منع التاغ الجماعي', m);
                break;

            case 'set':
                const newAction = args[1]?.toLowerCase();
                if (!['delete', 'warn', 'kick'].includes(newAction)) {
                    return await conn.reply(m.chat, '❌ الإجراء غير صالح. الاختيارات: delete, warn, kick', m);
                }
                config.action = newAction;
                fs.writeFileSync(ANTITAG_PATH, JSON.stringify(config, null, 2));
                await conn.reply(m.chat, `✅ تم تغيير الإجراء إلى: ${newAction}`, m);
                break;

            case 'threshold':
                const threshold = parseInt(args[1]);
                if (isNaN(threshold) || threshold < 3 || threshold > 50) {
                    return await conn.reply(m.chat, '❌ الحد الأدنى يجب أن يكون بين 3 و 50', m);
                }
                config.threshold = threshold;
                fs.writeFileSync(ANTITAG_PATH, JSON.stringify(config, null, 2));
                await conn.reply(m.chat, `✅ تم تغيير الحد الأدنى إلى: ${threshold} منشن`, m);
                break;

            case 'status':
                const status = config.enabled ? '✅ مفعل' : '❌ معطل';
                await conn.reply(m.chat, 
                    `⚙️ *إعدادات منع التاغ الجماعي*\n\n` +
                    `*الحالة:* ${status}\n` +
                    `*الإجراء:* ${config.action}\n` +
                    `*الحد الأدنى:* ${config.threshold} منشن\n` +
                    `*المجموعة:* ${groupMetadata?.subject || 'غير معروفة'}`, m);
                break;

            default:
                await conn.reply(m.chat, '❌ أمر غير معروف. استخدم .antitag للمساعدة', m);
        }
    } catch (error) {
        console.error('خطأ في أمر منع التاغ:', error);
        await conn.reply(m.chat, '❌ حدث خطأ أثناء معالجة الأمر', m);
    }
}

// دالة للكشف عن التاغ الجماعي
export function detectMassTagging(message, groupId) {
    try {
        const config = initConfig();
        if (!config.enabled) return null;

        // الحصول على المنسشنز من الرسالة
        const mentions = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        
        if (mentions.length >= config.threshold) {
            return {
                mentionsCount: mentions.length,
                action: config.action,
                mentions: mentions
            };
        }

        return null;
    } catch (error) {
        console.error('خطأ في كشف التاغ الجماعي:', error);
        return null;
    }
}

// دالة معالجة التاغ الجماعي
export async function handleMassTagging(sock, message, detectionResult) {
    try {
        if (!detectionResult) return;

        const { mentionsCount, action, mentions } = detectionResult;
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
        const warningMessage = `⚠️ *تم كشف تاغ جماعي*\n\n` +
                              `*المستخدم:* @${senderId.split('@')[0]}\n` +
                              `*عدد المنسشنز:* ${mentionsCount}\n` +
                              `*الإجراء:* ${action === 'delete' ? 'حذف الرسالة' : action === 'warn' ? 'تحذير' : 'طرد'}\n\n` +
                              `*ملاحظة:* التاغ الجماعي ممنوع في هذه المجموعة`;

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
        console.error('خطأ في معالجة التاغ الجماعي:', error);
    }
}

handler.help = ['antitag']
handler.tags = ['group', 'admin']
handler.command = ['antitag', 'منع_تاغ']
handler.description = 'نظام منع التاغ الجماعي في المجموعات'
handler.usage = '.antitag <on/off/set/threshold/status>'

// الصلاحيات - للمشرفين فقط
handler.group = true
handler.private = false
handler.owner = false
handler.admin = true
handler.botAdmin = true

export default handler
