
module.exports = {
    name: 'help',
    run(msg, args, bot, Discord) {
        let embed = require('../../embed')(msg.guild)
        let commands = Array.from(bot.commands.values())
        console.log(commands)
        for(const cmd of commands){
            if(cmd.name === 'help' || cmd.disabled)
            continue
            try {
                embed.addField(cmd.name, cmd.description)
            } catch (error) {
                console.log(error)
            }
        }
        msg.channel.send({embed: [embed]})
    }
}