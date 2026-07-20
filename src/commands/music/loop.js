const { globalQueue } = global;

import { ServerQueue, check } from "../../classes/serverQueue";
const {
  SlashCommandBuilder,
  basename,
  CommandInteraction,
  Client,
} = require("discord.js");
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
  name: "loop",

  data: new SlashCommandBuilder()
    .setName("loop")
    .setDescription("Changes loop state")
    .addSubcommand((sub) =>
      sub
        .setName("disabled")
        .setDescription("Loop disabled")
        .setNameLocalizations(lang.options[0].names)
        .setDescriptionLocalizations(lang.options[0].descriptions)
    )
    .addSubcommand((sub) =>
      sub
        .setName("queue")
        .setDescription("Queue loop")
        .setNameLocalizations(lang.options[1].names)
        .setDescriptionLocalizations(lang.options[1].descriptions)
    )
    .addSubcommand((sub) =>
      sub
        .setName("track")
        .setDescription("Track loop")
        .setNameLocalizations(lang.options[2].names)
        .setDescriptionLocalizations(lang.options[2].descriptions)
    ),
  /**
   *
   * @param {CommandInteraction} interaction
   * @param {Client} bot
   * @param {String} locale
   * @param  {...any} params
   * @returns
   */
  async run(interaction, bot, locale, ...params) {
    if (!check(interaction, globalQueue)) return;
    let server_queue = globalQueue.get(interaction.guild.id);

    let mode = interaction.options.getSubcommand();
    if (!mode) return;
    switch (server_queue.changeLoopState(mode)) {
      case ServerQueue.loopStates.disabled:
        interaction.reply(
          //`${ServerQueue.queueFormat.start}\nLoop: disabled\n${ServerQueue.queueFormat.end}`
          { embeds: [titleEmbed(interaction.guild, "loop disabled")] }
        );
        break;
      case ServerQueue.loopStates.queue:
        interaction.reply(
          //`${ServerQueue.queueFormat.start}\nLoop: queue\n${ServerQueue.queueFormat.end}`
          {embeds: [titleEmbed(interaction.guild, "loop queue")]}
        );
        break;
      case ServerQueue.loopStates.track:
        interaction.reply(
          //`${ServerQueue.queueFormat.start}\nLoop: track\n${ServerQueue.queueFormat.end}`
          {embeds: [titleEmbed(interaction.guild, "loop track")]}
        );
        break;
    }
  },
};
