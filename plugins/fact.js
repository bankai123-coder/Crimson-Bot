import fetch from 'node-fetch';

const handler = async (m, { conn, sender }) => {
    try {
        // رد فعل
        await conn.sendMessage(m.chat, { 
            react: { text: '💡', key: m.key } 
        });

        // إعلام البدء
        await conn.sendMessage(m.chat, {
            text: `╔═══════════════════════════╗
║  🔍 جاري البحث         ║
╚═══════════════════════════╝

📚 جاري البحث عن معلومة مثيرة...

⏳ الحالة: جاري التحميل

━━━━━━━━━━━━━━━━━━━━━━━━
⏱️ قد يستغرق بضع ثوانٍ`,
            mentions: [sender]
        }, { quoted: m });

        const response = await fetch('https://uselessfacts.jsph.pl/random.json?language=en', {
            timeout: 10000
        });

        if (!response.ok) {
            throw new Error(`فشل API: ${response.status}`);
        }

        const data = await response.json();
        const fact = data.text;

        // ترجمة بسيطة للعربية (يمكن إضافة خدمة ترجمة حقيقية)
        const arabicFact = await translateToArabic(fact);

        await conn.sendMessage(m.chat, {
            text: `╔═══════════════════════════╗
║     💡 معلومة مثيرة     ║
╚═══════════════════════════╝

${arabicFact}

━━━━━━━━━━━━━━━━━━━━━━━━
🤖 Crimson Bot | معارف متنوعة`,
            mentions: [sender]
        }, { quoted: m });

    } catch (error) {
        console.error('❌ Error in fact command:', error);
        
        await conn.sendMessage(m.chat, {
            text: `╔═══════════════════════════╗
║  ❌ فشل التحميل         ║
╚═══════════════════════════╝

⚠️ فشل في جلب المعلومة

💡 الأسباب المحتملة:
├─ مشكلة في الاتصال
├─ الخادم مشغول
└─ حاول مرة أخرى

━━━━━━━━━━━━━━━━━━━━━━━━
🔄 جرب مرة أخرى`,
            mentions: [sender]
        }, { quoted: m });
    }
};

// دالة ترجمة بسيطة (يمكن استبدالها بAPI ترجمة حقيقي)
async function translateToArabic(text) {
    // هذه ترجمة بسيطة - يمكن إضافة خدمة ترجمة حقيقية
    const simpleTranslations = {
        'cat': 'قطة',
        'dog': 'كلب', 
        'world': 'العالم',
        'science': 'العلم',
        'history': 'التاريخ',
        'interesting': 'مثير',
        'fact': 'حقيقة'
    };
    
    let translated = text;
    for (const [eng, arb] of Object.entries(simpleTranslations)) {
        translated = translated.replace(new RegExp(eng, 'gi'), arb);
    }
    
    return translated;
}

handler.help = ['fact', 'معلومة', 'حقيقة'];
handler.tags = ['tools', 'fun'];
handler.command = ['fact', 'معلومة', 'حقيقة', 'facts'];
handler.description = 'عرض معلومات وحقائق مثيرة';
handler.usage = '.fact';
handler.example = '.fact';

handler.group = true;
handler.private = true;
handler.owner = false;
handler.admin = false;
handler.premium = false;
handler.botAdmin = false;

export default handler;
