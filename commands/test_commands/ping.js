const { SlashCommandBuilder } = require('@discordjs/builders')

module.exports = {
    name: 'ping',
    description: 'Calcola il ping',
    run(msg, args, bot) {
        let embed = require('../../embed')(msg.guild)
        embed.setTitle(`Ping: ${bot.ws.ping}ms`)
        msg.reply({ embeds: [embed], ephemeral: true })
    },
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Calcola il ping'),
    async execute(inter, bot) {
        let embed = require('../../embed')(inter.guild)
        embed.setTitle(`Ping: ${bot.ws.ping}ms`)
        await inter.reply({ embeds: [embed], ephemeral: true })
    }
}