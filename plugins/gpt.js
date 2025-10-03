import axios from 'axios';
import fetch from 'node-fetch';

let handler = async (m, { conn, args, text, isOwner, isAdmin, isGroup, command }) => {
    if (!text) {
        return await conn.reply(m.chat, `❌ *الاستخدام الصحيح:*\n${command} <سؤالك>\n\n*مثال:*\n${command} اكتب كود HTML بسيط`, m);
    }

    try {
        // إظهار رد فعل المعالجة
        await conn.react(m.chat, '🤖', m);

        if (command === 'gpt') {
            const response = await axios.get(`https://api.dreaded.site/api/chatgpt?text=${encodeURIComponent(text)}`);
            
            if (response.data?.success && response.data.result) {
                const answer = response.data.result.prompt;
                await conn.reply(m.chat, `🤖 *ChatGPT*\n\n${answer}`, m);
            } else {
                throw new Error('استجابة غير صالحة من API');
            }
        } else if (command === 'gemini') {
            const apis = [
                `https://vapis.my.id/api/gemini?q=${encodeURIComponent(text)}`,
                `https://api.siputzx.my.id/api/ai/gemini-pro?content=${encodeURIComponent(text)}`,
                `https://api.ryzendesu.vip/api/ai/gemini?text=${encodeURIComponent(text)}`,
                `https://api.dreaded.site/api/gemini2?text=${encodeURIComponent(text)}`,
                `https://api.giftedtech.my.id/api/ai/geminiai?apikey=gifted&q=${encodeURIComponent(text)}`,
                `https://api.giftedtech.my.id/api/ai/geminiaipro?apikey=gifted&q=${encodeURIComponent(text)}`
            ];

            for (const api of apis) {
                try {
                    const response = await fetch(api);
                    const data = await response.json();

                    if (data.message || data.data || data.answer || data.result) {
                        const answer = data.message || data.data || data.answer || data.result;
                        await conn.reply(m.chat, `🤖 *Google Gemini*\n\n${answer}`, m);
                        return;
                    }
                } catch (e) {
                    continue;
                }
            }
            throw new Error('فشل جميع واجهات Gemini');
        }
    } catch (error) {
        console.error('AI Error:', error);
        await conn.reply(m.chat, `❌ *خطأ في الذكاء الاصطناعي*\n\n${error.message}\n\nيرجى المحاولة مرة أخرى لاحقاً.`, m);
    }
}

handler.help = ['gpt', 'gemini']
handler.tags = ['ai']
handler.command = ['gpt', 'gemini']
handler.description = 'الذكاء الاصطناعي (ChatGPT و Google Gemini)'
handler.usage = '.gpt <سؤال> أو .gemini <سؤال>'
handler.example = '.gpt اكتب كود HTML بسيط'

// الصلاحيات - متاح للجميع
handler.group = false
handler.private = false
handler.owner = false
handler.admin = false
handler.premium = false

export default handler
