// ═══════════════════════════════════════════════════
// ECONOMY SYSTEM - نظام الاقتصاد المتقدم
// ═══════════════════════════════════════════════════

const jobs = [
    { name: 'مبرمج', minPay: 500, maxPay: 2000, cooldown: 3600 },
    { name: 'طبيب', minPay: 800, maxPay: 2500, cooldown: 3600 },
    { name: 'مهندس', minPay: 600, maxPay: 2200, cooldown: 3600 },
    { name: 'معلم', minPay: 400, maxPay: 1500, cooldown: 3600 },
    { name: 'تاجر', minPay: 300, maxPay: 3000, cooldown: 3600 }
]

const items = [
    { id: 'phone', name: '📱 هاتف', price: 5000, sellPrice: 2500 },
    { id: 'laptop', name: '💻 لابتوب', price: 15000, sellPrice: 7500 },
    { id: 'car', name: '🚗 سيارة', price: 50000, sellPrice: 25000 },
    { id: 'house', name: '🏠 منزل', price: 200000, sellPrice: 100000 },
    { id: 'gold', name: '💰 سبيكة ذهب', price: 10000, sellPrice: 9000 },
    { id: 'diamond', name: '💎 الماس', price: 25000, sellPrice: 22000 }
]

// ═══════════════════════════════════════════════════
// رصيد المستخدم
// ═══════════════════════════════════════════════════
async function balance(m, { db, sender, reply, args, mentionedJid }) {
    try {
        const target = mentionedJid?.[0] || sender
        const user = await db.getUser(target)

        if (!user) {
            return reply('❌ المستخدم غير موجود في قاعدة البيانات.')
        }

        const totalWealth = user.balance + user.bank
        const inventory = user.inventory || {}
        const inventoryValue = Object.entries(inventory).reduce((sum, [itemId, quantity]) => {
            const item = items.find(i => i.id === itemId)
            return sum + (item ? item.sellPrice * quantity : 0)
        }, 0)

        const netWorth = totalWealth + inventoryValue

        const text = `╔═══════════════════════════════╗
║   💰 حساب المستخدم 💰        ║
╚═══════════════════════════════╝

👤 *المستخدم:* ${user.name}
━━━━━━━━━━━━━━━━━━━━━━━━━

💵 *المحفظة:* ${user.balance.toLocaleString()} 💴
🏦 *البنك:* ${user.bank.toLocaleString()} 💴
📊 *الإجمالي:* ${totalWealth.toLocaleString()} 💴

━━━━━━━━━━━━━━━━━━━━━━━━━
📦 *قيمة المخزون:* ${inventoryValue.toLocaleString()} 💴
💎 *صافي الثروة:* ${netWorth.toLocaleString()} 💴
━━━━━━━━━━━━━━━━━━━━━━━━━

📈 *المستوى:* ${user.level}
⭐ *الخبرة:* ${user.exp}/${(user.level + 1) * 100}
🎯 *التصنيف:* #${await db.getUserRank(target)}`

        await reply(text)
    } catch (error) {
        console.error('Balance error:', error)
        await reply('❌ حدث خطأ أثناء عرض الرصيد.')
    }
}

// ═══════════════════════════════════════════════════
// المكافأة اليومية
// ═══════════════════════════════════════════════════
async function daily(m, { db, sender, reply }) {
    try {
        const user = await db.getUser(sender)
        const now = Date.now()
        const cooldown = 86400000 // 24 hours

        if (user.lastDaily && now - user.lastDaily < cooldown) {
            const remaining = cooldown - (now - user.lastDaily)
            const hours = Math.floor(remaining / 3600000)
            const minutes = Math.floor((remaining % 3600000) / 60000)

            return reply(`⏰ يمكنك المطالبة بالمكافأة اليومية بعد *${hours}* ساعة و *${minutes}* دقيقة.`)
        }

        const baseReward = 1000
        const streak = user.dailyStreak || 0
        const streakBonus = Math.min(streak * 100, 1000)
        const totalReward = baseReward + streakBonus

        await db.addMoney(sender, totalReward)
        await db.updateUser(sender, {
            lastDaily: now,
            dailyStreak: streak + 1
        })

        const text = `╔═══════════════════════════════╗
║   🎁 المكافأة اليومية 🎁     ║
╚═══════════════════════════════╝

✅ *تم استلام المكافأة بنجاح!*

💰 *المبلغ الأساسي:* ${baseReward.toLocaleString()} 💴
🔥 *مكافأة التسلسل:* ${streakBonus.toLocaleString()} 💴
━━━━━━━━━━━━━━━━━━━━━━━━━
💵 *الإجمالي:* ${totalReward.toLocaleString()} 💴

📊 *تسلسلك الحالي:* ${streak + 1} يوم 🔥
💼 *رصيدك الجديد:* ${user.balance + totalReward} 💴

🎯 *نصيحة:* استمر في المطالبة يومياً لزيادة المكافأة!`

        await reply(text)
    } catch (error) {
        console.error('Daily error:', error)
        await reply('❌ حدث خطأ أثناء المطالبة بالمكافأة.')
    }
}

// ═══════════════════════════════════════════════════
// العمل لكسب المال
// ═══════════════════════════════════════════════════
async function work(m, { db, sender, reply }) {
    try {
        const user = await db.getUser(sender)
        const now = Date.now()
        const cooldown = 3600000 // 1 hour

        if (user.lastWork && now - user.lastWork < cooldown) {
            const remaining = cooldown - (now - user.lastWork)
            const minutes = Math.floor(remaining / 60000)

            return reply(`⏰ أنت متعب! يمكنك العمل مرة أخرى بعد *${minutes}* دقيقة.`)
        }

        const job = jobs[Math.floor(Math.random() * jobs.length)]
        const earnings = Math.floor(Math.random() * (job.maxPay - job.minPay + 1)) + job.minPay
        const expGain = Math.floor(earnings / 10)

        await db.addMoney(sender, earnings)
        await db.addExp(sender, expGain)
        await db.updateUser(sender, { lastWork: now })

        const messages = [
            `عملت كـ *${job.name}* وكسبت`,
            `قمت بوظيفة *${job.name}* ونجحت في كسب`,
            `أنهيت عملك كـ *${job.name}* وحصلت على`,
            `تم توظيفك كـ *${job.name}* وربحت`
        ]

        const message = messages[Math.floor(Math.random() * messages.length)]

        const text = `╔═══════════════════════════════╗
║   💼 نتيجة العمل 💼          ║
╚═══════════════════════════════╝

${message}:

💰 *الأرباح:* ${earnings.toLocaleString()} 💴
⭐ *الخبرة:* +${expGain} XP

━━━━━━━━━━━━━━━━━━━━━━━━━
💼 *رصيدك الجديد:* ${user.balance + earnings} 💴
📊 *خبرتك:* ${user.exp + expGain}/${(user.level + 1) * 100}

⏰ *يمكنك العمل مرة أخرى بعد ساعة!*`

        await reply(text)
    } catch (error) {
        console.error('Work error:', error)
        await reply('❌ حدث خطأ أثناء العمل.')
    }
}

// ═══════════════════════════════════════════════════
// تحويل الأموال
// ═══════════════════════════════════════════════════
async function transfer(m, { db, sender, reply, args, mentionedJid }) {
    try {
        if (!mentionedJid || mentionedJid.length === 0) {
            return reply('❌ يرجى منشن الشخص الذي تريد التحويل له.\n*مثال:* .تحويل @user 1000')
        }

        const amount = parseInt(args[1])
        if (isNaN(amount) || amount <= 0) {
            return reply('❌ يرجى إدخال مبلغ صحيح.\n*مثال:* .تحويل @user 1000')
        }

        const target = mentionedJid[0]
        if (target === sender) {
            return reply('❌ لا يمكنك تحويل الأموال لنفسك!')
        }

        const user = await db.getUser(sender)
        if (user.balance < amount) {
            return reply(`❌ رصيدك غير كافٍ!\n💰 رصيدك الحالي: ${user.balance.toLocaleString()} 💴`)
        }

        const targetUser = await db.getUser(target)
        const fee = Math.floor(amount * 0.05) // 5% رسوم
        const finalAmount = amount - fee

        await db.addMoney(sender, -amount)
        await db.addMoney(target, finalAmount)

        const text = `╔═══════════════════════════════╗
║   💸 تحويل ناجح 💸          ║
╚═══════════════════════════════╝

✅ *تم التحويل بنجاح!*

👤 *من:* ${user.name}
👤 *إلى:* ${targetUser.name}

💰 *المبلغ المرسل:* ${amount.toLocaleString()} 💴
💳 *الرسوم:* ${fee.toLocaleString()} 💴 (5%)
━━━━━━━━━━━━━━━━━━━━━━━━━
💵 *المبلغ المستلم:* ${finalAmount.toLocaleString()} 💴

📊 *رصيدك الجديد:* ${user.balance - amount} 💴`

        await reply(text)
    } catch (error) {
        console.error('Transfer error:', error)
        await reply('❌ حدث خطأ أثناء التحويل.')
    }
}

// ═══════════════════════════════════════════════════
// المتجر
// ═══════════════════════════════════════════════════
async function shop(m, { reply }) {
    let text = `╔═══════════════════════════════╗
║   🏪 المتجر 🏪              ║
╚═══════════════════════════════╝

🛒 *قائمة العناصر المتاحة:*

━━━━━━━━━━━━━━━━━━━━━━━━━\n`

    items.forEach((item, index) => {
        text += `${index + 1}. ${item.name}
   💰 السعر: ${item.price.toLocaleString()} 💴
   💸 سعر البيع: ${item.sellPrice.toLocaleString()} 💴\n\n`
    })

    text += `━━━━━━━━━━━━━━━━━━━━━━━━━
📝 *للشراء:* .شراء [رقم العنصر]
📝 *للبيع:* .بيع [رقم العنصر]
📦 *للمخزون:* .مخزون`

    await reply(text)
}

// ═══════════════════════════════════════════════════
// شراء عنصر
// ═══════════════════════════════════════════════════
async function buy(m, { db, sender, reply, args }) {
    try {
        const itemIndex = parseInt(args[0]) - 1

        if (isNaN(itemIndex) || itemIndex < 0 || itemIndex >= items.length) {
            return reply('❌ رقم عنصر غير صحيح!\n*استخدم:* .متجر لعرض العناصر')
        }

        const item = items[itemIndex]
        const user = await db.getUser(sender)

        if (user.balance < item.price) {
            return reply(`❌ رصيدك غير كافٍ!\n💰 السعر: ${item.price.toLocaleString()} 💴\n💼 رصيدك: ${user.balance.toLocaleString()} 💴`)
        }

        await db.addMoney(sender, -item.price)
        await db.addToInventory(sender, item.id, 1)

        const text = `╔═══════════════════════════════╗
║   ✅ عملية شراء ناجحة ✅     ║
╚═══════════════════════════════╝

🛍️ *تم شراء:* ${item.name}
💰 *السعر:* ${item.price.toLocaleString()} 💴

━━━━━━━━━━━━━━━━━━━━━━━━━
💼 *رصيدك الجديد:* ${user.balance - item.price} 💴

📦 *استخدم .مخزون لعرض مشترياتك*`

        await reply(text)
    } catch (error) {
        console.error('Buy error:', error)
        await reply('❌ حدث خطأ أثناء الشراء.')
    }
}

// ═══════════════════════════════════════════════════
// بيع عنصر
// ═══════════════════════════════════════════════════
async function sell(m, { db, sender, reply, args }) {
    try {
        const itemIndex = parseInt(args[0]) - 1

        if (isNaN(itemIndex) || itemIndex < 0 || itemIndex >= items.length) {
            return reply('❌ رقم عنصر غير صحيح!')
        }

        const item = items[itemIndex]
        const user = await db.getUser(sender)
        const inventory = user.inventory || {}

        if (!inventory[item.id] || inventory[item.id] === 0) {
            return reply(`❌ ليس لديك ${item.name} للبيع!`)
        }

        await db.addMoney(sender, item.sellPrice)
        await db.addToInventory(sender, item.id, -1)

        const text = `╔═══════════════════════════════╗
║   💸 عملية بيع ناجحة 💸     ║
╚═══════════════════════════════╝

🏷️ *تم بيع:* ${item.name}
💰 *المبلغ:* ${item.sellPrice.toLocaleString()} 💴

━━━━━━━━━━━━━━━━━━━━━━━━━
💼 *رصيدك الجديد:* ${user.balance + item.sellPrice} 💴`

        await reply(text)
    } catch (error) {
        console.error('Sell error:', error)
        await reply('❌ حدث خطأ أثناء البيع.')
    }
}

// ═══════════════════════════════════════════════════
// المخزون
// ═══════════════════════════════════════════════════
async function inventory(m, { db, sender, reply }) {
    try {
        const user = await db.getUser(sender)
        const inventory = user.inventory || {}

        let text = `╔═══════════════════════════════╗
║   📦 المخزون 📦             ║
╚═══════════════════════════════╝

👤 *المستخدم:* ${user.name}
━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`

        const hasItems = Object.values(inventory).some(qty => qty > 0)

        if (!hasItems) {
            text += '❌ *مخزونك فارغ!*\n\n🛍️ استخدم .متجر للشراء'
        } else {
            items.forEach(item => {
                const quantity = inventory[item.id] || 0
                if (quantity > 0) {
                    text += `${item.name}\n📊 الكمية: ${quantity}\n💰 القيمة: ${(item.sellPrice * quantity).toLocaleString()} 💴\n\n`
                }
            })
        }

        await reply(text)
    } catch (error) {
        console.error('Inventory error:', error)
        await reply('❌ حدث خطأ أثناء عرض المخزون.')
    }
}

// ═══════════════════════════════════════════════════
// لوحة المتصدرين
// ═══════════════════════════════════════════════════
async function leaderboard(m, { db, reply }) {
    try {
        const topUsers = await db.getTopUsers(10)

        let text = `╔═══════════════════════════════╗
║   🏆 لوحة المتصدرين 🏆      ║
╚═══════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`

        topUsers.forEach((user, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`
            const totalWealth = user.balance + user.bank
            text += `${medal} *${user.name}*\n💰 ${totalWealth.toLocaleString()} 💴 | Lv.${user.level}\n\n`
        })

        text += `━━━━━━━━━━━━━━━━━━━━━━━━━
💪 استمر في العمل للوصول للقمة!`

        await reply(text)
    } catch (error) {
        console.error('Leaderboard error:', error)
        await reply('❌ حدث خطأ أثناء عرض المتصدرين.')
    }
}

// ═══════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════

balance.help = ['رصيد', 'balance']
balance.tags = ['economy']
balance.command = ['رصيد', 'balance', 'bal', 'فلوس']
balance.description = 'عرض رصيدك أو رصيد شخص آخر'

daily.help = ['يومي', 'daily']
daily.tags = ['economy']
daily.command = ['يومي', 'daily', 'يومية']
daily.description = 'الحصول على المكافأة اليومية'

work.help = ['عمل', 'work']
work.tags = ['economy']
work.command = ['عمل', 'work', 'شغل']
work.description = 'العمل لكسب المال'
work.cooldown = 60

transfer.help = ['تحويل', 'transfer']
transfer.tags = ['economy']
transfer.command = ['تحويل', 'transfer', 'tf']
transfer.description = 'تحويل الأموال لشخص آخر'
transfer.usage = '.تحويل @user [amount]'

shop.help = ['متجر', 'shop']
shop.tags = ['economy']
shop.command = ['متجر', 'shop', 'store']
shop.description = 'عرض المتجر'

buy.help = ['شراء', 'buy']
buy.tags = ['economy']
buy.command = ['شراء', 'buy']
buy.description = 'شراء عنصر من المتجر'
buy.usage = '.شراء [رقم العنصر]'
buy.args = true

sell.help = ['بيع', 'sell']
sell.tags = ['economy']
sell.command = ['بيع', 'sell']
sell.description = 'بيع عنصر من مخزونك'
sell.usage = '.بيع [رقم العنصر]'
sell.args = true

inventory.help = ['مخزون', 'inventory']
inventory.tags = ['economy']
inventory.command = ['مخزون', 'inventory', 'inv', 'حقيبة']
inventory.description = 'عرض مخزونك'

leaderboard.help = ['تصدر', 'leaderboard']
leaderboard.tags = ['economy']
leaderboard.command = ['تصدر', 'leaderboard', 'lb', 'top']
leaderboard.description = 'عرض أغنى اللاعبين'

export default balance
export { daily, work, transfer, shop, buy, sell, inventory, leaderboard }
