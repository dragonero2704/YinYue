const play_dl = require('play-dl');
const voice = require('@discordjs/voice');
const { ActionRowBuilder, ButtonBuilder, SlashCommandBuilder, ButtonStyle, InteractionType, InteractionResponseType, ButtonInteraction } = require('discord.js');
const {titleEmbed, fieldEmbed, sendReply} = require('../../misc/functions')

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
                return undefined;
                if (play_dl.is_expired()) { await play_dl.refreshToken() }

                switch (type_url[1]) {
                    case 'album':
                        {
                            let playlist = await play_dl.spotify(query)
                            let songs = []
                            for (let i = 0; i < playlist.videoCount; i++) {
                                let song = {
                                    url: playlist[i].video_details.url,
                                    title: playlist[i].video_details.title,
                                    thumbnail: playlist[i].video_details.thumbnail,
                                    duration: playlist[i].video_details.durationInSec,
                                    durationRaw: playlist[i].video_details.durationRaw,

                                }
                                songs.push(song)
                            }
                            return songs
                        }
                        break;
                    case 'playlist':
                        {
                            let playlist = await play_dl.spotify(query)
                            // console.log(playlist)
                            let tracks = await playlist.fetched_tracks.get('1')
                            // console.log(tracks)
                            console.log(`fetching ${playlist.tracksCount} tracks from Youtube...`);
                            let songs = [];
                            for (let i = 0; i < playlist.tracksCount; i++) {

                                let yt_video = (await play_dl.search(tracks[i].name, { limit: 1, type: 'video' }))[0]
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
                            let yt_video = (await play_dl.search(track.name, { limit: 1, type: 'video' }))[0]

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

    static async getResource(song) {
        // Stream first from play-dl.stream('url')
        // console.log(song)
        let resource;
        try {
            const stream = await play_dl.stream(song.url, { discordPlayerCompatibility: true });
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
        // Resource for discord.js player to play
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
        this.player.stop()
        this.sub.unsubscribe();
        this.player = undefined;
        try {
            this.connection.destroy();
        } catch (error) { }
        globalQueue.delete(this.txtChannel.guild.id);
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

    startCollector(msg) {
        this.pageIndex = 0;
        this.queueMsg = msg;
        const filter = (inter) => {
            if (msg.id === inter.message.id) {
                return true
            } else {
                let repl = serverQueue.errors.oldQueue + '(' + (msg.url) + ')'
                // let embed = fieldEmbed(msg.guild, 'Redirect', repl)
                inter.channel.send({ content: repl, ephemeral: true })
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
                case 'FirstPage':
                    this.pageIndex = 0;
                    break;
                case 'Previous':
                    this.pageIndex -= 1;
                    if (this.pageIndex < 0) this.pageIndex = 0;
                    break;

                case 'Next':
                    this.pageIndex += 1;
                    if (this.pageIndex >= pages.length) this.pageIndex = pages.length - 1;
                    break;
                case 'LastPage':
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

module.exports = {serverQueue}