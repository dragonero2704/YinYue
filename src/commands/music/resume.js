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
  name: "resume",

  data: new SlashCommandBuilder()
    .setName("resume")
    .setDescription("Resumes the queue"),
  async run(interaction, bot, locale, ...params) {
    if (!check(interaction, globalQueue)) return;
    let server_queue = globalQueue.get(interaction.guild.id);

    interaction.reply(
      // `${ServerQueue.queueFormat.start}\nRiprendo\n${ServerQueue.queueFormat.end}`
      {embeds:[titleEmbed(interaction.guild, lang.names[locale])]}
    );

    server_queue.resume();
  },
};
