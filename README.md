# 🤖 Crimson Bot - Advanced WhatsApp Bot

<div align="center">

![Version](https://img.shields.io/badge/version-3.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)
![License](https://img.shields.io/badge/license-MIT-orange.svg)

**بوت واتساب متقدم مع نظام اضافات ديناميكي وقاعدة بيانات JSON**

[المميزات](#-المميزات) • [التثبيت](#-التثبيت) • [الاستخدام](#-الاستخدام) • [الإضافات](#-نظام-الإضافات)

</div>

---

## 📋 المميزات

### ⚡ الميزات الرئيسية

- ✅ **Multi-Device Support** - دعم الأجهزة المتعددة
- 🔄 **Hot Reload** - تحميل الإضافات تلقائياً دون إعادة تشغيل
- 💾 **JSON Database** - قاعدة بيانات JSON سريعة وآمنة
- 🔌 **Plugin System** - نظام إضافات قوي وسهل الاستخدام
- 🛡️ **Anti-Spam** - حماية من السبام
- 👥 **Group Management** - إدارة كاملة للمجموعات
- 💰 **Economy System** - نظام اقتصادي متكامل
- 📊 **Level System** - نظام مستويات و XP
- 🎮 **Games** - ألعاب متنوعة
- 🤖 **AI Integration** - دعم الذكاء الاصطناعي
- 📥 **Downloaders** - تحميل من منصات متعددة
- 🎨 **Media Tools** - أدوات معالجة الوسائط
- 📝 **Custom Commands** - أوامر مخصصة
- 🔐 **Permissions System** - نظام صلاحيات متقدم
- ⚙️ **Highly Configurable** - قابل للتخصيص بالكامل
- 📱 **Termux Compatible** - يعمل على Termux بدون مشاكل

### 🎯 ميزات متقدمة

- **Auto-Restart**: إعادة تشغيل تلقائية عند الأخطاء
- **Auto-Backup**: نسخ احتياطي تلقائي للبيانات
- **Performance Monitoring**: مراقبة الأداء
- **Error Handling**: معالجة متقدمة للأخطاء
- **Cooldown System**: نظام انتظار للأوامر
- **Blacklist**: قائمة حظر للمستخدمين والمجموعات
- **Premium System**: نظام المشتركين المميزين
- **Marriage System**: نظام الزواج
- **Clan System**: نظام العشائر
- **Achievement System**: نظام الإنجازات
- **Inventory System**: نظام المخزون
- **Shop System**: نظام المتجر
- **Reminder System**: نظام التذكيرات
- **Poll System**: نظام التصويت
- **Notes System**: نظام الملاحظات

---

## 🚀 التثبيت

### المتطلبات

- Node.js v18 أو أحدث
- Git
- FFmpeg (اختياري للوسائط)

### التثبيت على Termux

```bash
# تحديث الحزم
pkg update && pkg upgrade -y

# تثبيت المتطلبات
pkg install git nodejs ffmpeg libwebp imagemagick -y

# استنساخ المشروع
git clone https://github.com/crimson-bot/crimson
cd crimson

# تثبيت الحزم
npm install

# تشغيل البوت
npm start
```

### التثبيت على Linux/Ubuntu

```bash
# تحديث النظام
sudo apt update && sudo apt upgrade -y

# تثبيت Node.js و npm
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# تثبيت المتطلبات الإضافية
sudo apt install -y git ffmpeg libwebp-dev imagemagick

# استنساخ المشروع
git clone https://github.com/crimson-bot/crimson
cd crimson

# تثبيت الحزم
npm install

# تشغيل البوت
npm start
```

### التثبيت على Windows

```bash
# تثبيت Node.js من الموقع الرسمي
# https://nodejs.org/

# استنساخ المشروع
git clone https://github.com/crimson-bot/crimson
cd crimson

# تثبيت الحزم
npm install

# تشغيل البوت
npm start
```

---

## ⚙️ الإعدادات

### تعديل ملف config.js

افتح ملف `config.js` وقم بتعديل الإعدادات التالية:

```javascript
export default {
    botName: 'Crimson',              // اسم البوت
    botNumber: '22234001933',        // رقم البوت
    ownerNumber: '22232157828',      // رقم المالك
    prefix: '.',                      // البريفيكس
    timezone: 'Africa/Nouakchott',   // المنطقة الزمنية
    // ... باقي الإعدادات
}
```

### إعدادات مهمة

| الإعداد | الوصف | القيمة الافتراضية |
|--------|-------|-------------------|
| `prefix` | البريفيكس المستخدم للأوامر | `.` |
| `autoRead` | قراءة الرسائل تلقائياً | `true` |
| `autoTyping` | إظهار حالة الكتابة | `true` |
| `antiCall` | رفض المكالمات تلقائياً | `true` |
| `antiSpam` | الحماية من السبام | `true` |
| `autoRestart` | إعادة التشغيل التلقائية | `true` |

---

## 📖 الاستخدام

### تشغيل البوت

```bash
# التشغيل العادي
npm start

# التشغيل مع nodemon (للتطوير)
npm run dev

# التشغيل في الخلفية (Termux)
nohup npm start &

# التشغيل مع screen
screen -S crimson
npm start
# اضغط Ctrl+A ثم D للخروج
```

### إعادة الاتصال بالشاشة

```bash
screen -r crimson
```

### إيقاف البوت

```bash
# إيقاف عادي
Ctrl + C

# إيقاف في الخلفية
pkill -f "node Index.js"
```

---

## 🔌 نظام الإضافات

### بنية الإضافة

يجب أن تكون كل إضافة في ملف `.js` داخل مجلد `plugins`:

```javascript
let handler = async (m, { conn, args, text, isOwner, isAdmin }) => {
    // كود الأمر هنا
    await conn.sendMessage(m.key.remoteJid, { 
        text: 'مرحباً!' 
    })
}

// معلومات الإضافة
handler.help = ['test']           // المساعدة
handler.tags = ['main']           // التصنيف
handler.command = ['test', 'تجربة'] // الأوامر
handler.description = 'أمر تجريبي' // الوصف
handler.usage = '.test'           // طريقة الاستخدام
handler.example = '.test مرحبا'   // مثال

// الصلاحيات
handler.owner = false             // للمالك فقط
handler.admin = false             // لمشرفي المجموعة
handler.group = false             // للمجموعات فقط
handler.private = false           // للخاص فقط
handler.botAdmin = false          // البوت يجب أن يكون مشرف
handler.premium = false           // للمشتركين المميزين
handler.cooldown = 5              // وقت الانتظار بالثواني

export default handler
```

### Context متاح في الإضافات

```javascript
{
    conn,           // اتصال البوت
    bot,            // نسخة البوت
    db,             // قاعدة البيانات
    handler,        // Handler
    config,         // الإعدادات
    command,        // الأمر المستخدم
    prefix,         // البريفيكس
    args,           // المعطيات
    text,           // النص الكامل
    body,           // محتوى الرسالة
    from,           // من أين جاءت الرسالة
    sender,         // المرسل
    pushName,       // اسم المرسل
    isGroup,        // هل مجموعة؟
    isOwner,        // هل المالك؟
    isAdmin,        // هل مشرف؟
    isBotAdmin,     // هل البوت مشرف؟
    quoted,         // الرسالة المقتبسة
    reply,          // دالة الرد
    send,           // دالة الإرسال
    react,          // دالة التفاعل
    delete,         // دالة الحذف
    download        // دالة التحميل
}
```

### أمثلة على الإضافات

#### إضافة بسيطة

```javascript
// plugins/ping.js
let handler = async (m, { conn }) => {
    const start = Date.now()
    await conn.sendMessage(m.key.remoteJid, { text: '🏓 Pong!' })
    const end = Date.now()
    const ping = end - start
    await conn.sendMessage(m.key.remoteJid, { 
        text: `⚡ السرعة: ${ping}ms` 
    })
}

handler.command = ['ping']
handler.tags = ['info']

export default handler
```

#### إضافة متقدمة

```javascript
// plugins/bank.js
let handler = async (m, { conn, db, args, sender }) => {
    const subCommand = args[0]?.toLowerCase()
    
    if (!subCommand) {
        const balance = db.getBalance(sender)
        return conn.sendMessage(m.key.remoteJid, { 
            text: `💰 رصيدك: ${balance.balance}\n🏦 البنك: ${balance.bank}` 
        })
    }
    
    if (subCommand === 'deposit') {
        const amount = parseInt(args[1])
        if (!amount || amount <= 0) {
            return conn.sendMessage(m.key.remoteJid, { 
                text: '❌ أدخل مبلغاً صحيحاً' 
            })
        }
        
        const result = db.depositToBank(sender, amount)
        if (result) {
            return conn.sendMessage(m.key.remoteJid, { 
                text: `✅ تم إيداع ${amount}💎 في البنك` 
            })
        } else {
            return conn.sendMessage(m.key.remoteJid, { 
                text: '❌ رصيد غير كافٍ' 
            })
        }
    }
}

handler.command = ['bank', 'بنك']
handler.tags = ['economy']
handler.usage = '.bank [deposit/withdraw] [amount]'

export default handler
```

---

## 🎮 الأوامر المتوفرة

### 🏠 الأوامر الرئيسية

- `.menu` - عرض القائمة
- `.help` - المساعدة
- `.ping` - قياس السرعة
- `.info` - معلومات البوت
- `.runtime` - مدة التشغيل
- `.owner` - معلومات المالك

### 👥 أوامر المجموعات

- `.kick @user` - طرد عضو
- `.add` - إضافة عضو
- `.promote @user` - ترقية لمشرف
- `.demote @user` - خفض رتبة
- `.group [open/close]` - فتح/إغلاق المجموعة
- `.delete` - حذف رسالة
- `.tagall` - منشن للجميع
- `.hidetag` - منشن خفي

### 👑 أوامر المالك

- `.broadcast` - إذاعة رسالة
- `.join` - الانضمام لمجموعة
- `.leave` - مغادرة مجموعة
- `.ban @user` - حظر مستخدم
- `.unban @user` - فك حظر
- `.restart` - إعادة تشغيل البوت
- `.update` - تحديث البوت

### 💰 الاقتصاد

- `.daily` - المكافأة اليومية
- `.work` - العمل
- `.balance` - رصيدك
- `.transfer @user amount` - تحويل أموال
- `.bank` - البنك
- `.shop` - المتجر
- `.buy` - شراء
- `.inventory` - المخزون

### 🎮 الألعاب

- `.slot` - ماكينة الحظ
- `.gamble amount` - مقامرة
- `.rps` - حجر ورقة مقص
- `.tictactoe @user` - X-O
- `.math` - رياضيات

### 📥 التحميل

- `.ytmp3 url` - تحميل صوت من YouTube
- `.ytmp4 url` - تحميل فيديو من YouTube
- `.tiktok url` - تحميل من TikTok
- `.instagram url` - تحميل من Instagram
- `.facebook url` - تحميل من Facebook

### 🔍 البحث

- `.google query` - بحث Google
- `.image query` - بحث صور
- `.ytsearch query` - بحث YouTube
- `.wiki query` - ويكيبيديا

### 🎨 الوسائط

- `.sticker` - تحويل لملصق
- `.toimg` - تحويل لصورة
- `.removebg` - إزالة الخلفية
- `.emojimix emoji1+emoji2` - دمج إيموجي

### 🤖 الذكاء الاصطناعي

- `.ai question` - ChatGPT
- `.gemini question` - Google Gemini
- `.imagine prompt` - توليد صور

---

## 📊 قاعدة البيانات

### استخدام قاعدة البيانات

```javascript
// الحصول على بيانات مستخدم
const user = db.getUser(userId)

// تحديث بيانات مستخدم
db.updateUser(userId, { balance: 5000 })

// إضافة أموال
db.addMoney(userId, 100)

// إضافة XP
db.addXP(userId, 50)

// تسجيل مستخدم
db.registerUser(userId, 'محمد')

// حفظ البيانات
await db.saveData()
```

### بنية البيانات

```javascript
// المستخدم
{
    id: 'userId',
    name: 'الاسم',
    registered: true,
    balance: 1000,
    level: 5,
    xp: 250,
    inventory: [],
    achievements: []
}

// المجموعة
{
    id: 'groupId',
    name: 'اسم المجموعة',
    welcome: true,
    antiLink: false,
    members: [],
    admins: []
}
```

---

## 🛠️ استكشاف الأخطاء

### المشاكل الشائعة

#### خطأ في الاتصال

```bash
# حذف ملفات المصادقة
rm -rf auth

# إعادة التشغيل
npm start
```

#### خطأ في الحزم

```bash
# حذف node_modules
rm -rf node_modules package-lock.json

# إعادة التثبيت
npm install
```

#### البوت لا يستجيب

- تأكد من أن الرقم غير محظور
- تحقق من الإنترنت
- راجع ملف الإعدادات

---

## 📝 المساهمة

نرحب بجميع المساهمات! يمكنك:

1. Fork المشروع
2. إنشاء فرع جديد (`git checkout -b feature/AmazingFeature`)
3. Commit التغييرات (`git commit -m 'Add some AmazingFeature'`)
4. Push للفرع (`git push origin feature/AmazingFeature`)
5. فتح Pull Request

---

## 📄 الترخيص

هذا المشروع مرخص تحت رخصة MIT - انظر ملف [LICENSE](LICENSE) للتفاصيل.

---

## 💖 الدعم

إذا أعجبك المشروع، يمكنك دعمنا:

- ⭐ إضافة نجمة للمشروع
- 🐛 الإبلاغ عن الأخطاء
- 💡 اقتراح ميزات جديدة
- 🔀 المساهمة في الكود

---

## 📞 التواصل

- **المالك**: +222 32 15 78 28
- **GitHub**: [github.com/crimson-bot](https://github.com/crimson-bot)
- **Telegram**: [@crimsonbot](https://t.me/crimsonbot)

---

<div align="center">

**صنع بـ ❤️ من Crimson Team**

[⬆ العودة للأعلى](#-crimson-bot---advanced-whatsapp-bot)

</div>
