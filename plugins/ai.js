// ═══════════════════════════════════════════════════
// AI COMMANDS - أوامر الذكاء الاصطناعي
// ═══════════════════════════════════════════════════

import axios from 'axios'

// ═══════════════════════════════════════════════════
// GPT - محادثة مع الذكاء الاصطناعي
// ═══════════════════════════════════════════════════
async function gpt(m, { text, reply, sender, db }) {
    if (!text) {
        return reply('❌ يرجى كتابة سؤالك!\n*مثال:* .gpt ما هي البرمجة؟')
    }

    try {
        await reply('🤖 جاري التفكير...')

        // استخدام API مجاني - يمكنك تغييره بـ API خاص بك
        const response = await axios.get(`https://api.betabotz.eu.org/api/search/openai-chat`, {
            params: {
                text: text,
                apikey: 'your-api-key' // ضع API key الخاص بك
            }
        })

        if (response.data && response.data.message) {
            const answer = response.data.message

            const replyText = `╔═══════════════════════════════╗
║   🤖 Crimson AI 🤖          ║
╚═══════════════════════════════╝

*💬 سؤالك:*
${text}

━━━━━━━━━━━━━━━━━━━━━━━━━

*🤖 الإجابة:*
${answer}

━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ Powered by Crimson Bot`

            await reply(replyText)

            // حفظ المحادثة
            await db.saveConversation(sender, text, answer)
        } else {
            await reply('❌ لم أتمكن من الحصول على إجابة. حاول مرة أخرى.')
        }
    } catch (error) {
        console.error('GPT error:', error)
        await reply('❌ حدث خطأ في الاتصال بالذكاء الاصطناعي.')
    }
}

// ═══════════════════════════════════════════════════
// توليد صورة بالذكاء الاصطناعي
// ═══════════════════════════════════════════════════
async function imagine(m, { text, reply, conn, from }) {
    if (!text) {
        return reply('❌ يرجى وصف الصورة التي تريدها!\n*مثال:* .صورة قطة لطيفة تلعب')
    }

    try {
        await reply('🎨 جاري رسم الصورة... قد يستغرق هذا دقيقة.')

        // API لتوليد الصور - استخدم API خاص بك
        const response = await axios.get(`https://api.betabotz.eu.org/api/search/openai-image`, {
            params: {
                text: text,
                apikey: 'your-api-key'
            },
            responseType: 'arraybuffer'
        })

        if (response.data) {
            await conn.sendMessage(from, {
                image: Buffer.from(response.data),
                caption: `╔═══════════════════════════════╗
║   🎨 AI Image Generator 🎨  ║
╚═══════════════════════════════╝

*📝 الوصف:*
${text}

✨ تم توليد الصورة بنجاح!
⚡ Powered by Crimson Bot`
            })
        } else {
            await reply('❌ فشل توليد الصورة. حاول مرة أخرى.')
        }
    } catch (error) {
        console.error('Imagine error:', error)
        await reply('❌ حدث خطأ أثناء توليد الصورة.')
    }
}

// ═══════════════════════════════════════════════════
// ترجمة نص
// ═══════════════════════════════════════════════════
async function translate(m, { text, reply, args }) {
    if (!text) {
        return reply('❌ الاستخدام الصحيح:\n.ترجمة [اللغة] [النص]\n*مثال:* .ترجمة en مرحبا')
    }

    const targetLang = args[0]?.toLowerCase()
    const textToTranslate = args.slice(1).join(' ')

    if (!textToTranslate) {
        return reply('❌ يرجى إدخال النص المراد ترجمته!\n*مثال:* .ترجمة en مرحبا')
    }

    const languages = {
        'ar': 'العربية',
        'en': 'English',
        'fr': 'Français',
        'es': 'Español',
        'de': 'Deutsch',
        'it': 'Italiano',
        'tr': 'Türkçe',
        'ru': 'Русский',
        'ja': '日本語',
        'ko': '한국어',
        'zh': '中文'
    }

    if (!languages[targetLang]) {
        return reply(`❌ لغة غير مدعومة!\n\n*اللغات المتاحة:*\n${Object.entries(languages).map(([code, name]) => `${code} - ${name}`).join('\n')}`)
    }

    try {
        await reply('🔄 جاري الترجمة...')

        const response = await axios.get(`https://api.mymemory.translated.net/get`, {
            params: {
                q: textToTranslate,
                langpair: `auto|${targetLang}`
            }
        })

        if (response.data && response.data.responseData) {
            const translation = response.data.responseData.translatedText

            const replyText = `╔═══════════════════════════════╗
║   🌐 الترجمة 🌐             ║
╚═══════════════════════════════╝

*📝 النص الأصلي:*
${textToTranslate}

━━━━━━━━━━━━━━━━━━━━━━━━━

*✨ الترجمة (${languages[targetLang]}):*
${translation}

━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ Powered by Crimson Bot`

            await reply(replyText)
        } else {
            await reply('❌ فشلت الترجمة. حاول مرة أخرى.')
        }
    } catch (error) {
        console.error('Translate error:', error)
        await reply('❌ حدث خطأ أثناء الترجمة.')
    }
}

// ═══════════════════════════════════════════════════
// تحليل صورة بالذكاء الاصطناعي
// ═══════════════════════════════════════════════════
async function analyzeImage(m, { quoted, reply, download }) {
    try {
        if (!quoted || !quoted.message?.imageMessage) {
            return reply('❌ يرجى الرد على صورة لتحليلها!')
        }

        await reply('🔍 جاري تحليل الصورة...')

        const buffer = await download()
        const base64 = buffer.toString('base64')

        // استخدام API لتحليل الصور
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-4-vision-preview",
            messages: [{
                role: "user",
                content: [
                    { type: "text", text: "صف هذه الصورة بالتفصيل باللغة العربية" },
                    { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64}` } }
                ]
            }],
            max_tokens: 300
        }, {
            headers: {
                'Authorization': `Bearer YOUR_API_KEY`,
                'Content-Type': 'application/json'
            }
        })

        if (response.data && response.data.choices) {
            const analysis = response.data.choices[0].message.content

            const replyText = `╔═══════════════════════════════╗
║   🔍 تحليل الصورة 🔍        ║
╚═══════════════════════════════╝

*📸 التحليل:*
${analysis}

━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ Powered by Crimson AI`

            await reply(replyText)
        }
    } catch (error) {
        console.error('Analyze error:', error)
        await reply('❌ حدث خطأ أثناء تحليل الصورة. تأكد من صحة API Key.')
    }
}

// ═══════════════════════════════════════════════════
// توليد كود برمجي
// ═══════════════════════════════════════════════════
async function generateCode(m, { text, reply }) {
    if (!text) {
        return reply('❌ يرجى وصف الكود المطلوب!\n*مثال:* .كود دالة لحساب مجموع رقمين في JavaScript')
    }

    try {
        await reply('💻 جاري توليد الكود...')

        const prompt = `Generate code for: ${text}. Include comments in Arabic and return only the code with brief explanation.`

        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-4",
            messages: [{
                role: "user",
                content: prompt
            }],
            max_tokens: 1000
        }, {
            headers: {
                'Authorization': `Bearer YOUR_API_KEY`,
                'Content-Type': 'application/json'
            }
        })

        if (response.data && response.data.choices) {
            const code = response.data.choices[0].message.content

            const replyText = `╔═══════════════════════════════╗
║   💻 Code Generator 💻       ║
╚═══════════════════════════════╝

*📝 الطلب:*
${text}

━━━━━━━━━━━━━━━━━━━━━━━━━

\`\`\`
${code}
\`\`\`

━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ Powered by Crimson Bot`

            await reply(replyText)
        }
    } catch (error) {
        console.error('Code generation error:', error)
        await reply('❌ حدث خطأ أثناء توليد الكود.')
    }
}

// ═══════════════════════════════════════════════════
// ملخص نص طويل
// ═══════════════════════════════════════════════════
async function summarize(m, { text, reply, quoted }) {
    let textToSummarize = text

    if (!textToSummarize && quoted) {
        textToSummarize = quoted.text
    }

    if (!textToSummarize) {
        return reply('❌ يرجى كتابة النص أو الرد على رسالة لتلخيصها!')
    }

    if (textToSummarize.length < 100) {
        return reply('❌ النص قصير جداً! يجب أن يكون أطول من 100 حرف.')
    }

    try {
        await reply('📝 جاري تلخيص النص...')

        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-4",
            messages: [{
                role: "user",
                content: `لخص النص التالي باللغة العربية بشكل مختصر ومفيد:\n\n${textToSummarize}`
            }],
            max_tokens: 500
        }, {
            headers: {
                'Authorization': `Bearer YOUR_API_KEY`,
                'Content-Type': 'application/json'
            }
        })

        if (response.data && response.data.choices) {
            const summary = response.data.choices[0].message.content

            const replyText = `╔═══════════════════════════════╗
║   📝 ملخص النص 📝           ║
╚═══════════════════════════════╝

*📄 الملخص:*
${summary}

━━━━━━━━━━━━━━━━━━━━━━━━━
📊 طول النص الأصلي: ${textToSummarize.length} حرف
📊 طول الملخص: ${summary.length} حرف
⚡ Powered by Crimson Bot`

            await reply(replyText)
        }
    } catch (error) {
        console.error('Summarize error:', error)
        await reply('❌ حدث خطأ أثناء تلخيص النص.')
    }
}

// ═══════════════════════════════════════════════════
// شرح مفهوم أو موضوع
// ═══════════════════════════════════════════════════
async function explain(m, { text, reply }) {
    if (!text) {
        return reply('❌ يرجى كتابة الموضوع الذي تريد شرحه!\n*مثال:* .شرح الذكاء الاصطناعي')
    }

    try {
        await reply('📚 جاري البحث والشرح...')

        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-4",
            messages: [{
                role: "user",
                content: `اشرح "${text}" بطريقة بسيطة وواضحة باللغة العربية، مع أمثلة إن أمكن.`
            }],
            max_tokens: 800
        }, {
            headers: {
                'Authorization': `Bearer YOUR_API_KEY`,
                'Content-Type': 'application/json'
            }
        })

        if (response.data && response.data.choices) {
            const explanation = response.data.choices[0].message.content

            const replyText = `╔═══════════════════════════════╗
║   📚 شرح تفصيلي 📚          ║
╚═══════════════════════════════╝

*🎯 الموضوع:* ${text}

━━━━━━━━━━━━━━━━━━━━━━━━━

${explanation}

━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ Powered by Crimson Bot`

            await reply(replyText)
        }
    } catch (error) {
        console.error('Explain error:', error)
        await reply('❌ حدث خطأ أثناء الشرح.')
    }
}

// ═══════════════════════════════════════════════════
// تصحيح النصوص
// ═══════════════════════════════════════════════════
async function correct(m, { text, reply, quoted }) {
    let textToCorrect = text

    if (!textToCorrect && quoted) {
        textToCorrect = quoted.text
    }

    if (!textToCorrect) {
        return reply('❌ يرجى كتابة النص أو الرد على رسالة لتصحيحها!')
    }

    try {
        await reply('✏️ جاري التصحيح...')

        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-4",
            messages: [{
                role: "user",
                content: `صحح الأخطاء الإملائية والنحوية في النص التالي، واشرح التصحيحات:\n\n${textToCorrect}`
            }],
            max_tokens: 700
        }, {
            headers: {
                'Authorization': `Bearer YOUR_API_KEY`,
                'Content-Type': 'application/json'
            }
        })

        if (response.data && response.data.choices) {
            const corrected = response.data.choices[0].message.content

            const replyText = `╔═══════════════════════════════╗
║   ✏️ تصحيح النص ✏️          ║
╚═══════════════════════════════╝

*📝 النص الأصلي:*
${textToCorrect}

━━━━━━━━━━━━━━━━━━━━━━━━━

${corrected}

━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ Powered by Crimson Bot`

            await reply(replyText)
        }
    } catch (error) {
        console.error('Correct error:', error)
        await reply('❌ حدث خطأ أثناء التصحيح.')
    }
}

// ═══════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════

gpt.help = ['gpt', 'ai']
gpt.tags = ['ai']
gpt.command = ['gpt', 'ai', 'chatgpt', 'اسأل']
gpt.description = 'محادثة مع الذكاء الاصطناعي'
gpt.usage = '.gpt [سؤالك]'
gpt.args = true

imagine.help = ['صورة', 'imagine']
imagine.tags = ['ai']
imagine.command = ['صورة', 'imagine', 'توليد-صورة']
imagine.description = 'توليد صورة بالذكاء الاصطناعي'
imagine.usage = '.صورة [الوصف]'
imagine.args = true
imagine.cooldown = 30

translate.help = ['ترجمة', 'translate']
translate.tags = ['ai']
translate.command = ['ترجمة', 'translate', 'tr']
translate.description = 'ترجمة نص لأي لغة'
translate.usage = '.ترجمة [اللغة] [النص]'
translate.args = true

analyzeImage.help = ['تحليل-صورة', 'analyze']
analyzeImage.tags = ['ai']
analyzeImage.command = ['تحليل-صورة', 'analyze', 'vision']
analyzeImage.description = 'تحليل صورة بالذكاء الاصطناعي'
analyzeImage.cooldown = 20

generateCode.help = ['كود', 'code']
generateCode.tags = ['ai']
generateCode.command = ['كود', 'code', 'generate-code']
generateCode.description = 'توليد كود برمجي'
generateCode.usage = '.كود [وصف الكود]'
generateCode.args = true

summarize.help = ['تلخيص', 'summarize']
summarize.tags = ['ai']
summarize.command = ['تلخيص', 'summarize', 'summary']
summarize.description = 'تلخيص نص طويل'

explain.help = ['شرح', 'explain']
explain.tags = ['ai']
explain.command = ['شرح', 'explain', 'eli5']
explain.description = 'شرح مفهوم أو موضوع'
explain.usage = '.شرح [الموضوع]'
explain.args = true

correct.help = ['تصحيح', 'correct']
correct.tags = ['ai']
correct.command = ['تصحيح', 'correct', 'fix']
correct.description = 'تصحيح الأخطاء الإملائية والنحوية'

export default gpt
export { imagine, translate, analyzeImage, generateCode, summarize, explain, correct }
