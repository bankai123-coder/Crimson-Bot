import fs from 'fs';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const ANTICALL_PATH = path.join(__dirname, '../data/anticall.json');

function readState() {
    try {
        if (!fs.existsSync(ANTICALL_PATH)) return { enabled: false };
        const raw = fs.readFileSync(ANTICALL_PATH, 'utf8');
        const data = JSON.parse(raw || '{}');
        return { enabled: !!data.enabled };
    } catch {
        return { enabled: false };
    }
}

function writeState(enabled) {
    try {
        const dir = path.dirname(ANTICALL_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(ANTICALL_PATH, JSON.stringify({ enabled: !!enabled }, null, 2));
    } catch (error) {
        console.error('خطأ في حفظ إعدادات منع المكالمات:', error);
    }
}

let handler = async (m, { conn, args, text, isOwner }) => {
    if (!isOwner) {
        return await conn.reply(m.chat, '❌ هذا الأمر للمالك فقط!', m);
    }

    const state = readState();
    const action = args[0]?.toLowerCase();

    if (!action || !['on', 'off', 'status'].includes(action)) {
        return await conn.reply(m.chat, 
            `📞 *نظام منع المكالمات*\n\n` +
            `*الحالة الحالية:* ${state.enabled ? '✅ مفعل' : '❌ معطل'}\n\n` +
            `*الأوامر:*\n` +
            `• .anticall on - تفعيل منع المكالمات\n` +
            `• .anticall off - تعطيل منع المكالمات\n` +
            `• .anticall status - عرض الحالة`, m);
    }

    if (action === 'status') {
        await conn.reply(m.chat, 
            `📞 *حالة منع المكالمات*\n\n` +
            `النظام حالياً: *${state.enabled ? 'مفعل ✅' : 'معطل ❌'}*`, m);
        return;
    }

    const enable = action === 'on';
    writeState(enable);
    
    await conn.reply(m.chat, 
        `📞 *نظام منع المكالمات*\n\n` +
        `تم ${enable ? 'تفعيل' : 'تعطيل'} النظام بنجاح ✅\n\n` +
        `${enable ? 'سيتم رفض المكالمات تلقائياً' : 'سيتم استقبال المكالمات بشكل طبيعي'}`, m);
}

// دالة للتحقق من حالة منع المكالمات
export function isAnticallEnabled() {
    return readState().enabled;
}

// دالة لمعالجة المكالمات
export async function handleAnticall(sock, call) {
    try {
        if (!isAnticallEnabled()) return;

        if (call.status === 'offer') {
            await sock.rejectCall(call.id, call.from);
            console.log(`📞 تم رفض مكالمة من: ${call.from}`);
            
            // إرسال إشعار للمالك
            const ownerJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
            await sock.sendMessage(ownerJid, {
                text: `📞 *تم رفض مكالمة*\n\n` +
                      `*من:* ${call.from}\n` +
                      `*الوقت:* ${new Date().toLocaleString('ar-SA')}\n` +
                      `*الحالة:* مرفوض تلقائياً بواسطة نظام منع المكالمات`
            });
        }
    } catch (error) {
        console.error('خطأ في معالجة المكالمة:', error);
    }
}

handler.help = ['anticall']
handler.tags = ['owner']
handler.command = ['anticall', 'منع_مكالمات']
handler.description = 'نظام منع ورفض المكالمات تلقائياً'
handler.usage = '.anticall <on/off/status>'

// الصلاحيات - للمالك فقط
handler.group = false
handler.private = true
handler.owner = true
handler.admin = false
handler.premium = false

export default handler
