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
  name: "shuffle",
  data: new SlashCommandBuilder()
    .setName("shuffle")
    .setDescription("Mixes the queue"),
  async execute(interaction, bot, locale, ...params) {
    if (!check(interaction, globalQueue)) return;
    let server_queue = globalQueue.get(interaction.guild.id);
    server_queue.shuffle();
    interaction.reply(
      // `${
      //   ServerQueue.queueFormat.start
      // }\nShuffled ${server_queue.getSongsLength()} songs\n${
      //   ServerQueue.queueFormat.end
      // }`
      {embeds:[titleEmbed(interaction.guild, `${server_queue.getSongsLength()} ${lang.names[locale]}`)]}
    );
  },
  async run(msg, args, bot) {
    if (!check(msg, globalQueue)) return;
    let server_queue = globalQueue.get(msg.guild.id);
    server_queue.shuffle();
    reactToMsg(msg, "🔀");
  },
};
