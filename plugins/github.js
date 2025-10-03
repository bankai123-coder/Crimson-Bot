import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const handler = async (m, { conn, sender }) => {
    try {
        // رد فعل
        await conn.sendMessage(m.chat, { 
            react: { text: '🐙', key: m.key } 
        });

        // إعلام البدء
        await conn.sendMessage(m.chat, {
            text: `╔═══════════════════════════╗
║  🔍 جاري التحميل        ║
╚═══════════════════════════╝

🌐 المصدر: GitHub
📦 جاري جلب معلومات المستودع...

━━━━━━━━━━━━━━━━━━━━━━━━
⏱️ قد يستغرق بضع ثوانٍ`,
            mentions: [sender]
        }, { quoted: m });

        const response = await fetch('https://api.github.com/repos/crimson-team/Crimson-Bot', {
            headers: {
                'User-Agent': 'Crimson-Bot'
            },
            timeout: 15000
        });

        if (!response.ok) {
            throw new Error(`فشل API: ${response.status}`);
        }

        const repoData = await response.json();

        // تنسيق المعلومات
        const repoInfo = `
╔═══════════════════════════╗
║     🐙 Crimson Bot        ║
╚═══════════════════════════╝

📛 *الاسم:* ${repoData.name}
👀 *المشاهدات:* ${repoData.watchers_count}
📊 *الحجم:* ${(repoData.size / 1024).toFixed(2)} MB
🔄 *آخر تحديث:* ${new Date(repoData.updated_at).toLocaleDateString('ar-EG')}
🌐 *الرابط:* ${repoData.html_url}
🍴 *الفروع:* ${repoData.forks_count}
⭐ *النجوم:* ${repoData.stargazers_count}
📝 *الوصف:* ${repoData.description || 'لا يوجد وصف'}

📈 *الإحصائيات:*
├─ 📁 المشروع: ${repoData.full_name}
├─ 🏷️ الرخصة: ${repoData.license?.name || 'MIT'}
├─ 🔄 النوع: ${repoData.private ? 'خاص' : 'عام'}
└─ 🐍 اللغة: ${repoData.language || 'Node.js'}

━━━━━━━━━━━━━━━━━━━━━━━━
🤖 Crimson Bot | تطوير متقدم`;

        try {
            const imagePath = path.join(__dirname, '../assets/bot_image.jpg');
            const imageBuffer = fs.readFileSync(imagePath);

            await conn.sendMessage(m.chat, {
                image: imageBuffer,
                caption: repoInfo
            }, { quoted: m });

        } catch (imageError) {
            // إذا لم توجد الصورة، إرسال النص فقط
            await conn.sendMessage(m.chat, {
                text: repoInfo
            }, { quoted: m });
        }

    } catch (error) {
        console.error('❌ Error in github command:', error);
        
        await conn.sendMessage(m.chat, {
            text: `╔═══════════════════════════╗
║  ❌ فشل التحميل         ║
╚═══════════════════════════╝

⚠️ فشل في جلب معلومات GitHub

💡 الأسباب المحتملة:
├─ مشكلة في الاتصال
├─ المستودع غير متوفر
├─ الخادم مشغول
└─ حاول مرة أخرى

━━━━━━━━━━━━━━━━━━━━━━━━
🔄 جرب مرة أخرى`,
            mentions: [sender]
        }, { quoted: m });
    }
};

handler.help = ['github', 'git', 'repo'];
handler.tags = ['tools', 'info'];
handler.command = ['github', 'git', 'repo', 'جيتهاب', 'مستودع'];
handler.description = 'عرض معلومات مستودع Crimson Bot على GitHub';
handler.usage = '.github';
handler.example = '.github';

handler.group = true;
handler.private = true;
handler.owner = false;
handler.admin = false;
handler.premium = false;
handler.botAdmin = false;

export default handler;
