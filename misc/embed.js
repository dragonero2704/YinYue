const { EmbedBuilder } = require('discord.js')

const embedFromGuild = (guild) => {
    let embed = new EmbedBuilder()
        .setColor(guild.members.me.displayColor)
    return embed
}

module.exports = embedFromGuild