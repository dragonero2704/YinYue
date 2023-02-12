function titleEmbed(guild, title, description = undefined, url = undefined) {
    let embed = require('../misc/embed')(guild)
    embed.setTitle(title).setTimestamp()
    if(description) embed.setDescription(description)
    if(url) embed.setURL(url)
    return embed;
}

function fieldEmbed(guild, title, content) {
    let embed = require('../misc/embed')(guild)
    embed.addFields([{ name: title, value: content }]).setTimestamp()
    // embed.setDescription('')
    return embed;
}

async function sendReply(channel, embed, timeout = undefined) {
    if (!timeout) {
        channel.send({ embeds: [embed] })
    } else {
        channel.send({ embeds: [embed] }).then(msg => {
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