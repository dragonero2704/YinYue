module.exports = {
    name: 'help',
    run(msg, args, bot) {
        let embed = require('../../embed')(msg.guild)
        let commands = Array.from(bot.commands.values())
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