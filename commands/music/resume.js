const { globalQueue } = global
const { ServerQueue, check } = require("../../classes/serverQueue");
const { SlashCommandBuilder, basename } = require("discord.js");
const {
  titleEmbed,
  fieldEmbed,
  sendReply,
  reactToMsg,
} = require("../../classes/util");

 const lang = require(`../../languages/${basename(__filename).split(".")[0]}.json`);

module.exports = {
  name: "resume",
  aliases: ["r"],
  data: new SlashCommandBuilder()
    .setName("resume")
    .setDescription("Resumes the queue"),
  async execute(interaction, bot, locale, ...params) {
    if (!check(interaction, globalQueue)) return;
    let server_queue = globalQueue.get(interaction.guild.id);

    interaction.reply(
      // `${ServerQueue.queueFormat.start}\nRiprendo\n${ServerQueue.queueFormat.end}`
      {embeds:[titleEmbed(interaction.guild, lang.names[locale])]}
    );

    server_queue.resume();
  },

  async run(msg, args, bot) {
    if (!check(msg, globalQueue)) return;
    let server_queue = globalQueue.get(msg.guild.id);

    server_queue.resume();
    reactToMsg(msg, "▶️");
  },
};
