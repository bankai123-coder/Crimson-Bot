import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const handler = async (m, { conn, text, quoted, sender }) => {
    try {
        // 🔍 التحقق من وجود الرابط
        if (!text) {
            return await conn.sendMessage(m.chat, {
                text: `╔═══════════════════════════╗
║  ❌ خطأ في الإدخال      ║
╚═══════════════════════════╝

📌 يجب إرسال رابط فيديو الفيسبوك

📝 طريقة الاستخدام:
├─ .fb https://facebook.com/...
└─ .fb https://fb.watch/...

━━━━━━━━━━━━━━━━━━━━━━━━
💡 أرسل الرابط للمتابعة`,
                mentions: [sender]
            }, { quoted: m });
        }

        const url = text.trim();
        
        // 🔎 التحقق من أن الرابط لفيسبوك
        if (!url.includes('facebook.com') && !url.includes('fb.watch')) {
            return await conn.sendMessage(m.chat, {
                text: `╔═══════════════════════════╗
║  ❌ رابط غير صحيح       ║
╚═══════════════════════════╝

⚠️ هذا ليس رابط فيسبوك صالح

✅ تأكد من:
├─ الرابط من facebook.com
├─ أو من fb.watch
└─ الفيديو عام وليس خاص

━━━━━━━━━━━━━━━━━━━━━━━━
🔄 جرب رابطاً آخر`,
                mentions: [sender]
            }, { quoted: m });
        }

        // 🔄 رد فعل
        await conn.sendMessage(m.chat, { 
            react: { text: '⏬', key: m.key } 
        });

        // 📡 إعلام بالبدء
        await conn.sendMessage(m.chat, {
            text: `╔═══════════════════════════╗
║  📥 جاري التحميل        ║
╚═══════════════════════════╝

🌐 المنصة: Facebook
⏳ الحالة: جاري المعالجة...

━━━━━━━━━━━━━━━━━━━━━━━━
⏱️ قد يستغرق بضع دقائق`,
            mentions: [sender]
        }, { quoted: m });

        // 🔗 حل الروابط المختصرة
        let resolvedUrl = url;
        try {
            const redirectResponse = await fetch(url, {
                timeout: 15000,
                redirect: 'follow',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });
            
            if (redirectResponse.url && redirectResponse.url !== url) {
                resolvedUrl = redirectResponse.url;
            }
        } catch (redirectError) {
            console.log('⚠️ لم يتم حل الرابط المختصر، استخدام الرابط الأصلي');
        }

        // 📡 استخدام API للتحميل
        async function fetchFromFacebookAPI(videoUrl) {
            const apiUrl = `https://api.princetechn.com/api/download/facebook?apikey=prince&url=${encodeURIComponent(videoUrl)}`;
            
            const response = await fetch(apiUrl, {
                timeout: 30000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                    'Accept': 'application/json, text/plain, */*'
                }
            });
            
            if (!response.ok) {
                throw new Error(`فشل API: ${response.status}`);
            }
            
            return await response.json();
        }

        // 🔄 محاولة مع الرابط المحلول ثم الأصلي
        let apiData;
        try {
            apiData = await fetchFromFacebookAPI(resolvedUrl);
        } catch (firstError) {
            console.log('🔄 محاولة بالرابط الأصلي...');
            apiData = await fetchFromFacebookAPI(url);
        }

        // ✅ التحقق من استجابة API
        if (!apiData || apiData.status !== 200 || !apiData.success || !apiData.result) {
            throw new Error('فشل في الحصول على بيانات الفيديو من الخادم');
        }

        // 🎬 الحصول على رابط الفيديو
        const videoUrl = apiData.result.hd_video || apiData.result.sd_video;
        
        if (!videoUrl) {
            throw new Error('لم يتم العثور على رابط فيديو في الاستجابة');
        }

        // 📁 إنشاء مجلد مؤقت
        const tmpDir = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
        }

        // 💾 حفظ الفيديو مؤقتاً
        const tempFile = path.join(tmpDir, `fb_video_${Date.now()}.mp4`);

        // 📥 تحميل الفيديو
        const videoResponse = await fetch(videoUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Referer': 'https://www.facebook.com/'
            }
        });

        if (!videoResponse.ok) {
            throw new Error(`فشل في تحميل الفيديو: ${videoResponse.status}`);
        }

        const fileStream = fs.createWriteStream(tempFile);
        await new Promise((resolve, reject) => {
            videoResponse.body.pipe(fileStream);
            videoResponse.body.on("error", reject);
            fileStream.on("finish", resolve);
        });

        // ✅ التحقق من وجود الملف
        if (!fs.existsSync(tempFile) || fs.statSync(tempFile).size === 0) {
            throw new Error('فشل في حفظ الفيديو');
        }

        // 📊 معلومات الفيديو
        const fileStats = fs.statSync(tempFile);
        const fileSizeMB = (fileStats.size / (1024 * 1024)).toFixed(2);
        const quality = apiData.result.hd_video ? 'HD' : 'SD';

        // 📤 إرسال الفيديو
        await conn.sendMessage(m.chat, {
            video: { url: tempFile },
            caption: `╔═══════════════════════════╗
║  ✅ تم التحميل بنجاح     ║
╚═══════════════════════════╝

📊 معلومات الملف:
├─ 📦 الحجم: ${fileSizeMB} MB
├─ ⚡ الجودة: ${quality}
├─ 🎬 النوع: فيديو
└─ 🌐 المصدر: Facebook

━━━━━━━━━━━━━━━━━━━━━━━━
🤖 Crimson Bot | تحميل فيسبوك`,
            mentions: [sender]
        }, { quoted: m });

        // 🧹 تنظيف الملف المؤقت
        try {
            fs.unlinkSync(tempFile);
        } catch (cleanError) {
            console.error('⚠️ خطأ في حذف الملف المؤقت:', cleanError);
        }

        // ✅ تسجيل الاستخدام
        console.log(`✅ facebook video downloaded by ${sender}, size: ${fileSizeMB}MB`);

    } catch (error) {
        console.error('❌ Error in facebook command:', error);
        
        let errorMessage = `╔═══════════════════════════╗
║  ❌ فشل التحميل         ║
╚═══════════════════════════╝

`;
        
        if (error.message.includes('فشل API') || error.message.includes('بيانات الفيديو')) {
            errorMessage += `⚠️ السبب: الخادم غير متاح

💡 الحلول المقترحة:
├─ جرب رابط فيديو آخر
├─ انتظر قليلاً وحاول مرة أخرى
└─ تأكد أن الفيديو عام`;
        } else if (error.message.includes('تحميل الفيديو')) {
            errorMessage += `⚠️ السبب: لا يمكن الوصول للفيديو

💡 الحلول المقترحة:
├─ تأكد من صحة الرابط
├─ جرب فيديو أصغر حجماً
└─ الفيديو قد يكون محذوفاً`;
        } else {
            errorMessage += `⚠️ الخطأ: ${error.message}

━━━━━━━━━━━━━━━━━━━━━━━━
🔄 حاول مرة أخرى لاحقاً`;
        }

        await conn.sendMessage(m.chat, {
            text: errorMessage,
            mentions: [sender]
        }, { quoted: m });
    }
};

handler.help = ['fb'];
handler.tags = ['download', 'media'];
handler.command = ['fb', 'فيسبوك', 'فيديو', 'facebook'];
handler.description = 'تحميل فيديوهات من فيسبوك بجودة عالية';
handler.usage = '.fb <رابط الفيديو>';
handler.example = '.fb https://www.facebook.com/watch/?v=123456789';

handler.group = true;
handler.private = true;
handler.owner = false;
handler.admin = false;
handler.premium = false;
handler.botAdmin = false;

export default handler;
