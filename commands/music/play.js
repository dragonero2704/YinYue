const play_dl = require('play-dl');
const voice = require('@discordjs/voice');
const { ActionRowBuilder, ButtonBuilder, SlashCommandBuilder, ButtonStyle, InteractionType, InteractionResponseType, ButtonInteraction } = require('discord.js');
const { titleEmbed, fieldEmbed, sendReply, reactToMsg } = require('../../misc/functions')
let globalQueue = new Map()

let blank_field = '\u200b'

class serverQueue {
    constructor(songs, txtChannel, voiceChannel) {
        this.songs = [];
        if (Array.isArray(songs)) {
            // console.log('Constructed an array of songs')
            this.songs = songs;
        } else {
            // console.log('Added a song')
            this.songs = [songs];
        }
        // console.log(this.songs)
        this.curPlayingSong = this.songs[0];
        this.loopState = serverQueue.loopStates.disabled;

        this.txtChannel = txtChannel;
        this.voiceChannel = voiceChannel;

        try {
            this.connection = voice.joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: txtChannel.guild.id,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator,
            });
        } catch (error) {
            console.log(new Error(error))
            return
        }
        // player
        this.player = voice.createAudioPlayer({
            behaviors: {
                noSubscriber: voice.NoSubscriberBehavior.Play
            }
        })

        this.connection.on(voice.VoiceConnectionStatus.Disconnected, async (oldState, newState) => {
            try {
                await Promise.race([
                    voice.entersState(connection, voice.VoiceConnectionStatus.Signalling, 5000),
                    voice.entersState(connection, voice.VoiceConnectionStatus.Connecting, 5000),
                ]);
                // Seems to be reconnecting to a new channel - ignore disconnect
                this.voiceChannel = await this.txtChannel.guild.channels.cache.get(this.connection.joinConfig.channelId)
            } catch (error) {
                // Seems to be a real disconnect which SHOULDN'T be recovered from
                this.connection.destroy();
                this.die(true);
            }
        })

        this.player.on('stateChange', (oldState, newState) => {
            console.log(`Player state: ${oldState.status} => ${newState.status}`);
        })

        this.player.on(voice.AudioPlayerStatus.Playing, async (oldState, newState) => {
            let song = newState.resource.metadata;
            console.log(`Now playing: ${song.title}`);
            await sendReply(this.txtChannel, fieldEmbed(this.txtChannel.guild, 'In riproduzione', `[**${song.title}**](${song.url})`), 10000);
        })

        this.player.on(voice.AudioPlayerStatus.Buffering, (oldState, newState) => {
            console.log(`Buffering ${newState.resource.metadata.title}`);
        })

        this.player.on(voice.AudioPlayerStatus.Idle, async (oldState, newState) => {
            let song = this.nextTrack();
            // console.log(song)
            if (song) {
                await this.play(song)
            } else {
                this.die();
                globalQueue.delete(this.voiceChannel.guild.id);
            }

        })
        this.player.on('error', error => {
            console.error(`Error: ${error.message} with resource ${error.resource.metadata.title}`);
        });

        this.sub = this.connection.subscribe(this.player)
        //queue 
        this.queueCollector = undefined;
        this.pageIndex = undefined;
    }

    static loopStates = {
        disabled: 0,
        queue: 1,
        track: 2,
    }

    static errors = {
        queueNotFound: 'Coda non trovata',
        voiceChannelNotFound: 'Devi essere in un canale vocale',
        invalidArgument: 'Inserire una parola chiave o un url',
        emptyQueue: 'La coda è vuota',
        oldQueue: 'Questa coda non è più valida. Vai a quella più [recente]',
        differentVoiceChannel: `Devi essere nello stesso canale di `
    }

    static responses = {
        loopDisabled: 'Loop disabilitato',
        loopEnabled: 'Loop abilitato sulla coda',
        loopEnabledTrack: 'Loop abilitato sulla traccia',
        newTrack: 'Aggiunta alla coda',
        endQueue: 'Coda terminata',
    }

    static queueFormat = {
        start: '```Python',
        end: '```'
    }

    static async getSongObject(args) {
        // isurl
        let query = args.join(' ');
        // console.log(query)
        let type_url = await play_dl.validate(query)
        try {
            type_url = type_url.split('_')
        } catch (error) { }
        switch (type_url[0]) {
            //youtube
            case 'yt':
                switch (type_url[1]) {
                    case 'video':
                        {
                            let media = (await play_dl.video_basic_info(query)).video_details
                            // console.log(media)
                            let song = {
                                url: media.url,
                                title: media.title,
                                thumbnail: media.thumbnail,
                                duration: media.durationInSec,
                                durationRaw: media.durationRaw,
                            }
                            return song;
                        }

                        break;
                    case 'playlist':
                        {
                            let songs = []
                            console.log(query)
                            let videos = await (await play_dl.playlist_info(query)).all_videos()
                            // let videos = await playlist.all_videos()
                            // console.log(playlist)
                            for (const video of videos) {
                                let song = {
                                    url: video.url,
                                    title: video.title,
                                    thumbnail: video.thumbnail,
                                    duration: video.durationInSec,
                                    durationRaw: video.durationRaw,
                                }
                                songs.push(song)
                            }
                            return songs;
                        }
                        break;
                    case 'album':
                        break;
                }
                break;
            //spotify
            case 'sp':
                if (play_dl.is_expired()) { await play_dl.refreshToken() }
                let playlist = await play_dl.spotify(query)
                
                switch (type_url[1]) {
                    case 'album':
                        {
                            // console.log(playlist)
                            let tracks = await playlist.all_tracks()
                            // console.log(tracks)
                            console.log(`fetching ${playlist.tracksCount} tracks from Youtube...`);
                            let songs = [];
                            for (let i = 0; i < playlist.tracksCount; i++) {

                                let yt_video = (await play_dl.search(tracks[i].name, { limit: 1 }))[0]
                                // console.log(yt_video)
                                let song = {
                                    url: yt_video.url,
                                    title: yt_video.title,
                                    thumbnail: yt_video.thumbnail,
                                    duration: yt_video.durationInSec,
                                    durationRaw: yt_video.durationRaw,

                                }
                                songs.push(song)
                            }
                            console.log('done')
                            return songs;
                        }
                        break;
                    case 'playlist':
                        {
                            let playlist = await play_dl.spotify(query)
                            // console.log(playlist)
                            let tracks = await playlist.all_tracks()
                            // console.log(tracks)
                            console.log(`fetching ${playlist.tracksCount} tracks from Youtube...`);
                            let songs = [];
                            for (let i = 0; i < playlist.tracksCount; i++) {

                                let yt_video = (await play_dl.search(tracks[i].name, { limit: 1 }))[0]
                                // console.log(yt_video)
                                let song = {
                                    url: yt_video.url,
                                    title: yt_video.title,
                                    thumbnail: yt_video.thumbnail,
                                    duration: yt_video.durationInSec,
                                    durationRaw: yt_video.durationRaw,

                                }
                                songs.push(song)
                            }
                            console.log('done')
                            return songs;
                        }
                        break;
                    case 'track':
                        {
                            let track = await play_dl.spotify(query);
                            let yt_video = (await play_dl.search(track.name, { limit: 1 }))[0]

                            let song = {
                                url: yt_video.url,
                                title: yt_video.name,
                                thumbnail: yt_video.thumbnail,
                                duration: yt_video.durationInSec,
                                durationRaw: yt_video.durationRaw,
                            }
                            return song;
                        }
                        break;
                }
            //soundcloud
            case 'so':
                //not implemented 
                play_dl.getFreeClientID().then((clientID) => play_dl.setToken({
                    soundcloud: {
                        client_id: clientID
                    }
                }))
                break;

            default:
                {
                    console.log(`Searching for '${query}' on YT`);
                    let media = (await play_dl.search(query, { type: 'video', limit: 1 }))[0];
                    if (!media) return undefined;
                    let song = {
                        url: media.url,
                        title: media.title,
                        thumbnail: media.thumbnail,
                        duration: media.durationInSec,
                        durationRaw: media.durationRaw,
                    }
                    return song;
                }
                break;
        }
    }
    // Builds the resource for discord.js player to play
    static async getResource(song) {
        // Stream first from play-dl.stream('url')
        let resource;
        try {
            const stream = await play_dl.stream(song.url);
            resource = voice.createAudioResource(stream.stream, {
                metadata: song,
                // Do not uncomment, errors with discord opus may come up
                // inlineVolume: true,
                inputType: stream.type,
            });
        } catch (error) {
            console.log(new Error(error));
            return undefined;
        }
        // resource.volume.setVolume(0.5);
        // console.log(resource)

        return resource;
    }

    nextTrack(forceskip = false) {
        let curIndex = this.curPlayingIndex();
        let nextIndex = curIndex + 1;
        let songsLenght = this.songs.length;
        let nextSong = undefined;
        if (!forceskip) {
            switch (this.loopState) {
                case serverQueue.loopStates.disabled:
                    if (nextIndex < songsLenght) {
                        nextSong = this.songs[nextIndex];
                    }
                    break;
                case serverQueue.loopStates.queue:
                    if (nextIndex >= songsLenght) {
                        nextIndex = 0;
                    }
                    nextSong = this.songs[nextIndex];
                    break;
                case serverQueue.loopStates.track:
                    nextIndex = curIndex;
                    nextSong = this.songs[nextIndex];
                    break;
            }
        } else {
            switch (this.loopState) {
                case serverQueue.loopStates.disabled:
                    if (nextIndex < songsLenght) {
                        nextSong = this.songs[nextIndex];
                    }
                    break;
                case serverQueue.loopStates.queue:
                case serverQueue.loopStates.track:
                    if (nextIndex >= songsLenght) {
                        nextIndex = 0;
                    }
                    nextSong = this.songs[nextIndex];
                    break;
            }
        }
        if (nextSong !== undefined) {
            this.curPlayingSong = nextSong;
        }

        return nextSong;
    }

    async play(song = undefined) {
        if (!song) {
            song = this.curPlayingSong;
        }
        let resource = await serverQueue.getResource(song);
        try {
            this.player.play(resource);
            this.curPlayingSong = song;
        } catch (error) {
            console.log(error)
        }
    }

    async jump(index) {
        await this.play(this.songs[index]);
    }

    add(song) {
        this.songs.push(song);
    }

    addMultiple(songs) {
        this.songs = this.songs.concat(songs)
    }

    curPlayingIndex() {
        return this.songs.indexOf(this.curPlayingSong);
    }

    indexOfSong(song) {
        return this.songs.indexOf(song);
    }

    remove(index) {
        this.songs = this.songs.filter((val, i) => {
            return i !== index
        })
    }

    changeLoopState(arg = undefined) {
        if (!arg) {
            this.loopState += 1
            if (this.loopState > serverQueue.loopStates.track) {
                this.loopState = serverQueue.loopStates.disabled;
            }
            return this.loopState;
        } else {
            switch (arg.toLowerCase()) {
                case 'off':
                case 'disabled':
                    this.loopState = serverQueue.loopStates.disabled;

                    break;
                case 'q':
                case 'queue':
                    this.loopState = serverQueue.loopStates.queue;

                    break;

                case 't':
                case 'track':
                    this.loopState = serverQueue.loopStates.track;
                    break;

                default:
                    this.loopState += 1
                    if (this.loopState > serverQueue.loopStates.track) {
                        this.loopState = serverQueue.loopStates.disabled;
                    }

                    break;
            }
            return this.loopState;
        }
    }

    getLoopState() {
        return this.loopState;
    }

    getSongs() {
        return this.songs;
    }

    getSongsLength() {
        return this.songs.length
    }

    pause() {
        this.player.pause();
    }

    resume() {
        this.player.unpause();
    }
    shuffle() {
        for (let i = this.songs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.songs[i], this.songs[j]] = [this.songs[j], this.songs[i]];
        }
    }

    die(force = false) {
        // try {
        //     this.player.stop()
        // } catch (error) {

        // }
        this.sub.unsubscribe();
        this.player = undefined;
        try {
            this.connection.destroy();
        } catch (error) { }

        if (!force) sendReply(this.txtChannel, titleEmbed(this.txtChannel.guild, serverQueue.responses.endQueue))
    }

    static convertToRawDuration(seconds) {
        let hours = Math.floor(seconds / 3600);
        seconds = Math.floor(seconds % 3600);
        let minutes = Math.floor(seconds / 60);
        seconds = Math.round(seconds % 60);
        if (hours < 10) {
            hours = '0' + hours.toString();
        } else {
            hours = hours.toString();
        }
        if (minutes < 10) {
            minutes = '0' + minutes.toString();
        } else {
            minutes = minutes.toString();
        }
        if (seconds < 10) {
            seconds = '0' + seconds.toString();
        } else {
            seconds = seconds.toString();
        }
        return hours + ':' + minutes + ':' + seconds;
    }

    getPlaybackDuration() {
        try {
            return this.player.state.playbackDuration;
        } catch (error) {
            return 0
        }
    }

    //this function returns an array
    queuePages() {
        let queue = [];
        let counter = 1;
        for (const song of this.songs) {
            let line = '';
            if (song === this.curPlayingSong) {
                //currently playing
                // console.log(song.duration - (Math.round((this.getPlaybackDuration()) / 1000)))
                line = `    ⬐In riproduzione\n${counter}. ${song.title}\t${serverQueue.convertToRawDuration(song.duration - (Math.round((this.getPlaybackDuration()) / 1000)))} rimasti\n    ⬑In riproduzione`
            } else {
                line = `${counter}. ${song.title}\t${song.durationRaw}`
            }
            queue.push(line);
            counter++;
        }

        let songsxpage = 20;
        let pages = [];
        while (queue.length !== 0) {
            let tmp = [];
            for (let i = 0; i < songsxpage; i++) {
                if (queue.length === 0) break;
                tmp.push(queue.shift());
            }
            pages.push(tmp);
        }
        return pages;
    }

    startCollector(msg, buttonIds) {
        this.pageIndex = 0;
        this.queueMsg = msg;
        const filter = (inter) => {
            if (msg.id === inter.message.id && buttonIds.includes(inter.customId)) {
                return true
            } else {
                // let repl = serverQueue.errors.oldQueue + '(' + (msg.url) + ')'
                // let embed = fieldEmbed(msg.guild, 'Redirect', repl)
                // inter.channel.send({ content: repl, ephemeral: true })
                return false
            }
        }

        let pages = this.queuePages();

        this.queueCollector = msg.channel.createMessageComponentCollector({
            filter
        })

        this.queueCollector.on('collect', (inter) => {
            if (!inter.message.editable) inter.message.fetch()
            inter.deferUpdate({
                fetchReply: false,
            })
            switch (inter.component.customId) {
                case buttonIds[0]:
                    this.pageIndex = 0;
                    break;
                case buttonIds[1]:
                    this.pageIndex -= 1;
                    if (this.pageIndex < 0) this.pageIndex = 0;
                    break;

                case buttonIds[2]:
                    this.pageIndex += 1;
                    if (this.pageIndex >= pages.length) this.pageIndex = pages.length - 1;
                    break;
                case buttonIds[3]:
                    this.pageIndex = pages.length - 1;
                    break;

                default:
                    // console.log('default event')
                    break;
            }

            let content = [serverQueue.queueFormat.start];
            content = content.concat(pages[this.pageIndex]);
            content.push(serverQueue.queueFormat.end);
            inter.message.edit(content.join('\n'));
        })
    }

    stopCollector() {
        if (!this.queueCollector) return
        this.queueCollector.stop();
        this.queueCollector = undefined;
        if (!this.queueMsg.editable) this.queueMsg.fetch()
        this.queueMsg.delete()
        return;
    }

    getSongsJson() {
        return JSON.stringify(this.getSongs())
    }
}

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
                interaction.deferReply()
                let item = await serverQueue.getSongObject(input);
                if (!item) return interaction.reply({ embeds: [titleEmbed(interaction.guild, 'Nessun risultato')], ephemeral: true })
                if (Array.isArray(item)) {
                    interaction.editReply({ embeds: [fieldEmbed(interaction.guild, 'Aggiunte alla coda', `**${item.length}** brani aggiunti alla coda!`)] });
                } else {
                    interaction.editReply({ embeds: [fieldEmbed(interaction.guild, 'Aggiunta alla coda', `[${item.title}](${item.url}) è in coda!`)] })
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
                        interaction.reply({embeds: [fieldEmbed(interaction.guild, 'Skip', `[${song.title}](${song.url})`)]});
                        await server_queue.play(song);
                    } else {
                        server_queue.die();
                        globalQueue.delete(interaction.guild.id);
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
                    server_queue.startCollector(queueinteraction, ['FirstPage', 'Previous', 'Next', 'LastPage'])
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
                    server_queue.startCollector(queueMsg, ['FirstPage', 'Previous', 'Next', 'LastPage'])
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