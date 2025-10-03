import fetch from 'node-fetch';

const handler = async (m, { conn, sender }) => {
    try {
        // رد فعل
        await conn.sendMessage(m.chat, { 
            react: { text: '🌙', key: m.key } 
        });

        // إعلام البدء
        await conn.sendMessage(m.chat, {
            text: `╔═══════════════════════════╗
║  🌙 جاري التحضير       ║
╚═══════════════════════════╝

📝 جاري تحضير رسالة ليلة سعيدة...

⏳ الحالة: جاري التحميل

━━━━━━━━━━━━━━━━━━━━━━━━
⏱️ قد يستغرق بضع ثوانٍ`,
            mentions: [sender]
        }, { quoted: m });

        const apiKey = 'shizo';
        const response = await fetch(`https://shizoapi.onrender.com/api/texts/lovenight?apikey=${apiKey}`, {
            timeout: 15000,
            headers: {
                'User-Agent': 'Crimson Bot'
            }
        });

        if (!response.ok) {
            throw new Error(`فشل API: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.result) {
            throw new Error('لا توجد رسالة متاحة');
        }

        const goodnightMessage = data.result;

        await conn.sendMessage(m.chat, {
            text: `╔═══════════════════════════╗
║     🌙 ليلة سعيدة       ║
╚═══════════════════════════╝

${goodnightMessage}

━━━━━━━━━━━━━━━━━━━━━━━━
🤖 Crimson Bot | ليالي هانئة`,
            mentions: [sender]
        }, { quoted: m });

        console.log(`✅ Goodnight message sent to: ${sender}`);

    } catch (error) {
        console.error('❌ Error in goodnight command:', error);
        
        // رسائل ليلة سعيدة بديلة
        const backupMessages = [
            "🌙 ليلة سعيدة يا غالي، أتمنى لك أحلاماً جميلة وليلة هانئة. لا تنسى أن النجوم تراقبك وتتمنى لك الراحة!",
            "✨ قبل أن تنام، تذكر أن اليوم كان صفحة جديدة في كتاب حياتك. غداً ستكون صفحة أخرى مليئة بالأمل. ليلة سعيدة!",
            "🌜 أغمض عينيك واسترح، فالعالم سيظل ينتظرك في الصباح. ليكن نومك عميقاً وأحلامك جميلة. ليلة سعيدة!",
            "🛌 اليوم انتهى بكل ما فيه، وغداً يعدك بفرص جديدة. استرح جيداً واحلم بأجمل الأحلام. ليلة مباركة!",
            "🌠 النجوم تلمع في السماء لتودعك إلى عالم الأحلام. نام مبكراً واستيقظ بنشاط. ليلة سعيدة وحلوة!"
        ];
        
        const randomMessage = backupMessages[Math.floor(Math.random() * backupMessages.length)];
        
        await conn.sendMessage(m.chat, {
            text: `╔═══════════════════════════╗
║     🌙 ليلة سعيدة       ║
╚═══════════════════════════╝

${randomMessage}

💡 *ملاحظة:* استخدام رسالة محلية بسبب مشكلة في الخادم

━━━━━━━━━━━━━━━━━━━━━━━━
🤖 Crimson Bot | ليالي هانئة`,
            mentions: [sender]
        }, { quoted: m });
    }
};

handler.help = ['goodnight', 'ليلة', 'تصبحون'];
handler.tags = ['fun', 'social'];
handler.command = ['goodnight', 'ليلة', 'تصبحون', 'ليلةسعيدة'];
handler.description = 'إرسال رسالة ليلة سعيدة رومانسية';
handler.usage = '.goodnight';
handler.example = '.goodnight';

handler.group = true;
handler.private = true;
handler.owner = false;
handler.admin = false;
handler.premium = false;
handler.botAdmin = false;

export default handler;
