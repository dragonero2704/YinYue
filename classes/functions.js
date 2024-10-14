const embedFromGuild = require('../misc/embed')

function titleEmbed(guild, title, description = undefined, url = undefined) {
    let embed = embedFromGuild(guild)
    embed.setTitle(title)
    if(description) embed.setDescription(description)
    if(url) embed.setURL(url)
    return embed;
}

const fieldEmbed = (guild, title, content) => embedFromGuild(guild).addFields([{ name: title, value: content }])

function sendReply(channel, embed, timeout = undefined) {
    if (!timeout) {
        channel.send({ embeds: [embed] })
    } else {
        channel.send({ embeds: [embed] })
        .then(msg => {
            setTimeout(() => {
                if (msg.editable)
                    msg.delete()
            }, timeout)
        });
    }
}


async function reactToMsg(msg, emoji) {
    await msg.react(emoji)
}

module.exports = {
    titleEmbed, 
    fieldEmbed, 
    sendReply, 
    reactToMsg
}