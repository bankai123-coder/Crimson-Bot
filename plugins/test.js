let handler = async (m, { conn, args, text, db, sender, usedPrefix }) => {
    let user = await db.getUser(sender)
    let uptime = process.uptime()
    let hours = Math.floor(uptime / 3600)
    let minutes = Math.floor((uptime % 3600) / 60)
    let seconds = Math.floor(uptime % 60)
    
    let menuText = `╔═══════════════════════════════╗
║   🤖 CRIMSON BOT MENU 🤖      ║
╚═══════════════════════════════╝

👤 *المستخدم:* ${user.name}
💎 *الرصيد:* ${user.balance + user.bank}
📊 *المستوى:* ${user.level}
⭐ *الخبرة:* ${user.exp}

━━━━━━━━━━━━━━━━━━━━━━━━━
📁 *الأقسام الرئيسية:*
━━━━━━━━━━━━━━━━━━━━━━━━━

💰 *الاقتصاد:*
• ${usedPrefix}رصيد - عرض الرصيد
• ${usedPrefix}يومي - المكافأة اليومية  
• ${usedPrefix}عمل - العمل لكسب المال
• ${usedPrefix}تحويل - تحويل الأموال
• ${usedPrefix}متجر - عرض المتجر
• ${usedPrefix}تصدر - أفضل اللاعبين

👥 *المجموعات:*
• ${usedPrefix}ترقية - ترقية عضو
• ${usedPrefix}تنزيل - تنزيل عضو
• ${usedPrefix}طرد - طرد عضو
• ${usedPrefix}تثبيت - تثبيت رسالة
• ${usedPrefix}الغاء-تثبيت - إلغاء التثبيت

🎮 *الترفيه:*
• ${usedPrefix}كت - حجر ورقة مقص
• ${usedPrefix}تخمين - لعبة التخمين
• ${usedPrefix}ميمز - ميمز عشوائية
• ${usedPrefix}حكم - حكم وأقوال
• ${usedPrefix}سؤال - أسئلة عامة

🔧 *الأدوات:*
• ${usedPrefix}ستيكر - صنع ملصق
• ${usedPrefix}تلوين - تلوين نص
• ${usedPrefix}كتابة - كتابة نص
• ${usedPrefix}quran - آيات قرآنية
• ${usedPrefix}بحث - بحث في الإنترنت

🤖 *الذكاء الاصطناعي:*
• ${usedPrefix}gpt - محادثة مع GPT
• ${usedPrefix}صورة - توليد صورة
• ${usedPrefix}ترجمة - ترجمة النص

🎵 *الموسيقى:*
• ${usedPrefix}اغنية - تحميل أغنية
• ${usedPrefix}فيديو - تحميل فيديو
• ${usedPrefix}يوتيوب - بحث في يوتيوب

🎌 *الأنمي:*
• ${usedPrefix}انمي - معلومات أنمي
• ${usedPrefix}مانجا - معلومات مانجا
• ${usedPrefix}شخصية - شخصية أنمي

👑 *المالك:*
• ${usedPrefix}بان - حظر مستخدم
• ${usedPrefix}انبان - فك حظر مستخدم
• ${usedPrefix}بريميوم - إضافة مميز
• ${usedPrefix}اعلان - إرسال إعلان

━━━━━━━━━━━━━━━━━━━━━━━━━
💻 *المطور:* Crimson Team
📱 *الإصدار:* 3.0.0  
⏰ *مدة التشغيل:* ${hours}س ${minutes}د ${seconds}ث
📞 *الدعم:* ${usedPrefix}دعم
━━━━━━━━━━━━━━━━━━━━━━━━━`

    // إرسال القائمة كصورة
    await conn.sendMessage(m.key.remoteJid, {
        image: { url: 'https://i.imgur.com/8nLfV7s.jpg' },
        caption: menuText,
        contextInfo: {
            externalAdReply: {
                title: '🤖 Crimson Bot',
                body: 'أقوى بوت واتساب',
                thumbnail: await (await conn.getFile('https://i.imgur.com/5m6rW8x.jpg')).data,
                sourceUrl: 'https://github.com/crimson-team'
            }
        }
    })
}

handler.help = ['menu', 'help', 'قائمة', 'مساعدة']
handler.tags = ['main']
handler.command = ['menu', 'help', 'قائمة', 'الاوامر', 'مساعدة']
handler.description = 'عرض القائمة الرئيسية'
handler.usage = '.menu'

export default handler
