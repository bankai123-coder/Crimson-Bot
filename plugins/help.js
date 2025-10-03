import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const handler = async (m, { conn, sender }) => {
    try {
        // رد فعل
        await conn.sendMessage(m.chat, { 
            react: { text: '📚', key: m.key } 
        });

        const helpMessage = `
╔═══════════════════════════╗
║     🤖 Crimson Bot        ║
║     الإصدار: 3.0.0        ║
║     المطور: Crimson Team  ║
╚═══════════════════════════╝

*📋 الأوامر المتاحة:*

╔═══════════════════════════╗
🌐 *الأوامر العامة:*
║ ➤ .help أو .menu
║ ➤ .ping
║ ➤ .alive
║ ➤ .owner
║ ➤ .joke
║ ➤ .quote
║ ➤ .fact
║ ➤ .weather <مدينة>
║ ➤ .news
║ ➤ .lyrics <اسم الأغنية>
║ ➤ .groupinfo
║ ➤ .staff أو .admins
║ ➤ .trt <نص> <لغة>
║ ➤ .ss <رابط>
║ ➤ .jid
╚═══════════════════════════╝

╔═══════════════════════════╗
👮‍♂️ *أوامر المشرفين:*
║ ➤ .ban @user
║ ➤ .promote @user
║ ➤ .demote @user
║ ➤ .mute <دقائق>
║ ➤ .unmute
║ ➤ .delete أو .del
║ ➤ .kick @user
║ ➤ .warn @user
║ ➤ .antilink
║ ➤ .antibadword
║ ➤ .clear
║ ➤ .tagall
║ ➤ .hidetag <رسالة>
║ ➤ .chatbot
║ ➤ .welcome <on/off>
║ ➤ .setgdesc <وصف>
║ ➤ .setgname <اسم جديد>
╚═══════════════════════════╝

╔═══════════════════════════╗
🔒 *أوامر المالك:*
║ ➤ .mode <public/private>
║ ➤ .clearsession
║ ➤ .antidelete
║ ➤ .update
║ ➤ .settings
║ ➤ .setpp
║ ➤ .autoreact <on/off>
║ ➤ .autostatus <on/off>
║ ➤ .pmblocker <on/off>
╚═══════════════════════════╝

╔═══════════════════════════╗
🎨 *الصور والملصقات:*
║ ➤ .blur <صورة>
║ ➤ .sticker <صورة>
║ ➤ .removebg
║ ➤ .remini
║ ➤ .crop <صورة>
║ ➤ .emojimix <رمز1+رمز2>
║ ➤ .igs <رابط انستغرام>
║ ➤ .igsc <رابط انستغرام>
╚═══════════════════════════╝

╔═══════════════════════════╗
🎮 *ألعاب:*
║ ➤ .tictactoe @user
║ ➤ .hangman
║ ➤ .guess <حرف>
║ ➤ .trivia
║ ➤ .truth
║ ➤ .dare
╚═══════════════════════════╝

╔═══════════════════════════╗
🤖 *الذكاء الاصطناعي:*
║ ➤ .gpt <سؤال>
║ ➤ .gemini <سؤال>
║ ➤ .imagine <وصف>
║ ➤ .flux <وصف>
╚═══════════════════════════╝

╔═══════════════════════════╗
🎯 *ترفيه:*
║ ➤ .compliment @user
║ ➤ .insult @user
║ ➤ .flirt
║ ➤ .shayari
║ ➤ .goodnight
║ ➤ .character @user
║ ➤ .ship @user
╚═══════════════════════════╝

╔═══════════════════════════╗
📥 *التحميل:*
║ ➤ .fb <رابط فيسبوك>
║ ➤ .ig <رابط انستغرام>
║ ➤ .tiktok <رابط>
║ ➤ .play <اسم الأغنية>
║ ➤ .song <اسم الأغنية>
║ ➤ .video <اسم الفيديو>
║ ➤ .ytmp4 <رابط>
╚═══════════════════════════╝

╔═══════════════════════════╗
🔧 *أدوات:*
║ ➤ .git
║ ➤ .github
║ ➤ .script
║ ➤ .repo
╚═══════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━
📞 للدعم: Crimson Team
🎯 قناة التحديثات: @CrimsonBot`;

        try {
            const imagePath = path.join(__dirname, '../assets/bot_image.jpg');
            
            if (fs.existsSync(imagePath)) {
                const imageBuffer = fs.readFileSync(imagePath);
                
                await conn.sendMessage(m.chat, {
                    image: imageBuffer,
                    caption: helpMessage,
                    contextInfo: {
                        forwardingScore: 1,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: '120363161513685998@newsletter',
                            newsletterName: 'Crimson Bot',
                            serverMessageId: -1
                        }
                    }
                }, { quoted: m });
            } else {
                await conn.sendMessage(m.chat, { 
                    text: helpMessage,
                    contextInfo: {
                        forwardingScore: 1,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: '120363161513685998@newsletter',
                            newsletterName: 'Crimson Bot',
                            serverMessageId: -1
                        }
                    }
                }, { quoted: m });
            }
        } catch (error) {
            console.error('❌ Error loading help image:', error);
            await conn.sendMessage(m.chat, { 
                text: helpMessage 
            }, { quoted: m });
        }

    } catch (error) {
        console.error('❌ Error in help command:', error);
        
        await conn.sendMessage(m.chat, {
            text: `╔═══════════════════════════╗
║  ❌ فشل التحميل         ║
╚═══════════════════════════╝

⚠️ فشل في تحميل قائمة الأوامر

💡 حاول:
├─ إعادة المحاولة
├─ التحقق من الاتصال
└─ الاتصال بالدعم

━━━━━━━━━━━━━━━━━━━━━━━━
🔄 جرب مرة أخرى`,
            mentions: [sender]
        }, { quoted: m });
    }
};

handler.help = ['help', 'menu', 'مساعدة', 'الاوامر'];
handler.tags = ['tools'];
handler.command = ['help', 'menu', 'مساعدة', 'الاوامر', 'هلب'];
handler.description = 'عرض جميع الأوامر المتاحة';
handler.usage = '.help';
handler.example = '.help';

handler.group = true;
handler.private = true;
handler.owner = false;
handler.admin = false;
handler.premium = false;
handler.botAdmin = false;

export default handler;
