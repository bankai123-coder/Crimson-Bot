// ═══════════════════════════════════════════════════
// DOWNLOADER COMMANDS - أوامر التحميل
// ═══════════════════════════════════════════════════

import axios from 'axios'
import ytdl from 'ytdl-core'
import yts from 'yt-search'

// ═══════════════════════════════════════════════════
// تحميل من يوتيوب - صوت
// ═══════════════════════════════════════════════════
async function ytmp3(m, { text, reply, conn, from }) {
    if (!text) {
        return reply('❌ يرجى إدخال اسم الأغنية أو رابط يوتيوب!\n*مثال:* .اغنية عمرو دياب')
    }

    try {
        await reply('🔍 جاري البحث...')

        let videoUrl = text
        let videoInfo

        // إذا لم يكن رابط، ابحث في يوتيوب
        if (!text.includes('youtube.com') && !text.includes('youtu.be')) {
            const search = await yts(text)
            if (!search.videos.length) {
                return reply('❌ لم أجد نتائج!')
            }
            videoInfo = search.videos[0]
            videoUrl = videoInfo.url
        } else {
            videoInfo = await ytdl.getInfo(videoUrl)
        }

        await reply(`📥 جاري تحميل: *${videoInfo.title}*\n⏳ قد يستغرق بضع دقائق...`)

        // تحميل الصوت
        const audioStream = ytdl(videoUrl, {
            quality: 'highestaudio',
            filter: 'audioonly'
        })

        const chunks = []
        audioStream.on('data', (chunk) => chunks.push(chunk))
        
        audioStream.on('end', async () => {
            const buffer = Buffer.concat(chunks)

            await conn.sendMessage(from, {
                audio: buffer,
                mimetype: 'audio/mpeg',
                fileName: `${videoInfo.title}.mp3`,
                contextInfo: {
                    externalAdReply: {
                        title: videoInfo.title,
                        body: `Duration: ${videoInfo.duration || 'Unknown'}`,
                        thumbnail: await (await axios.get(videoInfo.thumbnail, { responseType: 'arraybuffer' })).data,
                        mediaType: 2,
                        mediaUrl: videoUrl,
                        sourceUrl: videoUrl
                    }
                }
            })
        })

        audioStream.on('error', (error) => {
            console.error('Download error:', error)
            reply('❌ حدث خطأ أثناء التحميل.')
        })

    } catch (error) {
        console.error('YT MP3 error:', error)
        await reply('❌ حدث خطأ أثناء التحميل. تأكد من الرابط.')
    }
}

// ═══════════════════════════════════════════════════
// تحميل من يوتيوب - فيديو
// ═══════════════════════════════════════════════════
async function ytmp4(m, { text, reply, conn, from }) {
    if (!text) {
        return reply('❌ يرجى إدخال اسم الفيديو أو رابط يوتيوب!\n*مثال:* .فيديو أفضل مباراة')
    }

    try {
        await reply('🔍 جاري البحث...')

        let videoUrl = text
        let videoInfo

        if (!text.includes('youtube.com') && !text.includes('youtu.be')) {
            const search = await yts(text)
            if (!search.videos.length) {
                return reply('❌ لم أجد نتائج!')
            }
            videoInfo = search.videos[0]
            videoUrl = videoInfo.url
        } else {
            videoInfo = await ytdl.getInfo(videoUrl)
        }

        await reply(`📥 جاري تحميل: *${videoInfo.title}*\n⏳ قد يستغرق عدة دقائق...`)

        // تحميل الفيديو
        const videoStream = ytdl(videoUrl, {
            quality: 'highest',
            filter: 'videoandaudio'
        })

        const chunks = []
        videoStream.on('data', (chunk) => chunks.push(chunk))
        
        videoStream.on('end', async () => {
            const buffer = Buffer.concat(chunks)

            await conn.sendMessage(from, {
                video: buffer,
                caption: `╔═══════════════════════════════╗
║   📹 YouTube Video 📹        ║
╚═══════════════════════════════╝

*📌 العنوان:* ${videoInfo.title}
*👤 القناة:* ${videoInfo.author?.name || 'Unknown'}
*⏱️ المدة:* ${videoInfo.duration || 'Unknown'}
*👁️ المشاهدات:* ${videoInfo.views?.toLocaleString() || 'Unknown'}

━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ Downloaded by Crimson Bot`,
                contextInfo: {
                    externalAdReply: {
                        title: videoInfo.title,
                        body: videoInfo.author?.name || 'YouTube',
                        thumbnail: await (await axios.get(videoInfo.thumbnail, { responseType: 'arraybuffer' })).data,
                        mediaType: 1,
                        sourceUrl: videoUrl
                    }
                }
            })
        })

        videoStream.on('error', (error) => {
            console.error('Download error:', error)
            reply('❌ حدث خطأ أثناء التحميل.')
        })

    } catch (error) {
        console.error('YT MP4 error:', error)
        await reply('❌ حدث خطأ أثناء التحميل.')
    }
}

// ═══════════════════════════════════════════════════
// بحث في يوتيوب
// ═══════════════════════════════════════════════════
async function ytsearch(m, { text, reply }) {
    if (!text) {
        return reply('❌ يرجى إدخال كلمة البحث!\n*مثال:* .يوتيوب أغاني عربية')
    }

    try {
        await reply('🔍 جاري البحث...')

        const search = await yts(text)
        const videos = search.videos.slice(0, 5)

        if (!videos.length) {
            return reply('❌ لم أجد نتائج!')
        }

        let searchText = `╔═══════════════════════════════╗
║   🔍 نتائج البحث 🔍         ║
╚═══════════════════════════════╝

*🔎 البحث عن:* ${text}

━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`

        videos.forEach((video, index) => {
            searchText += `${index + 1}. *${video.title}*
👤 ${video.author.name}
⏱️ ${video.timestamp}
👁️ ${video.views.toLocaleString()} مشاهدة
🔗 ${video.url}\n\n`
        })

        searchText += `━━━━━━━━━━━━━━━━━━━━━━━━━
💡 استخدم .اغنية [رابط] للتحميل`

        await reply(searchText)
    } catch (error) {
        console.error('YT Search error:', error)
        await reply('❌ حدث خطأ أثناء البحث.')
    }
}

// ═══════════════════════════════════════════════════
// تحميل من تيك توك
// ═══════════════════════════════════════════════════
async function tiktok(m, { text, reply, conn, from }) {
    if (!text || !text.includes('tiktok.com')) {
        return reply('❌ يرجى إدخال رابط تيك توك صحيح!\n*مثال:* .تيك-توك https://vt.tiktok.com/...')
    }

    try {
        await reply('📥 جاري التحميل...')

        // استخدام API لتحميل تيك توك
        const response = await axios.get(`https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(text)}`)

        if (response.data && response.data.video) {
            const videoData = response.data.video
            const videoBuffer = await axios.get(videoData.noWatermark, { responseType: 'arraybuffer' })

            await conn.sendMessage(from, {
                video: Buffer.from(videoBuffer.data),
                caption: `╔═══════════════════════════════╗
║   🎵 TikTok Video 🎵         ║
╚═══════════════════════════════╝

*📌 العنوان:* ${response.data.title || 'TikTok Video'}
*👤 الناشر:* ${response.data.author || 'Unknown'}

━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ Downloaded by Crimson Bot`
            })
        } else {
            await reply('❌ فشل التحميل. تأكد من الرابط.')
        }
    } catch (error) {
        console.error('TikTok error:', error)
        await reply('❌ حدث خطأ أثناء التحميل من تيك توك.')
    }
}

// ═══════════════════════════════════════════════════
// تحميل من انستغرام
// ═══════════════════════════════════════════════════
async function instagram(m, { text, reply, conn, from }) {
    if (!text || !text.includes('instagram.com')) {
        return reply('❌ يرجى إدخال رابط انستغرام صحيح!\n*مثال:* .انستا https://www.instagram.com/p/...')
    }

    try {
        await reply('📥 جاري التحميل...')

        const response = await axios.get(`https://api.betabotz.eu.org/api/download/igdowload?url=${encodeURIComponent(text)}&apikey=your-api-key`)

        if (response.data && response.data.result) {
            const media = response.data.result

            if (media.includes('.mp4')) {
                const videoBuffer = await axios.get(media, { responseType: 'arraybuffer' })
                await conn.sendMessage(from, {
                    video: Buffer.from(videoBuffer.data),
                    caption: '⚡ Downloaded by Crimson Bot'
                })
            } else {
                const imageBuffer = await axios.get(media, { responseType: 'arraybuffer' })
                await conn.sendMessage(from, {
                    image: Buffer.from(imageBuffer.data),
                    caption: '⚡ Downloaded by Crimson Bot'
                })
            }
        } else {
            await reply('❌ فشل التحميل. قد يكون الحساب خاص.')
        }
    } catch (error) {
        console.error('Instagram error:', error)
        await reply('❌ حدث خطأ أثناء التحميل من انستغرام.')
    }
}

// ═══════════════════════════════════════════════════
// تحميل من فيسبوك
// ═══════════════════════════════════════════════════
async function facebook(m, { text, reply, conn, from }) {
    if (!text || !text.includes('facebook.com')) {
        return reply('❌ يرجى إدخال رابط فيسبوك صحيح!\n*مثال:* .فيسبوك https://www.facebook.com/...')
    }

    try {
        await reply('📥 جاري التحميل...')

        const response = await axios.get(`https://api.betabotz.eu.org/api/download/fbdown?url=${encodeURIComponent(text)}&apikey=your-api-key`)

        if (response.data && response.data.result) {
            const videoUrl = response.data.result.HD || response.data.result.SD

            const videoBuffer = await axios.get(videoUrl, { responseType: 'arraybuffer' })

            await conn.sendMessage(from, {
                video: Buffer.from(videoBuffer.data),
                caption: `╔═══════════════════════════════╗
║   📘 Facebook Video 📘       ║
╚═══════════════════════════════╝

*📌 العنوان:* ${response.data.title || 'Facebook Video'}

━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ Downloaded by Crimson Bot`
            })
        } else {
            await reply('❌ فشل التحميل. تأكد من الرابط.')
        }
    } catch (error) {
        console.error('Facebook error:', error)
        await reply('❌ حدث خطأ أثناء التحميل من فيسبوك.')
    }
}

// ═══════════════════════════════════════════════════
// تحميل من تويتر/X
// ═══════════════════════════════════════════════════
async function twitter(m, { text, reply, conn, from }) {
    if (!text || (!text.includes('twitter.com') && !text.includes('x.com'))) {
        return reply('❌ يرجى إدخال رابط تويتر/X صحيح!\n*مثال:* .تويتر https://twitter.com/...')
    }

    try {
        await reply('📥 جاري التحميل...')

        const response = await axios.get(`https://api.betabotz.eu.org/api/download/twitter?url=${encodeURIComponent(text)}&apikey=your-api-key`)

        if (response.data && response.data.result) {
            const mediaUrl = response.data.result.HD || response.data.result.SD

            if (mediaUrl.includes('.mp4')) {
                const videoBuffer = await axios.get(mediaUrl, { responseType: 'arraybuffer' })
                await conn.sendMessage(from, {
                    video: Buffer.from(videoBuffer.data),
                    caption: '⚡ Downloaded by Crimson Bot'
                })
            } else {
                const imageBuffer = await axios.get(mediaUrl, { responseType: 'arraybuffer' })
                await conn.sendMessage(from, {
                    image: Buffer.from(imageBuffer.data),
                    caption: '⚡ Downloaded by Crimson Bot'
                })
            }
        } else {
            await reply('❌ فشل التحميل. تأكد من الرابط.')
        }
    } catch (error) {
        console.error('Twitter error:', error)
        await reply('❌ حدث خطأ أثناء التحميل من تويتر.')
    }
}

// ═══════════════════════════════════════════════════
// تحويل إلى ملصق
// ═══════════════════════════════════════════════════
async function sticker(m, { conn, from, reply, quoted, download }) {
    try {
        if (!quoted) {
            return reply('❌ يرجى الرد على صورة أو فيديو لتحويله إلى ملصق!')
        }

        const mediaType = quoted.message?.imageMessage ? 'image' : 
                         quoted.message?.videoMessage ? 'video' : null

        if (!mediaType) {
            return reply('❌ يرجى الرد على صورة أو فيديو فقط!')
        }

        await reply('⏳ جاري إنشاء الملصق...')

        const buffer = await download()

        await conn.sendMessage(from, {
            sticker: buffer
        })
    } catch (error) {
        console.error('Sticker error:', error)
        await reply('❌ حدث خطأ أثناء إنشاء الملصق.')
    }
}

// ═══════════════════════════════════════════════════
// ملصق بنص
// ═══════════════════════════════════════════════════
async function attp(m, { text, reply, conn, from }) {
    if (!text) {
        return reply('❌ يرجى إدخال النص!\n*مثال:* .attp مرحبا')
    }

    if (text.length > 50) {
        return reply('❌ النص طويل جداً! الحد الأقصى 50 حرف.')
    }

    try {
        await reply('⏳ جاري إنشاء الملصق...')

        const response = await axios.get(`https://api.betabotz.eu.org/api/maker/attp?text=${encodeURIComponent(text)}&apikey=your-api-key`, {
            responseType: 'arraybuffer'
        })

        await conn.sendMessage(from, {
            sticker: Buffer.from(response.data)
        })
    } catch (error) {
        console.error('ATTP error:', error)
        await reply('❌ حدث خطأ أثناء إنشاء الملصق.')
    }
}

// ═══════════════════════════════════════════════════
// تحويل صوت إلى رسالة صوتية
// ═══════════════════════════════════════════════════
async function toVoice(m, { conn, from, reply, quoted, download }) {
    try {
        if (!quoted || !quoted.message?.audioMessage) {
            return reply('❌ يرجى الرد على رسالة صوتية أو ملف صوتي!')
        }

        await reply('⏳ جاري التحويل...')

        const buffer = await download()

        await conn.sendMessage(from, {
            audio: buffer,
            mimetype: 'audio/ogg; codecs=opus',
            ptt: true
        })
    } catch (error) {
        console.error('ToVoice error:', error)
        await reply('❌ حدث خطأ أثناء التحويل.')
    }
}

// ═══════════════════════════════════════════════════
// تحويل صورة إلى PDF
// ═══════════════════════════════════════════════════
async function toPDF(m, { conn, from, reply, quoted, download }) {
    try {
        if (!quoted || !quoted.message?.imageMessage) {
            return reply('❌ يرجى الرد على صورة!')
        }

        await reply('⏳ جاري التحويل إلى PDF...')

        const buffer = await download()
        
        // استخدام مكتبة لتحويل الصورة إلى PDF
        const PDFDocument = require('pdfkit')
        const pdfDoc = new PDFDocument()
        
        const chunks = []
        pdfDoc.on('data', chunk => chunks.push(chunk))
        
        pdfDoc.image(buffer, {
            fit: [500, 500],
            align: 'center',
            valign: 'center'
        })
        
        pdfDoc.end()
        
        pdfDoc.on('end', async () => {
            const pdfBuffer = Buffer.concat(chunks)
            
            await conn.sendMessage(from, {
                document: pdfBuffer,
                mimetype: 'application/pdf',
                fileName: `Crimson-${Date.now()}.pdf`
            })
        })
    } catch (error) {
        console.error('ToPDF error:', error)
        await reply('❌ حدث خطأ أثناء التحويل.')
    }
}

// ═══════════════════════════════════════════════════
// بحث وتحميل صور
// ═══════════════════════════════════════════════════
async function googleImage(m, { text, reply, conn, from }) {
    if (!text) {
        return reply('❌ يرجى إدخال كلمة البحث!\n*مثال:* .صور قطط لطيفة')
    }

    try {
        await reply('🔍 جاري البحث عن الصور...')

        const response = await axios.get(`https://api.betabotz.eu.org/api/search/googleimage?query=${encodeURIComponent(text)}&apikey=your-api-key`)

        if (response.data && response.data.result && response.data.result.length > 0) {
            const images = response.data.result.slice(0, 5)

            for (const imageUrl of images) {
                try {
                    const imageBuffer = await axios.get(imageUrl, { 
                        responseType: 'arraybuffer',
                        timeout: 10000
                    })

                    await conn.sendMessage(from, {
                        image: Buffer.from(imageBuffer.data),
                        caption: `🔍 نتيجة البحث: ${text}\n⚡ Powered by Crimson Bot`
                    })

                    await new Promise(resolve => setTimeout(resolve, 1000))
                } catch (err) {
                    console.error('Image download error:', err)
                }
            }
        } else {
            await reply('❌ لم أجد صور!')
        }
    } catch (error) {
        console.error('Google Image error:', error)
        await reply('❌ حدث خطأ أثناء البحث.')
    }
}

// ═══════════════════════════════════════════════════
// تحميل أغنية من Spotify
// ═══════════════════════════════════════════════════
async function spotify(m, { text, reply, conn, from }) {
    if (!text) {
        return reply('❌ يرجى إدخال اسم الأغنية أو رابط Spotify!\n*مثال:* .spotify shape of you')
    }

    try {
        await reply('🔍 جاري البحث في Spotify...')

        const response = await axios.get(`https://api.betabotz.eu.org/api/download/spotify?url=${encodeURIComponent(text)}&apikey=your-api-key`)

        if (response.data && response.data.result) {
            const track = response.data.result

            const audioBuffer = await axios.get(track.download, { responseType: 'arraybuffer' })

            await conn.sendMessage(from, {
                audio: Buffer.from(audioBuffer.data),
                mimetype: 'audio/mpeg',
                fileName: `${track.title}.mp3`,
                contextInfo: {
                    externalAdReply: {
                        title: track.title,
                        body: track.artist,
                        thumbnail: await (await axios.get(track.image, { responseType: 'arraybuffer' })).data,
                        mediaType: 2,
                        sourceUrl: text
                    }
                }
            })
        } else {
            await reply('❌ لم أجد الأغنية!')
        }
    } catch (error) {
        console.error('Spotify error:', error)
        await reply('❌ حدث خطأ أثناء التحميل من Spotify.')
    }
}

// ═══════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════

ytmp3.help = ['اغنية', 'ytmp3']
ytmp3.tags = ['downloader']
ytmp3.command = ['اغنية', 'ytmp3', 'song', 'play']
ytmp3.description = 'تحميل أغنية من يوتيوب'
ytmp3.usage = '.اغنية [اسم او رابط]'
ytmp3.args = true
ytmp3.cooldown = 10

ytmp4.help = ['فيديو', 'ytmp4']
ytmp4.tags = ['downloader']
ytmp4.command = ['فيديو', 'ytmp4', 'video']
ytmp4.description = 'تحميل فيديو من يوتيوب'
ytmp4.usage = '.فيديو [اسم او رابط]'
ytmp4.args = true
ytmp4.cooldown = 15

ytsearch.help = ['يوتيوب', 'yts']
ytsearch.tags = ['downloader']
ytsearch.command = ['يوتيوب', 'yts', 'ytsearch']
ytsearch.description = 'البحث في يوتيوب'
ytsearch.usage = '.يوتيوب [كلمة البحث]'
ytsearch.args = true

tiktok.help = ['تيك-توك', 'tiktok']
tiktok.tags = ['downloader']
tiktok.command = ['تيك-توك', 'tiktok', 'tt']
tiktok.description = 'تحميل فيديو من تيك توك'
tiktok.usage = '.تيك-توك [رابط]'
tiktok.args = true
tiktok.cooldown = 10

instagram.help = ['انستا', 'instagram']
instagram.tags = ['downloader']
instagram.command = ['انستا', 'instagram', 'ig', 'igdl']
instagram.description = 'تحميل من انستغرام'
instagram.usage = '.انستا [رابط]'
instagram.args = true
instagram.cooldown = 10

facebook.help = ['فيسبوك', 'facebook']
facebook.tags = ['downloader']
facebook.command = ['فيسبوك', 'facebook', 'fb', 'fbdl']
facebook.description = 'تحميل فيديو من فيسبوك'
facebook.usage = '.فيسبوك [رابط]'
facebook.args = true
facebook.cooldown = 10

twitter.help = ['تويتر', 'twitter']
twitter.tags = ['downloader']
twitter.command = ['تويتر', 'twitter', 'x', 'twdl']
twitter.description = 'تحميل من تويتر/X'
twitter.usage = '.تويتر [رابط]'
twitter.args = true
twitter.cooldown = 10

sticker.help = ['ستيكر', 'sticker']
sticker.tags = ['converter']
sticker.command = ['ستيكر', 'sticker', 's', 'ملصق']
sticker.description = 'تحويل صورة/فيديو إلى ملصق'

attp.help = ['attp']
attp.tags = ['converter']
attp.command = ['attp', 'ttp']
attp.description = 'إنشاء ملصق نصي متحرك'
attp.usage = '.attp [النص]'
attp.args = true

toVoice.help = ['tovn', 'tovoice']
toVoice.tags = ['converter']
toVoice.command = ['tovn', 'tovoice', 'لصوت']
toVoice.description = 'تحويل صوت إلى رسالة صوتية'

toPDF.help = ['topdf']
toPDF.tags = ['converter']
toPDF.command = ['topdf', 'لpdf']
toPDF.description = 'تحويل صورة إلى PDF'

googleImage.help = ['صور', 'image']
googleImage.tags = ['downloader']
googleImage.command = ['صور', 'image', 'gimage']
googleImage.description = 'البحث عن صور'
googleImage.usage = '.صور [كلمة البحث]'
googleImage.args = true
googleImage.cooldown = 10

spotify.help = ['spotify']
spotify.tags = ['downloader']
spotify.command = ['spotify', 'spotifydl']
spotify.description = 'تحميل من Spotify'
spotify.usage = '.spotify [اسم او رابط]'
spotify.args = true
spotify.cooldown = 10

export default ytmp3
export { ytmp4, ytsearch, tiktok, instagram, facebook, twitter, sticker, attp, toVoice, toPDF, googleImage, spotify }
