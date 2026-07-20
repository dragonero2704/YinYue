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
  name: "pause",

  data: new SlashCommandBuilder()
    .setName("pause")
    .setDescription("Pauses the music")
    .setNameLocalizations(lang.names)
    .setDescriptionLocalizations(lang.descriptions),

  async run(interaction, bot, locale, ...params) {
    if (!check(interaction, globalQueue)) return;
    let server_queue = globalQueue.get(interaction.guild.id);
    interaction.reply(
      //`${ServerQueue.queueFormat.start}\nPausa\n${ServerQueue.queueFormat.end}`
      {embeds:[titleEmbed(interaction.guild, lang.names[locale])]}
    );
    server_queue.pause();
  },
};
