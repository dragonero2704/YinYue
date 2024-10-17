const {InteractionType, Client, CommandInteraction} = require('discord.js')
const {logger} = global
module.exports = {
    name: 'interactionCreate',
    /**
     * 
     * @param {CommandInteraction} interaction 
     * @param {Client} bot 
     * @returns 
     */
    async run(interaction, bot) {
        if (interaction.type !== InteractionType.ApplicationCommand) return;
        
        const { commandName, locale } = interaction;

        try {
            const cmd_name = bot.aliases.get(commandName.toLowerCase()) || commandName.toLowerCase();
            logger.info(`${interaction.member.user.tag} executed /${commandName.toLowerCase()} in guild ${interaction.guild.name}`)
            await bot.commands.get(cmd_name).execute(interaction, bot, locale);
        } catch (warning) {
            logger.warn(warning)
        }
    },
}