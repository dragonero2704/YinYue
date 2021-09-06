module.exports = {
    name: 'ping',
    run(msg, args, bot, Discord) {
        let embed = require('../../embed')(msg.guild)
        embed.setTitle(`Ping: ${bot.ws.ping}ms`)
        msg.channel.send({embeds: [embed]})
    },
}