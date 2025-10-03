import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import fs from 'fs';
import path from 'path';

const handler = async (m, { conn, text, quoted, sender }) => {
    try {
        const isGroup = m.chat.endsWith('@g.us');
        if (!isGroup) {
            return await conn.sendMessage(m.chat, {
                text: `╔═══════════════════════════╗
║  ❌ غير مسموح          ║
╚═══════════════════════════╝

⚠️ هذا الأمر يعمل فقط في المجموعات

💡 انتقل إلى مجموعة وحاول مرة أخرى`,
                mentions: [sender]
            }, { quoted: m });
        }

        // التحقق من صلاحية المشرف
        const groupMetadata = await conn.groupMetadata(m.chat);
        const participant = groupMetadata.participants.find(p => p.id === sender);
        
        if (!participant?.admin) {
            return await conn.sendMessage(m.chat, {
                text: `╔═══════════════════════════╗
║  ❌ صلاحية مرفوضة       ║
╚═══════════════════════════╝

⚠️ فقط مشرفو المجموعة يمكنهم استخدام هذا الأمر

💡 اطلب من المشرف تنفيذ الأمر`,
                mentions: [sender]
            }, { quoted: m });
        }

        // الحصول على الأعضاء غير المشرفين
        const nonAdmins = groupMetadata.participants
            .filter(p => !p.admin)
            .map(p => p.id);

        if (nonAdmins.length === 0) {
            return await conn.sendMessage(m.chat, {
                text: `╔═══════════════════════════╗
║  ⚠️ لا يوجد أعضاء      ║
╚═══════════════════════════╝

ℹ️ جميع الأعضاء في هذه المجموعة مشرفون

📊 الإحصائيات:
├─ 👥 إجمالي الأعضاء: ${groupMetadata.participants.length}
├─ 🛡️ عدد المشرفين: ${groupMetadata.participants.length}
└─ 👤 الأعضاء العاديين: 0

━━━━━━━━━━━━━━━━━━━━━━━━
🎯 لا حاجة للإشارة المخفية`,
                mentions: [sender]
            }, { quoted: m });
        }

        // رد فعل
        await conn.sendMessage(m.chat, { 
            react: { text: '👥', key: m.key } 
        });

        let messageContent = {};

        if (quoted?.message) {
            // إذا كان هناك رد على رسالة
            const quotedMsg = quoted.message;

            if (quotedMsg.imageMessage) {
                // صورة
                const filePath = await downloadMedia(quotedMsg.imageMessage, 'image');
                messageContent = {
                    image: { url: filePath },
                    caption: text || quotedMsg.imageMessage.caption || '',
                    mentions: nonAdmins
                };
            } else if (quotedMsg.videoMessage) {
                // فيديو
                const filePath = await downloadMedia(quotedMsg.videoMessage, 'video');
                messageContent = {
                    video: { url: filePath },
                    caption: text || quotedMsg.videoMessage.caption || '',
                    mentions: nonAdmins
                };
            } else if (quotedMsg.documentMessage) {
                // ملف
                const filePath = await downloadMedia(quotedMsg.documentMessage, 'document');
                messageContent = {
                    document: { url: filePath },
                    fileName: quotedMsg.documentMessage.fileName || 'ملف',
                    caption: text || '',
                    mentions: nonAdmins
                };
            } else if (quotedMsg.conversation || quotedMsg.extendedTextMessage?.text) {
                // نص
                const messageText = quotedMsg.conversation || quotedMsg.extendedTextMessage.text;
                messageContent = {
                    text: text ? `${text}\n\n${messageText}` : messageText,
                    mentions: nonAdmins
                };
            }
        } else if (text) {
            // إذا كان هناك نص فقط
            messageContent = {
                text: text,
                mentions: nonAdmins
            };
        } else {
            return await conn.sendMessage(m.chat, {
                text: `╔═══════════════════════════╗
║  ❌ خطأ في الإدخال      ║
╚═══════════════════════════╝

📌 يرجى إدخال نص أو الرد على رسالة

📝 طريقة الاستخدام:
├─ .hidetag <النص>
├─ أو أرسل .hidetag مع الرد على:
│  ├─ صورة
│  ├─ فيديو  
│  ├─ ملف
│  └─ رسالة نصية

━━━━━━━━━━━━━━━━━━━━━━━━
💡 مثال: .hidetag رسالة مهمة`,
                mentions: [sender]
            }, { quoted: m });
        }

        // إرسال الرسالة مع الإشارات المخفية
        await conn.sendMessage(m.chat, messageContent);

        // إرسال تأكيد
        await conn.sendMessage(m.chat, {
            text: `╔═══════════════════════════╗
║  ✅ تم الإرسال         ║
╚═══════════════════════════╝

🎯 الإشارة المخفية تم إرسالها بنجاح

📊 الإحصائيات:
├─ 👥 المستهدفون: ${nonAdmins.length} عضو
├─ 🛡️ المستثنون: ${groupMetadata.participants.length - nonAdmins.length} مشرف
└─ 📨 النوع: ${quoted ? 'رسالة مرفقة' : 'نص فقط'}

━━━━━━━━━━━━━━━━━━━━━━━━
🤖 Crimson Bot | إدارة متقدمة`,
            mentions: [sender]
        }, { quoted: m });

    } catch (error) {
        console.error('❌ Error in hidetag command:', error);
        
        await conn.sendMessage(m.chat, {
            text: `╔═══════════════════════════╗
║  ❌ فشل الإرسال         ║
╚═══════════════════════════╝

⚠️ فشل في إرسال الإشارة المخفية

💡 الأسباب المحتملة:
├─ الصلاحيات غير كافية
├─ الملف كبير جداً
├─ المشكلة فنية
└─ حاول مرة أخرى

━━━━━━━━━━━━━━━━━━━━━━━━
🔄 جرب مرة أخرى`,
            mentions: [sender]
        }, { quoted: m });
    }
};

// دالة مساعدة لتحميل الوسائط
async function downloadMedia(message, mediaType) {
    const stream = await downloadContentFromMessage(message, mediaType);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
    }
    const tmpDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    const filePath = path.join(tmpDir, `${Date.now()}.${mediaType}`);
    fs.writeFileSync(filePath, buffer);
    return filePath;
}

handler.help = ['hidetag', 'تاج'];
handler.tags = ['group', 'admin'];
handler.command = ['hidetag', 'تاج', 'اشارةخفية'];
handler.description = 'إرسال رسالة مع إشارة مخفية لجميع الأعضاء غير المشرفين';
handler.usage = '.hidetag <نص> أو الرد على رسالة';
handler.example = '.hidetag اجتماع مهم';

handler.group = true;
handler.private = false;
handler.owner = false;
handler.admin = true;
handler.premium = false;
handler.botAdmin = true;

export default handler;
