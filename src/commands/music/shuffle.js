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
  name: "shuffle",
  data: new SlashCommandBuilder()
    .setName("shuffle")
    .setDescription("Mixes the queue"),
  async run(interaction, bot, locale, ...params) {
    if (!check(interaction, globalQueue)) return;
    let server_queue = globalQueue.get(interaction.guild.id);
    server_queue.shuffle();
    interaction.reply(
      // `${
      //   ServerQueue.queueFormat.start
      // }\nShuffled ${server_queue.getSongsLength()} songs\n${
      //   ServerQueue.queueFormat.end
      // }`
      {embeds:[titleEmbed(interaction.guild, `${server_queue.getSongsLength()} ${lang.names[locale]}`)]}
    );
  },
};
