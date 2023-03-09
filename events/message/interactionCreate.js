const {InteractionType} = require('discord.js')

module.exports = {
    name: 'interactionCreate',
    run(interaction, bot) {
        if (interaction.type !== InteractionType.ApplicationCommand) return;

        const { commandName } = interaction;

        try {
            let cmd_name = bot.aliases.get(commandName.toLowerCase()) || commandName.toLowerCase();
            console.log(`${interaction.member.user.tag} executed /${commandName.toLowerCase()} in guild ${interaction.guild.name}`)
            const locale = interaction.locale
            bot.commands.get(cmd_name).execute(interaction, bot, locale);
        } catch (error) {
            console.log('Comando sconosciuto')
            console.log(error)
        }
    },
}