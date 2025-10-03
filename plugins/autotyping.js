import fs from 'fs';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const AUTOTYPING_PATH = path.join(__dirname, '../data/autotyping.json');

// تهيئة ملف الإعدادات
function initConfig() {
    if (!fs.existsSync(AUTOTYPING_PATH)) {
        const defaultConfig = {
            enabled: false,
            typingDelay: 3000, // تأخير الكتابة بالمللي ثانية
            minDelay: 2000,
            maxDelay: 8000
        };
        fs.writeFileSync(AUTOTYPING_PATH, JSON.stringify(defaultConfig, null, 2));
    }
    return JSON.parse(fs.readFileSync(AUTOTYPING_PATH));
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
            `⌨️ *نظام الكتابة التلقائية*\n\n` +
            `*الحالة:* ${status}\n` +
            `*مدة الكتابة:* ${config.typingDelay}ms\n` +
            `*الحد الأدنى:* ${config.minDelay}ms\n` +
            `*الحد الأقصى:* ${config.maxDelay}ms\n\n` +
            `*الأوامر:*\n` +
            `• .autotyping on - تفعيل النظام\n` +
            `• .autotyping off - تعطيل النظام\n` +
            `• .autotyping delay <مدة> - تغيير المدة\n` +
            `• .autotyping status - عرض الإعدادات\n\n` +
            `*الوظيفة:* إظهار مؤشر الكتابة تلقائياً قبل الرد على الرسائل`, m);
    }

    try {
        switch (action) {
            case 'on':
                config.enabled = true;
                fs.writeFileSync(AUTOTYPING_PATH, JSON.stringify(config, null, 2));
                await conn.reply(m.chat, '✅ تم تفعيل الكتابة التلقائية', m);
                break;

            case 'off':
                config.enabled = false;
                fs.writeFileSync(AUTOTYPING_PATH, JSON.stringify(config, null, 2));
                await conn.reply(m.chat, '❌ تم تعطيل الكتابة التلقائية', m);
                break;

            case 'delay':
                const delay = parseInt(args[1]);
                if (isNaN(delay) || delay < config.minDelay || delay > config.maxDelay) {
                    return await conn.reply(m.chat, 
                        `❌ المدة يجب أن تكون بين ${config.minDelay} و ${config.maxDelay} مللي ثانية`, m);
                }
                config.typingDelay = delay;
                fs.writeFileSync(AUTOTYPING_PATH, JSON.stringify(config, null, 2));
                await conn.reply(m.chat, `✅ تم تغيير مدة الكتابة إلى: ${delay}ms`, m);
                break;

            case 'status':
                const status = config.enabled ? '✅ مفعل' : '❌ معطل';
                await conn.reply(m.chat, 
                    `⚙️ *إعدادات الكتابة التلقائية*\n\n` +
                    `*الحالة:* ${status}\n` +
                    `*مدة الكتابة:* ${config.typingDelay}ms\n` +
                    `*الحد الأدنى:* ${config.minDelay}ms\n` +
                    `*الحد الأقصى:* ${config.maxDelay}ms\n` +
                    `*آخر تحديث:* ${new Date().toLocaleString('ar-SA')}`, m);
                break;

            default:
                await conn.reply(m.chat, '❌ أمر غير معروف. استخدم .autotyping للمساعدة', m);
        }
    } catch (error) {
        console.error('خطأ في أمر الكتابة التلقائية:', error);
        await conn.reply(m.chat, '❌ حدث خطأ أثناء معالجة الأمر', m);
    }
}

// دالة التحقق من تفعيل النظام
export function isAutotypingEnabled() {
    try {
        const config = initConfig();
        return config.enabled;
    } catch (error) {
        console.error('خطأ في التحقق من الكتابة التلقائية:', error);
        return false;
    }
}

// دالة معالجة الكتابة التلقائية للرسائل العادية
export async function handleAutotypingForMessage(sock, chatId, userMessage) {
    if (!isAutotypingEnabled()) return false;

    try {
        const config = initConfig();
        
        // الاشتراك في تحديثات الحالة لهذه الدردشة
        await sock.presenceSubscribe(chatId);
        
        // إرسال حالة متاحة أولاً
        await sock.sendPresenceUpdate('available', chatId);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // ثم إرسال حالة الكتابة
        await sock.sendPresenceUpdate('composing', chatId);
        
        // محاكاة وقت الكتابة بناءً على طول الرسالة
        const typingDelay = Math.max(config.minDelay, Math.min(config.maxDelay, userMessage.length * 150));
        await new Promise(resolve => setTimeout(resolve, typingDelay));
        
        // إرسال الكتابة مرة أخرى للتأكد من بقائها مرئية
        await sock.sendPresenceUpdate('composing', chatId);
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // أخيراً إرسال حالة متوقفة
        await sock.sendPresenceUpdate('paused', chatId);
        
        return true; // تم إظهار الكتابة
    } catch (error) {
        console.error('❌ خطأ في إرسال مؤشر الكتابة:', error);
        return false; // فشل في إظهار الكتابة
    }
}

// دالة إظهار حالة الكتابة بعد تنفيذ الأمر
export async function showTypingAfterCommand(sock, chatId) {
    if (!isAutotypingEnabled()) return false;

    try {
        const config = initConfig();
        
        // هذه الدالة تعمل بعد تنفيذ الأمر وإرسال الرد
        // لذا نحتاج فقط لإظهار مؤشر كتابة قصير
        
        // الاشتراك في تحديثات الحالة
        await sock.presenceSubscribe(chatId);
        
        // إظهار حالة الكتابة لفترة وجيزة
        await sock.sendPresenceUpdate('composing', chatId);
        
        // إبقاء الكتابة مرئية لفترة قصيرة
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // ثم التوقف
        await sock.sendPresenceUpdate('paused', chatId);
        
        return true;
    } catch (error) {
        console.error('❌ خطأ في إرسال مؤشر الكتابة بعد الأمر:', error);
        return false;
    }
}

handler.help = ['autotyping']
handler.tags = ['owner']
handler.command = ['autotyping', 'كتابة_تلقائية']
handler.description = 'نظام إظهار مؤشر الكتابة تلقائياً'
handler.usage = '.autotyping <on/off/delay/status>'

// الصلاحيات - للمالك فقط
handler.group = false
handler.private = true
handler.owner = true
handler.admin = false
handler.premium = false

export default handler
