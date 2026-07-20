const { globalQueue } = global;

import { ServerQueue, check } from "../../classes/serverQueue";
import { SlashCommandBuilder, basename } from "discord.js";
const {
  titleEmbed,
  fieldEmbed,
  sendReply,
  reactToMsg,
} = require("../../classes/util");

const lang = require(`../../../languages/${
  basename(__filename).split(".")[0]
}.json`);

export default {
  name: "remove",
  data: new SlashCommandBuilder()
    .setName("remove")
    .setDescription("removes {index} song from the queue")
    .setNameLocalizations(lang.names)
    .setDescriptionLocalizations(lang.descriptions)
    .addNumberOption((num) =>
      num
        .setName("index")
        .setDescription("{index} of the song to remove")
        .setNameLocalizations(lang.options[0].names)
        .setDescriptionLocalizations(lang.options[0].descriptions)
        .setMinValue(1)
        .setRequired(true)
    ),

  async run(interaction, bot, locale, ...params) {
    if (!check(interaction, globalQueue)) return;
    let index = interaction.options.getNumber("index");
    let server_queue = globalQueue.get(interaction.guild.id);
    if (!index || index < 1 || index > server_queue.songs.length) {
      interaction.reply({
        embeds: [
          titleEmbed(
            interaction.guild,
            `Input a number between 1 and ${server_queue.songs.length}`
          ),
        ],
        ephemeral: true,
      });
      return;
    }
    interaction.reply(
      // `${ServerQueue.queueFormat.start}\n${index}. [${
      //   server_queue.getSongs()[index - 1].title
      // }](${server_queue.getSongs()[index - 1].url}) rimossa\n${
      //   ServerQueue.queueFormat.end
      // }`
      {
        embeds: [
          titleEmbed(
            interaction.guild,
            lang.names[locale],
            `[${server_queue.getSongs()[index - 1].title}](${
              server_queue.getSongs()[index - 1].url
            })`
          ),
        ],
      }
    );
    server_queue.remove(index - 1);
  },
};
