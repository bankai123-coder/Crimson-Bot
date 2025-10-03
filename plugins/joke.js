import fetch from 'node-fetch';

const handler = async (m, { conn, sender }) => {
    try {
        // رد فعل
        await conn.sendMessage(m.chat, { 
            react: { text: '😂', key: m.key } 
        });

        // إعلام البدء
        await conn.sendMessage(m.chat, {
            text: `╔═══════════════════════════╗
║  🔍 جاري البحث         ║
╚═══════════════════════════╝

🎭 جاري البحث عن نكتة مضحكة...

⏳ الحالة: جاري التحميل

━━━━━━━━━━━━━━━━━━━━━━━━
⏱️ قد يستغرق بضع ثوانٍ`,
            mentions: [sender]
        }, { quoted: m });

        const response = await fetch('https://icanhazdadjoke.com/', {
            headers: { 
                'Accept': 'application/json',
                'User-Agent': 'Crimson Bot (https://github.com/crimson-team/Crimson-Bot)'
            },
            timeout: 10000
        });

        if (!response.ok) {
            throw new Error(`فشل API: ${response.status}`);
        }

        const data = await response.json();
        const joke = data.joke;

        // ترجمة النكتة للعربية (ترجمة بسيطة)
        const arabicJoke = await translateJokeToArabic(joke);

        await conn.sendMessage(m.chat, {
            text: `╔═══════════════════════════╗
║     😂 نكتة مضحكة       ║
╚═══════════════════════════╝

${arabicJoke}

━━━━━━━━━━━━━━━━━━━━━━━━
🤖 Crimson Bot | ترفيه ممتع`,
            mentions: [sender]
        }, { quoted: m });

    } catch (error) {
        console.error('❌ Error in joke command:', error);
        
        // استخدام نكت محلية إذا فشل API
        const localJokes = [
            "لماذا لا يستخدم العلماء القلم الرصاص؟ لأنهم يخافون من الممحاة!",
            "ماذا قال البحر للشاطئ؟ لا شيء،他只是 تموج!",
            "لماذا كانت الكمبيوتر مريضة؟ لأنه كان لديه فيروس!",
            "ماذا قال الجدار للجدار الآخر؟ سأراك في الزاوية!",
            "لماذا يحب الرياضيون القهوة؟ لأنها تعطيهم دفعة!"
        ];
        
        const randomJoke = localJokes[Math.floor(Math.random() * localJokes.length)];
        
        await conn.sendMessage(m.chat, {
            text: `╔═══════════════════════════╗
║     😂 نكتة مضحكة       ║
╚═══════════════════════════╝

${randomJoke}

💡 *ملاحظة:* استخدام نكتة محلية بسبب مشكلة في الخادم

━━━━━━━━━━━━━━━━━━━━━━━━
🤖 Crimson Bot | ترفيه ممتع`,
            mentions: [sender]
        }, { quoted: m });
    }
};

// دالة ترجمة بسيطة للنكت
async function translateJokeToArabic(joke) {
    const translations = {
        'why': 'لماذا',
        'what': 'ماذا',
        'how': 'كيف',
        'computer': 'كمبيوتر',
        'scientist': 'عالم',
        'coffee': 'قهوة',
        'virus': 'فيروس',
        'sea': 'بحر',
        'beach': 'شاطئ',
        'wall': 'جدار',
        'pencil': 'قلم رصاص',
        'eraser': 'ممحاة',
        'athlete': 'رياضي'
    };
    
    let translated = joke;
    for (const [eng, arb] of Object.entries(translations)) {
        translated = translated.replace(new RegExp(eng, 'gi'), arb);
    }
    
    return translated;
}

handler.help = ['joke', 'نكتة', 'ضحك'];
handler.tags = ['fun', 'entertainment'];
handler.command = ['joke', 'نكتة', 'ضحك', 'نكت'];
handler.description = 'عرض نكتة عشوائية مضحكة';
handler.usage = '.joke';
handler.example = '.joke';

handler.group = true;
handler.private = true;
handler.owner = false;
handler.admin = false;
handler.premium = false;
handler.botAdmin = false;

export default handler;
