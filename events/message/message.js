module.exports = {
    name: 'messageCreate',
    once: false,
    run(msg, bot, Discord) {
        if (msg.author.bot) return;
        let prefix = bot.prefix.get(msg.guild.id)
        if(!prefix) prefix = bot.prefix.get('default')
        if (!msg.content.startsWith(prefix)) return;
        let args = msg.content.substring(prefix.length).split(' ');
        let cmd_name = bot.aliases.get(args[0].toLowerCase()) || args[0].toLowerCase();

        try {
            bot.commands.get(cmd_name).run(msg, args, bot, Discord);
        } catch (error) {
            console.log('Comando sconosciuto')
        }
    },
}