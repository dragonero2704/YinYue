const { EmbedBuilder } = require("discord.js");

module.exports = {
  embedFromGuild(guild) {
    let embed = new EmbedBuilder().setColor(guild.members.me.displayColor);
    return embed;
  },

  titleEmbed(guild, title, description = undefined, url = undefined) {
    let embed = this.embedFromGuild(guild);
    embed.setTitle(title);
    if (description) embed.setDescription(description);
    if (url) embed.setURL(url);
    return embed;
  },

  fieldEmbed(guild, title, content) {
    this.embedFromGuild(guild).addFields([{ name: title, value: content }]);
  },

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

  SecsToRaw(seconds) {
    let res = [];
    while (seconds > 0) {
      res.push(String(Math.floor(seconds % 60)).padStart(2, "0"));
      seconds /= 60;
      seconds = Math.floor(seconds);
    }
    return res.join(":");
  },
  /**
   *
   * @param {String} raw
   */
  RawToSecs(raw) {
    //             sec min hours
    const bases = [1, 60, 60 * 60];
    const arr = raw.split(":").reverse().slice(0, 3);
    let seconds = 0;
    arr.map((v, i) => v * bases[i]).forEach((v) => (seconds += v));
    return seconds;
  },
};
