import fs from 'fs';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const AUTOSTATUS_PATH = path.join(__dirname, '../data/autostatus.json');

// تهيئة ملف الإعدادات
function initConfig() {
    if (!fs.existsSync(AUTOSTATUS_PATH)) {
        const defaultConfig = {
            enabled: false,
            reactOn: false,
            reactionEmoji: '💚'
        };
        fs.writeFileSync(AUTOSTATUS_PATH, JSON.stringify(defaultConfig, null, 2));
    }
    return JSON.parse(fs.readFileSync(AUTOSTATUS_PATH));
}

let handler = async (m, { conn, args, text, isOwner }) => {
    if (!isOwner) {
        return await conn.reply(m.chat, '❌ هذا الأمر للمالك فقط!', m);
    }

    const config = initConfig();
    const action = args[0]?.toLowerCase();

    if (!action) {
        const status = config.enabled ? '✅ مفعل' : '❌ معطل';
        const reactStatus = config.reactOn ? '✅ مفعل' : '❌ معطل';
        return await conn.reply(m.chat, 
            `🔄 *نظام مشاهدة الستاتس تلقائياً*\n\n` +
            `*المشاهدة التلقائية:* ${status}\n` +
            `*ردود الفعل:* ${reactStatus}\n` +
            `*الإيموجي:* ${config.reactionEmoji}\n\n` +
            `*الأوامر:*\n` +
            `• .autostatus on - تفعيل المشاهدة\n` +
            `• .autostatus off - تعطيل المشاهدة\n` +
            `• .autostatus react on/off - ردود الفعل\n` +
            `• .autostatus emoji <إيموجي> - تغيير الإيموجي\n` +
            `• .autostatus status - عرض الإعدادات`, m);
    }

    try {
        switch (action) {
            case 'on':
                config.enabled = true;
                fs.writeFileSync(AUTOSTATUS_PATH, JSON.stringify(config, null, 2));
                await conn.reply(m.chat, 
                    '✅ تم تفعيل مشاهدة الستاتس تلقائياً!\n' +
                    'سيقوم البوت بمشاهدة جميع ستاتسات الجهات تلقائياً.', m);
                break;

            case 'off':
                config.enabled = false;
                fs.writeFileSync(AUTOSTATUS_PATH, JSON.stringify(config, null, 2));
                await conn.reply(m.chat, 
                    '❌ تم تعطيل مشاهدة الستاتس تلقائياً!\n' +
                    'لن يقوم البوت بمشاهدة الستاتسات تلقائياً.', m);
                break;

            case 'react':
                const reactAction = args[1]?.toLowerCase();
                if (!['on', 'off'].includes(reactAction)) {
                    return await conn.reply(m.chat, '❌ استخدم: .autostatus react on/off', m);
                }
                config.reactOn = reactAction === 'on';
                fs.writeFileSync(AUTOSTATUS_PATH, JSON.stringify(config, null, 2));
                await conn.reply(m.chat, 
                    `💫 ردود الفعل على الستاتس: ${config.reactOn ? 'مفعلة' : 'معطلة'}!`, m);
                break;

            case 'emoji':
                const emoji = args[1];
                if (!emoji) {
                    return await conn.reply(m.chat, '❌ يرجى تحديد الإيموجي', m);
                }
                config.reactionEmoji = emoji;
                fs.writeFileSync(AUTOSTATUS_PATH, JSON.stringify(config, null, 2));
                await conn.reply(m.chat, `✅ تم تغيير إيموجي رد الفعل إلى: ${emoji}`, m);
                break;

            case 'status':
                const status = config.enabled ? '✅ مفعل' : '❌ معطل';
                const reactStatus = config.reactOn ? '✅ مفعل' : '❌ معطل';
                await conn.reply(m.chat, 
                    `⚙️ *إعدادات الستاتس التلقائي*\n\n` +
                    `*المشاهدة التلقائية:* ${status}\n` +
                    `*ردود الفعل:* ${reactStatus}\n` +
                    `*الإيموجي:* ${config.reactionEmoji}\n` +
                    `*آخر تحديث:* ${new Date().toLocaleString('ar-SA')}`, m);
                break;

            default:
                await conn.reply(m.chat, '❌ أمر غير معروف. استخدم .autostatus للمساعدة', m);
        }
    } catch (error) {
        console.error('خطأ في أمر الستاتس التلقائي:', error);
        await conn.reply(m.chat, '❌ حدث خطأ أثناء معالجة الأمر', m);
    }
}

// دالة التحقق من تفعيل النظام
export function isAutoStatusEnabled() {
    try {
        const config = initConfig();
        return config.enabled;
    } catch (error) {
        console.error('خطأ في التحقق من الستاتس التلقائي:', error);
        return false;
    }
}

// دالة التحقق من تفعيل ردود الفعل
export function isStatusReactionEnabled() {
    try {
        const config = initConfig();
        return config.reactOn;
    } catch (error) {
        console.error('خطأ في التحقق من ردود الفعل:', error);
        return false;
    }
}

// دالة الرد على الستاتس
export async function reactToStatus(sock, statusKey) {
    try {
        if (!isStatusReactionEnabled()) {
            return;
        }

        const config = initConfig();

        // استخدام طريقة relayMessage المناسبة لردود فعل الستاتس
        await sock.relayMessage(
            'status@broadcast',
            {
                reactionMessage: {
                    key: {
                        remoteJid: 'status@broadcast',
                        id: statusKey.id,
                        participant: statusKey.participant || statusKey.remoteJid,
                        fromMe: false
                    },
                    text: config.reactionEmoji
                }
            },
            {
                messageId: statusKey.id,
                statusJidList: [statusKey.remoteJid, statusKey.participant || statusKey.remoteJid]
            }
        );
        
    } catch (error) {
        console.error('❌ خطأ في الرد على الستاتس:', error.message);
    }
}

// دالة معالجة تحديثات الستاتس
export async function handleStatusUpdate(sock, status) {
    try {
        if (!isAutoStatusEnabled()) {
            return;
        }

        // إضافة تأخير لتجنب تجاوز الحد المسموح
        await new Promise(resolve => setTimeout(resolve, 1000));

        // معالجة الستاتس من messages.upsert
        if (status.messages && status.messages.length > 0) {
            const msg = status.messages[0];
            if (msg.key && msg.key.remoteJid === 'status@broadcast') {
                try {
                    await sock.readMessages([msg.key]);
                    
                    // الرد على الستاتس إذا كان مفعلاً
                    await reactToStatus(sock, msg.key);
                    
                } catch (err) {
                    if (err.message?.includes('rate-overlimit')) {
                        console.log('⚠️ تجاوز الحد المسموح، انتظار قبل إعادة المحاولة...');
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        await sock.readMessages([msg.key]);
                    } else {
                        throw err;
                    }
                }
                return;
            }
        }

        // معالجة تحديثات الستاتس المباشرة
        if (status.key && status.key.remoteJid === 'status@broadcast') {
            try {
                await sock.readMessages([status.key]);
                
                // الرد على الستاتس إذا كان مفعلاً
                await reactToStatus(sock, status.key);
                
            } catch (err) {
                if (err.message?.includes('rate-overlimit')) {
                    console.log('⚠️ تجاوز الحد المسموح، انتظار قبل إعادة المحاولة...');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    await sock.readMessages([status.key]);
                } else {
                    throw err;
                }
            }
            return;
        }

    } catch (error) {
        console.error('❌ خطأ في مشاهدة الستاتس التلقائية:', error.message);
    }
}

handler.help = ['autostatus']
handler.tags = ['owner']
handler.command = ['autostatus', 'ستاتس_تلقائي']
handler.description = 'نظام مشاهدة والرد على الستاتس تلقائياً'
handler.usage = '.autostatus <on/off/react/emoji/status>'

// الصلاحيات - للمالك فقط
handler.group = false
handler.private = true
handler.owner = true
handler.admin = false
handler.premium = false

export default handler
