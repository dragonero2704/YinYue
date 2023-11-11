const { globalQueue } = require('../../misc/globals')

const { ServerQueue, check } = require('../../classes/serverQueue');
const { SongBuilder } = require('../../classes/songBuilder')
const { titleEmbed, fieldEmbed, sendReply, reactToMsg } = require('../../misc/functions')
const { SlashCommandBuilder, basename } = require('discord.js');

const lang = require(`./languages/${basename(__filename).split('.')[0]}.json`)

module.exports = {
    name: "play",
    aliases: ["p"],
    data: new SlashCommandBuilder()
        .setName('play')
        .setNameLocalizations(lang.names)
        .setDescription('Adds songs to the queue')
        .setDescriptionLocalizations(lang.descriptions)
        .addStringOption(input =>
            input.setName('query')
                .setDescription('A link to youtube or spotify or a search queue')
                .setRequired(true)
                .setNameLocalizations(lang.options[0].names)
                .setDescriptionLocalizations(lang.options[0].descriptions)
        ),

    async execute(interaction, bot, locale, ...params) {
        await interaction.deferReply().catch((error) => console.error(error))

        let voice_channel = interaction.member.voice.channel;
        if (!voice_channel) {
            // sendReply(msg.channel, titleEmbed(msg.guild, ServerQueue.errors.voiceChannelNotFound), 10000);
            return interaction.editReply({ embeds: [titleEmbed(interaction.guild, ServerQueue.errors.voiceChannelNotFound)], ephemeral: true });
        }

        let input = interaction.options.getString('query');
        console.log(input)
        if (!input) {
            // sendReply(interaction.channel, titleEmbed(interaction.guild, ServerQueue.errors.invalidArgument), 10000);
            return interaction.editReply({ embeds: [titleEmbed(interaction.guild, ServerQueue.errors.invalidArgument)], ephemeral: true });
        }

        let server_queue = globalQueue.get(interaction.guild.id);

        if (server_queue !== undefined) {
            if (server_queue.getVoiceChannel() !== voice_channel) {
                let content = ServerQueue.queueFormat.start + ServerQueue.errors.differentVoiceChannel + `<@${bot.user.id}> !` + ServerQueue.queueFormat.end;
                return interaction.editReply({ content: content, ephemeral: true })
            }
        }

        console.time("songObject")

        const songBuilder = new SongBuilder(input)

        let item = await songBuilder.build().catch((error) => console.error(error))
        console.timeEnd("songObject")
        console.log(item)
        if (!item) return interaction.editReply({ embeds: [titleEmbed(interaction.guild, 'Nessun risultato')], ephemeral: true })



        if (!server_queue) {
            console.log("Creating server queue")
            server_queue = new ServerQueue(item, interaction.channel, voice_channel);
            // adds songs to the global queue map
            globalQueue.set(interaction.guild.id, server_queue);
            await server_queue.play().catch(console.error)
        } else {
            server_queue.add(item)
        }
        if (Array.isArray(item)) {
            interaction.editReply({ embeds: [fieldEmbed(interaction.guild, 'Aggiunte alla coda', `**${item.length}** brani aggiunti alla coda!`)] }).catch((error) => console.error(error))
        } else {
            interaction.editReply({ embeds: [fieldEmbed(interaction.guild, 'Aggiunta alla coda', `[${item.title}](${item.url}) è in coda!`)] }).catch((error) => console.error(error))
        }

    },
    async run(msg, args, bot) {
        let voice_channel = await msg.member.voice.channel;
        if (!voice_channel) {
            // sendReply(msg.channel, titleEmbed(msg.guild, ServerQueue.errors.voiceChannelNotFound), 10000);
            return msg.reply({ embeds: [titleEmbed(msg.guild, ServerQueue.errors.voiceChannelNotFound)], ephemeral: true });
        }

        if (!args[0]) {
            // sendReply(msg.channel, titleEmbed(msg.guild, ServerQueue.errors.invalidArgument), 10000);
            return msg.reply({ embeds: [titleEmbed(msg.guild, ServerQueue.errors.invalidArgument)], ephemeral: true });
        }

        let server_queue = globalQueue.get(msg.guild.id);

        if (server_queue !== undefined) {
            if (server_queue.voiceChannel !== voice_channel)
                return msg.reply({ embeds: [titleEmbed(msg.guild, ServerQueue.errors.differentVoiceChannel + `<@${bot.user.id}> !`)], ephemeral: true });
        }

        let item = await ServerQueue.getSongObject(args);
        if (!item) return msg.reply({ embeds: [titleEmbed(msg.guild, 'Nessun risultato')], ephemeral: true })
        if (Array.isArray(item)) {
            sendReply(msg.channel, fieldEmbed(msg.guild, 'Aggiunte alla coda', `**${item.length}** brani aggiunti alla coda!`));
        } else {
            sendReply(msg.channel, fieldEmbed(msg.guild, 'Aggiunta alla coda', `[${item.title}](${item.url}) è in coda!`));
        }

        if (!server_queue) {
            server_queue = new ServerQueue(item, msg.channel, voice_channel);
            // adds songs to the global queue map
            globalQueue.set(msg.guild.id, server_queue);
            // plays the first song of the list
            await server_queue.play()
        } else {
            if (Array.isArray(item)) {
                item.forEach(v => {
                    if (!server_queue.getSongs().includes(v))
                        server_queue.add(v);
                })
            } else {
                if (!server_queue.getSongs().includes(item))
                    server_queue.add(item);
            }
        }
        reactToMsg(msg, '👌');
    }
}