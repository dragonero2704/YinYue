const { globalQueue } = global;
import { ServerQueue, check } from "../../classes/serverQueue";
import { SlashCommandBuilder, basename } from "discord.js";
const {
  titleEmbed,
  fieldEmbed,
  sendReply,
  reactToMsg,
} = require("../../classes/util");

const blank_field = "\u200b";

const lang = require(`../../../languages/${
  basename(__filename).split(".")[0]
}.json`);

export default {
  name: "die",
  data: new SlashCommandBuilder()
    .setName("die")
    .setNameLocalizations(lang.names)
    .setDescription("Turns off music and leaves voice channel")
    .setDescriptionLocalizations(lang.descriptions),
  async run(interaction, bot, locale, ...params) {
    if (!check(interaction, globalQueue, locale)) return;
    let server_queue = globalQueue.get(interaction.guild.id);
    server_queue.die(true);
    interaction.reply(blank_field);
    interaction.deleteReply();
  },
};
