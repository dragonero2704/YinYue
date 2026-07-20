const { globalQueue } = global;

import { SlashCommandBuilder, basename } from "discord.js";

const lang = require(`../../../languages/${
  basename(__filename).split(".")[0]
}.json`);

export default {
  name: "24-7",
  data: new SlashCommandBuilder()
    .setName("24-7")
    .setDescription("Stays in the channel 24/7")
    .setDescriptionLocalizations(lang.descriptions),
  disabled: true,
  async run(interaction, bot) {
    let serverQueue = globalQueue.get(interaction.guild.id);
    serverQueue.toggleAlwaysActive();
  },
};
