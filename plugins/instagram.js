import { igdl } from "ruhend-scraper";

// تخزين معرفات الرسائل المعالجة لمنع التكرار
const processedMessages = new Set();

// دالة لاستخراج الوسائط الفريدة مع منع التكرار
function extractUniqueMedia(mediaData) {
    const uniqueMedia = [];
    const seenUrls = new Set();
    
    for (const media of mediaData) {
        if (!media.url) continue;
        
        // التحقق من التكرار بناءً على الرابط فقط
        if (!seenUrls.has(media.url)) {
            seenUrls.add(media.url);
            uniqueMedia.push(media);
        }
    }
    
    return uniqueMedia;
}

// دالة للتحقق من صحة رابط الوسائط
function isValidMediaUrl(url) {
    if (!url || typeof url !== 'string') return false;
    
    // قبول أي رابط يبدو كوسائط
    return url.includes('cdninstagram.com') || 
           url.includes('instagram') || 
           url.includes('http');
}

const handler = async (m, { conn, text, args, sender }) => {
    try {
        // التحقق من معالجة الرسالة مسبقاً
        if (processedMessages.has(m.key.id)) {
            return;
        }
        
        // إضافة معرف الرسالة للمجموعة
        processedMessages.add(m.key.id);
        
        // تنظيف معرفات الرسائل القديمة بعد 5 دقائق
        setTimeout(() => {
            processedMessages.delete(m.key.id);
        }, 5 * 60 * 1000);

        if (!text) {
            return await conn.sendMessage(m.chat, { 
                text: `╔═══════════════════════════╗
║  ❌ خطأ في الإدخال      ║
╚═══════════════════════════╝

📌 يرجى إرسال رابط إنستغرام

📝 طريقة الاستخدام:
├─ .ig <رابط الإنستغرام>
├─ .instagram <رابط الإنستغرام>
└─ .reel <رابط الريل>

━━━━━━━━━━━━━━━━━━━━━━━━
💡 أرسل الرابط للمتابعة`,
                mentions: [sender]
            }, { quoted: m });
        }

        // أنماط روابط إنستغرام المختلفة
        const instagramPatterns = [
            /https?:\/\/(?:www\.)?instagram\.com\//,
            /https?:\/\/(?:www\.)?instagr\.am\//,
            /https?:\/\/(?:www\.)?instagram\.com\/p\//,
            /https?:\/\/(?:www\.)?instagram\.com\/reel\//,
            /https?:\/\/(?:www\.)?instagram\.com\/tv\//
        ];

        const isValidUrl = instagramPatterns.some(pattern => pattern.test(text));
        
        if (!isValidUrl) {
            return await conn.sendMessage(m.chat, { 
                text: `╔═══════════════════════════╗
║  ❌ رابط غير صحيح       ║
╚═══════════════════════════╝

⚠️ هذا ليس رابط إنستغرام صالح

✅ يجب أن يكون الرابط من:
├─ instagram.com/p/ (منشور)
├─ instagram.com/reel/ (ريل)
├─ instagram.com/tv/ (فيديو)
└─ instagr.am/ (رابط مختصر)

━━━━━━━━━━━━━━━━━━━━━━━━
🔄 جرب رابطاً آخر`,
                mentions: [sender]
            }, { quoted: m });
        }

        // رد فعل
        await conn.sendMessage(m.chat, { 
            react: { text: '🔄', key: m.key } 
        });

        // إعلام البدء
        await conn.sendMessage(m.chat, {
            text: `╔═══════════════════════════╗
║  📥 جاري التحميل        ║
╚═══════════════════════════╝

🌐 المنصة: Instagram
⏳ الحالة: جاري معالجة الرابط...

━━━━━━━━━━━━━━━━━━━━━━━━
⏱️ قد يستغرق بضع ثوانٍ`,
            mentions: [sender]
        }, { quoted: m });

        const downloadData = await igdl(text);
        
        if (!downloadData || !downloadData.data || downloadData.data.length === 0) {
            return await conn.sendMessage(m.chat, { 
                text: `╔═══════════════════════════╗
║  ❌ لم يتم العثور       ║
╚═══════════════════════════╝

⚠️ لم يتم العثور على وسائط في الرابط

💡 الأسباب المحتملة:
├─ المنشور خاص
├─ الرابط غير صحيح
├─ الحساب محظور
└─ مشكلة في الخادم

━━━━━━━━━━━━━━━━━━━━━━━━
🔄 جرب رابطاً آخر`,
                mentions: [sender]
            }, { quoted: m });
        }

        const mediaData = downloadData.data;
        
        // منع التكرار البسيط
        const uniqueMedia = extractUniqueMedia(mediaData);
        
        // الحد الأقصى 20 وسائط
        const mediaToDownload = uniqueMedia.slice(0, 20);
        
        if (mediaToDownload.length === 0) {
            return await conn.sendMessage(m.chat, { 
                text: `╔═══════════════════════════╗
║  ❌ لا توجد وسائط      ║
╚═══════════════════════════╝

⚠️ لم يتم العثور على وسائط صالحة

💡 الأسباب المحتملة:
├─ المنشور خاص
├─ مشكلة في السكريبر
├─ الروابط غير صالحة
└─ محتوى محذوف

━━━━━━━━━━━━━━━━━━━━━━━━
🔄 جرب رابطاً آخر`,
                mentions: [sender]
            }, { quoted: m });
        }

        // إعلام بعدد الوسائط
        await conn.sendMessage(m.chat, {
            text: `╔═══════════════════════════╗
║  📊 جاري الإرسال       ║
╚═══════════════════════════╝

📦 عدد الوسائط: ${mediaToDownload.length}
⏳ الحالة: جاري تحميل الوسائط...

━━━━━━━━━━━━━━━━━━━━━━━━
⏱️ الرجاء الانتظار...`,
            mentions: [sender]
        }, { quoted: m });

        // تحميل جميع الوسائط
        let successCount = 0;
        for (let i = 0; i < mediaToDownload.length; i++) {
            try {
                const media = mediaToDownload[i];
                const mediaUrl = media.url;

                // التحقق إذا كان فيديو
                const isVideo = /\.(mp4|mov|avi|mkv|webm)$/i.test(mediaUrl) || 
                              media.type === 'video' || 
                              text.includes('/reel/') || 
                              text.includes('/tv/');

                if (isVideo) {
                    await conn.sendMessage(m.chat, {
                        video: { url: mediaUrl },
                        mimetype: "video/mp4",
                        caption: `📸 الوسائط ${i + 1}/${mediaToDownload.length}\n🤖 Knight Bot - تحميل احترافي`
                    }, { quoted: m });
                } else {
                    await conn.sendMessage(m.chat, {
                        image: { url: mediaUrl },
                        caption: `📸 الوسائط ${i + 1}/${mediaToDownload.length}\n🤖 Knight Bot - تحميل احترافي`
                    }, { quoted: m });
                }
                
                successCount++;
                
                // تأخير بين التنزيلات لمنع التحميل الزائد
                if (i < mediaToDownload.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                
            } catch (mediaError) {
                console.error(`❌ خطأ في تحميل الوسائط ${i + 1}:`, mediaError);
                // الاستمرار مع الوسائط التالية إذا فشل أحدها
            }
        }

        // إعلام بالإنجاز
        if (successCount > 0) {
            await conn.sendMessage(m.chat, {
                text: `╔═══════════════════════════╗
║  ✅ اكتمل التحميل       ║
╚═══════════════════════════╝

📊 النتائج:
├─ ✅ تم بنجاح: ${successCount}
├─ ❌ فشل: ${mediaToDownload.length - successCount}
└─ 📦 الإجمالي: ${mediaToDownload.length}

━━━━━━━━━━━━━━━━━━━━━━━━
🤖 Knight Bot - تحميل احترافي`,
                mentions: [sender]
            }, { quoted: m });
        }

    } catch (error) {
        console.error('❌ Error in instagram command:', error);
        
        let errorMessage = `╔═══════════════════════════╗
║  ❌ فشل التحميل         ║
╚═══════════════════════════╝

`;
        
        if (error.message.includes('private') || error.message.includes('خاص')) {
            errorMessage += `⚠️ السبب: المنشور خاص

💡 الحلول:
├─ تأكد أن المنشور عام
├─ جرب منشوراً آخر
└─ لا يمكن تحميل المنشورات الخاصة`;
        } else if (error.message.includes('timeout')) {
            errorMessage += `⚠️ السبب: انتهت المهلة

💡 الحلول:
├─ جرب مرة أخرى
├─ تحقق من اتصالك
└─ الخادم مشغول حالياً`;
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

handler.help = ['ig', 'instagram', 'reel'];
handler.tags = ['download', 'media', 'social'];
handler.command = ['ig', 'instagram', 'انستغرام', 'ريل', 'reel'];
handler.description = 'تحميل الصور والفيديوهات من إنستغرام';
handler.usage = '.ig <رابط المنشور/الريل>';
handler.example = '.ig https://www.instagram.com/p/Cxample123/';

handler.group = true;
handler.private = true;
handler.owner = false;
handler.admin = false;
handler.premium = false;
handler.botAdmin = false;

export default handler;
