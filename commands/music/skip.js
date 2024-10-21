const { globalQueue } = global
const { ServerQueue, check } = require("../../classes/serverQueue");
const { SlashCommandBuilder, basename } = require("discord.js");
const {
  titleEmbed,
  fieldEmbed,
  sendReply,
  reactToMsg,
} = require("../../classes/util");

 const lang = require(`../../languages/${basename(__filename).split(".")[0]}.json`);

module.exports = {
  name: "skip",
  aliases: ["s"],
  data: new SlashCommandBuilder()
    .setName("skip")
    .setNameLocalizations(lang.names)
    .setDescription("Skips to the next song")
    .setDescriptionLocalizations(lang.descriptions),
  async execute(interaction, bot, locale, ...params) {
    if (!check(interaction, globalQueue)) return;
    let server_queue = globalQueue.get(interaction.guild.id);

    let song = server_queue.nextTrack(true);

    if (song) {
      interaction.reply({
        embeds: [
          fieldEmbed(interaction.guild, "Skip", `[${song.title}](${song.url})`),
        ],
      });
      await server_queue.play(song);
    } else {
      server_queue.die();
      globalQueue.delete(interaction.guild.id);
      interaction.reply({
        embeds: [titleEmbed(interaction.guild, lang.responses.endQueue[locale])],
      });
    }
  },

  async run(msg, args, bot) {
    if (!check(msg, globalQueue)) return;
    let server_queue = globalQueue.get(msg.guild.id);

    let song = server_queue.nextTrack(true);
    // console.log(song);
    if (song) {
      await server_queue.play(song);
    } else {
      server_queue.die();
      globalQueue.delete(msg.guild.id);
      sendReply(
        msg.channel,
        titleEmbed(msg.guild, ServerQueue.responses.endQueue[locale])
      );
    }
    reactToMsg(msg, "⏭️");
  },
};
