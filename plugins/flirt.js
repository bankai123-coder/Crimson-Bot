import fetch from 'node-fetch';

const handler = async (m, { conn, mentioned, sender }) => {
    try {
        let targetUser;
        
        // التحقق من المستخدم المذكور
        if (mentioned && mentioned.length > 0) {
            targetUser = mentioned[0];
        } 
        // التحقق من الرسالة التي تم الرد عليها
        else if (m.message?.extendedTextMessage?.contextInfo?.participant) {
            targetUser = m.message.extendedTextMessage.contextInfo.participant;
        }
        
        if (!targetUser) {
            return await conn.sendMessage(m.chat, {
                text: `╔═══════════════════════════╗
║  ❌ خطأ في الإدخال      ║
╚═══════════════════════════╝

📌 يرجى ذكر شخص أو الرد على رسالته للمغازلة

📝 طريقة الاستخدام:
├─ .flirt @user
├─ أو أرسل .flirt مع الرد على رسالة
└─ كن محترماً ولا تسيء استخدام هذه الميزة!

━━━━━━━━━━━━━━━━━━━━━━━━
💡 مثال: .flirt @username`,
                mentions: [sender]
            }, { quoted: m });
        }

        // منع المغازلة الذاتية
        if (targetUser === sender) {
            return await conn.sendMessage(m.chat, {
                text: `╔═══════════════════════════╗
║  ❌ لا يمكن ذلك        ║
╚═══════════════════════════╝

⚠️ لا يمكنك مغازلة نفسك!

💡 حاول:
├─ ذكر شخص آخر
├─ أو اطلب من صديق مغازلتك
└─ الحب يبدأ من احترام الذات!

━━━━━━━━━━━━━━━━━━━━━━━━
🎯 جرب مع شخص آخر`,
                mentions: [sender]
            }, { quoted: m });
        }

        // منع مغازلة البوت
        if (targetUser === conn.user.id) {
            return await conn.sendMessage(m.chat, {
                text: `╔═══════════════════════════╗
║  🤖 أنا مجرد بوت       ║
╚═══════════════════════════╝

⚠️ أنا مجرد بوت، لا يمكنني العلاقات!

💡 لكن يمكنني مساعدتك في مغازلة الآخرين 😊

━━━━━━━━━━━━━━━━━━━━━━━━
🎯 جرب مع شخص حقيقي`,
                mentions: [sender]
            }, { quoted: m });
        }

        // رد فعل
        await conn.sendMessage(m.chat, { 
            react: { text: '💕', key: m.key } 
        });

        // إعلام البدء
        await conn.sendMessage(m.chat, {
            text: `╔═══════════════════════════╗
║  💕 جاري التحضير       ║
╚═══════════════════════════╝

🎯 المستهدف: @${targetUser.split('@')[0]}
📝 جاري تحضير رسالة غرامية...

━━━━━━━━━━━━━━━━━━━━━━━━
⏱️ قد يستغرق بضع ثوانٍ`,
            mentions: [targetUser]
        }, { quoted: m });

        const apiKey = 'shizo';
        const response = await fetch(`https://shizoapi.onrender.com/api/texts/flirt?apikey=${apiKey}`, {
            timeout: 15000,
            headers: {
                'User-Agent': 'Crimson Bot'
            }
        });

        let flirtMessage;
        
        if (response.ok) {
            const data = await response.json();
            flirtMessage = data.result;
        } else {
            // رسائل مغازلة بديلة
            const backupFlirts = [
                "لو كنت نجمة في السماء، لكنتِ الأكثر إشراقاً وجمالاً!",
                "هل تعلم أنكِ أجمل من قوس قزح بعد المطر؟",
                "لو كان للحب عنوان، لكنتِ عنوانه الأول والأخير!",
                "عيناكِ كالنجوم تضيئان ظلام حياتي!",
                "أنتِ مثل القهوة الصباحية، لا يمكنني بدء يومي بدونك!"
            ];
            flirtMessage = backupFlirts[Math.floor(Math.random() * backupFlirts.length)];
        }

        await conn.sendMessage(m.chat, {
            text: `╔═══════════════════════════╗
║     💕 رسالة غرامية     ║
╚═══════════════════════════╝

🎯 من: @${sender.split('@')[0]}
💌 إلى: @${targetUser.split('@')[0]}
💬 الرسالة: ${flirtMessage}

━━━━━━━━━━━━━━━━━━━━━━━━
🤖 Crimson Bot | حب ومشاعر`,
            mentions: [sender, targetUser]
        }, { quoted: m });

        console.log(`✅ Flirt message sent from: ${sender} to: ${targetUser}`);

    } catch (error) {
        console.error('❌ Error in flirt command:', error);
        
        await conn.sendMessage(m.chat, {
            text: `╔═══════════════════════════╗
║  ❌ فشل المغازلة        ║
╚═══════════════════════════╝

⚠️ فشل في إرسال رسالة المغازلة

💡 الأسباب المحتملة:
├─ المستخدم غير موجود
├─ مشكلة في الاتصال
├─ حاول مرة أخرى
└─ ربما الوقت غير مناسب!

━━━━━━━━━━━━━━━━━━━━━━━━
🔄 جرب مرة أخرى`,
            mentions: [sender]
        }, { quoted: m });
    }
};

handler.help = ['flirt', 'مغازلة', 'غزل'];
handler.tags = ['fun', 'social'];
handler.command = ['flirt', 'مغازلة', 'غزل', 'حب'];
handler.description = 'إرسال رسالة مغازلة للمستخدم المذكور';
handler.usage = '.flirt @user';
handler.example = '.flirt @username';

handler.group = true;
handler.private = true;
handler.owner = false;
handler.admin = false;
handler.premium = false;
handler.botAdmin = false;

export default handler;
