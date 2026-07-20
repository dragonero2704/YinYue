const { globalQueue } = global
import { ServerQueue, check } from "../../classes/serverQueue";
import { SlashCommandBuilder, basename } from "discord.js";
const {
  titleEmbed,
  fieldEmbed,
  sendReply,
  reactToMsg,
} = require("../../classes/util");

 import lang from `../../../languages/${basename(__filename).split(".")[0]}.json`;

export default {
  name: "skip",

  data: new SlashCommandBuilder()
    .setName("skip")
    .setNameLocalizations(lang.names)
    .setDescription("Skips to the next song")
    .setDescriptionLocalizations(lang.descriptions),
  async run(interaction, bot, locale, ...params) {
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
};
