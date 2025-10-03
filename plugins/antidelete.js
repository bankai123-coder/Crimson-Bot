import fs from 'fs';
import path from 'path';
import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import { writeFile } from 'fs/promises';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const CONFIG_PATH = path.join(__dirname, '../data/antidelete.json');
const TEMP_MEDIA_DIR = path.join(__dirname, '../temp');

// تخزين مؤقت للرسائل
const messageStore = new Map();

// التأكد من وجود المجلد المؤقت
if (!fs.existsSync(TEMP_MEDIA_DIR)) {
    fs.mkdirSync(TEMP_MEDIA_DIR, { recursive: true });
}

// تحميل الإعدادات
function loadAntideleteConfig() {
    try {
        if (!fs.existsSync(CONFIG_PATH)) return { enabled: false };
        return JSON.parse(fs.readFileSync(CONFIG_PATH));
    } catch {
        return { enabled: false };
    }
}

// حفظ الإعدادات
function saveAntideleteConfig(config) {
    try {
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
    } catch (err) {
        console.error('خطأ في حفظ الإعدادات:', err);
    }
}

let handler = async (m, { conn, args, text, isOwner }) => {
    if (!isOwner) {
        return await conn.reply(m.chat, '❌ هذا الأمر للمالك فقط!', m);
    }

    const config = loadAntideleteConfig();
    const action = args[0]?.toLowerCase();

    if (!action) {
        return await conn.reply(m.chat, 
            `🗑️ *نظام منع الحذف*\n\n` +
            `*الحالة الحالية:* ${config.enabled ? '✅ مفعل' : '❌ معطل'}\n\n` +
            `*الأوامر:*\n` +
            `• .antidelete on - تفعيل النظام\n` +
            `• .antidelete off - تعطيل النظام\n` +
            `• .antidelete status - عرض الحالة\n\n` +
            `*الميزات:*\n` +
            `• كشف الرسائل المحذوفة\n` +
            `• حفظ الوسائط المحذوفة\n` +
            `• إشعارات فورية`, m);
    }

    if (action === 'status') {
        await conn.reply(m.chat, 
            `⚙️ *حالة نظام منع الحذف*\n\n` +
            `*الحالة:* ${config.enabled ? '✅ مفعل' : '❌ معطل'}\n` +
            `*الرسائل المخزنة:* ${messageStore.size}\n` +
            `*آخر تحديث:* ${new Date().toLocaleString('ar-SA')}`, m);
        return;
    }

    if (action === 'on' || action === 'off') {
        config.enabled = action === 'on';
        saveAntideleteConfig(config);
        
        await conn.reply(m.chat, 
            `🗑️ *نظام منع الحذف*\n\n` +
            `تم ${config.enabled ? 'تفعيل' : 'تعطيل'} النظام بنجاح ✅\n\n` +
            `${config.enabled ? 'سيتم مراقبة وحفظ الرسائل المحذوفة' : 'تم إيقاف المراقبة'}`, m);
    } else {
        await conn.reply(m.chat, '❌ أمر غير صالح. استخدم .antidelete للمساعدة', m);
    }
}

// دالة تخزين الرسائل
export async function storeMessage(sock, message) {
    try {
        const config = loadAntideleteConfig();
        if (!config.enabled) return;

        if (!message.key?.id) return;

        const messageId = message.key.id;
        let content = '';
        let mediaType = '';
        let mediaPath = '';
        let isViewOnce = false;

        const sender = message.key.participant || message.key.remoteJid;

        // كشف المحتوى (بما في ذلك الرسائل ذات المشاهدة الواحدة)
        const viewOnceContainer = message.message?.viewOnceMessageV2?.message || message.message?.viewOnceMessage?.message;
        if (viewOnceContainer) {
            if (viewOnceContainer.imageMessage) {
                mediaType = 'image';
                content = viewOnceContainer.imageMessage.caption || '';
                const buffer = await downloadContentFromMessage(viewOnceContainer.imageMessage, 'image');
                mediaPath = path.join(TEMP_MEDIA_DIR, `${messageId}.jpg`);
                await writeFile(mediaPath, buffer);
                isViewOnce = true;
            } else if (viewOnceContainer.videoMessage) {
                mediaType = 'video';
                content = viewOnceContainer.videoMessage.caption || '';
                const buffer = await downloadContentFromMessage(viewOnceContainer.videoMessage, 'video');
                mediaPath = path.join(TEMP_MEDIA_DIR, `${messageId}.mp4`);
                await writeFile(mediaPath, buffer);
                isViewOnce = true;
            }
        } else if (message.message?.conversation) {
            content = message.message.conversation;
        } else if (message.message?.extendedTextMessage?.text) {
            content = message.message.extendedTextMessage.text;
        } else if (message.message?.imageMessage) {
            mediaType = 'image';
            content = message.message.imageMessage.caption || '';
            const buffer = await downloadContentFromMessage(message.message.imageMessage, 'image');
            mediaPath = path.join(TEMP_MEDIA_DIR, `${messageId}.jpg`);
            await writeFile(mediaPath, buffer);
        } else if (message.message?.stickerMessage) {
            mediaType = 'sticker';
            const buffer = await downloadContentFromMessage(message.message.stickerMessage, 'sticker');
            mediaPath = path.join(TEMP_MEDIA_DIR, `${messageId}.webp`);
            await writeFile(mediaPath, buffer);
        } else if (message.message?.videoMessage) {
            mediaType = 'video';
            content = message.message.videoMessage.caption || '';
            const buffer = await downloadContentFromMessage(message.message.videoMessage, 'video');
            mediaPath = path.join(TEMP_MEDIA_DIR, `${messageId}.mp4`);
            await writeFile(mediaPath, buffer);
        }

        messageStore.set(messageId, {
            content,
            mediaType,
            mediaPath,
            sender,
            group: message.key.remoteJid.endsWith('@g.us') ? message.key.remoteJid : null,
            timestamp: new Date().toISOString(),
            isViewOnce
        });

        // معالجة الرسائل ذات المشاهدة الواحدة
        if (isViewOnce && mediaType && fs.existsSync(mediaPath)) {
            try {
                const ownerJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
                const senderName = sender.split('@')[0];
                
                await sock.sendMessage(ownerJid, {
                    text: `👁️ *رسالة مشاهدة واحدة*\n\n` +
                          `*من:* @${senderName}\n` +
                          `*النوع:* ${mediaType}\n` +
                          `*الوقت:* ${new Date().toLocaleString('ar-SA')}`,
                    mentions: [sender]
                });

                if (mediaType === 'image') {
                    await sock.sendMessage(ownerJid, { 
                        image: { url: mediaPath },
                        caption: `📸 ${content || 'صورة مشاهدة واحدة'}`
                    });
                } else if (mediaType === 'video') {
                    await sock.sendMessage(ownerJid, { 
                        video: { url: mediaPath },
                        caption: `🎥 ${content || 'فيديو مشاهدة واحدة'}`
                    });
                }

                // تنظيف الملف المؤقت
                try { fs.unlinkSync(mediaPath); } catch {}
            } catch (e) {
                console.error('خطأ في معالجة رسالة المشاهدة الواحدة:', e);
            }
        }

    } catch (err) {
        console.error('خطأ في تخزين الرسالة:', err);
    }
}

// دالة معالجة الحذف
export async function handleMessageDeletion(sock, revocationMessage) {
    try {
        const config = loadAntideleteConfig();
        if (!config.enabled) return;

        const messageId = revocationMessage.message.protocolMessage.key.id;
        const deletedBy = revocationMessage.participant || revocationMessage.key.participant || revocationMessage.key.remoteJid;
        const ownerJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';

        // تجاهل إذا كان الحذف من البوت نفسه
        if (deletedBy.includes(sock.user.id) || deletedBy === ownerJid) return;

        const original = messageStore.get(messageId);
        if (!original) return;

        const sender = original.sender;
        const senderName = sender.split('@')[0];
        let groupName = '';

        if (original.group) {
            try {
                const groupMetadata = await sock.groupMetadata(original.group);
                groupName = groupMetadata.subject;
            } catch (error) {
                groupName = 'مجموعة غير معروفة';
            }
        }

        const time = new Date().toLocaleString('ar-SA');

        let text = `🗑️ *تقرير رسالة محذوفة*\n\n` +
            `*🧑‍💼 حذف بواسطة:* @${deletedBy.split('@')[0]}\n` +
            `*👤 المرسل الأصلي:* @${senderName}\n` +
            `*📞 الرقم:* ${sender}\n` +
            `*🕒 الوقت:* ${time}\n`;

        if (groupName) text += `*👥 المجموعة:* ${groupName}\n`;

        if (original.content) {
            text += `\n*💬 النص المحذوف:*\n${original.content}`;
        }

        // إرسال التقرير
        await sock.sendMessage(ownerJid, {
            text,
            mentions: [deletedBy, sender]
        });

        // إرسال الوسائط المحذوفة
        if (original.mediaType && fs.existsSync(original.mediaPath)) {
            try {
                switch (original.mediaType) {
                    case 'image':
                        await sock.sendMessage(ownerJid, {
                            image: { url: original.mediaPath },
                            caption: `🖼️ صورة محذوفة من @${senderName}`,
                            mentions: [sender]
                        });
                        break;
                    case 'sticker':
                        await sock.sendMessage(ownerJid, {
                            sticker: { url: original.mediaPath }
                        });
                        break;
                    case 'video':
                        await sock.sendMessage(ownerJid, {
                            video: { url: original.mediaPath },
                            caption: `🎥 فيديو محذوف من @${senderName}`,
                            mentions: [sender]
                        });
                        break;
                }
            } catch (err) {
                await sock.sendMessage(ownerJid, {
                    text: `⚠️ خطأ في إرسال الوسائط: ${err.message}`
                });
            }

            // تنظيف الملف
            try {
                fs.unlinkSync(original.mediaPath);
            } catch (err) {
                console.error('خطأ في تنظيف الوسائط:', err);
            }
        }

        // إزالة الرسالة من التخزين
        messageStore.delete(messageId);

    } catch (err) {
        console.error('خطأ في معالجة الحذف:', err);
    }
}

handler.help = ['antidelete']
handler.tags = ['owner']
handler.command = ['antidelete', 'منع_حذف']
handler.description = 'نظام كشف وحفظ الرسائل المحذوفة'
handler.usage = '.antidelete <on/off/status>'

// الصلاحيات - للمالك فقط
handler.group = false
handler.private = true
handler.owner = true
handler.admin = false
handler.premium = false

export default handler
