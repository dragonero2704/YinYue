const { globalQueue } = global

const { ServerQueue, check } = require("../../classes/serverQueue");
const { SlashCommandBuilder, basename } = require("discord.js");
const {
  titleEmbed,
  fieldEmbed,
  sendReply,
  reactToMsg,
} = require("../../classes/functions");

const lang = require(`./languages/${basename(__filename).split(".")[0]}.json`);

module.exports = {
  name: "pause",

  data: new SlashCommandBuilder()
    .setName("pause")
    .setDescription("Pauses the music")
    .setNameLocalizations(lang.names)
    .setDescriptionLocalizations(lang.descriptions),

  async execute(interaction, bot, locale, ...params) {
    if (!check(interaction, globalQueue)) return;
    let server_queue = globalQueue.get(interaction.guild.id);
    interaction.reply(
      `${ServerQueue.queueFormat.start}\nPausa\n${ServerQueue.queueFormat.end}`
    );
    server_queue.pause();
  },

  async run(msg, args, bot) {
    if (!check(msg, globalQueue)) return;
    let server_queue = globalQueue.get(msg.guild.id);
    server_queue.pause();
    reactToMsg(msg, "⏸️");
  },
};
