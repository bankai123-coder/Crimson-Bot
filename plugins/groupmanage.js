import fs from 'fs';
import path from 'path';
import { downloadContentFromMessage } from '@whiskeysockets/baileys';

const handler = async (m, { conn, text, args, sender, quoted }) => {
    try {
        const command = args[0]?.toLowerCase();
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

        // التحقق من أن البوت مشرف
        const botParticipant = groupMetadata.participants.find(p => p.id === conn.user.id);
        if (!botParticipant?.admin) {
            return await conn.sendMessage(m.chat, {
                text: `╔═══════════════════════════╗
║  ❌ البوت ليس مشرف     ║
╚═══════════════════════════╝

⚠️ يجب أن يكون البوت مشرفاً في المجموعة

💡 رفع البوت كمشرف أولاً`,
                mentions: [sender]
            }, { quoted: m });
        }

        if (command === 'setgdesc') {
            // تعيين وصف المجموعة
            const description = text.replace('.setgdesc', '').trim();
            
            if (!description) {
                return await conn.sendMessage(m.chat, {
                    text: `╔═══════════════════════════╗
║  ❌ خطأ في الإدخال      ║
╚═══════════════════════════╝

📌 يرجى إدخال وصف للمجموعة

📝 طريقة الاستخدام:
.setgdesc <الوصف>

💡 مثال:
.setgdesc مجموعة للتكنولوجيا والبرمجة`,
                    mentions: [sender]
                }, { quoted: m });
            }

            await conn.sendMessage(m.chat, { 
                react: { text: '📝', key: m.key } 
            });

            try {
                await conn.groupUpdateDescription(m.chat, description);
                
                await conn.sendMessage(m.chat, {
                    text: `╔═══════════════════════════╗
║  ✅ تم التحديث         ║
╚═══════════════════════════╝

📝 وصف المجموعة تم تحديثه بنجاح

📋 الوصف الجديد:
${description}

━━━━━━━━━━━━━━━━━━━━━━━━
🤖 Crimson Bot | إدارة متقدمة`,
                    mentions: [sender]
                }, { quoted: m });

            } catch (error) {
                throw new Error('فشل في تحديث وصف المجموعة');
            }

        } else if (command === 'setgname') {
            // تعيين اسم المجموعة
            const groupName = text.replace('.setgname', '').trim();
            
            if (!groupName) {
                return await conn.sendMessage(m.chat, {
                    text: `╔═══════════════════════════╗
║  ❌ خطأ في الإدخال      ║
╚═══════════════════════════╝

📌 يرجى إدخال اسم جديد للمجموعة

📝 طريقة الاستخدام:
.setgname <الاسم الجديد>

💡 مثال:
.setgname Crimson Group`,
                    mentions: [sender]
                }, { quoted: m });
            }

            await conn.sendMessage(m.chat, { 
                react: { text: '📛', key: m.key } 
            });

            try {
                await conn.groupUpdateSubject(m.chat, groupName);
                
                await conn.sendMessage(m.chat, {
                    text: `╔═══════════════════════════╗
║  ✅ تم التحديث         ║
╚═══════════════════════════╝

📛 اسم المجموعة تم تحديثه بنجاح

🏷️ الاسم الجديد:
${groupName}

━━━━━━━━━━━━━━━━━━━━━━━━
🤖 Crimson Bot | إدارة متقدمة`,
                    mentions: [sender]
                }, { quoted: m });

            } catch (error) {
                throw new Error('فشل في تحديث اسم المجموعة');
            }

        } else if (command === 'setgpp') {
            // تعيين صورة المجموعة
            await conn.sendMessage(m.chat, { 
                react: { text: '🖼️', key: m.key } 
            });

            const quotedMessage = quoted?.message;
            const imageMessage = quotedMessage?.imageMessage || quotedMessage?.stickerMessage;

            if (!imageMessage) {
                return await conn.sendMessage(m.chat, {
                    text: `╔═══════════════════════════╗
║  ❌ خطأ في الإدخال      ║
╚═══════════════════════════╝

📌 يرجى الرد على صورة أو ملصق

📝 طريقة الاستخدام:
قم بالرد على صورة ثم اكتب:
.setgpp

💡 تأكد أن:
├─ الصورة واضحة
├─ الملصق ذو جودة جيدة
└─ الملف غير تالف`,
                    mentions: [sender]
                }, { quoted: m });
            }

            try {
                const tmpDir = path.join(process.cwd(), 'tmp');
                if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

                const stream = await downloadContentFromMessage(imageMessage, 'image');
                let buffer = Buffer.from([]);
                for await (const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk]);
                }

                const imgPath = path.join(tmpDir, `gpp_${Date.now()}.jpg`);
                fs.writeFileSync(imgPath, buffer);

                await conn.updateProfilePicture(m.chat, { url: imgPath });
                
                // تنظيف الملف المؤقت
                try { 
                    fs.unlinkSync(imgPath); 
                } catch (_) {}

                await conn.sendMessage(m.chat, {
                    text: `╔═══════════════════════════╗
║  ✅ تم التحديث         ║
╚═══════════════════════════╝

🖼️ صورة المجموعة تم تحديثها بنجاح

📸 تم تعيين الصورة الجديدة للمجموعة

━━━━━━━━━━━━━━━━━━━━━━━━
🤖 Crimson Bot | إدارة متقدمة`,
                    mentions: [sender]
                }, { quoted: m });

            } catch (error) {
                throw new Error('فشل في تحديث صورة المجموعة');
            }

        } else {
            // عرض المساعدة
            await conn.sendMessage(m.chat, {
                text: `╔═══════════════════════════╗
║     🛠️ إدارة المجموعة     ║
╚═══════════════════════════╝

📋 أوامر إدارة المجموعة:

📝 .setgdesc <الوصف>
└─ تحديث وصف المجموعة

📛 .setgname <الاسم>
└─ تغيير اسم المجموعة

🖼️ .setgpp
└─ تغيير صورة المجموعة (بالرد على صورة)

⚙️ .settings
└─ إعدادات المجموعة المتقدمة

━━━━━━━━━━━━━━━━━━━━━━━━
🤖 Crimson Bot | إدارة متقدمة`,
                mentions: [sender]
            }, { quoted: m });
        }

    } catch (error) {
        console.error('❌ Error in groupmanage command:', error);
        
        await conn.sendMessage(m.chat, {
            text: `╔═══════════════════════════╗
║  ❌ فشل العملية        ║
╚═══════════════════════════╝

⚠️ فشل في تنفيذ الأمر

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

handler.help = ['setgdesc', 'setgname', 'setgpp'];
handler.tags = ['group', 'admin'];
handler.command = ['setgdesc', 'setgname', 'setgpp', 'وصف', 'اسم', 'صورة'];
handler.description = 'أوامر إدارة المجموعة للمشرفين';
handler.usage = '.setgdesc <وصف> | .setgname <اسم> | .setgpp';
handler.example = '.setgdesc مجموعة رائعة';

handler.group = true;
handler.private = false;
handler.owner = false;
handler.admin = true;
handler.premium = false;
handler.botAdmin = true;

export default handler;
