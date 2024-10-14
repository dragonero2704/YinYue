const { globalQueue } = global

const { ServerQueue, check } = require("../../classes/serverQueue");
const { SlashCommandBuilder, basename } = require("discord.js");

// const lang = require(`./languages/${basename(__filename).split('.')[0]}.json`)

module.exports = {
  name: "",
  aliases: "",
  data: "",
  disabled: true,
  async execute(interaction, bot) {},

  async run(msg, args, bot) {},
};
