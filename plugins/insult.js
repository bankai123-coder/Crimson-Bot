const insults = [
    "أنت مثل السحابة، عندما تختفي يصبح اليوم جميلاً!",
    "تجلب الجميع الكثير من الفرح عندما تغادر الغرفة!",
    "سأوافق معك، ولكن بعدها سنكون كلانا مخطئاً!",
    "أنت لست غبياً، لديك فقط حظ سيء في التفكير!",
    "أسرارك دائماً آمنة معي، أنا لا أستمع إليها أبداً!",
    "أنت دليل أن حتى التطور يأخذ استراحة أحياناً!",
    "لديك شيء على ذقنك... لا، الثالث من الأسفل!",
    "أنت مثل تحديث البرنامج، عندما أراك أفكر، 'هل أحتاج هذا حقاً الآن؟'",
    "أنت مثل بنس - ذو وجهين ولا يساوي الكثير!",
    "أنت سبب وضع التعليمات على زجاجات الشامبو!",
    "نكاتك مثل الحليب المنتهي الصلاحية - حامضة وصعبة الهضم!",
    "أنت مثل إشارة الواي فاي - دائماً ضعيفة عندما تكون нужна بشدة!",
    "طاقتك مثل الثقب الأسود - تمتص الحياة من الغرفة!",
    "لديك الوجه المثالي للإذاعة!",
    "أنت مثل ازدحام المرور - لا أحد يريدك، ولكنك هنا!",
    "أنت مثل قلم رصاص مكسور - بلا نقطة!",
    "أفكارك أصلية جداً، أنا متأكد أنني سمعتها جميعاً من قبل!",
    "أنت دليل حي أن حتى الأخطاء يمكن أن تكون منتجة!",
    "أنت لست كسولاً، أنت فقط متحمس بشدة لعدم فعل شيء!",
    "دماغك يعمل بنظام Windows 95 - بطيء وقديم!",
    "أنت مثل مطب سرعة - لا أحد يحبك، ولكن الجميع must يتعامل معك!",
    "أنت مثل سحابة البعوض - مزعج فقط!",
    "أنت تجمع الناس معاً... للتحدث عن مدى إزعاجك!"
];

const handler = async (m, { conn, mentioned, sender }) => {
    try {
        let userToInsult;
        
        // التحقق من المستخدم المذكور
        if (mentioned && mentioned.length > 0) {
            userToInsult = mentioned[0];
        } 
        // التحقق من الرسالة التي تم الرد عليها
        else if (m.message?.extendedTextMessage?.contextInfo?.participant) {
            userToInsult = m.message.extendedTextMessage.contextInfo.participant;
        }
        
        if (!userToInsult) {
            return await conn.sendMessage(m.chat, {
                text: `╔═══════════════════════════╗
║  ❌ خطأ في الإدخال      ║
╚═══════════════════════════╝

📌 يرجى ذكر شخص أو الرد على رسالته للإهانة

📝 طريقة الاستخدام:
├─ .insult @user
├─ أو أرسل .insult مع الرد على رسالة
└─ كن لطيفاً ولا تسيء استخدام هذه الميزة!

━━━━━━━━━━━━━━━━━━━━━━━━
💡 مثال: .insult @username`,
                mentions: [sender]
            }, { quoted: m });
        }

        // منع الإهانة الذاتية
        if (userToInsult === sender) {
            return await conn.sendMessage(m.chat, {
                text: `╔═══════════════════════════╗
║  ❌ لا يمكن ذلك        ║
╚═══════════════════════════╝

⚠️ لا يمكنك إهانة نفسك!

💡 حاول:
├─ ذكر شخص آخر
├─ أو اطلب من صديق إهانتك
└─ كن لطيفاً مع نفسك!

━━━━━━━━━━━━━━━━━━━━━━━━
🎯 جرب مع شخص آخر`,
                mentions: [sender]
            }, { quoted: m });
        }

        // منع إهانة البوت
        if (userToInsult === conn.user.id) {
            return await conn.sendMessage(m.chat, {
                text: `╔═══════════════════════════╗
║  🤖 لا يمكن إهانتي     ║
╚═══════════════════════════╝

⚠️ أنا مجرد بوت، لا يمكن إهانتي!

💡 لكن يمكنني إهانتك بدلاً من ذلك 😉

━━━━━━━━━━━━━━━━━━━━━━━━
🎯 جرب مع شخص آخر`,
                mentions: [sender]
            }, { quoted: m });
        }

        // رد فعل
        await conn.sendMessage(m.chat, { 
            react: { text: '😈', key: m.key } 
        });

        const insult = insults[Math.floor(Math.random() * insults.length)];

        // تأخير صغير لتجنب التحميل الزائد
        await new Promise(resolve => setTimeout(resolve, 1000));

        await conn.sendMessage(m.chat, {
            text: `╔═══════════════════════════╗
║     😈 إهانة لطيفة      ║
╚═══════════════════════════╝

🎯 المستهدف: @${userToInsult.split('@')[0]}
💬 الرسالة: ${insult}

━━━━━━━━━━━━━━━━━━━━━━━━
🤖 Crimson Bot | دعابة بريئة`,
            mentions: [userToInsult]
        }, { quoted: m });

        console.log(`✅ Insult sent to: ${userToInsult} by: ${sender}`);

    } catch (error) {
        console.error('❌ Error in insult command:', error);
        
        await conn.sendMessage(m.chat, {
            text: `╔═══════════════════════════╗
║  ❌ فشل الإهانة         ║
╚═══════════════════════════╝

⚠️ فشل في إرسال الإهانة

💡 الأسباب المحتملة:
├─ المستخدم غير موجود
├─ مشكلة في الاتصال
├─ حاول مرة أخرى
└─ ربما يستحق المستخدم راحة!

━━━━━━━━━━━━━━━━━━━━━━━━
🔄 جرب مرة أخرى`,
            mentions: [sender]
        }, { quoted: m });
    }
};

handler.help = ['insult', 'اهانة', 'شتم'];
handler.tags = ['fun', 'entertainment'];
handler.command = ['insult', 'اهانة', 'شتم', 'اساءة'];
handler.description = 'إرسال إهانة لطيفة للمستخدم المذكور (دعابة)';
handler.usage = '.insult @user';
handler.example = '.insult @username';

handler.group = true;
handler.private = true;
handler.owner = false;
handler.admin = false;
handler.premium = false;
handler.botAdmin = false;

export default handler;
