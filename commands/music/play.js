const { globalQueue } = require('../../misc/globals')

const { serverQueue } = require('./serverQueue');

const { titleEmbed, fieldEmbed, sendReply, reactToMsg } = require('../../misc/functions')
const { ActionRowBuilder, ButtonBuilder, SlashCommandBuilder, ButtonStyle, ComponentType, ModalBuilder, TextInputBuilder, TextInputStyle, StringSelectMenuBuilder } = require('discord.js');


module.exports = {
    name: "play",
    aliases: ["p"],
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Aggiunge le canzoni alla coda')
        .addStringOption(input =>
            input.setName('input')
                .setDescription('Un link a Youtube o una stringa')
                .setRequired(true)
        ),

    async execute(interaction, bot) {
        let voice_channel = await interaction.member.voice.channel;
        if (!voice_channel) {
            // sendReply(msg.channel, titleEmbed(msg.guild, serverQueue.errors.voiceChannelNotFound), 10000);
            return interaction.reply({ embeds: [titleEmbed(interaction.guild, serverQueue.errors.voiceChannelNotFound)], ephemeral: true });
        }

        let input = interaction.options.getString('input');

        if (!input) {
            // sendReply(interaction.channel, titleEmbed(interaction.guild, serverQueue.errors.invalidArgument), 10000);
            return interaction.reply({ embeds: [titleEmbed(interaction.guild, serverQueue.errors.invalidArgument)], ephemeral: true });
        }

        input = input.split(' ');

        let server_queue = globalQueue.get(interaction.guild.id);

        if (server_queue !== undefined) {
            if (server_queue.voiceChannel !== voice_channel) {
                let content = serverQueue.queueFormat.start + serverQueue.errors.differentVoiceChannel + `<@${bot.user.id}> !` + serverQueue.queueFormat.end;
                return interaction.reply({ content: content, ephemeral: true })
            }
            // return interaction.reply({ embeds: [titleEmbed(interaction.guild, serverQueue.errors.differentVoiceChannel + `<@${bot.user.id}> !`)], ephemeral: true });
        }
        // await interaction.reply(`${serverQueue.queueFormat.start}\n${bot.user.username} is working, this may take some time ${serverQueue.queueFormat.end}`)
        await interaction.deferReply()
        console.time("songObject")
        let item = await serverQueue.getSongObject(input);
        console.timeEnd("songObject")

        if (!item) return interaction.editReply({ embeds: [titleEmbed(interaction.guild, 'Nessun risultato')], ephemeral: true })

        if (Array.isArray(item)) {
            interaction.editReply({ embeds: [fieldEmbed(interaction.guild, 'Aggiunte alla coda', `**${item.length}** brani aggiunti alla coda!`)] }).catch(error => console.log(error));
        } else {
            interaction.editReply({ embeds: [fieldEmbed(interaction.guild, 'Aggiunta alla coda', `[${item.title}](${item.url}) è in coda!`)] }).catch(error => console.log(error))
        }
        console.log("Creating server queue")
        if (!server_queue) {
            server_queue = new serverQueue(item, interaction.channel, voice_channel);
            // adds songs to the global queue map
            globalQueue.set(interaction.guild.id, server_queue);
            // plays the first song of the list
            await server_queue.play()
        } else {
            if (Array.isArray(item)) {
                server_queue.addMultiple(item);
            } else {
                server_queue.add(item);
            }
        }
    },
    async run(msg, args, bot) {
        let voice_channel = await msg.member.voice.channel;
        if (!voice_channel) {
            // sendReply(msg.channel, titleEmbed(msg.guild, serverQueue.errors.voiceChannelNotFound), 10000);
            return msg.reply({ embeds: [titleEmbed(msg.guild, serverQueue.errors.voiceChannelNotFound)], ephemeral: true });
        }

        if (!args[0]) {
            // sendReply(msg.channel, titleEmbed(msg.guild, serverQueue.errors.invalidArgument), 10000);
            return msg.reply({ embeds: [titleEmbed(msg.guild, serverQueue.errors.invalidArgument)], ephemeral: true });
        }

        let server_queue = globalQueue.get(msg.guild.id);

        if (server_queue !== undefined) {
            if (server_queue.voiceChannel !== voice_channel)
                return msg.reply({ embeds: [titleEmbed(msg.guild, serverQueue.errors.differentVoiceChannel + `<@${bot.user.id}> !`)], ephemeral: true });
        }

        let item = await serverQueue.getSongObject(args);
        if (!item) return msg.reply({ embeds: [titleEmbed(msg.guild, 'Nessun risultato')], ephemeral: true })
        if (Array.isArray(item)) {
            sendReply(msg.channel, fieldEmbed(msg.guild, 'Aggiunte alla coda', `**${item.length}** brani aggiunti alla coda!`));
        } else {
            sendReply(msg.channel, fieldEmbed(msg.guild, 'Aggiunta alla coda', `[${item.title}](${item.url}) è in coda!`));
        }

        if (!server_queue) {
            server_queue = new serverQueue(item, msg.channel, voice_channel);
            // adds songs to the global queue map
            globalQueue.set(msg.guild.id, server_queue);
            // plays the first song of the list
            await server_queue.play()
        } else {
            if (Array.isArray(item)) {
                server_queue.addMultiple(item);
            } else {
                server_queue.add(item);
            }
        }
        reactToMsg(msg, '👌');
    }
}