let handler = async (m, { conn }) => {
    const start = Date.now()
    await conn.sendMessage(m.key.remoteJid, { text: 'Pong!' }, { quoted: m })
    const end = Date.now()
    const ping = end - start
    await conn.sendMessage(m.key.remoteJid, { 
        text: `Speed: ${ping}ms` 
    }, { quoted: m })
}

handler.help = ['ping', 'speed']
handler.tags = ['info']
handler.command = ['ping', 'speed']
handler.description = 'Check the bot\'s response speed'
handler.usage = '.ping'
handler.example = '.ping'

handler.group = true
handler.private = true
handler.owner = false
handler.admin = false
handler.premium = false
handler.botAdmin = false
handler.cooldown = 3

export default handler