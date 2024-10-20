const { ServerQueue, check } = require("../../classes/serverQueue");
const {
  titleEmbed,
  fieldEmbed,
  sendReply,
  reactToMsg,
} = require("../../classes/util");
const { SlashCommandBuilder, basename } = require("discord.js");
const { search } = require("../../libs/libs_handler");
const { NotImplemented } = require("../../classes/error");
const lang = require(`../../languages/${
  basename(__filename).split(".")[0]
}.json`);

module.exports = {
  name: "play",
  aliases: ["p"],
  data: new SlashCommandBuilder()
    .setName("play")
    .setNameLocalizations(lang.names)
    .setDescription("Adds songs to the queue")
    .setDescriptionLocalizations(lang.descriptions)
    .addStringOption((input) =>
      input
        .setName("query")
        .setDescription("A link to youtube or spotify or a search queue")
        .setRequired(true)
        .setNameLocalizations(lang.options.query.names)
        .setDescriptionLocalizations(lang.options.query.descriptions)
    ),
  /**
   *
   * @param {import("discord.js").Interaction} interaction
   * @param {*} bot
   * @param {*} locale
   * @returns
   */
  async execute(interaction, bot, locale) {
    await interaction
      .deferReply()
      .catch((error) => logger.error(error.message));
    const voice_channel = interaction.member.voice.channel;
    if (!voice_channel) {
      // sendReply(msg.channel, titleEmbed(msg.guild, ServerQueue.errors.voiceChannelNotFound), 10000);
      return interaction.editReply({
        embeds: [
          titleEmbed(
            interaction.guild,
            ServerQueue.errors.voiceChannelNotFound[locale]
          ),
        ],
        ephemeral: true,
      });
    }

    const query = interaction.options.getString("query");

    if (!query) {
      // sendReply(interaction.channel, titleEmbed(interaction.guild, ServerQueue.errors.invalidArgument), 10000);
      return interaction.editReply({
        embeds: [
          titleEmbed(
            interaction.guild,
            ServerQueue.errors.invalidArgument[locale]
          ),
        ],
        ephemeral: true,
      });
    }

    let server_queue = globalQueue.get(interaction.guild.id);

    if (server_queue) {
      if (server_queue.getVoiceChannel() !== voice_channel) {
        let content =
          ServerQueue.queueFormat.start +
          ServerQueue.errors.differentVoiceChannel[locale] +
          `<@${bot.user.id}> !` +
          ServerQueue.queueFormat.end;
        return interaction.editReply({ content: content, ephemeral: true });
      }
    }
    // search for the song
    const item = await search(query, ["yt-stream"]).catch((error) => {
      if (error instanceof NotImplemented) {
        interaction.editReply({
          embeds: [
            titleEmbed(interaction.guild, lang.responses.noResults[locale]),
          ],
          ephemeral: true,
        });
      }
      logger.error(error.message);
    });

    if (!server_queue) {
      server_queue = new ServerQueue(item, interaction.channel, voice_channel);
      logger.info("Queue created");
      // adds songs to the global queue map
      globalQueue.set(interaction.guild.id, server_queue);
      await server_queue.play().catch((e) => logger.error(e.message));
    } else {
      server_queue.add(item);
    }
    if (item.length === 1) {
      interaction
        .editReply({
          embeds: [
            fieldEmbed(
              interaction.guild,
              lang.responses.queueAdd[locale],
              `**${item.length}** ${lang.responses.multiAdd[locale]}`
            ),
          ],
        })
        .catch((error) => logger.error(error.message));
    } else {
      interaction
        .editReply({
          embeds: [
            fieldEmbed(
              interaction.guild,
              lang.responses.queueAdd[locale],
              `[${item.title}](${item.url})`
            ),
          ],
        })
        .catch((error) => logger.error(error.message));
    }
  },
  /**
   * Deprecated
   * @param {*} msg
   * @param {*} args
   * @param {*} bot
   * @returns
   */
  async run(msg, args, bot) {
    let voice_channel = await msg.member.voice.channel;
    if (!voice_channel) {
      // sendReply(msg.channel, titleEmbed(msg.guild, ServerQueue.errors.voiceChannelNotFound), 10000);
      return msg.reply({
        embeds: [
          titleEmbed(msg.guild, ServerQueue.errors.voiceChannelNotFound),
        ],
        ephemeral: true,
      });
    }

    if (!args[0]) {
      // sendReply(msg.channel, titleEmbed(msg.guild, ServerQueue.errors.invalidArgument), 10000);
      return msg.reply({
        embeds: [titleEmbed(msg.guild, ServerQueue.errors.invalidArgument)],
        ephemeral: true,
      });
    }

    let server_queue = globalQueue.get(msg.guild.id);

    if (server_queue !== undefined) {
      if (server_queue.voiceChannel !== voice_channel)
        return msg.reply({
          embeds: [
            titleEmbed(
              msg.guild,
              ServerQueue.errors.differentVoiceChannel + `<@${bot.user.id}> !`
            ),
          ],
          ephemeral: true,
        });
    }

    let item = await ServerQueue.getSongObject(args);
    if (!item)
      return msg.reply({
        embeds: [titleEmbed(msg.guild, "Nessun risultato")],
        ephemeral: true,
      });
    if (Array.isArray(item)) {
      sendReply(
        msg.channel,
        fieldEmbed(
          msg.guild,
          "Aggiunte alla coda",
          `**${item.length}** brani aggiunti alla coda!`
        )
      );
    } else {
      sendReply(
        msg.channel,
        fieldEmbed(
          msg.guild,
          "Aggiunta alla coda",
          `[${item.title}](${item.url}) è in coda!`
        )
      );
    }

    if (!server_queue) {
      server_queue = new ServerQueue(item, msg.channel, voice_channel);
      // adds songs to the global queue map
      globalQueue.set(msg.guild.id, server_queue);
      // plays the first song of the list
      await server_queue.play();
    } else {
      if (Array.isArray(item)) {
        item.forEach((v) => {
          if (!server_queue.getSongs().includes(v)) server_queue.add(v);
        });
      } else {
        if (!server_queue.getSongs().includes(item)) server_queue.add(item);
      }
    }
    reactToMsg(msg, "👌");
  },
};
