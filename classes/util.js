const { EmbedBuilder, TextChannel, Embed } = require("discord.js");
function embedFromGuild(guild) {
  let embed = new EmbedBuilder().setColor(guild.members.me.displayColor);
  return embed;
}
module.exports = {
  embedFromGuild,

  titleEmbed(guild, title, description = undefined, url = undefined) {
    let embed = embedFromGuild(guild);
    embed.setTitle(title);
    if (description) embed.setDescription(description);
    if (url) embed.setURL(url);
    return embed;
  },

  fieldEmbed(guild, title, content) {
    return embedFromGuild(guild).addFields([{ name: title, value: content }]);
  },
  /**
   * 
   * @param {TextChannel} channel 
   * @param {Embed} embed 
   * @param {number} timeout 
   */
  sendReply(channel, embed, timeout = undefined) {
    if (!timeout) {
      channel.send({ embeds: [embed] });
    } else {
      channel.send({ embeds: [embed] }).then((msg) => {
        setTimeout(() => {
          if (msg.editable) msg.delete();
        }, timeout);
      });
    }
  },

  async reactToMsg(msg, emoji) {
    await msg.react(emoji);
  },

  SecondsToText(seconds) {
    let res = [
      String(Math.floor(seconds % 60)).padStart(2, "0"),
      String(Math.floor((seconds / 60) % 60)).padStart(2, "0"),
    ];
    const hours = Math.floor((seconds / 3600))
    if(hours > 0) res.push(String(hours).padStart(2, "0"))
  
    res.reverse()
    return res.join(":");
  },
  /**
   *
   * @param {String} raw
   */
  TextToSeconds(raw) {
    //             sec min hours
    const bases = [1, 60, 60 * 60];
    const arr = raw.split(":").reverse().slice(0, 3);
    let seconds = 0;
    arr.map((v, i) => v * bases[i]).forEach((v) => (seconds += v));
    return seconds;
  },
  isValidUrl(urlString) {
    try {
      return Boolean(new URL(urlString));
    } catch (e) {
      return false;
    }
  },
};
