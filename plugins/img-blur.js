import { downloadMediaMessage } from '@whiskeysockets/baileys';
import sharp from 'sharp';

const handler = async (m, { conn, quoted, sender }) => {
    try {
        // التحقق من وجود صورة
        let imageBuffer;
        
        if (quoted?.message?.imageMessage) {
            // إذا كان هناك رد على صورة
            imageBuffer = await downloadMediaMessage(
                { message: { ...quoted.message } },
                'buffer',
                {},
                {}
            );
        } else if (m.message?.imageMessage) {
            // إذا كانت الصورة في الرسالة الحالية
            imageBuffer = await downloadMediaMessage(
                m,
                'buffer',
                {},
                {}
            );
        } else {
            return await conn.sendMessage(m.chat, {
                text: `╔═══════════════════════════╗
║  ❌ خطأ في الإدخال      ║
╚═══════════════════════════╝

📌 يرجى إرسال صورة أو الرد على صورة

📝 طريقة الاستخدام:
├─ أرسل صورة مع التسمية .blur
├─ أو أرسل .blur مع الرد على صورة
└─ الصور المدعومة: JPG, PNG, WebP

━━━━━━━━━━━━━━━━━━━━━━━━
💡 مثال: رد على صورة واكتب .blur`,
                mentions: [sender]
            }, { quoted: m });
        }

        // رد فعل
        await conn.sendMessage(m.chat, { 
            react: { text: '🎨', key: m.key } 
        });

        // إعلام البدء
        await conn.sendMessage(m.chat, {
            text: `╔═══════════════════════════╗
║  🎨 جاري المعالجة      ║
╚═══════════════════════════╝

🖼️ نوع: تأثير ضبابي
⚡ الحالة: جاري تطبيق التأثير...

━━━━━━━━━━━━━━━━━━━━━━━━
⏱️ قد يستغرق بضع ثوانٍ`,
            mentions: [sender]
        }, { quoted: m });

        // تحسين الصورة وتطبيق تأثير الضباب
        const processedImage = await sharp(imageBuffer)
            .resize(800, 800, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .jpeg({ quality: 85 })
            .blur(15) // قوة التأثير الضبابي
            .toBuffer();

        // إرسال الصورة المعالجة
        await conn.sendMessage(m.chat, {
            image: processedImage,
            caption: `╔═══════════════════════════╗
║  ✅ اكتمل المعالجة     ║
╚═══════════════════════════╝

🎨 التأثير: ضبابي
📊 القوة: متوسطة
🖼️ النوع: صورة محسنة

━━━━━━━━━━━━━━━━━━━━━━━━
🤖 Crimson Bot | محرر الصور`,
            mentions: [sender]
        }, { quoted: m });

        console.log(`✅ Image blurred for: ${sender}`);

    } catch (error) {
        console.error('❌ Error in blur command:', error);
        
        await conn.sendMessage(m.chat, {
            text: `╔═══════════════════════════╗
║  ❌ فشل المعالجة       ║
╚═══════════════════════════╝

⚠️ فشل في تطبيق تأثير الضباب

💡 الأسباب المحتملة:
├─ الصورة تالفة
├─ الحجم كبير جداً
├─ عدم دعم الصيغة
└─ مشكلة في الخادم

━━━━━━━━━━━━━━━━━━━━━━━━
🔄 جرب مرة أخرى`,
            mentions: [sender]
        }, { quoted: m });
    }
};

handler.help = ['blur', 'ضباب', 'تأثير'];
handler.tags = ['tools', 'media'];
handler.command = ['blur', 'ضباب', 'تأثير', 'blurimage'];
handler.description = 'تطبيق تأثير ضبابي على الصور';
handler.usage = '.blur (مع الرد على صورة)';
handler.example = '.blur';

handler.group = true;
handler.private = true;
handler.owner = false;
handler.admin = false;
handler.premium = false;
handler.botAdmin = false;

export default handler;
