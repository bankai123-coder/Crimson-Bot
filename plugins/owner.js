// ═══════════════════════════════════════════════════
// OWNER COMMANDS - أوامر المالك
// ═══════════════════════════════════════════════════

import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'

const execAsync = promisify(exec)

// ═══════════════════════════════════════════════════
// تقييم كود JavaScript
// ═══════════════════════════════════════════════════
async function evaluate(m, { text, reply, bot, db, conn }) {
    if (!text) {
        return reply('❌ يرجى إدخال الكود!\n*مثال:* .eval return "Hello"')
    }

    try {
        const result = await eval(`(async () => { ${text} })()`)
        const output = typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result)

        await reply(`╔═══════════════════════════════╗
║   📊 نتيجة التقييم 📊        ║
╚═══════════════════════════════╝

*📝 الكود:*
\`\`\`javascript
${text}
\`\`\`

*✅ النتيجة:*
\`\`\`
${output}
\`\`\``)
    } catch (error) {
        await reply(`╔═══════════════════════════════╗
║   ❌ خطأ في التقييم ❌       ║
╚═══════════════════════════════╝

*📝 الكود:*
\`\`\`javascript
${text}
\`\`\`

*❌ الخطأ:*
\`\`\`
${error.message}
\`\`\``)
    }
}

// ═══════════════════════════════════════════════════
// تنفيذ أوامر Shell
// ═══════════════════════════════════════════════════
async function shell(m, { text, reply }) {
    if (!text) {
        return reply('❌ يرجى إدخال الأمر!\n*مثال:* .$ ls -la')
    }

    try {
        await reply('⏳ جاري التنفيذ...')
        
        const { stdout, stderr } = await execAsync(text)
        const output = stdout || stderr || 'تم التنفيذ بنجاح'

        await reply(`╔═══════════════════════════════╗
║   💻 Shell Output 💻         ║
╚═══════════════════════════════╝

*📝 الأمر:*
\`\`\`bash
${text}
\`\`\`

*✅ النتيجة:*
\`\`\`
${output}
\`\`\``)
    } catch (error) {
        await reply(`❌ خطأ في التنفيذ:
\`\`\`
${error.message}
\`\`\``)
    }
}

// ═══════════════════════════════════════════════════
// إعادة تشغيل البوت
// ═══════════════════════════════════════════════════
async function restart(m, { reply }) {
    await reply('🔄 جاري إعادة تشغيل البوت...')

    try {
        process.exit(0)
    } catch (error) {
        await reply('❌ فشلت إعادة التشغيل!')
    }
}

// ═══════════════════════════════════════════════════
// إيقاف البوت
// ═══════════════════════════════════════════════════
async function shutdown(m, { reply }) {
    await reply('⚠️ جاري إيقاف البوت...')

    setTimeout(() => {
        process.exit(1)
    }, 2000)
}

// ═══════════════════════════════════════════════════
// حظر مستخدم
// ═══════════════════════════════════════════════════
async function ban(m, { db, reply, mentionedJid, args }) {
    if (!mentionedJid || mentionedJid.length === 0) {
        return reply('❌ يرجى منشن المستخدم!\n*مثال:* .بان @user')
    }

    const target = mentionedJid[0]
    const reason = args.slice(1).join(' ') || 'بدون سبب'

    try {
        await db.banUser(target, reason)
        await reply(`✅ تم حظر المستخدم بنجاح!

👤 *المستخدم:* @${target.split('@')[0]}
📝 *السبب:* ${reason}`)
    } catch (error) {
        await reply('❌ حدث خطأ أثناء الحظر!')
    }
}

// ═══════════════════════════════════════════════════
// إلغاء حظر مستخدم
// ═══════════════════════════════════════════════════
async function unban(m, { db, reply, mentionedJid }) {
    if (!mentionedJid || mentionedJid.length === 0) {
        return reply('❌ يرجى منشن المستخدم!\n*مثال:* .فك-بان @user')
    }

    const target = mentionedJid[0]

    try {
        await db.unbanUser(target)
        await reply(`✅ تم إلغاء حظر المستخدم!

👤 *المستخدم:* @${target.split('@')[0]}`)
    } catch (error) {
        await reply('❌ حدث خطأ أثناء إلغاء الحظر!')
    }
}

// ═══════════════════════════════════════════════════
// إضافة مشترك مميز
// ═══════════════════════════════════════════════════
async function addPremium(m, { db, reply, mentionedJid, args }) {
    if (!mentionedJid || mentionedJid.length === 0) {
        return reply('❌ يرجى منشن المستخدم!\n*مثال:* .بريميوم @user 30')
    }

    const target = mentionedJid[0]
    const days = parseInt(args[1]) || 30

    try {
        const expireDate = Date.now() + (days * 86400000)
        await db.addPremiumUser(target, expireDate)

        await reply(`✅ تم إضافة المستخدم للمميزين!

👤 *المستخدم:* @${target.split('@')[0]}
⏰ *المدة:* ${days} يوم
📅 *تاريخ الانتهاء:* ${new Date(expireDate).toLocaleDateString('ar-EG')}`)
    } catch (error) {
        await reply('❌ حدث خطأ أثناء الإضافة!')
    }
}

// ═══════════════════════════════════════════════════
// إزالة مشترك مميز
// ═══════════════════════════════════════════════════
async function removePremium(m, { db, reply, mentionedJid }) {
    if (!mentionedJid || mentionedJid.length === 0) {
        return reply('❌ يرجى منشن المستخدم!\n*مثال:* .ازالة-بريميوم @user')
    }

    const target = mentionedJid[0]

    try {
        await db.removePremiumUser(target)
        await reply(`✅ تم إزالة المستخدم من المميزين!

👤 *المستخدم:* @${target.split('@')[0]}`)
    } catch (error) {
        await reply('❌ حدث خطأ أثناء الإزالة!')
    }
}

// ═══════════════════════════════════════════════════
// إرسال إعلان لجميع المجموعات
// ═══════════════════════════════════════════════════
async function broadcast(m, { text, reply, conn, bot }) {
    if (!text) {
        return reply('❌ يرجى كتابة الإعلان!\n*مثال:* .اعلان مرحباً بالجميع')
    }

    try {
        await reply('📢 جاري إرسال الإعلان...')

        const groups = Object.keys(await conn.groupFetchAllParticipating())
        let successCount = 0
        let failCount = 0

        for (const groupId of groups) {
            try {
                await conn.sendMessage(groupId, {
                    text: `╔═══════════════════════════════╗
║   📢 إعلان من الإدارة 📢    ║
╚═══════════════════════════════╝

${text}

━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ Crimson Bot Official`
                })
                successCount++
                await new Promise(resolve => setTimeout(resolve, 1000))
            } catch (error) {
                failCount++
            }
        }

        await reply(`✅ تم إرسال الإعلان!

📊 *الإحصائيات:*
✅ نجح: ${successCount} مجموعة
❌ فشل: ${failCount} مجموعة`)
    } catch (error) {
        await reply('❌ حدث خطأ أثناء الإرسال!')
    }
}

// ═══════════════════════════════════════════════════
// وضع الصيانة
// ═══════════════════════════════════════════════════
async function maintenance(m, { db, reply, args }) {
    const action = args[0]?.toLowerCase()

    if (action === 'on' || action === 'تفعيل') {
        await db.setMaintenanceMode(true)
        await reply('✅ تم تفعيل وضع الصيانة!\n⚠️ البوت متاح للمالك فقط.')
    } else if (action === 'off' || action === 'تعطيل') {
        await db.setMaintenanceMode(false)
        await reply('✅ تم تعطيل وضع الصيانة!\n🎉 البوت متاح للجميع الآن.')
    } else {
        const isActive = await db.isMaintenanceMode()
        await reply(`ℹ️ وضع الصيانة: ${isActive ? '🔴 مفعل' : '🟢 غير مفعل'}

*للتحكم:*
- .صيانة on - تفعيل
- .صيانة off - تعطيل`)
    }
}

// ═══════════════════════════════════════════════════
// إحصائيات البوت
// ═══════════════════════════════════════════════════
async function stats(m, { reply, bot, conn, handler }) {
    try {
        const groups = Object.keys(await conn.groupFetchAllParticipating())
        const uptime = process.uptime()
        const hours = Math.floor(uptime / 3600)
        const minutes = Math.floor((uptime % 3600) / 60)
        const seconds = Math.floor(uptime % 60)

        const memUsage = process.memoryUsage()
        const memUsed = (memUsage.heapUsed / 1024 / 1024).toFixed(2)
        const memTotal = (memUsage.heapTotal / 1024 / 1024).toFixed(2)

        const text = `╔═══════════════════════════════╗
║   📊 إحصائيات البوت 📊      ║
╚═══════════════════════════════╝

*⏰ مدة التشغيل:*
${hours} ساعة، ${minutes} دقيقة، ${seconds} ثانية

*📱 المجموعات:*
${groups.length} مجموعة

*🔌 الإضافات:*
📦 ${handler.getPluginCount()} إضافة محملة
⚡ ${handler.getCommandCount()} أمر متاح
📁 ${handler.getCategoryCount()} فئة

*💾 الذاكرة:*
استخدام: ${memUsed} MB
إجمالي: ${memTotal} MB

*🖥️ النظام:*
Platform: ${process.platform}
Node: ${process.version}
Arch: ${process.arch}

━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ Crimson Bot v3.0.0`

        await reply(text)
    } catch (error) {
        await reply('❌ حدث خطأ أثناء جلب الإحصائيات!')
    }
}

// ═══════════════════════════════════════════════════
// قائمة الإضافات
// ═══════════════════════════════════════════════════
async function pluginsList(m, { reply, handler }) {
    try {
        const plugins = handler.getPlugins()
        const categories = handler.getCategories()

        let text = `╔═══════════════════════════════╗
║   📦 قائمة الإضافات 📦      ║
╚═══════════════════════════════╝\n\n`

        for (const category of categories) {
            const categoryPlugins = handler.getPluginsByCategory(category)
            text += `📁 *${category.toUpperCase()}:*\n`
            
            for (const pluginName of categoryPlugins) {
                const plugin = handler.getPluginInfo(pluginName)
                const commands = Array.isArray(plugin.command) ? plugin.command : [plugin.command]
                text += `  • ${pluginName} (${commands.length})\n`
            }
            text += '\n'
        }

        text += `━━━━━━━━━━━━━━━━━━━━━━━━━
📊 *الإجمالي:* ${plugins.length} إضافة
⚡ *الأوامر:* ${handler.getCommandCount()} أمر`

        await reply(text)
    } catch (error) {
        await reply('❌ حدث خطأ أثناء جلب القائمة!')
    }
}

// ═══════════════════════════════════════════════════
// إعادة تحميل إضافة
// ═══════════════════════════════════════════════════
async function reloadPlugin(m, { reply, handler, args }) {
    if (!args[0]) {
        return reply('❌ يرجى تحديد اسم الإضافة!\n*مثال:* .reload economy')
    }

    const pluginName = args[0]

    try {
        await handler.reloadPlugin(pluginName)
        await reply(`✅ تم إعادة تحميل الإضافة: *${pluginName}*`)
    } catch (error) {
        await reply(`❌ فشل إعادة التحميل: ${error.message}`)
    }
}

// ═══════════════════════════════════════════════════
// إعادة تحميل جميع الإضافات
// ═══════════════════════════════════════════════════
async function reloadAll(m, { reply, handler }) {
    try {
        await reply('🔄 جاري إعادة تحميل جميع الإضافات...')
        await handler.reloadPlugins()
        await reply(`✅ تم إعادة تحميل ${handler.getPluginCount()} إضافة بنجاح!`)
    } catch (error) {
        await reply('❌ حدث خطأ أثناء إعادة التحميل!')
    }
}

// ═══════════════════════════════════════════════════
// تفعيل/تعطيل إضافة
// ═══════════════════════════════════════════════════
async function togglePlugin(m, { reply, handler, args }) {
    if (!args[0] || !args[1]) {
        return reply('❌ الاستخدام الصحيح:\n.plugin [اسم الإضافة] [on/off]\n*مثال:* .plugin economy on')
    }

    const pluginName = args[0]
    const action = args[1].toLowerCase()

    try {
        if (action === 'on') {
            await handler.enablePlugin(pluginName)
            await reply(`✅ تم تفعيل الإضافة: *${pluginName}*`)
        } else if (action === 'off') {
            await handler.disablePlugin(pluginName)
            await reply(`⚠️ تم تعطيل الإضافة: *${pluginName}*`)
        } else {
            await reply('❌ استخدم on أو off فقط!')
        }
    } catch (error) {
        await reply(`❌ خطأ: ${error.message}`)
    }
}

// ═══════════════════════════════════════════════════
// إضافة رصيد لمستخدم
// ═══════════════════════════════════════════════════
async function addMoney(m, { db, reply, mentionedJid, args }) {
    if (!mentionedJid || mentionedJid.length === 0) {
        return reply('❌ يرجى منشن المستخدم!\n*مثال:* .اضافة-فلوس @user 10000')
    }

    const target = mentionedJid[0]
    const amount = parseInt(args[1])

    if (isNaN(amount) || amount <= 0) {
        return reply('❌ يرجى إدخال مبلغ صحيح!')
    }

    try {
        await db.addMoney(target, amount)
        const user = await db.getUser(target)

        await reply(`✅ تم إضافة الرصيد بنجاح!

👤 *المستخدم:* @${target.split('@')[0]}
💰 *المبلغ المضاف:* ${amount.toLocaleString()} 💴
💼 *الرصيد الجديد:* ${user.balance.toLocaleString()} 💴`)
    } catch (error) {
        await reply('❌ حدث خطأ أثناء إضافة الرصيد!')
    }
}

// ═══════════════════════════════════════════════════
// خصم رصيد من مستخدم
// ═══════════════════════════════════════════════════
async function removeMoney(m, { db, reply, mentionedJid, args }) {
    if (!mentionedJid || mentionedJid.length === 0) {
        return reply('❌ يرجى منشن المستخدم!\n*مثال:* .خصم-فلوس @user 5000')
    }

    const target = mentionedJid[0]
    const amount = parseInt(args[1])

    if (isNaN(amount) || amount <= 0) {
        return reply('❌ يرجى إدخال مبلغ صحيح!')
    }

    try {
        await db.addMoney(target, -amount)
        const user = await db.getUser(target)

        await reply(`✅ تم خصم الرصيد بنجاح!

👤 *المستخدم:* @${target.split('@')[0]}
💰 *المبلغ المخصوم:* ${amount.toLocaleString()} 💴
💼 *الرصيد الجديد:* ${user.balance.toLocaleString()} 💴`)
    } catch (error) {
        await reply('❌ حدث خطأ أثناء خصم الرصيد!')
    }
}

// ═══════════════════════════════════════════════════
// الانضمام لمجموعة عبر رابط
// ═══════════════════════════════════════════════════
async function join(m, { text, reply, conn }) {
    if (!text || !text.includes('chat.whatsapp.com')) {
        return reply('❌ يرجى إدخال رابط المجموعة!\n*مثال:* .join https://chat.whatsapp.com/...')
    }

    try {
        const code = text.split('chat.whatsapp.com/')[1]
        
        await conn.groupAcceptInvite(code)
        await reply('✅ تم الانضمام للمجموعة بنجاح!')
    } catch (error) {
        await reply('❌ فشل الانضمام! قد يكون الرابط منتهي أو غير صالح.')
    }
}

// ═══════════════════════════════════════════════════
// مغادرة مجموعة
// ═══════════════════════════════════════════════════
async function leave(m, { reply, conn, from, isGroup }) {
    if (!isGroup) {
        return reply('❌ هذا الأمر للمجموعات فقط!')
    }

    try {
        await reply('👋 وداعاً! شكراً لاستخدام Crimson Bot.')
        
        setTimeout(async () => {
            await conn.groupLeave(from)
        }, 3000)
    } catch (error) {
        await reply('❌ حدث خطأ أثناء المغادرة!')
    }
}

// ═══════════════════════════════════════════════════
// تنظيف قاعدة البيانات
// ═══════════════════════════════════════════════════
async function cleanDB(m, { db, reply }) {
    try {
        await reply('🧹 جاري تنظيف قاعدة البيانات...')

        const result = await db.cleanInactiveUsers(90) // حذف المستخدمين غير النشطين لمدة 90 يوم

        await reply(`✅ تم التنظيف بنجاح!

🗑️ *تم حذف:* ${result.deleted} مستخدم
📊 *المتبقي:* ${result.remaining} مستخدم`)
    } catch (error) {
        await reply('❌ حدث خطأ أثناء التنظيف!')
    }
}

// ═══════════════════════════════════════════════════
// نسخ احتياطي لقاعدة البيانات
// ═══════════════════════════════════════════════════
async function backup(m, { db, reply, conn, from }) {
    try {
        await reply('💾 جاري إنشاء نسخة احتياطية...')

        const backupData = await db.createBackup()
        const backupFile = `backup_${Date.now()}.json`

        fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2))

        await conn.sendMessage(from, {
            document: fs.readFileSync(backupFile),
            mimetype: 'application/json',
            fileName: backupFile
        })

        fs.unlinkSync(backupFile)

        await reply('✅ تم إنشاء النسخة الاحتياطية بنجاح!')
    } catch (error) {
        await reply('❌ حدث خطأ أثناء إنشاء النسخة الاحتياطية!')
    }
}

// ═══════════════════════════════════════════════════
// عرض السجل
// ═══════════════════════════════════════════════════
async function logs(m, { reply, args }) {
    try {
        const lines = parseInt(args[0]) || 50

        const logContent = await execAsync(`tail -n ${lines} logs/bot.log`)
        
        await reply(`╔═══════════════════════════════╗
║   📋 سجل البوت 📋           ║
╚═══════════════════════════════╝

\`\`\`
${logContent.stdout}
\`\`\``)
    } catch (error) {
        await reply('❌ حدث خطأ أثناء قراءة السجل!')
    }
}

// ═══════════════════════════════════════════════════
// إرسال رسالة لمستخدم
// ═══════════════════════════════════════════════════
async function sendTo(m, { conn, reply, args }) {
    if (args.length < 2) {
        return reply('❌ الاستخدام:\n.sendto [الرقم] [الرسالة]\n*مثال:* .sendto 1234567890 مرحبا')
    }

    const number = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net'
    const message = args.slice(1).join(' ')

    try {
        await conn.sendMessage(number, { text: message })
        await reply('✅ تم إرسال الرسالة بنجاح!')
    } catch (error) {
        await reply('❌ فشل الإرسال!')
    }
}

// ═══════════════════════════════════════════════════
// قائمة المحظورين
// ═══════════════════════════════════════════════════
async function bannedList(m, { db, reply }) {
    try {
        const banned = await db.getBannedUsers()

        if (banned.length === 0) {
            return reply('✅ لا يوجد مستخدمين محظورين!')
        }

        let text = `╔═══════════════════════════════╗
║   🚫 قائمة المحظورين 🚫     ║
╚═══════════════════════════════╝\n\n`

        banned.forEach((user, index) => {
            text += `${index + 1}. @${user.jid.split('@')[0]}\n`
            text += `   📝 السبب: ${user.reason}\n`
            text += `   📅 التاريخ: ${new Date(user.date).toLocaleDateString('ar-EG')}\n\n`
        })

        await reply(text)
    } catch (error) {
        await reply('❌ حدث خطأ أثناء جلب القائمة!')
    }
}

// ═══════════════════════════════════════════════════
// قائمة المميزين
// ═══════════════════════════════════════════════════
async function premiumList(m, { db, reply }) {
    try {
        const premium = await db.getPremiumUsers()

        if (premium.length === 0) {
            return reply('✅ لا يوجد مشتركين مميزين!')
        }

        let text = `╔═══════════════════════════════╗
║   💎 قائمة المميزين 💎      ║
╚═══════════════════════════════╝\n\n`

        premium.forEach((user, index) => {
            const daysLeft = Math.floor((user.expireDate - Date.now()) / 86400000)
            text += `${index + 1}. @${user.jid.split('@')[0]}\n`
            text += `   ⏰ المتبقي: ${daysLeft} يوم\n`
            text += `   📅 الانتهاء: ${new Date(user.expireDate).toLocaleDateString('ar-EG')}\n\n`
        })

        await reply(text)
    } catch (error) {
        await reply('❌ حدث خطأ أثناء جلب القائمة!')
    }
}

// ═══════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════

evaluate.help = ['eval']
evaluate.tags = ['owner']
evaluate.command = ['eval', '=>']
evaluate.description = 'تقييم كود JavaScript'
evaluate.owner = true

shell.help = ['}, 'exec']
shell.tags = ['owner']
shell.command = ['}, 'exec', 'shell']
shell.description = 'تنفيذ أوامر Shell'
shell.owner = true

restart.help = ['restart']
restart.tags = ['owner']
restart.command = ['restart', 'reboot', 'اعادة-تشغيل']
restart.description = 'إعادة تشغيل البوت'
restart.owner = true

shutdown.help = ['shutdown']
shutdown.tags = ['owner']
shutdown.command = ['shutdown', 'ايقاف']
shutdown.description = 'إيقاف البوت'
shutdown.owner = true

ban.help = ['ban']
ban.tags = ['owner']
ban.command = ['ban', 'بان', 'حظر']
ban.description = 'حظر مستخدم'
ban.owner = true

unban.help = ['unban']
unban.tags = ['owner']
unban.command = ['unban', 'فك-بان', 'فك-حظر']
unban.description = 'إلغاء حظر مستخدم'
unban.owner = true

addPremium.help = ['addprem']
addPremium.tags = ['owner']
addPremium.command = ['addprem', 'بريميوم', 'اضافة-بريميوم']
addPremium.description = 'إضافة مشترك مميز'
addPremium.owner = true

removePremium.help = ['delprem']
removePremium.tags = ['owner']
removePremium.command = ['delprem', 'ازالة-بريميوم']
removePremium.description = 'إزالة مشترك مميز'
removePremium.owner = true

broadcast.help = ['bc']
broadcast.tags = ['owner']
broadcast.command = ['bc', 'broadcast', 'اعلان']
broadcast.description = 'إرسال إعلان'
broadcast.owner = true
broadcast.args = true

maintenance.help = ['maintenance']
maintenance.tags = ['owner']
maintenance.command = ['maintenance', 'صيانة']
maintenance.description = 'وضع الصيانة'
maintenance.owner = true

stats.help = ['stats']
stats.tags = ['owner']
stats.command = ['stats', 'status', 'احصائيات']
stats.description = 'إحصائيات البوت'
stats.owner = true

pluginsList.help = ['plugins']
pluginsList.tags = ['owner']
pluginsList.command = ['plugins', 'listplugins', 'الاضافات']
pluginsList.description = 'قائمة الإضافات'
pluginsList.owner = true

reloadPlugin.help = ['reload']
reloadPlugin.tags = ['owner']
reloadPlugin.command = ['reload', 'اعادة-تحميل']
reloadPlugin.description = 'إعادة تحميل إضافة'
reloadPlugin.owner = true

reloadAll.help = ['reloadall']
reloadAll.tags = ['owner']
reloadAll.command = ['reloadall', 'اعادة-تحميل-الكل']
reloadAll.description = 'إعادة تحميل جميع الإضافات'
reloadAll.owner = true

togglePlugin.help = ['plugin']
togglePlugin.tags = ['owner']
togglePlugin.command = ['plugin', 'اضافة']
togglePlugin.description = 'تفعيل/تعطيل إضافة'
togglePlugin.owner = true

addMoney.help = ['addmoney']
addMoney.tags = ['owner']
addMoney.command = ['addmoney', 'اضافة-فلوس']
addMoney.description = 'إضافة رصيد لمستخدم'
addMoney.owner = true

removeMoney.help = ['removemoney']
removeMoney.tags = ['owner']
removeMoney.command = ['removemoney', 'خصم-فلوس']
removeMoney.description = 'خصم رصيد من مستخدم'
removeMoney.owner = true

join.help = ['join']
join.tags = ['owner']
join.command = ['join', 'انضم']
join.description = 'الانضمام لمجموعة'
join.owner = true

leave.help = ['leave']
leave.tags = ['owner']
leave.command = ['leave', 'غادر']
leave.description = 'مغادرة المجموعة'
leave.owner = true
leave.group = true

cleanDB.help = ['cleandb']
cleanDB.tags = ['owner']
cleanDB.command = ['cleandb', 'تنظيف']
cleanDB.description = 'تنظيف قاعدة البيانات'
cleanDB.owner = true

backup.help = ['backup']
backup.tags = ['owner']
backup.command = ['backup', 'نسخ-احتياطي']
backup.description = 'نسخ احتياطي للبيانات'
backup.owner = true

logs.help = ['logs']
logs.tags = ['owner']
logs.command = ['logs', 'log', 'سجل']
logs.description = 'عرض السجل'
logs.owner = true

sendTo.help = ['sendto']
sendTo.tags = ['owner']
sendTo.command = ['sendto', 'ارسل-لـ']
sendTo.description = 'إرسال رسالة لمستخدم'
sendTo.owner = true

bannedList.help = ['banlist']
bannedList.tags = ['owner']
bannedList.command = ['banlist', 'المحظورين']
bannedList.description = 'قائمة المحظورين'
bannedList.owner = true

premiumList.help = ['premlist']
premiumList.tags = ['owner']
premiumList.command = ['premlist', 'المميزين']
premiumList.description = 'قائمة المميزين'
premiumList.owner = true

export default evaluate
export { shell, restart, shutdown, ban, unban, addPremium, removePremium, broadcast, maintenance, stats, pluginsList, reloadPlugin, reloadAll, togglePlugin, addMoney, removeMoney, join, leave, cleanDB, backup, logs, sendTo, bannedList, premiumList }}
