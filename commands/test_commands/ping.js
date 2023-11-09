const { SlashCommandBuilder } = require('discord.js')

module.exports = {
    name: 'ping',
    description: 'Calcola il ping',
    run(msg, args, bot) {
        let embed = require('../../misc/embed')(msg.guild)
        embed.setTitle(`Ping: ${bot.ws.ping}ms`)
        msg.reply({ embeds: [embed], ephemeral: true })
    },
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Calcola il ping'),
    async execute(inter, bot, locale, ...params) {
        let embed = require('../../misc/embed')(inter.guild)
        embed.setTitle(`Ping: ${bot.ws.ping}ms`)
        await inter.reply({ embeds: [embed], ephemeral: true })
    }
}