const {Prefixes} = require('../../database/models/prefixes')

module.exports = {
    name: 'messageCreate',
    once: false,
    run(msg, bot) {
        if (msg.author.bot) return;
        let prefix = Prefixes.findOne({where:{serverId: msg.guild.id}}).prefix ?? '-'
        
        if (!msg.cleanContent.startsWith(prefix)) return;
    
        let args = msg.cleanContent.substring(prefix.length).split(' ');
        let cmd_name = bot.aliases.get(args[0].toLowerCase()) || args[0].toLowerCase();
        if(cmd_name.length == 0) return;
        console.log(`Comando in esecuzione: ${cmd_name}.js`)
        console.log(`${msg.author.tag} executed ${prefix}${args[0].toLowerCase()} in guild ${msg.guild.name}`)

        try {
            bot.commands.get(cmd_name).run(msg, args, bot);
        } catch (error) {
            // console.log('Comando sconosciuto')
            console.warning(error)
        }
    },
}