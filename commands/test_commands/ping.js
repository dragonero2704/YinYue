const {
  SlashCommandBuilder,
  CommandInteraction,
  Client,
} = require("discord.js");
const { titleEmbed } = require("../../classes/util");

module.exports = {
  name: "ping",
  description: "Calcola il ping",
  run(msg, args, bot) {
    msg.reply({
      embeds: [titleEmbed(msg.guild, `Ping: ${bot.ws.ping}ms`)],
      ephemeral: true,
    });
  },
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Calcola il ping"),
  /**
   *
   * @param {CommandInteraction} inter
   * @param {Client} bot
   * @param {String} locale
   */
  async execute(inter, bot, locale) {
    inter.reply({
      embeds: [titleEmbed(inter.guild, `Ping: ${bot.ws.ping}ms`)],
      ephemeral: true,
    });
  },
};
