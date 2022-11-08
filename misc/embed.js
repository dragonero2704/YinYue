const { EmbedBuilder } = require('discord.js')

module.exports = (guild) => {
    let embed = new EmbedBuilder()
        .setColor(guild.members.me.displayColor)
    return embed
}