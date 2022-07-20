const {InteractionType} = require('discord.js')

module.exports = {
    name: 'interactionCreate',
    run(interaction, bot) {
        if (!interaction.type === InteractionType.ApplicationCommand) return;

        const { commandName } = interaction;

        let cmd_name = bot.aliases.get(commandName.toLowerCase()) || commandName.toLowerCase();
        console.log(`Comando in esecuzione: ${cmd_name}.js`)
        try {
            bot.commands.get(cmd_name).execute(interaction, bot);
        } catch (error) {
            console.log('Comando sconosciuto')
            console.log(error)
        }
    },
}