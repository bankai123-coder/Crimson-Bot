let handler = async (m, { conn, config }) => {
    const uptime = process.uptime();
    const days = Math.floor(uptime / (60 * 60 * 24));
    const hours = Math.floor((uptime % (60 * 60 * 24)) / (60 * 60));
    const minutes = Math.floor((uptime % (60 * 60)) / 60);
    const seconds = Math.floor(uptime % 60);

    const uptimeText = `${days} يوم, ${hours} ساعة, ${minutes} دقيقة, ${seconds} ثانية`;

    const message = `╔════════════════════════╗
║       🤖 حالة البوت       ║
╚════════════════════════╝

*🟢 البوت شغال وعامل:*
• *الإصدار:* 3.0.1
• *المطور:* Crimson Team
• *البريفكس:* ${config.prefix}
• *مدة التشغيل:* ${uptimeText}

*🌟 المميزات المتوفرة:*
• إدارة المجموعات المتقدمة
• حماية من السبام والروابط
• نظام اقتصادي متكامل
• ألعاب وتسلية
• أدوات تحميل متعددة
• ذكاء اصطناعي

*📝 الاستخدام:*
اكتب *${config.prefix}menu* لرؤية جميع الأوامر

*⚡ Crimson Bot - الإصدار المتقدم*`;

    await conn.reply(m.chat, message, m);
}

handler.help = ['alive', 'bot', 'البوت']
handler.tags = ['main']
handler.command = ['alive', 'bot', 'البوت', 'حالة']
handler.description = 'عرض حالة البوت ومعلوماته'
handler.usage = '.alive'

// الصلاحيات - متاح للجميع
handler.group = true
handler.private = true
handler.owner = false
handler.admin = false
handler.premium = false

export default handler
