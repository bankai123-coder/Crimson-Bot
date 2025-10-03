import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const handler = async (m, { conn, text, args, sender }) => {
    try {
        if (!text) {
            return await conn.sendMessage(m.chat, {
                text: `╔═══════════════════════════╗
║  ❌ خطأ في الإدخال      ║
╚═══════════════════════════╝

📌 يرجى إدخال وصف للصورة

📝 طريقة الاستخدام:
├─ .imagine <الوصف>
├─ .imagine <مشهد تخيلي>
└─ .imagine <تفاصيل الصورة>

━━━━━━━━━━━━━━━━━━━━━━━━
💡 مثال: .imagine منظر غروب الشمس فوق الجبال`,
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
║  🎨 جاري الرسم          ║
╚═══════════════════════════╝

📝 الوصف: "${text}"
🤖 النموذج: الذكاء الاصطناعي
⏳ الحالة: جاري إنشاء الصورة...

━━━━━━━━━━━━━━━━━━━━━━━━
⏱️ قد يستغرق ١-٢ دقيقة`,
            mentions: [sender]
        }, { quoted: m });

        // تحسين الوصف
        const enhancedPrompt = enhancePrompt(text);

        // طلب API
        const apiUrl = `https://shizoapi.onrender.com/api/ai/imagine?apikey=shizo&query=${encodeURIComponent(enhancedPrompt)}`;
        
        const response = await fetch(apiUrl, {
            timeout: 120000, // 2 دقيقة
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        if (!response.ok) {
            throw new Error(`فشل API: ${response.status}`);
        }

        const imageBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(imageBuffer);

        // التحقق من أن البيانات صورة
        if (buffer.length < 100) {
            throw new Error('استجابة API غير صالحة');
        }

        // إرسال الصورة المنشأة
        await conn.sendMessage(m.chat, {
            image: buffer,
            caption: `🎨 "${text}"\n🤖 Crimson Bot | الذكاء الاصطناعي`,
            mentions: [sender]
        }, { quoted: m });

        console.log(`✅ Image generated for: ${text}`);

    } catch (error) {
        console.error('❌ Error in imagine command:', error);
        
        await conn.sendMessage(m.chat, {
            text: `╔═══════════════════════════╗
║  ❌ فشل الإنشاء        ║
╚═══════════════════════════╝

📝 الوصف: "${text}"
⚠️ فشل في إنشاء الصورة

💡 الأسباب المحتملة:
├─ الخادم مشغول
├─ الوصف غير مناسب
├─ انتهت المهلة
└─ مشكلة في الاتصال

━━━━━━━━━━━━━━━━━━━━━━━━
🔄 حاول مرة أخرى`,
            mentions: [sender]
        }, { quoted: m });
    }
};

// دالة لتحسين الوصف
function enhancePrompt(prompt) {
    const qualityEnhancers = [
        'high quality',
        'detailed',
        'masterpiece', 
        'best quality',
        'ultra realistic',
        '4k',
        'highly detailed',
        'professional photography',
        'cinematic lighting',
        'sharp focus'
    ];

    const numEnhancers = Math.floor(Math.random() * 2) + 3;
    const selectedEnhancers = qualityEnhancers
        .sort(() => Math.random() - 0.5)
        .slice(0, numEnhancers);

    return `${prompt}, ${selectedEnhancers.join(', ')}`;
}

handler.help = ['imagine', 'رسم', 'صورة'];
handler.tags = ['ai', 'tools', 'media'];
handler.command = ['imagine', 'رسم', 'صورة', 'انشاء'];
handler.description = 'إنشاء صور باستخدام الذكاء الاصطناعي';
handler.usage = '.imagine <وصف الصورة>';
handler.example = '.imagine منظر طبيعي خلاب';

handler.group = true;
handler.private = true;
handler.owner = false;
handler.admin = false;
handler.premium = false;
handler.botAdmin = false;

export default handler;
