const words = ['javascript', 'bot', 'hangman', 'whatsapp', 'nodejs', 'برمجة', 'تطوير', 'ذكاء', 'اصطناعي'];
const hangmanGames = new Map();

const handler = async (m, { conn, text, args, sender }) => {
    try {
        const chatId = m.chat;
        const command = args[0]?.toLowerCase();

        if (command === 'start' || !command) {
            // بدء لعبة جديدة
            if (hangmanGames.has(chatId)) {
                return await conn.sendMessage(m.chat, {
                    text: `╔═══════════════════════════╗
║  ⚠️ لعبة نشطة           ║
╚═══════════════════════════╝

🎮 هناك لعبة hangman نشطة بالفعل!

📝 استخدم:
├─ .hangman guess <حرف>
├─ .hangman end (لإنهاء اللعبة)
└─ .hangman status (لعرض الحالة)

━━━━━━━━━━━━━━━━━━━━━━━━
🎯 تابع اللعبة الحالية`,
                    mentions: [sender]
                }, { quoted: m });
            }

            const word = words[Math.floor(Math.random() * words.length)];
            const maskedWord = '_ '.repeat(word.length).trim();

            hangmanGames.set(chatId, {
                word,
                maskedWord: maskedWord.split(' '),
                guessedLetters: [],
                wrongGuesses: 0,
                maxWrongGuesses: 6,
                startTime: Date.now(),
                player: sender
            });

            await conn.sendMessage(m.chat, {
                text: `╔═══════════════════════════╗
║  🎮 بدأت اللعبة         ║
╚═══════════════════════════╝

📝 الكلمة: ${maskedWord}
💡 الأحرف: ${word.length} حرف
❌ الأخطاء المسموحة: 6

📋 التعليمات:
├─ .hangman guess <حرف>
├─ .hangman status (لعرض الحالة)
└─ .hangman end (لإنهاء اللعبة)

━━━━━━━━━━━━━━━━━━━━━━━━
🎯 حظاً موفقاً! 🍀`,
                mentions: [sender]
            }, { quoted: m });

        } else if (command === 'guess') {
            // تخمين حرف
            const game = hangmanGames.get(chatId);
            if (!game) {
                return await conn.sendMessage(m.chat, {
                    text: `╔═══════════════════════════╗
║  ❌ لا توجد لعبة        ║
╚═══════════════════════════╝

⚠️ لا توجد لعبة hangman نشطة

💡 ابدأ لعبة جديدة:
.hangman start

━━━━━━━━━━━━━━━━━━━━━━━━
🎮 استمتع باللعبة!`,
                    mentions: [sender]
                }, { quoted: m });
            }

            const letter = args[1]?.toLowerCase();
            if (!letter || letter.length !== 1) {
                return await conn.sendMessage(m.chat, {
                    text: `╔═══════════════════════════╗
║  ❌ حرف غير صالح        ║
╚═══════════════════════════╝

⚠️ يرجى إدخال حرف واحد فقط

📝 الاستخدام:
.hangman guess <حرف>

💡 مثال:
.hangman guess أ

━━━━━━━━━━━━━━━━━━━━━━━━
🎯 حاول مرة أخرى`,
                    mentions: [sender]
                }, { quoted: m });
            }

            const { word, guessedLetters, maskedWord, maxWrongGuesses } = game;

            if (guessedLetters.includes(letter)) {
                return await conn.sendMessage(m.chat, {
                    text: `╔═══════════════════════════╗
║  ⚠️ حرف مكرر            ║
╚═══════════════════════════╝

❌ الحرف "${letter}" تم تخمينه مسبقاً

📊 الحروف التي جربتها:
${guessedLetters.join(', ') || 'لا توجد'}

━━━━━━━━━━━━━━━━━━━━━━━━
🎯 جرب حرفاً آخر`,
                    mentions: [sender]
                }, { quoted: m });
            }

            guessedLetters.push(letter);

            if (word.includes(letter)) {
                // تخمين صحيح
                for (let i = 0; i < word.length; i++) {
                    if (word[i] === letter) {
                        maskedWord[i] = letter;
                    }
                }

                await conn.sendMessage(m.chat, {
                    text: `╔═══════════════════════════╗
║  ✅ تخمين صحيح          ║
╚═══════════════════════════╝

🎯 الحرف: ${letter}
📝 الكلمة: ${maskedWord.join(' ')}

📊 التقدم:
├─ ✅ صحيح: ${maskedWord.filter(l => l !== '_').length}
├─ ❌ أخطاء: ${game.wrongGuesses}
├─ ⏳ متبقي: ${maxWrongGuesses - game.wrongGuesses}
└─ 🔤 مجرب: ${guessedLetters.join(', ')}

━━━━━━━━━━━━━━━━━━━━━━━━
🎮 استمر في التخمين!`,
                    mentions: [sender]
                }, { quoted: m });

                if (!maskedWord.includes('_')) {
                    // فوز
                    const timeSpent = Math.round((Date.now() - game.startTime) / 1000);
                    await conn.sendMessage(m.chat, {
                        text: `╔═══════════════════════════╗
║  🎉 فوز مبروك!          ║
╚═══════════════════════════╝

🏆 الكلمة: ${word}
⏱️ الوقت: ${timeSpent} ثانية
✅ النقاط: ${Math.max(100 - timeSpent - (game.wrongGuesses * 10), 10)}

📊 الإحصائيات:
├─ 🔤 الأحرف: ${word.length}
├─ ❌ الأخطاء: ${game.wrongGuesses}
├─ ✅ التخمينات: ${guessedLetters.length}
└─ 🎯 الدقة: ${Math.round((maskedWord.filter(l => l !== '_').length / guessedLetters.length) * 100)}%

━━━━━━━━━━━━━━━━━━━━━━━━
🎮 لعبة رائعة! 👏`,
                        mentions: [sender]
                    }, { quoted: m });
                    hangmanGames.delete(chatId);
                }
            } else {
                // تخمين خاطئ
                game.wrongGuesses += 1;

                await conn.sendMessage(m.chat, {
                    text: `╔═══════════════════════════╗
║  ❌ تخمين خاطئ          ║
╚═══════════════════════════╝

🎯 الحرف: ${letter}
📝 الكلمة: ${maskedWord.join(' ')}

📊 التقدم:
├─ ✅ صحيح: ${maskedWord.filter(l => l !== '_').length}
├─ ❌ أخطاء: ${game.wrongGuesses}
├─ ⏳ متبقي: ${maxWrongGuesses - game.wrongGuesses}
└─ 🔤 مجرب: ${guessedLetters.join(', ')}

━━━━━━━━━━━━━━━━━━━━━━━━
💡 حاول حرفاً آخر`,
                    mentions: [sender]
                }, { quoted: m });

                if (game.wrongGuesses >= maxWrongGuesses) {
                    // خسارة
                    await conn.sendMessage(m.chat, {
                        text: `╔═══════════════════════════╗
║  💔 انتهت اللعبة        ║
╚═══════════════════════════╝

🎯 الكلمة كانت: ${word}
❌ عدد الأخطاء: ${game.wrongGuesses}

📊 الإحصائيات:
├─ 🔤 الأحرف: ${word.length}
├─ ✅ التخمينات الصحيحة: ${maskedWord.filter(l => l !== '_').length}
├─ 🔤 الحروف المجربة: ${guessedLetters.join(', ')}
└- 🎮 اللاعب: @${sender.split('@')[0]}

━━━━━━━━━━━━━━━━━━━━━━━━
🔄 جرب مرة أخرى!`,
                        mentions: [sender]
                    }, { quoted: m });
                    hangmanGames.delete(chatId);
                }
            }

        } else if (command === 'status') {
            // عرض حالة اللعبة
            const game = hangmanGames.get(chatId);
            if (!game) {
                return await conn.sendMessage(m.chat, {
                    text: `╔═══════════════════════════╗
║  ❌ لا توجد لعبة        ║
╚═══════════════════════════╝

⚠️ لا توجد لعبة hangman نشطة

💡 ابدأ لعبة جديدة:
.hangman start

━━━━━━━━━━━━━━━━━━━━━━━━
🎮 استمتع باللعبة!`,
                    mentions: [sender]
                }, { quoted: m });
            }

            const { word, maskedWord, guessedLetters, wrongGuesses, maxWrongGuesses, startTime } = game;
            const timeSpent = Math.round((Date.now() - startTime) / 1000);

            await conn.sendMessage(m.chat, {
                text: `╔═══════════════════════════╗
║  📊 حالة اللعبة         ║
╚═══════════════════════════╝

📝 الكلمة: ${maskedWord.join(' ')}
⏱️ الوقت: ${timeSpent} ثانية

📊 الإحصائيات:
├─ ✅ صحيح: ${maskedWord.filter(l => l !== '_').length}
├─ ❌ أخطاء: ${wrongGuesses}
├─ ⏳ متبقي: ${maxWrongGuesses - wrongGuesses}
├─ 🔤 مجرب: ${guessedLetters.join(', ') || 'لا شيء'}
└─ 🎯 الأحرف: ${word.length}

━━━━━━━━━━━━━━━━━━━━━━━━
🎮 استمر في التخمين!`,
                mentions: [sender]
            }, { quoted: m });

        } else if (command === 'end') {
            // إنهاء اللعبة
            const game = hangmanGames.get(chatId);
            if (!game) {
                return await conn.sendMessage(m.chat, {
                    text: `╔═══════════════════════════╗
║  ❌ لا توجد لعبة        ║
╚═══════════════════════════╝

⚠️ لا توجد لعبة hangman نشطة

💡 ابدأ لعبة جديدة:
.hangman start

━━━━━━━━━━━━━━━━━━━━━━━━
🎮 استمتع باللعبة!`,
                    mentions: [sender]
                }, { quoted: m });
            }

            hangmanGames.delete(chatId);
            await conn.sendMessage(m.chat, {
                text: `╔═══════════════════════════╗
║  🏁 انتهت اللعبة        ║
╚═══════════════════════════╝

🎯 الكلمة كانت: ${game.word}
📊 التقدم: ${game.maskedWord.join(' ')}

📈 الإحصائيات:
├─ ❌ الأخطاء: ${game.wrongGuesses}
├─ 🔤 الحروف المجربة: ${game.guessedLetters.join(', ') || 'لا شيء'}
└- ⏱️ المدة: ${Math.round((Date.now() - game.startTime) / 1000)} ثانية

━━━━━━━━━━━━━━━━━━━━━━━━
🎮 شكراً للعب! 👏`,
                mentions: [sender]
            }, { quoted: m });

        } else {
            // أمر غير معروف
            await conn.sendMessage(m.chat, {
                text: `╔═══════════════════════════╗
║  ❌ أمر غير معروف       ║
╚═══════════════════════════╝

📋 الأوامر المتاحة:

🎮 .hangman start
└─ بدء لعبة جديدة

🔤 .hangman guess <حرف>
└─ تخمين حرف

📊 .hangman status
└─ عرض حالة اللعبة

🛑 .hangman end
└─ إنهاء اللعبة

━━━━━━━━━━━━━━━━━━━━━━━━
🎯 استمتع باللعبة!`,
                mentions: [sender]
            }, { quoted: m });
        }

    } catch (error) {
        console.error('❌ Error in hangman command:', error);
        
        await conn.sendMessage(m.chat, {
            text: `╔═══════════════════════════╗
║  ❌ خطأ في اللعبة       ║
╚═══════════════════════════╝

⚠️ حدث خطأ غير متوقع

💡 حاول:
├─ إعادة تشغيل اللعبة
├─ استخدام أوامر بسيطة
└─ التحقق من الاتصال

━━━━━━━━━━━━━━━━━━━━━━━━
🔄 جرب مرة أخرى`,
            mentions: [sender]
        }, { quoted: m });
    }
};

handler.help = ['hangman'];
handler.tags = ['games', 'fun'];
handler.command = ['hangman', 'تخمين', 'لعبة'];
handler.description = 'لعبة Hangman - تخمين الكلمات';
handler.usage = `.hangman start | guess <حرف> | status | end`;
handler.example = '.hangman guess أ';

handler.group = true;
handler.private = true;
handler.owner = false;
handler.admin = false;
handler.premium = false;
handler.botAdmin = false;

export default handler;
