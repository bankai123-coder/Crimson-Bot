import fetch from 'node-fetch';

const handler = async (m, { conn, text, args, sender }) => {
    try {
        if (!text) {
            return await conn.sendMessage(m.chat, {
                text: `╔═══════════════════════════╗
║  ❌ خطأ في الإدخال      ║
╚═══════════════════════════╝

📌 يرجى إدخال كلمة للبحث عن GIF

📝 طريقة الاستخدام:
├─ .gif <الكلمة>
├─ .gif <موضوع البحث>
└─ .gif <وصف الحركة>

━━━━━━━━━━━━━━━━━━━━━━━━
💡 مثال: .gif cat dance`,
                mentions: [sender]
            }, { quoted: m });
        }

        // رد فعل
        await conn.sendMessage(m.chat, { 
            react: { text: '🔍', key: m.key } 
        });

        // إعلام البدء
        await conn.sendMessage(m.chat, {
            text: `╔═══════════════════════════╗
║  🔍 جاري البحث         ║
╚═══════════════════════════╝

🎯 البحث عن: "${text}"
🌐 المصدر: Giphy
⏳ الحالة: جاري البحث...

━━━━━━━━━━━━━━━━━━━━━━━━
⏱️ قد يستغرق بضع ثوانٍ`,
            mentions: [sender]
        }, { quoted: m });

        const apiKey = 'GIPHY_API_KEY'; // استبدل بمفتاح API الخاص بك
        const searchQuery = encodeURIComponent(text);

        const response = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${searchQuery}&limit=1&rating=g`, {
            timeout: 15000
        });

        if (!response.ok) {
            throw new Error(`فشل API: ${response.status}`);
        }

        const data = await response.json();
        const gifUrl = data.data[0]?.images?.downsized_medium?.url;

        if (!gifUrl) {
            return await conn.sendMessage(m.chat, {
                text: `╔═══════════════════════════╗
║  ❌ لم يتم العثور       ║
╚═══════════════════════════╝

🔍 البحث: "${text}"
⚠️ لم يتم العثور على GIF

💡 حاول مع:
├─ كلمات مختلفة
├─ مصطلحات بالإنجليزية
└─ كلمات أبسط

━━━━━━━━━━━━━━━━━━━━━━━━
🔄 جرب بحثاً آخر`,
                mentions: [sender]
            }, { quoted: m });
        }

        // إرسال الـ GIF
        await conn.sendMessage(m.chat, {
            video: { url: gifUrl },
            caption: `🎬 "${text}"\n🤖 Crimson Bot | بحث متقدم`,
            gifPlayback: true
        }, { quoted: m });

        console.log(`✅ GIF sent for: ${text}`);

    } catch (error) {
        console.error('❌ Error in gif command:', error);
        
        await conn.sendMessage(m.chat, {
            text: `╔═══════════════════════════╗
║  ❌ فشل البحث          ║
╚═══════════════════════════╝

🔍 البحث: "${text}"
⚠️ فشل في العثور على GIF

💡 الأسباب المحتملة:
├─ مشكلة في الاتصال
├─ الخادم مشغول
└─ كلمة البحث غير مناسبة

━━━━━━━━━━━━━━━━━━━━━━━━
🔄 حاول مرة أخرى`,
            mentions: [sender]
        }, { quoted: m });
    }
};

handler.help = ['gif', 'giphy'];
handler.tags = ['tools', 'media'];
handler.command = ['gif', 'giphy', 'جيف', 'حركة'];
handler.description = 'البحث عن GIF من Giphy';
handler.usage = '.gif <كلمة البحث>';
handler.example = '.gif cat dancing';

handler.group = true;
handler.private = true;
handler.owner = false;
handler.admin = false;
handler.premium = false;
handler.botAdmin = false;

export default handler;
