const { ActionRowBuilder, ButtonBuilder, ButtonStyle, basename } = require('discord.js');
const { titleEmbed, fieldEmbed, sendReply } = require('../../misc/functions')
const { globalQueue } = require('../../misc/globals')
const voice = require('@discordjs/voice');
const play_dl = require('play-dl')
let blank_field = '\u200b'

const lang = require(`./languages/${basename(__filename).split('.')[0]}.json`)

function check(interaction, globalQueue) {
    let voice_channel = interaction.member.voice.channel;
    if (!voice_channel) {
        interaction.reply({ embeds: [titleEmbed(interaction.guild, ServerQueue.errors.voiceChannelNotFound)], ephemeral: true });
        return false;
    }
    let server_queue = globalQueue.get(interaction.guild.id);
    if (!server_queue) {
        interaction.reply({ embeds: [titleEmbed(interaction.guild, ServerQueue.errors.queueNotFound)], ephemeral: true });
        return false;
    }
    if (server_queue.voiceChannel !== voice_channel && server_queue !== undefined) {
        interaction.reply({ embeds: [titleEmbed(interaction.guild, ServerQueue.errors.differentVoiceChannel + `<@${bot.user.id}> !`)], ephemeral: true });
        return false;
    }
    let songs = server_queue.getSongs();
    if (songs.length === 0) {
        interaction.reply({ embeds: [titleEmbed(interaction.guild, ServerQueue.errors.emptyQueue)], ephemeral: true });
        return false;
    }
    return true;
}

class ServerQueue {
    constructor(songs, txtChannel, voiceChannel, autodie = true, locale = "en-UK") {
        this.songs = [];
        if (Array.isArray(songs)) {
            this.songs = songs;
            // console.log('Constructed an array of songs: '+this.songs)
        } else {
            // console.log('Added a song')
            this.songs = [songs];
        }
        // console.log(this.songs)
        this.curPlayingSong = this.songs[0];
        this.loopState = ServerQueue.loopStates.disabled;

        this.txtChannel = txtChannel;
        this.voiceChannel = voiceChannel;
        const interval = 60_000
        if (autodie) {
            setInterval(() => {
                if (voiceChannel.members.size <= 1) {
                    //il bot è da solo
                    this.die(true)
                }
            }, interval)
        }
        try {
            this.connection = voice.joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: txtChannel.guild.id,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator,
            });
        } catch (error) {
            console.log(error)
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
                console.log("Disconnected")
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
            let embed = titleEmbed(this.txtChannel.guild, `**${song.title}**`, 'In riproduzione', song.url)
            embed.setImage(song.thumbnailUrl)
            await sendReply(this.txtChannel, embed, 10000);
        })

        this.player.on(voice.AudioPlayerStatus.Buffering, (oldState, newState) => {
            console.log(`Buffering ${newState.resource.metadata.title}`);
        })

        this.player.on(voice.AudioPlayerStatus.Idle, async (oldState, newState) => {
            if (!globalQueue.get(this.voiceChannel.guild.id)) return;
            let song = await this.nextTrack();
            if (song) {
                await this.play(song)
            } else {
                this.die();
            }
        })

        this.player.on('error', error => {
            console.error(`Error: ${error.message} with resource ${error.resource.metadata.title}`);
        });

        this.connection.on('error', e => {
            console.error
        })

        this.connection.on('stateChange', (oldState, newState) => {
            const oldNetworking = Reflect.get(oldState, 'networking');
            const newNetworking = Reflect.get(newState, 'networking');
          
            const networkStateChangeHandler = (oldNetworkState, newNetworkState) => {
              const newUdp = Reflect.get(newNetworkState, 'udp');
              clearInterval(newUdp?.keepAliveInterval);
            }
          
            oldNetworking?.off('stateChange', networkStateChangeHandler);
            newNetworking?.on('stateChange', networkStateChangeHandler);
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
                                thumbnailUrl: media.thumbnails[0].url,
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
                            let videos = await play_dl.playlist_info(query).all_videos()
                            // let videos = await playlist.all_videos()
                            // console.log(playlist)
                            for (const video of videos) {
                                let song = {
                                    url: video.url,
                                    title: video.title,
                                    thumbnailUrl: video.thumbnails[0].url,
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
                            let tracks = await playlist.all_tracks()
                            console.log(`fetching ${playlist.tracksCount} tracks from Youtube...`);
                            let promises = [];
                            tracks.forEach(track => {
                                promises.push(new Promise((resolve, reject) => {
                                    play_dl.search(track.name, {
                                        type: 'video', limit: 1, source: {
                                            youtube: "video"
                                        }
                                    }).then(ytVideo => {
                                        ytVideo = ytVideo[0]
                                        if (ytVideo) {
                                            resolve({
                                                url: ytVideo.url,
                                                title: ytVideo.title,
                                                thumbnailUrl: ytVideo.thumbnails[0].url,
                                                duration: ytVideo.durationInSec,
                                                durationRaw: ytVideo.durationRaw,
                                            })
                                        } else
                                            reject()
                                    })

                                }))
                            })
                            return Promise.allSettled(promises)
                                .then(results => results.filter(val => val.status === 'fulfilled').map(val => val.value))
                                .catch(e => console.log)

                        }
                        break;
                    case 'playlist':
                        {
                            let playlist = await play_dl.spotify(query)
                            let tracks = await playlist.all_tracks()
                            console.log(`fetching ${playlist.tracksCount} tracks from Youtube...`);
                            let promises = [];
                            tracks.forEach(track => {
                                promises.push(new Promise((resolve, reject) => {
                                    play_dl.search(track.name, {
                                        type: 'video', limit: 1, source: {
                                            youtube: "video"
                                        }
                                    }).then(ytVideo => {
                                        ytVideo = ytVideo[0]
                                        if (ytVideo) {
                                            resolve({
                                                url: ytVideo.url,
                                                title: ytVideo.title,
                                                thumbnailUrl: ytVideo.thumbnails[0].url,
                                                duration: ytVideo.durationInSec,
                                                durationRaw: ytVideo.durationRaw,
                                            })
                                        } else
                                            reject()
                                    })

                                }))
                            })
                            return Promise.allSettled(promises)
                                .then(results => results.filter(val => val.status === 'fulfilled').map(val => val.value))
                                .catch(e => console.log)
                        }
                        break;
                    case 'track':
                        {
                            let track = await play_dl.spotify(query);
                            let yt_video = (await play_dl.search(track.name, { limit: 1 }))[0]

                            let song = {
                                url: yt_video.url,
                                title: yt_video.title,
                                thumbnailUrl: yt_video.thumbnails[0].url,
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
                    let media = undefined;
                    try {
                        media = (await play_dl.search(query, {
                            type: 'video', limit: 1, source: {
                                youtube: "video"
                            }
                        }))[0];
                    } catch (error) {
                        console.log(error)
                    }

                    if (!media) return undefined;
                    let song = {
                        url: media.url,
                        title: media.title,
                        thumbnailUrl: media.thumbnails[0].url,
                        duration: media.durationInSec,
                        durationRaw: media.durationRaw,
                    }
                    console.log(`Match found: ${song.title}`)
                    return song;
                }
                break;
        }
        return undefined
    }
    // Builds the resource for discord.js player to play
    async getResource(song) {
        // Stream first from play-dl.stream('url')
        console.time("stream")
        let resource, stream;
        try {
            stream = await play_dl.stream(song.url);

        } catch (error) {

            console.log("Stream" + error);
            return undefined;
        }
        console.timeEnd("stream")

        console.time("resource")
        try {
            resource = voice.createAudioResource(stream.stream, {
                metadata: song,
                // Do not uncomment, errors with discord opus may come up
                // inlineVolume: true,
                inputType: stream.type,
            });
        } catch (error) {
            console.log("Resource" + error);
            return undefined;
        }
        console.timeEnd("resource")
        return resource;
    }

    nextTrack(forceskip = false) {
        let curIndex = this.curPlayingIndex();
        let nextIndex = curIndex + 1;
        let songsLenght = this.songs.length;
        let nextSong = undefined;
        if (!forceskip) {
            switch (this.loopState) {
                case ServerQueue.loopStates.disabled:
                    if (nextIndex < songsLenght) {
                        nextSong = this.songs[nextIndex];
                    }
                    break;
                case ServerQueue.loopStates.queue:
                    if (nextIndex >= songsLenght) {
                        nextIndex = 0;
                    }
                    nextSong = this.songs[nextIndex];
                    break;
                case ServerQueue.loopStates.track:
                    nextIndex = curIndex;
                    nextSong = this.songs[nextIndex];
                    break;
            }
        } else {
            switch (this.loopState) {
                case ServerQueue.loopStates.disabled:
                    if (nextIndex < songsLenght) {
                        nextSong = this.songs[nextIndex];
                    }
                    break;
                case ServerQueue.loopStates.queue:
                case ServerQueue.loopStates.track:
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

        let resource = await this.getResource(song);

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

    add(...songs) {
        songs.flatMap(val => val).forEach(song => {
            if (this.indexOfSong(song) === -1)
                this.songs.push(song)
        })
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
            if (this.loopState > ServerQueue.loopStates.track) {
                this.loopState = ServerQueue.loopStates.disabled;
            }
            return this.loopState;
        } else {
            switch (arg.toLowerCase()) {
                case 'off':
                case 'disabled':
                    this.loopState = ServerQueue.loopStates.disabled;

                    break;
                case 'q':
                case 'queue':
                    this.loopState = ServerQueue.loopStates.queue;

                    break;

                case 't':
                case 'track':
                    this.loopState = ServerQueue.loopStates.track;
                    break;

                default:
                    this.loopState += 1
                    if (this.loopState > ServerQueue.loopStates.track) {
                        this.loopState = ServerQueue.loopStates.disabled;
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
        try {
            this.player.pause();
        }catch(error){
            
        }
    }

    resume() {
        try {
            this.player.unpause();
        } catch (error) {

        }
    }
    shuffle() {
        for (let i = this.songs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.songs[i], this.songs[j]] = [this.songs[j], this.songs[i]];
        }
    }

    die(force = false) {
        try {
            this.player.stop()
        } catch (error) {

        }
        this.sub.unsubscribe();
        this.player = undefined;
        try {
            this.connection.destroy();
        } catch (error) { }

        globalQueue.delete(this.voiceChannel.guild.id);

        if (!force) sendReply(this.txtChannel, titleEmbed(this.txtChannel.guild, ServerQueue.responses.endQueue))
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
        return this.player.state.playbackDuration ?? 0;
    }

    //this function returns an array
    queuePages() {
        let queue = [];
        let counter = 1;
        this.songs.forEach((song, index) => {
            let line = ''
            if (song === this.curPlayingSong) {
                line = `    ⬐In riproduzione\n${index + 1}. ${song.title}\t${ServerQueue.convertToRawDuration(song.duration - (Math.round((this.getPlaybackDuration()) / 1000)))} rimasti\n    ⬑In riproduzione`
            } else {
                line = `${index + 1}. ${song.title}\t${song.durationRaw}`
            }
            queue.push(line);
        })
        console.log(queue)
        const songsxpage = 20;
        const pages = queue.reduce((resultArray, item, index) => {
            const chunkIndex = Math.floor(index / songsxpage)

            if (!resultArray[chunkIndex]) {
                resultArray[chunkIndex] = [] // start a new chunk
            }

            resultArray[chunkIndex].push(item)

            return resultArray
        }, [])
        return pages;
    }

    startCollector(msg, buttonIds) {
        this.pageIndex = 0;
        this.queueMsg = msg;
        const filter = (inter) => {
            return buttonIds.includes(inter.customId)
        }

        let pages = this.queuePages();

        this.queueCollector = this.queueMsg.createMessageComponentCollector({
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

            let content = [ServerQueue.queueFormat.start];
            content = content.concat(pages[this.pageIndex]);
            content.push(ServerQueue.queueFormat.end);
            inter.message.edit(content.join('\n'));
        })
    }

    stopCollector() {
        if (this.queueCollector) {
            this.queueCollector.stop();
        }
        this.queueCollector = undefined;
        if (this??queueMsg??editable === false) {
            this.queueMsg.fetch()
        }
        try {
            this.queueMsg.delete()
        } catch (error) {
            //message is too old
        }

        return;
    }

    async showQueue(interaction) {
        this.stopCollector();

        let pages = this.queuePages();

        let queue = [ServerQueue.queueFormat.start];
        queue = queue.concat(pages[0]);
        queue.push(ServerQueue.queueFormat.end);
        queue = queue.join('\n');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('FirstPage').setLabel('<<').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('Previous').setLabel('<').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('Next').setLabel('>').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('LastPage').setLabel('>>').setStyle(ButtonStyle.Primary),
        )
        await interaction.reply(blank_field);
        await interaction.deleteReply();
        let queueinteraction = await interaction.channel.send({ content: queue, components: [row] });
        // let queueinteraction = await interaction.reply({ content: queue, components: [row] });
        this.startCollector(queueinteraction, ['FirstPage', 'Previous', 'Next', 'LastPage'])
    }

    getSongsJson() {
        return JSON.stringify(this.getSongs())
    }
}

module.exports = {
    module: true,
    ServerQueue,
    check
}