module.exports = {
    name: 'interactionCreate',
    run(interaction, bot, Discord) {
        if (!interaction.isCommand()) return;

        const { commandName } = interaction;

        let cmd_name = bot.aliases.get(commandName.toLowerCase()) || commandName.toLowerCase();
        console.log(cmd_name)
        try {
            bot.commands.get(cmd_name).run(msg, args, bot, Discord);
        } catch (error) {
            console.log('Comando sconosciuto')
            console.log(error)
        }
    },
}