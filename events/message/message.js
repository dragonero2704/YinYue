module.exports = {
    name: 'messageCreate',
    once: false,
    run(msg, bot) {
        if (msg.author.bot) return;
        let prefix = bot.prefix.get(msg.guild.id)
        if (!prefix) prefix = bot.prefix.get('default')
        if (!msg.content.startsWith(prefix)) return;
        let args = msg.content.substring(prefix.length).split(' ');
        let cmd_name = bot.aliases.get(args[0].toLowerCase()) || args[0].toLowerCase();
        console.log(cmd_name)
        try {
            bot.commands.get(cmd_name).run(msg, args, bot);
        } catch (error) {
            console.log('Comando sconosciuto')
            console.log(error)
        }
    },
}