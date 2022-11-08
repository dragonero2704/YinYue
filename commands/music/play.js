const voice = require('@discordjs/voice');
const { ActionRowBuilder, ButtonBuilder, SlashCommandBuilder, ButtonStyle, InteractionType, InteractionResponseType, ButtonInteraction } = require('discord.js');
const {serverQueue} = require('./serverQueue')
const {titleEmbed, fieldEmbed, sendReply, reactToMsg} = require('../../misc/functions')
let globalQueue = new Map()

let blank_field = '\u200b'

module.exports = {
    name: 'play',
    aliases: ['p', 'pause', 'skip', 's', 'jump', 'j', 'stop', 'die', 'l', 'loop', 'resume', 'q', 'queue', 'remove', 'r', 'shuffle'],
    args: ['[input]'],
    description: 'plays some music!',
    once: false,
    disabled: false,
    data: [new SlashCommandBuilder()
        .setName('play')
        .setDescription('Aggiunge le canzoni alla coda')
        .addStringOption(input =>
            input.setName('input')
                .setDescription('Un link a Youtube o una stringa')
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Mette in pausa'),

    new SlashCommandBuilder()
        .setName('resume')
        .setDescription('Riprende la musica'),

    new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Salta al brano successivo'),

    new SlashCommandBuilder()
        .setName('jump')
        .setDescription('Salta al brano n')
        .addNumberOption(option =>
            option
                .setName('index')
                .setDescription('Un numero da 0 al numero dei brani della coda')
                .setMinValue(1)
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName('die')
        .setDescription('Spegne la musica e svuota la coda'),

    new SlashCommandBuilder()
        .setName('loop')
        .setDescription('Cambia lo stato del loop')
        // .addStringOption(opt =>
        //     opt
        //     .setName('state')
        //     .setDescription('stato del loop')
        //     .addChoice('disabled', 'disabled')
        //     .addChoice('queue', 'queue')
        //     .addChoice('track', 'track')
        // ),
        .addSubcommand(sub =>
            sub
                .setName('disabled')
                .setDescription('Loop disabilitato')
        )
        .addSubcommand(sub =>
            sub
                .setName('queue')
                .setDescription('Loop abilitato sulla coda')
        )
        .addSubcommand(sub =>
            sub
                .setName('track')
                .setDescription('Loop sul brano')
        ),
    new SlashCommandBuilder()
        .setName('remove')
        .setDescription('rimuove un brano dalla coda')
        .addNumberOption(num =>
            num.setName('index')
                .setDescription('Indice del brano che si vuole eliminare dalla coda')
                .setMinValue(1)
                .setRequired(true)),

    new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Mostra la coda'),

    new SlashCommandBuilder()
        .setName('shuffle')
        .setDescription('Mixes the queue'),
    ],
    async execute(interaction, bot) {
        const { commandName } = interaction
        let cmd = commandName
        // await interaction.deferReply();
        switch (cmd) {
            case 'play':
            case 'p':
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

                let item = await serverQueue.getSongObject(input);
                if (!item) return interaction.reply({ embeds: [titleEmbed(interaction.guild, 'Nessun risultato')], ephemeral: true })
                if (Array.isArray(item)) {
                    // sendReply(interaction.channel, fieldEmbed(interaction.guild, 'Aggiunte alla coda', `**${item.length}** brani aggiunti alla coda!`));
                    interaction.reply({ embeds: [fieldEmbed(interaction.guild, 'Aggiunte alla coda', `**${item.length}** brani aggiunti alla coda!`)] });
                } else {
                    // sendReply(interaction.channel, fieldEmbed(interaction.guild, 'Aggiunta alla coda', `[${item.title}](${item.url}) è in coda!`));
                    interaction.reply({ embeds: [fieldEmbed(interaction.guild, 'Aggiunta alla coda', `[${item.title}](${item.url}) è in coda!`)] })
                }

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
                // reactToMsg(interaction, '👌');
                break;
            case 'shuffle':
                {
                    let voice_channel = await interaction.member.voice.channel;
                    if (!voice_channel) {
                        return interaction.reply({ embeds: [titleEmbed(interaction.guild, serverQueue.errors.voiceChannelNotFound)], ephemeral: true });
                    }
                    let server_queue = globalQueue.get(interaction.guild.id);
                    if (!server_queue) {
                        return interaction.reply({ embeds: [titleEmbed(interaction.guild, serverQueue.errors.queueNotFound)], ephemeral: true });
                    }
                    if (server_queue.voiceChannel !== voice_channel && server_queue !== undefined)
                        return interaction.reply({ embeds: [titleEmbed(interaction.guild, serverQueue.errors.differentVoiceChannel + `<@${bot.user.id}> !`)], ephemeral: true });
                    let song = server_queue.nextTrack(true);

                    server_queue.shuffle()
                    interaction.reply(`${serverQueue.queueFormat.start}\nShuffled ${server_queue.getSongsLength()} songs\n${serverQueue.queueFormat.end}`);
                }
                break
            case 'pause':
                {
                    let voice_channel = await interaction.member.voice.channel;
                    if (!voice_channel) {
                        return interaction.reply({ embeds: [titleEmbed(interaction.guild, serverQueue.errors.voiceChannelNotFound)], ephemeral: true });
                    }
                    let server_queue = globalQueue.get(interaction.guild.id);
                    if (!server_queue) {
                        return interaction.reply({ embeds: [titleEmbed(interaction.guild, serverQueue.errors.queueNotFound)], ephemeral: true });
                    }
                    if (server_queue.voiceChannel !== voice_channel && server_queue !== undefined)
                        return interaction.reply({ embeds: [titleEmbed(interaction.guild, serverQueue.errors.differentVoiceChannel + `<@${bot.user.id}> !`)], ephemeral: true });

                    interaction.reply(`${serverQueue.queueFormat.start}\nPausa\n${serverQueue.queueFormat.end}`);
                    server_queue.pause();
                    // reactToMsg(interaction, '⏸️');
                }
                break;

            case 'resume':
                {
                    let voice_channel = await interaction.member.voice.channel;
                    if (!voice_channel) {
                        return interaction.reply({ embeds: [titleEmbed(interaction.guild, serverQueue.errors.voiceChannelNotFound)], ephemeral: true });
                    }
                    let server_queue = globalQueue.get(interaction.guild.id);
                    if (!server_queue) {
                        return interaction.reply({ embeds: [titleEmbed(interaction.guild, serverQueue.errors.queueNotFound)], ephemeral: true });
                    }
                    if (server_queue.voiceChannel !== voice_channel && server_queue !== undefined)
                        return interaction.reply({ embeds: [titleEmbed(interaction.guild, serverQueue.errors.differentVoiceChannel + `<@${bot.user.id}> !`)], ephemeral: true });
                    interaction.reply(`${serverQueue.queueFormat.start}\nRiprendo\n${serverQueue.queueFormat.end}`);

                    server_queue.resume();
                    // reactToMsg(interaction, '▶️');
                }
                break

            case 'skip':
            case 's':
                {
                    let voice_channel = await interaction.member.voice.channel;
                    if (!voice_channel) {
                        return interaction.reply({ embeds: [titleEmbed(interaction.guild, serverQueue.errors.voiceChannelNotFound)], ephemeral: true });
                    }
                    let server_queue = globalQueue.get(interaction.guild.id);
                    if (!server_queue) {
                        return interaction.reply({ embeds: [titleEmbed(interaction.guild, serverQueue.errors.queueNotFound)], ephemeral: true });
                    }
                    if (server_queue.voiceChannel !== voice_channel && server_queue !== undefined)
                        return interaction.reply({ embeds: [titleEmbed(interaction.guild, serverQueue.errors.differentVoiceChannel + `<@${bot.user.id}> !`)], ephemeral: true });
                    let song = server_queue.nextTrack(true);
                    // console.log(song);

                    if (song) {
                        interaction.reply(`${serverQueue.queueFormat.start}\nSalto a [${song.title}](${song.url})\n${serverQueue.queueFormat.end}`);
                        await server_queue.play(song);
                    } else {
                        server_queue.die();
                        globalQueue.delete(interaction.guild.id);
                        // sendReply(interaction.channel, titleEmbed(interaction.guild, serverQueue.responses.endQueue))
                        interaction.reply({ embeds: [titleEmbed(interaction.guild, serverQueue.responses.endQueue)] })
                    }
                    // reactToMsg(interaction, '⏭️');
                }
                break;

            case 'jump':
            case 'j':
                {
                    let voice_channel = await interaction.member.voice.channel;
                    if (!voice_channel) {
                        sendReply(interaction.channel, titleEmbed(interaction.guild, serverQueue.errors.voiceChannelNotFound), 10000);
                        return;
                    }
                    let server_queue = globalQueue.get(interaction.guild.id);
                    if (!server_queue) {
                        sendReply(interaction.channel, titleEmbed(interaction.guild, serverQueue.errors.queueNotFound), 10000);
                        return;
                    }
                    if (server_queue.voiceChannel !== voice_channel && server_queue !== undefined)
                        return interaction.reply({ embeds: [titleEmbed(interaction.guild, serverQueue.errors.differentVoiceChannel + `<@${bot.user.id}> !`)], ephemeral: true });

                    let index = interaction.options.getNumber('index');
                    if (!index || index < 1 || index > server_queue.songs.length) {
                        interaction.reply({ embeds: [titleEmbed(interaction.guild, `Inserire un numero tra 1 e ${server_queue.getSongs().length}`)], ephemeral: true });
                        return;
                    }
                    interaction.reply(`${serverQueue.queueFormat.start}\nSalto a [${(server_queue.getSongs()[index - 1]).title}](${(server_queue.getSongs()[index - 1]).url})\n${serverQueue.queueFormat.end}`);

                    await server_queue.jump(index - 1);
                    // reactToMsg(interaction, '👍')
                }
                break;

            case 'die':
            case 'd':
                {
                    let voice_channel = await interaction.member.voice.channel;
                    if (!voice_channel) {
                        sendReply(interaction.channel, titleEmbed(interaction.guild, serverQueue.errors.voiceChannelNotFound), 10000);
                        return;
                    }
                    let server_queue = globalQueue.get(interaction.guild.id);
                    if (!server_queue) {
                        sendReply(interaction.channel, titleEmbed(interaction.guild, serverQueue.errors.queueNotFound), 10000);
                        return;
                    }
                    if (server_queue.voiceChannel !== voice_channel && server_queue !== undefined)
                        return interaction.reply({ embeds: [titleEmbed(interaction.guild, serverQueue.errors.differentVoiceChannel + `<@${bot.user.id}> !`)], ephemeral: true });
                    server_queue.die(true);
                    server_queue = undefined;
                    globalQueue.delete(interaction.guild.id);
                    interaction.reply(blank_field);
                    interaction.deleteReply();
                    // reactToMsg(interaction, '👋');
                }
                break;

            case 'loop':
            case 'l':
                {
                    let voice_channel = await interaction.member.voice.channel;
                    if (!voice_channel) {
                        return interaction.reply({ embeds: [titleEmbed(interaction.guild, serverQueue.errors.voiceChannelNotFound)], ephemeral: true });
                    }
                    let server_queue = globalQueue.get(interaction.guild.id);
                    if (!server_queue) {
                        return interaction.reply({ embeds: [titleEmbed(interaction.guild, serverQueue.errors.queueNotFound)], ephemeral: true });
                    }
                    if (server_queue.voiceChannel !== voice_channel && server_queue !== undefined)
                        return interaction.reply({ embeds: [titleEmbed(interaction.guild, serverQueue.errors.differentVoiceChannel + `<@${bot.user.id}> !`)], ephemeral: true });
                    // let mode = interaction.options.getString('state');
                    switch (interaction.options.getSubcommand()) {
                        case 'disabled':
                            mode = 'disabled'
                            break;
                        case 'queue':
                            mode = 'queue';
                            break;
                        case 'track':
                            mode = 'track';
                            break;

                        default:
                            mode = undefined;
                            break;
                    }

                    switch (server_queue.changeLoopState(mode)) {
                        case serverQueue.loopStates.disabled:
                            // sendReply(interaction.channel, titleEmbed(interaction.guild, serverQueue.responses.loopDisabled))
                            // reactToMsg(interaction, '➡️');
                            interaction.reply(`${serverQueue.queueFormat.start}\nLoop: disabled\n${serverQueue.queueFormat.end}`);
                            break;
                        case serverQueue.loopStates.queue:
                            // sendReply(interaction.channel, titleEmbed(interaction.guild, serverQueue.responses.loopEnabled));
                            // reactToMsg(interaction, '🔁');
                            interaction.reply(`${serverQueue.queueFormat.start}\nLoop: queue\n${serverQueue.queueFormat.end}`);
                            break;
                        case serverQueue.loopStates.track:
                            // sendReply(interaction.channel, titleEmbed(interaction.guild, serverQueue.responses.loopEnabledTrack));
                            // reactToMsg(interaction, '🔂');
                            interaction.reply(`${serverQueue.queueFormat.start}\nLoop: track\n${serverQueue.queueFormat.end}`);
                            break;
                    }
                }
                break;

            case 'queue':
            case 'q':
                {
                    let voice_channel = await interaction.member.voice.channel;
                    if (!voice_channel) {
                        return interaction.reply({ embeds: [titleEmbed(interaction.guild, serverQueue.errors.voiceChannelNotFound)], ephemeral: true });
                    }
                    let server_queue = globalQueue.get(interaction.guild.id);
                    if (!server_queue) {
                        return interaction.reply({ embeds: [titleEmbed(interaction.guild, serverQueue.errors.queueNotFound)], ephemeral: true });
                    }
                    if (server_queue.voiceChannel !== voice_channel && server_queue !== undefined)
                        return interaction.reply({ embeds: [titleEmbed(interaction.guild, serverQueue.errors.differentVoiceChannel + `<@${bot.user.id}> !`)], ephemeral: true });

                    let songs = server_queue.getSongs();
                    if (songs.length === 0) {
                        return interaction.reply({ embeds: [titleEmbed(interaction.guild, serverQueue.errors.emptyQueue)] });
                        // (interaction.channel, titleEmbed(interaction.guild, serverQueue.errors.emptyQueue), 10000);
                    }

                    server_queue.stopCollector();

                    let pages = server_queue.queuePages();

                    let queue = [serverQueue.queueFormat.start];
                    queue = queue.concat(pages[0]);
                    queue.push(serverQueue.queueFormat.end);
                    queue = queue.join('\n');

                    const row = new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('FirstPage').setLabel('<<').setStyle(ButtonStyle.Primary),
                        new ButtonBuilder().setCustomId('Previous').setLabel('<').setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder().setCustomId('Next').setLabel('>').setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder().setCustomId('LastPage').setLabel('>>').setStyle(ButtonStyle.Primary),
                    )
                    interaction.reply(blank_field);
                    interaction.deleteReply();
                    let queueinteraction = await interaction.channel.send({ content: queue, components: [row] });
                    server_queue.startCollector(queueinteraction)
                }
                break

            case 'remove':
            case 'r':
                {
                    let voice_channel = await interaction.member.voice.channel;
                    if (!voice_channel) {
                        return interaction.reply({ embeds: [titleEmbed(interaction.guild, serverQueue.errors.voiceChannelNotFound)], ephemeral: true });
                    }
                    let server_queue = globalQueue.get(interaction.guild.id);
                    if (!server_queue) {
                        return interaction.reply({ embeds: [titleEmbed(interaction.guild, serverQueue.errors.queueNotFound)], ephemeral: true });
                    }
                    if (server_queue.voiceChannel !== voice_channel && server_queue !== undefined)
                        return interaction.reply({ embeds: [titleEmbed(interaction.guild, serverQueue.errors.differentVoiceChannel + `<@${bot.user.id}> !`)], ephemeral: true });
                    let index = interaction.options.getNumber('index');
                    if (!index || index < 1 || index > server_queue.songs.length) {
                        interaction.reply({ embeds: [titleEmbed(interaction.guild, `Inserire un numero tra 1 e ${server_queue.songs.length}`)], ephemeral: true });
                        return;
                    }
                    interaction.reply(`${serverQueue.queueFormat.start}\n${index}. [${(server_queue.getSongs()[index - 1]).title}](${(server_queue.getSongs()[index - 1]).url}) rimossa\n${serverQueue.queueFormat.end}`)
                    server_queue.remove(index - 1);
                    // reactToMsg(interaction, '❌')
                }
                break
        }
    },

    async run(msg, args, bot) {
        const cmd = args.shift().toLowerCase()
        switch (cmd) {
            case 'play':
            case 'p':
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

                break;
            case 'shuffle':
                {
                    let voice_channel = await msg.member.voice.channel;
                    if (!voice_channel) {
                        return msg.reply({ embeds: [titleEmbed(msg.guild, serverQueue.errors.voiceChannelNotFound)], ephemeral: true });
                    }
                    let server_queue = globalQueue.get(msg.guild.id);
                    if (!server_queue) {
                        return msg.reply({ embeds: [titleEmbed(msg.guild, serverQueue.errors.queueNotFound)], ephemeral: true });
                    }
                    if (server_queue !== undefined) {
                        if (server_queue.voiceChannel !== voice_channel)
                            return msg.reply({ embeds: [titleEmbed(msg.guild, serverQueue.errors.differentVoiceChannel + `<@${bot.user.id}> !`)], ephemeral: true });
                    }
                    server_queue.shuffle()
                    reactToMsg(msg, '🔀');
                }
                break;
            case 'pause':
                {
                    let voice_channel = await msg.member.voice.channel;
                    if (!voice_channel) {
                        return msg.reply({ embeds: [titleEmbed(msg.guild, serverQueue.errors.voiceChannelNotFound)], ephemeral: true });
                    }
                    let server_queue = globalQueue.get(msg.guild.id);
                    if (!server_queue) {
                        return msg.reply({ embeds: [titleEmbed(msg.guild, serverQueue.errors.queueNotFound)], ephemeral: true });
                    }
                    if (server_queue !== undefined) {
                        if (server_queue.voiceChannel !== voice_channel)
                            return msg.reply({ embeds: [titleEmbed(msg.guild, serverQueue.errors.differentVoiceChannel + `<@${bot.user.id}> !`)], ephemeral: true });
                    }

                    server_queue.pause();
                    reactToMsg(msg, '⏸️');

                }
                break;

            case 'resume':
                {
                    let voice_channel = await msg.member.voice.channel;
                    if (!voice_channel) {
                        return msg.reply({ embeds: [titleEmbed(msg.guild, serverQueue.errors.voiceChannelNotFound)], ephemeral: true });
                    }
                    let server_queue = globalQueue.get(msg.guild.id);
                    if (!server_queue) {
                        return msg.reply({ embeds: [titleEmbed(msg.guild, serverQueue.errors.queueNotFound)], ephemeral: true });
                    }
                    if (server_queue !== undefined) {
                        if (server_queue.voiceChannel !== voice_channel)
                            return msg.reply({ embeds: [titleEmbed(msg.guild, serverQueue.errors.differentVoiceChannel + `<@${bot.user.id}> !`)], ephemeral: true });
                    }

                    server_queue.resume();
                    reactToMsg(msg, '▶️');
                }
                break;

            case 'skip':
            case 's':
                {
                    let voice_channel = await msg.member.voice.channel;
                    if (!voice_channel) {
                        return msg.reply({ embeds: [titleEmbed(msg.guild, serverQueue.errors.voiceChannelNotFound)], ephemeral: true });
                    }
                    let server_queue = globalQueue.get(msg.guild.id);
                    if (!server_queue) {
                        return msg.reply({ embeds: [titleEmbed(msg.guild, serverQueue.errors.queueNotFound)], ephemeral: true });
                    }
                    if (server_queue !== undefined) {
                        if (server_queue.voiceChannel !== voice_channel)
                            return msg.reply({ embeds: [titleEmbed(msg.guild, serverQueue.errors.differentVoiceChannel + `<@${bot.user.id}> !`)], ephemeral: true });
                    }

                    let song = server_queue.nextTrack(true);
                    // console.log(song);
                    if (song) {
                        await server_queue.play(song);
                    } else {
                        server_queue.die();
                        globalQueue.delete(msg.guild.id);
                        sendReply(msg.channel, titleEmbed(msg.guild, serverQueue.responses.endQueue))
                    }
                    reactToMsg(msg, '⏭️');
                }
                break;

            case 'jump':
            case 'j':
                {
                    let voice_channel = await msg.member.voice.channel;
                    if (!voice_channel) {
                        sendReply(msg.channel, titleEmbed(msg.guild, serverQueue.errors.voiceChannelNotFound), 10000);
                        return;
                    }
                    let server_queue = globalQueue.get(msg.guild.id);
                    if (!server_queue) {
                        sendReply(msg.channel, titleEmbed(msg.guild, serverQueue.errors.queueNotFound), 10000);
                        return;
                    }
                    if (server_queue !== undefined) {
                        if (server_queue.voiceChannel !== voice_channel)
                            return msg.reply({ embeds: [titleEmbed(msg.guild, serverQueue.errors.differentVoiceChannel + `<@${bot.user.id}> !`)], ephemeral: true });
                    }

                    let index = parseInt(args[0])
                    if (!index || index < 1 || index > server_queue.songs.length) {
                        msg.reply({ embeds: [titleEmbed(msg.guild, `Inserire un numero tra 1 e ${server_queue.songs.length}`)], ephemeral: true });
                        return;
                    }
                    let songs = server_queue.getSongs();
                    await server_queue.jump(index - 1);
                    reactToMsg(msg, '👍')
                }
                break;

            case 'die':
            case 'd':
                {
                    let voice_channel = await msg.member.voice.channel;
                    if (!voice_channel) {
                        sendReply(msg.channel, titleEmbed(msg.guild, serverQueue.errors.voiceChannelNotFound), 10000);
                        return;
                    }
                    let server_queue = globalQueue.get(msg.guild.id);
                    if (!server_queue) {
                        sendReply(msg.channel, titleEmbed(msg.guild, serverQueue.errors.queueNotFound), 10000);
                        return;
                    }
                    if (server_queue !== undefined) {
                        if (server_queue.voiceChannel !== voice_channel)
                            return msg.reply({ embeds: [titleEmbed(msg.guild, serverQueue.errors.differentVoiceChannel + `<@${bot.user.id}> !`)], ephemeral: true });
                    }

                    server_queue.die(true);
                    server_queue = undefined;
                    globalQueue.delete(msg.guild.id);
                    reactToMsg(msg, '👋');
                }
                break;

            case 'loop':
            case 'l':
                {
                    let voice_channel = await msg.member.voice.channel;
                    if (!voice_channel) {
                        return msg.reply({ embeds: [titleEmbed(msg.guild, serverQueue.errors.voiceChannelNotFound)], ephemeral: true });
                    }
                    let server_queue = globalQueue.get(msg.guild.id);
                    if (!server_queue) {
                        return msg.reply({ embeds: [titleEmbed(msg.guild, serverQueue.errors.queueNotFound)], ephemeral: true });
                    }
                    if (server_queue !== undefined) {
                        if (server_queue.voiceChannel !== voice_channel)
                            return msg.reply({ embeds: [titleEmbed(msg.guild, serverQueue.errors.differentVoiceChannel + `<@${bot.user.id}> !`)], ephemeral: true });
                    }

                    let mode = undefined
                    if (args.length !== 0)
                        mode = args[0];

                    switch (server_queue.changeLoopState(mode)) {
                        case serverQueue.loopStates.disabled:
                            // sendReply(msg.channel, titleEmbed(msg.guild, serverQueue.responses.loopDisabled))
                            reactToMsg(msg, '➡️');
                            break;
                        case serverQueue.loopStates.queue:
                            // sendReply(msg.channel, titleEmbed(msg.guild, serverQueue.responses.loopEnabled));
                            reactToMsg(msg, '🔁');

                            break;
                        case serverQueue.loopStates.track:
                            // sendReply(msg.channel, titleEmbed(msg.guild, serverQueue.responses.loopEnabledTrack));
                            reactToMsg(msg, '🔂');
                            break;
                    }
                }
                break;

            case 'queue':
            case 'q':
                {
                    let voice_channel = await msg.member.voice.channel;
                    if (!voice_channel) {
                        return msg.reply({ embeds: [titleEmbed(msg.guild, serverQueue.errors.voiceChannelNotFound)], ephemeral: true });
                    }
                    let server_queue = globalQueue.get(msg.guild.id);
                    if (!server_queue) {
                        return msg.reply({ embeds: [titleEmbed(msg.guild, serverQueue.errors.queueNotFound)], ephemeral: true });
                    }
                    if (server_queue !== undefined) {
                        if (server_queue.voiceChannel !== voice_channel)
                            return msg.reply({ embeds: [titleEmbed(msg.guild, serverQueue.errors.differentVoiceChannel + `<@${bot.user.id}> !`)], ephemeral: true });
                    }

                    let songs = server_queue.getSongs();
                    if (songs.length === 0) {
                        sendReply(msg.channel, titleEmbed(msg.guild, serverQueue.errors.emptyQueue), 10000);
                        return;
                    }

                    server_queue.stopCollector();

                    //function in serverQueue
                    // takes the pages
                    let pages = server_queue.queuePages();
                    // console.log(pages)

                    let queue = [serverQueue.queueFormat.start];
                    queue = queue.concat(pages[0]);
                    queue.push(serverQueue.queueFormat.end);
                    queue = queue.join('\n');

                    const row = new MessageActionRow().addComponents(
                        new ButtonBuilder().setCustomId('FirstPage').setLabel('<<').setStyle('PRIMARY'),
                        new ButtonBuilder().setCustomId('Previous').setLabel('<').setStyle('SECONDARY'),
                        new ButtonBuilder().setCustomId('Next').setLabel('>').setStyle('SECONDARY'),
                        new ButtonBuilder().setCustomId('LastPage').setLabel('>>').setStyle('PRIMARY'),
                    )

                    let queueMsg = await msg.channel.send({ content: queue, components: [row] })
                    server_queue.startCollector(queueMsg)
                }
                break

            case 'remove':
            case 'r':
                {
                    let voice_channel = await msg.member.voice.channel;
                    if (!voice_channel) {
                        return msg.reply({ embeds: [titleEmbed(msg.guild, serverQueue.errors.voiceChannelNotFound)], ephemeral: true });
                    }
                    let server_queue = globalQueue.get(msg.guild.id);
                    if (!server_queue) {
                        return msg.reply({ embeds: [titleEmbed(msg.guild, serverQueue.errors.queueNotFound)], ephemeral: true });
                    }
                    if (server_queue !== undefined) {
                        if (server_queue.voiceChannel !== voice_channel)
                            return msg.reply({ embeds: [titleEmbed(msg.guild, serverQueue.errors.differentVoiceChannel + `<@${bot.user.id}> !`)], ephemeral: true });
                    }

                    let index = parseInt(args[0])
                    if (!index || index < 1 || index > server_queue.songs.length) {
                        msg.reply({ embeds: [titleEmbed(msg.guild, `Inserire un numero tra 1 e ${server_queue.songs.length}`)], ephemeral: true });
                        return;
                    }

                    server_queue.remove(index - 1);
                    reactToMsg(msg, '❌')
                }
                break

        }
    }
}