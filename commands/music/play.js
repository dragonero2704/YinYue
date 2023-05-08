const { globalQueue } = require('../../misc/globals')

const { ServerQueue } = require('./serverQueue');

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
        let voice_channel = await interaction.member.voice.channel;
        if (!voice_channel) {
            // sendReply(msg.channel, titleEmbed(msg.guild, ServerQueue.errors.voiceChannelNotFound), 10000);
            return interaction.reply({ embeds: [titleEmbed(interaction.guild, ServerQueue.errors.voiceChannelNotFound)], ephemeral: true });
        }

        let input = interaction.options.getString('query');

        if (!input) {
            // sendReply(interaction.channel, titleEmbed(interaction.guild, ServerQueue.errors.invalidArgument), 10000);
            return interaction.reply({ embeds: [titleEmbed(interaction.guild, ServerQueue.errors.invalidArgument)], ephemeral: true });
        }

        input = input.split(' ');

        let server_queue = globalQueue.get(interaction.guild.id);

        if (server_queue !== undefined) {
            if (server_queue.voiceChannel !== voice_channel) {
                let content = ServerQueue.queueFormat.start + ServerQueue.errors.differentVoiceChannel + `<@${bot.user.id}> !` + ServerQueue.queueFormat.end;
                return interaction.reply({ content: content, ephemeral: true })
            }
        }

        await interaction.deferReply()
        console.time("songObject")
        let item = await ServerQueue.getSongObject(input);
        console.timeEnd("songObject")
        // console.log(item)
        if (!item) return interaction.editReply({ embeds: [titleEmbed(interaction.guild, 'Nessun risultato')], ephemeral: true })

        if (Array.isArray(item)) {
            interaction.editReply({ embeds: [fieldEmbed(interaction.guild, 'Aggiunte alla coda', `**${item.length}** brani aggiunti alla coda!`)] }).catch(console.log)
        } else {
            interaction.editReply({ embeds: [fieldEmbed(interaction.guild, 'Aggiunta alla coda', `[${item.title}](${item.url}) è in coda!`)] }).catch(console.log)
        }
        console.log("Creating server queue")
        if (!server_queue) {
            server_queue = new ServerQueue(item, interaction.channel, voice_channel);
            // adds songs to the global queue map
            globalQueue.set(interaction.guild.id, server_queue);
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
        return
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