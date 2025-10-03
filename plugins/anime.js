import axios from 'axios';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import webp from 'node-webpmux';
import crypto from 'crypto';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __dirname = path.dirname(new URL(import.meta.url).pathname);

const ANIMU_BASE = 'https://api.some-random-api.com/animu';

function normalizeType(input) {
    const lower = (input || '').toLowerCase();
    if (lower === 'facepalm' || lower === 'face_palm') return 'face-palm';
    if (lower === 'quote' || lower === 'animu-quote' || lower === 'animuquote') return 'quote';
    return lower;
}

async function convertMediaToSticker(mediaBuffer, isAnimated) {
    const tmpDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

    const inputExt = isAnimated ? 'gif' : 'jpg';
    const input = path.join(tmpDir, `animu_${Date.now()}.${inputExt}`);
    const output = path.join(tmpDir, `animu_${Date.now()}.webp`);
    fs.writeFileSync(input, mediaBuffer);

    const ffmpegCmd = isAnimated 
        ? `ffmpeg -y -i "${input}" -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000,fps=15" -c:v libwebp -preset default -loop 0 -vsync 0 -pix_fmt yuva420p -quality 60 -compression_level 6 "${output}"`
        : `ffmpeg -y -i "${input}" -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000" -c:v libwebp -preset default -loop 0 -vsync 0 -pix_fmt yuva420p -quality 75 -compression_level 6 "${output}"`;

    await execAsync(ffmpegCmd);

    let webpBuffer = fs.readFileSync(output);

    // إضافة بيانات الملصق
    const img = new webp.Image();
    await img.load(webpBuffer);

    const json = {
        'sticker-pack-id': crypto.randomBytes(32).toString('hex'),
        'sticker-pack-name': 'أنيمي - Crimson Bot',
        'emojis': ['🎌']
    };
    const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
    const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
    const exif = Buffer.concat([exifAttr, jsonBuffer]);
    exif.writeUIntLE(jsonBuffer.length, 14, 4);
    img.exif = exif;

    const finalBuffer = await img.save(null);

    try { fs.unlinkSync(input); } catch {}
    try { fs.unlinkSync(output); } catch {}
    return finalBuffer;
}

async function sendAnimu(conn, m, type) {
    const endpoint = `${ANIMU_BASE}/${type}`;
    const res = await axios.get(endpoint);
    const data = res.data || {};

    if (data.link) {
        const link = data.link;
        const lower = link.toLowerCase();
        const isGifLink = lower.endsWith('.gif');
        const isImageLink = lower.match(/\.(jpg|jpeg|png|webp)$/);

        // تحويل الوسائط إلى ملصقات
        if (isGifLink || isImageLink) {
            try {
                const resp = await axios.get(link, {
                    responseType: 'arraybuffer',
                    timeout: 15000,
                    headers: { 'User-Agent': 'Mozilla/5.0' }
                });
                const mediaBuf = Buffer.from(resp.data);
                const stickerBuf = await convertMediaToSticker(mediaBuf, isGifLink);
                await conn.sendSticker(m.chat, stickerBuf, m);
                return;
            } catch (error) {
                console.error('خطأ في تحويل الوسائط:', error);
            }
        }

        // الاحتياطي: إرسال كصورة
        try {
            await conn.sendImage(m.chat, link, `🎌 *أنيمي ${type}*`, m);
            return;
        } catch {}
    }
    
    if (data.quote) {
        await conn.reply(m.chat, `💬 *اقتباس أنيمي*\n\n"${data.quote}"`, m);
        return;
    }

    await conn.reply(m.chat, '❌ فشل في جلب محتوى الأنيمي', m);
}

let handler = async (m, { conn, args, text }) => {
    const sub = normalizeType(args[0]);

    const supported = [
        'nom', 'poke', 'cry', 'kiss', 'pat', 'hug', 'wink', 'face-palm', 'quote'
    ];

    try {
        if (!sub) {
            const typesText = supported.map(t => `• ${t}`).join('\n');
            await conn.reply(m.chat, `🎌 *أوامر الأنيمي*\n\n*الاستخدام:* .anime <النوع>\n\n*الأنواع المتاحة:*\n${typesText}\n\n*مثال:* .anime hug`, m);
            return;
        }

        if (!supported.includes(sub)) {
            await conn.reply(m.chat, `❌ النوع غير مدعوم: ${sub}\n\nاستخدم أحد الأنواع المتاحة:\n${supported.join(', ')}`, m);
            return;
        }

        await conn.react(m.chat, '🎌', m);
        await sendAnimu(conn, m, sub);
    } catch (err) {
        console.error('خطأ في أمر الأنيمي:', err);
        await conn.reply(m.chat, '❌ حدث خطأ أثناء جلب محتوى الأنيمي', m);
    }
}

handler.help = ['anime']
handler.tags = ['fun']
handler.command = ['anime', 'أنيمي']
handler.description = 'محتوى أنيمي (صور، ملصقات، اقتباسات)'
handler.usage = '.anime <النوع>'
handler.example = '.anime hug'

// الصلاحيات - متاح للجميع
handler.group = true
handler.private = true
handler.owner = false
handler.admin = false
handler.premium = false

export default handler
