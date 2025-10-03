import { igdl } from 'ruhend-scraper';
import fetch from 'node-fetch';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import webp from 'node-webpmux';
import crypto from 'crypto';

const handler = async (m, { conn, text, args, sender }) => {
    try {
        if (!text) {
            return await conn.sendMessage(m.chat, {
                text: `╔═══════════════════════════╗
║  ❌ خطأ في الإدخال      ║
╚═══════════════════════════╝

📌 يرجى إرسال رابط إنستغرام

📝 طريقة الاستخدام:
├─ .igs <رابط> (ملصق عادي)
├─ .igsc <رابط> (ملصق مقتطع)
└─ يدعم: منشورات، ريلز، قصص

━━━━━━━━━━━━━━━━━━━━━━━━
💡 مثال: .igs https://instagram.com/p/...`,
                mentions: [sender]
            }, { quoted: m });
        }

        const urlMatch = text.match(/https?:\/\/\S+/);
        if (!urlMatch) {
            return await conn.sendMessage(m.chat, {
                text: `╔═══════════════════════════╗
║  ❌ رابط غير صحيح       ║
╚═══════════════════════════╝

⚠️ لم يتم العثور على رابط صالح

💡 تأكد من:
├─ الرابط يبدأ بـ http أو https
├─ الرابط من إنستغرام
├─ الرابط كامل وغير مقطع

━━━━━━━━━━━━━━━━━━━━━━━━
🔄 جرب رابطاً آخر`,
                mentions: [sender]
            }, { quoted: m });
        }

        const isCrop = m.text.includes('.igsc');
        const instagramUrl = urlMatch[0];

        // رد فعل
        await conn.sendMessage(m.chat, { 
            react: { text: '⏬', key: m.key } 
        });

        // إعلام البدء
        await conn.sendMessage(m.chat, {
            text: `╔═══════════════════════════╗
║  📥 جاري التحميل        ║
╚═══════════════════════════╝

🌐 المنصة: Instagram
🎯 النوع: ${isCrop ? 'ملصق مقتطع' : 'ملصق عادي'}
⏳ الحالة: جاري معالجة الرابط...

━━━━━━━━━━━━━━━━━━━━━━━━
⏱️ قد يستغرق بضع ثوانٍ`,
            mentions: [sender]
        }, { quoted: m });

        const downloadData = await igdl(instagramUrl);
        
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

        const mediaItems = downloadData.data.filter(m => m && m.url);
        
        // منع التكرار
        const seenUrls = new Set();
        const uniqueItems = [];
        for (const item of mediaItems) {
            if (!seenUrls.has(item.url)) {
                seenUrls.add(item.url);
                uniqueItems.push(item);
            }
        }

        if (uniqueItems.length === 0) {
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

        // الحد الأقصى 5 وسائط لتجنب التحميل الزائد
        const itemsToProcess = uniqueItems.slice(0, 5);

        await conn.sendMessage(m.chat, {
            text: `╔═══════════════════════════╗
║  🎨 جاري التحويل       ║
╚═══════════════════════════╝

📦 عدد الوسائط: ${itemsToProcess.length}
⚡ النوع: ${isCrop ? 'ملصق مقتطع' : 'ملصق عادي'}
⏳ الحالة: جاري تحويل إلى ملصقات...

━━━━━━━━━━━━━━━━━━━━━━━━
⏱️ الرجاء الانتظار...`,
            mentions: [sender]
        }, { quoted: m });

        let successCount = 0;
        const seenHashes = new Set();

        for (let i = 0; i < itemsToProcess.length; i++) {
            try {
                const media = itemsToProcess[i];
                const mediaUrl = media.url;
                const isVideo = media.type === 'video' || /\.(mp4|mov|avi|mkv|webm)$/i.test(mediaUrl);

                // تحميل الوسائط
                const response = await fetch(mediaUrl, {
                    timeout: 30000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });

                if (!response.ok) continue;

                const buffer = await response.arrayBuffer();
                const mediaBuffer = Buffer.from(buffer);

                // التحقق من التكرار باستخدام الهاش
                const hash = crypto.createHash('sha1').update(mediaBuffer).digest('hex');
                if (seenHashes.has(hash)) continue;
                seenHashes.add(hash);

                // إنشاء مجلد مؤقت
                const tmpDir = path.join(process.cwd(), 'tmp');
                if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

                // تحويل إلى ملصق
                const tempInput = path.join(tmpDir, `ig_${Date.now()}_${i}.${isVideo ? 'mp4' : 'jpg'}`);
                const tempOutput = path.join(tmpDir, `sticker_${Date.now()}_${i}.webp`);

                fs.writeFileSync(tempInput, mediaBuffer);

                let ffmpegCommand;
                if (isVideo) {
                    ffmpegCommand = `ffmpeg -y -i "${tempInput}" -t 3 -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000,fps=10" -c:v libwebp -preset default -loop 0 -pix_fmt yuva420p -quality 40 -compression_level 6 -b:v 200k "${tempOutput}"`;
                } else {
                    ffmpegCommand = `ffmpeg -y -i "${tempInput}" -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000" -c:v libwebp -preset default -loop 0 -pix_fmt yuva420p -quality 75 -compression_level 6 "${tempOutput}"`;
                }

                await new Promise((resolve, reject) => {
                    exec(ffmpegCommand, (error) => {
                        if (error) reject(error);
                        else resolve();
                    });
                });

                if (!fs.existsSync(tempOutput)) continue;

                let stickerBuffer = fs.readFileSync(tempOutput);

                // إضافة بيانات EXIF للملصق
                const img = new webp.Image();
                await img.load(stickerBuffer);
                
                const stickerData = {
                    'sticker-pack-id': crypto.randomBytes(32).toString('hex'),
                    'sticker-pack-name': 'Crimson Bot',
                    'emojis': ['📸']
                };
                
                const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
                const jsonBuffer = Buffer.from(JSON.stringify(stickerData), 'utf8');
                const exif = Buffer.concat([exifAttr, jsonBuffer]);
                exif.writeUIntLE(jsonBuffer.length, 14, 4);
                img.exif = exif;

                const finalSticker = await img.save(null);

                // إرسال الملصق
                await conn.sendMessage(m.chat, {
                    sticker: finalSticker
                }, { quoted: m });

                successCount++;

                // تنظيف الملفات المؤقتة
                try { fs.unlinkSync(tempInput); } catch {}
                try { fs.unlinkSync(tempOutput); } catch {}

                // تأخير بين الوسائط
                if (i < itemsToProcess.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }

            } catch (itemError) {
                console.error(`❌ Error processing media ${i + 1}:`, itemError);
                // الاستمرار مع الوسائط التالية
            }
        }

        // إرسال تقرير النتائج
        if (successCount > 0) {
            await conn.sendMessage(m.chat, {
                text: `╔═══════════════════════════╗
║  ✅ اكتمل التحويل       ║
╚═══════════════════════════╝

📊 النتائج:
├─ ✅ تم بنجاح: ${successCount}
├─ ❌ فشل: ${itemsToProcess.length - successCount}
├─ 📦 الإجمالي: ${itemsToProcess.length}
└─ 🎯 النوع: ${isCrop ? 'ملصق مقتطع' : 'ملصق عادي'}

━━━━━━━━━━━━━━━━━━━━━━━━
🤖 Crimson Bot | تحويل متقدم`,
                mentions: [sender]
            }, { quoted: m });
        } else {
            throw new Error('فشل في تحويل أي وسائط');
        }

    } catch (error) {
        console.error('❌ Error in igs command:', error);
        
        await conn.sendMessage(m.chat, {
            text: `╔═══════════════════════════╗
║  ❌ فشل التحويل         ║
╚═══════════════════════════╝

⚠️ فشل في تحويل الرابط إلى ملصق

💡 الأسباب المحتملة:
├─ الرابط غير مدعوم
├─ المنشور خاص
├─ مشكلة في الخادم
└─ حاول مرة أخرى

━━━━━━━━━━━━━━━━━━━━━━━━
🔄 جرب رابطاً آخر`,
            mentions: [sender]
        }, { quoted: m });
    }
};

handler.help = ['igs', 'igsc'];
handler.tags = ['download', 'media', 'sticker'];
handler.command = ['igs', 'igsc', 'انستا', 'انستغرام'];
handler.description = 'تحويل منشورات إنستغرام إلى ملصقات';
handler.usage = '.igs <رابط> | .igsc <رابط>';
handler.example = '.igs https://instagram.com/p/example';

handler.group = true;
handler.private = true;
handler.owner = false;
handler.admin = false;
handler.premium = false;
handler.botAdmin = false;

export default handler;
