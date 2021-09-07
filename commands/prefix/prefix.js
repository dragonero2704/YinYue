module.exports = {
    name: 'prefix',
    run(msg, args, bot, Discord) {
        return msg.guild.send('comando disabilito, coming soon!')
        bot.prefix.delete(msg.guild.id)
        bot.prefix.set(msg.guild.id, args[1])
    }

}