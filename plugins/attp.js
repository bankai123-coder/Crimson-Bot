import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { writeExifVid } from '../lib/exif.js';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

let handler = async (m, { conn, args, text }) => {
    if (!text) {
        return await conn.reply(m.chat, 
            `🎭 *صنع ملصق نصي متحرك*\n\n` +
            `*الاستخدام:* .attp <النص>\n\n` +
            `*مثال:*\n` +
            `.attp مرحباً\n` +
            `.attp Hello World\n\n` +
            `*ملاحظة:* النص يجب أن يكون باللغة الإنجليزية`, m);
    }

    try {
        await conn.react(m.chat, '⏳', m);
        
        const mp4Buffer = await renderBlinkingVideoWithFfmpeg(text);
        const webpPath = await writeExifVid(mp4Buffer, { packname: 'Crimson Bot', author: 'Crimson Team' });
        const webpBuffer = fs.readFileSync(webpPath);
        
        // تنظيف الملفات المؤقتة
        try { fs.unlinkSync(webpPath); } catch (_) {}
        
        await conn.sendSticker(m.chat, webpBuffer, m);
        await conn.react(m.chat, '✅', m);
        
    } catch (error) {
        console.error('خطأ في إنشاء الملصق:', error);
        await conn.reply(m.chat, '❌ فشل في إنشاء الملصق. تأكد من تثبيت FFmpeg', m);
        await conn.react(m.chat, '❌', m);
    }
}

function renderBlinkingVideoWithFfmpeg(text) {
    return new Promise((resolve, reject) => {
        const fontPath = process.platform === 'win32'
            ? 'C:/Windows/Fonts/arialbd.ttf'
            : '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';

        // تهريب النص لـ ffmpeg
        const escapeDrawtextText = (s) => s
            .replace(/\\/g, '\\\\')
            .replace(/:/g, '\\:')
            .replace(/,/g, '\\,')
            .replace(/'/g, "\\'")
            .replace(/\[/g, '\\[')
            .replace(/\]/g, '\\]')
            .replace(/%/g, '\\%');

        const safeText = escapeDrawtextText(text);
        const safeFontPath = process.platform === 'win32'
            ? fontPath.replace(/\\/g, '/').replace(':', '\\:')
            : fontPath;

        // دورة التلون (بالثواني) وتأثير سريع ~0.1 ثانية لكل لون
        const cycle = 0.3;
        const dur = 1.8; // 6 دورات

        const drawRed = `drawtext=fontfile='${safeFontPath}':text='${safeText}':fontcolor=red:borderw=2:bordercolor=black@0.6:fontsize=56:x=(w-text_w)/2:y=(h-text_h)/2:enable='lt(mod(t\\,${cycle})\\,0.1)'`;
        const drawBlue = `drawtext=fontfile='${safeFontPath}':text='${safeText}':fontcolor=blue:borderw=2:bordercolor=black@0.6:fontsize=56:x=(w-text_w)/2:y=(h-text_h)/2:enable='between(mod(t\\,${cycle})\\,0.1\\,0.2)'`;
        const drawGreen = `drawtext=fontfile='${safeFontPath}':text='${safeText}':fontcolor=green:borderw=2:bordercolor=black@0.6:fontsize=56:x=(w-text_w)/2:y=(h-text_h)/2:enable='gte(mod(t\\,${cycle})\\,0.2)'`;

        const filter = `${drawRed},${drawBlue},${drawGreen}`;

        const args = [
            '-y',
            '-f', 'lavfi',
            '-i', `color=c=black:s=512x512:d=${dur}:r=20`,
            '-vf', filter,
            '-c:v', 'libx264',
            '-pix_fmt', 'yuv420p',
            '-movflags', '+faststart+frag_keyframe+empty_moov',
            '-t', String(dur),
            '-f', 'mp4',
            'pipe:1'
        ];

        const ff = spawn('ffmpeg', args);
        const chunks = [];
        const errors = [];
        ff.stdout.on('data', d => chunks.push(d));
        ff.stderr.on('data', e => errors.push(e));
        ff.on('error', reject);
        ff.on('close', code => {
            if (code === 0) return resolve(Buffer.concat(chunks));
            reject(new Error(Buffer.concat(errors).toString() || `ffmpeg خرج بالكود ${code}`));
        });
    });
}

handler.help = ['attp']
handler.tags = ['sticker', 'tools']
handler.command = ['attp', 'ملصق_نصي']
handler.description = 'صنع ملصقات نصية متحركة ملونة'
handler.usage = '.attp <النص>'
handler.example = '.attp Hello'

// الصلاحيات - متاح للجميع
handler.group = true
handler.private = true
handler.owner = false
handler.admin = false
handler.premium = false

export default handler
