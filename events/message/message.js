module.exports = {
    name: 'messageCreate',
    once: false,
    run(msg, bot, Discord) {
        if (msg.author.bot) return;
        if (!msg.content.startsWith(bot.prefix)) return;
        let args = msg.content.substring(bot.prefix.length).split(' ');
        let cmd_name = bot.aliases.get(args[0].toLowerCase()) || args[0].toLowerCase();

        try {
            bot.commands.get(cmd_name).run(msg, args, bot, Discord);
        } catch (error) {
            console.log('Comando sconosciuto')
        }
    },
}