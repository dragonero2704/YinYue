const { MessageEmbed } = require('discord.js')

module.exports = (guild) => {
    let embed = new MessageEmbed()
        .setColor(guild.me.displayColor)
    return embed
}