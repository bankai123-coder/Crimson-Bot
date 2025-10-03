import fetch from 'node-fetch';

const handler = async (m, { conn, groupMetadata, sender }) => {
    try {
        const isGroup = m.chat.endsWith('@g.us');
        if (!isGroup) {
            return await conn.sendMessage(m.chat, {
                text: `╔═══════════════════════════╗
║  ❌ غير مسموح          ║
╚═══════════════════════════╝

⚠️ هذا الأمر يعمل فقط في المجموعات

💡 انتقل إلى مجموعة وحاول مرة أخرى`,
                mentions: [sender]
            }, { quoted: m });
        }

        // رد فعل
        await conn.sendMessage(m.chat, { 
            react: { text: '📊', key: m.key } 
        });

        // الحصول على معلومات المجموعة
        const metadata = await conn.groupMetadata(m.chat);
        
        // الحصول على صورة المجموعة
        let ppUrl;
        try {
            ppUrl = await conn.profilePictureUrl(m.chat, 'image');
        } catch {
            ppUrl = 'https://i.imgur.com/2wzGhpF.jpeg'; // صورة افتراضية
        }

        // الحصول على المشرفين
        const participants = metadata.participants || [];
        const admins = participants.filter(p => p.admin);
        const adminList = admins.map((v, i) => `${i + 1}. @${v.id.split('@')[0]}`).join('\n');
        
        // المالك
        const owner = metadata.owner || admins.find(p => p.admin === 'superadmin')?.id || m.chat.split('-')[0] + '@s.whatsapp.net';

        // إنشاء النص
        const infoText = `
╔═══════════════════════════╗
║     📊 معلومات المجموعة     ║
╚═══════════════════════════╝

🆔 *المعرف:* 
${metadata.id}

📛 *الاسم:* 
${metadata.subject}

👥 *الأعضاء:* 
${participants.length} عضو

👑 *المالك:* 
@${owner.split('@')[0]}

🛡️ *المشرفون (${admins.length}):*
${adminList}

📝 *الوصف:*
${metadata.desc?.toString() || 'لا يوجد وصف'}

━━━━━━━━━━━━━━━━━━━━━━━━
🤖 Crimson Bot | إدارة متقدمة`;

        // إرسال الرسالة مع الإشارات
        await conn.sendMessage(m.chat, {
            image: { url: ppUrl },
            caption: infoText,
            mentions: [...admins.map(v => v.id), owner]
        }, { quoted: m });

    } catch (error) {
        console.error('❌ Error in groupinfo command:', error);
        
        await conn.sendMessage(m.chat, {
            text: `╔═══════════════════════════╗
║  ❌ فشل العملية        ║
╚═══════════════════════════╝

⚠️ فشل في الحصول على معلومات المجموعة

💡 تأكد أن:
├─ البوت مشرف في المجموعة
├─ المجموعة نشطة
└─ الاتصال مستقر

━━━━━━━━━━━━━━━━━━━━━━━━
🔄 حاول مرة أخرى`,
            mentions: [sender]
        }, { quoted: m });
    }
};

handler.help = ['groupinfo', 'infogroup', 'معلومات'];
handler.tags = ['group', 'tools'];
handler.command = ['groupinfo', 'infogroup', 'معلومات', 'المجموعة'];
handler.description = 'عرض معلومات مفصلة عن المجموعة';
handler.usage = '.groupinfo';
handler.example = '.groupinfo';

handler.group = true;
handler.private = false;
handler.owner = false;
handler.admin = false;
handler.premium = false;
handler.botAdmin = true;

export default handler;
