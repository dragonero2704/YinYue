module.exports = {
    name: 'prefix',
    description: 'changes bot prefix!',
    disabled: true,
    run(msg, args, bot, Discord) {
        if(this.disabled)
        return msg.guild.send('comando disabilito, coming soon!')
        
        bot.prefix.delete(msg.guild.id)
        bot.prefix.set(msg.guild.id, args[1])
    }

}