const {Prefixes} = require('../../database/models/prefixes')

module.exports = {
    name: 'messageCreate',
    once: false,
    run(msg, bot) {
        if (msg.author.bot) return;
        console.log(this.name + ' triggered')
        let prefix = Prefixes.findOne({where:{serverId: msg.guild.id}}).prefix ?? '-'
        console.log(`prefix: '${prefix}'`)
        
        if (!msg.cleanContent.startsWith(prefix)) return;
    
        let args = msg.cleanContent.substring(prefix.length).split(' ');
        let cmd_name = bot.aliases.get(args[0].toLowerCase()) || args[0].toLowerCase();
        console.log(`Comando in esecuzione: ${cmd_name}.js`)
        try {
            bot.commands.get(cmd_name).run(msg, args, bot);
        } catch (error) {
            console.log('Comando sconosciuto')
            console.log(error)
        }
    },
}