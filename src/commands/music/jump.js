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
  name: "jump",

  data: new SlashCommandBuilder()
    .setName("jump")
    .setDescription("Skips to {index} song")
    .addNumberOption((option) =>
      option
        .setName("index")
        .setNameLocalizations(lang.options[0].names)
        .setDescription("{index} to jump to")
        .setDescriptionLocalizations(lang.options[0].descriptions)
        .setMinValue(1)
        .setRequired(true)
    ),

  async run(interaction, bot, locale, ...params) {
    if (!check(interaction, globalQueue)) return;
    let server_queue = globalQueue.get(interaction.guild.id);

    let index = interaction.options.getNumber("index");
    if (!index || index < 1 || index > server_queue.getSongs().length) {
      interaction.reply({
        embeds: [
          titleEmbed(
            interaction.guild,
            `Input a number between 1 and ${server_queue.getSongs().length}`
          ),
        ],
        ephemeral: true,
      });
      return;
    }
    interaction.reply(
      // `${ServerQueue.queueFormat.start}\nSalto a [${
      //   server_queue.getSongs()[index - 1].title
      // }](${server_queue.getSongs()[index - 1].url})\n${
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

    await server_queue.jump(index - 1);
  },
};
