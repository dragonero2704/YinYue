module.exports = {
    name: 'help',
    run(msg, args, bot, Discord) {
        let embed = require('../../embed')(msg.guild)
        let commands = Array.from(bot.commands.values())
            // console.log(commands)
            // let ar = []
            // ar.toLocaleString()
        for (let cmd of commands) {
            if (cmd.name === 'help' || cmd.disabled)
                continue
            let description = cmd.description || 'no description found'
            let args = cmd.args || ''
            try {
                embed.addField(`${cmd.name} ${args}`, description)
            } catch (error) {
                console.log(error)
            }
        }
        msg.channel.send({ embeds: [embed] })
    },
    aliases: ['h'],
}