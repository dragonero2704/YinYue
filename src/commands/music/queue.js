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
  name: "queue",

  data: new SlashCommandBuilder()
    .setName("queue")
    .setDescription("Shows the queue"),

  async run(interaction, bot, locale, ...params) {
    if (!check(interaction, globalQueue)) return;
    let server_queue = globalQueue.get(interaction.guild.id);
    let songs = server_queue.getSongs();
    if (songs.length === 0) {
      interaction.reply({
        embeds: [titleEmbed(msg.guild, lang.errors.emptyQueue)],
      });
      return;
    }
    await server_queue.showQueue(interaction);
  },
};
