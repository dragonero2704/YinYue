function titleEmbed(guild, title) {
    let embed = require('../misc/embed')(guild)
    embed.setTitle(title)
    // embed.setDescription('')
    return embed;
}

function fieldEmbed(guild, title, content) {
    let embed = require('../misc/embed')(guild)
    embed.addFields([{ name: title, value: content }])
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

module.exports = {titleEmbed, fieldEmbed, sendReply, reactToMsg}