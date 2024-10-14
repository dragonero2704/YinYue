const { globalQueue } = global
const { ServerQueue, check } = require("../../classes/serverQueue");
const { SlashCommandBuilder, basename } = require("discord.js");
const {
  titleEmbed,
  fieldEmbed,
  sendReply,
  reactToMsg,
} = require("../../classes/functions");

const blank_field = "\u200b";

const lang = require(`./languages/${basename(__filename).split(".")[0]}.json`);

module.exports = {
  name: "die",
  aliases: ["d"],
  data: new SlashCommandBuilder()
    .setName("die")
    .setNameLocalizations(lang.names)
    .setDescription("Turns off music and leaves voice channel")
    .setDescriptionLocalizations(lang.descriptions),
  async execute(interaction, bot, locale, ...params) {
    if (!check(interaction, globalQueue, locale)) return;
    let server_queue = globalQueue.get(interaction.guild.id);
    server_queue.die(true);
    interaction.reply(blank_field);
    interaction.deleteReply();
  },

  async run(msg, args, bot) {
    if (!check(msg, globalQueue)) return;
    let server_queue = globalQueue.get(msg.guild.id);
    server_queue.die(true);
    reactToMsg(msg, "👋");
  },
};
