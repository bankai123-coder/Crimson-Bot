import fs from 'fs';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const BAD_WORDS_PATH = path.join(__dirname, '../data/badwords.json');

// تهيئة ملف الكلمات السيئة
function initBadWords() {
    if (!fs.existsSync(BAD_WORDS_PATH)) {
        const defaultWords = {
            enabled: false,
            words: [],
            action: 'delete' // delete, warn, mute, kick
        };
        fs.writeFileSync(BAD_WORDS_PATH, JSON.stringify(defaultWords, null, 2));
    }
    return JSON.parse(fs.readFileSync(BAD_WORDS_PATH));
}

let handler = async (m, { conn, args, text, isAdmin, isGroup, groupMetadata, sender }) => {
    if (!isGroup) {
        return await conn.reply(m.chat, '❌ هذا الأمر للمجموعات فقط!', m);
    }

    if (!isAdmin) {
        return await conn.reply(m.chat, '❌ هذا الأمر للمشرفين فقط!', m);
    }

    const config = initBadWords();
    const action = args[0]?.toLowerCase();

    if (!action) {
        const status = config.enabled ? '✅ مفعل' : '❌ معطل';
        const wordsCount = config.words.length;
        return await conn.reply(m.chat, 
            `🚫 *نظام منع الكلمات السيئة*\n\n` +
            `*الحالة:* ${status}\n` +
            `*الإجراء:* ${config.action}\n` +
            `*عدد الكلمات:* ${wordsCount}\n\n` +
            `*الأوامر:*\n` +
            `• .antibadword on - تفعيل النظام\n` +
            `• .antibadword off - تعطيل النظام\n` +
            `• .antibadword add <كلمة> - إضافة كلمة\n` +
            `• .antibadword remove <كلمة> - إزالة كلمة\n` +
            `• .antibadword list - عرض القائمة\n` +
            `• .antibadword set <delete|warn|mute|kick> - تحديد الإجراء\n` +
            `• .antibadword status - عرض الإعدادات`, m);
    }

    try {
        switch (action) {
            case 'on':
                config.enabled = true;
                fs.writeFileSync(BAD_WORDS_PATH, JSON.stringify(config, null, 2));
                await conn.reply(m.chat, '✅ تم تفعيل نظام منع الكلمات السيئة', m);
                break;

            case 'off':
                config.enabled = false;
                fs.writeFileSync(BAD_WORDS_PATH, JSON.stringify(config, null, 2));
                await conn.reply(m.chat, '❌ تم تعطيل نظام منع الكلمات السيئة', m);
                break;

            case 'add':
                const wordToAdd = args.slice(1).join(' ').toLowerCase();
                if (!wordToAdd) {
                    return await conn.reply(m.chat, '❌ يرجى تحديد الكلمة المراد إضافتها', m);
                }
                if (!config.words.includes(wordToAdd)) {
                    config.words.push(wordToAdd);
                    fs.writeFileSync(BAD_WORDS_PATH, JSON.stringify(config, null, 2));
                    await conn.reply(m.chat, `✅ تم إضافة الكلمة: "${wordToAdd}"`, m);
                } else {
                    await conn.reply(m.chat, '⚠️ هذه الكلمة موجودة مسبقاً', m);
                }
                break;

            case 'remove':
                const wordToRemove = args.slice(1).join(' ').toLowerCase();
                if (!wordToRemove) {
                    return await conn.reply(m.chat, '❌ يرجى تحديد الكلمة المراد إزالتها', m);
                }
                const index = config.words.indexOf(wordToRemove);
                if (index > -1) {
                    config.words.splice(index, 1);
                    fs.writeFileSync(BAD_WORDS_PATH, JSON.stringify(config, null, 2));
                    await conn.reply(m.chat, `✅ تم إزالة الكلمة: "${wordToRemove}"`, m);
                } else {
                    await conn.reply(m.chat, '❌ الكلمة غير موجودة في القائمة', m);
                }
                break;

            case 'list':
                const wordsList = config.words.length > 0 
                    ? config.words.map((w, i) => `${i + 1}. ${w}`).join('\n')
                    : 'لا توجد كلمات في القائمة';
                await conn.reply(m.chat, `📋 *قائمة الكلمات الممنوعة:*\n\n${wordsList}`, m);
                break;

            case 'set':
                const newAction = args[1]?.toLowerCase();
                if (!['delete', 'warn', 'mute', 'kick'].includes(newAction)) {
                    return await conn.reply(m.chat, '❌ الإجراء غير صالح. الاختيارات: delete, warn, mute, kick', m);
                }
                config.action = newAction;
                fs.writeFileSync(BAD_WORDS_PATH, JSON.stringify(config, null, 2));
                await conn.reply(m.chat, `✅ تم تغيير الإجراء إلى: ${newAction}`, m);
                break;

            case 'status':
                const status = config.enabled ? '✅ مفعل' : '❌ معطل';
                await conn.reply(m.chat, 
                    `⚙️ *إعدادات منع الكلمات السيئة*\n\n` +
                    `*الحالة:* ${status}\n` +
                    `*الإجراء:* ${config.action}\n` +
                    `*عدد الكلمات:* ${config.words.length}`, m);
                break;

            default:
                await conn.reply(m.chat, '❌ أمر غير معروف. استخدم .antibadword للمساعدة', m);
        }
    } catch (error) {
        console.error('خطأ في أمر منع الكلمات:', error);
        await conn.reply(m.chat, '❌ حدث خطأ أثناء معالجة الأمر', m);
    }
}

// دالة للكشف عن الكلمات السيئة
export function detectBadWords(message, groupId) {
    try {
        const config = initBadWords();
        if (!config.enabled) return null;

        const text = message.message?.conversation || 
                    message.message?.extendedTextMessage?.text || '';
        
        if (!text) return null;

        const foundWord = config.words.find(word => 
            text.toLowerCase().includes(word.toLowerCase())
        );

        return foundWord ? { word: foundWord, action: config.action } : null;
    } catch (error) {
        console.error('خطأ في كشف الكلمات السيئة:', error);
        return null;
    }
}

handler.help = ['antibadword']
handler.tags = ['group', 'admin']
handler.command = ['antibadword', 'منع_كلمات']
handler.description = 'نظام منع الكلمات السيئة في المجموعات'
handler.usage = '.antibadword <on/off/add/remove/list/set/status>'

// الصلاحيات - للمشرفين فقط
handler.group = true
handler.private = false
handler.owner = false
handler.admin = true
handler.botAdmin = true

export default handler
