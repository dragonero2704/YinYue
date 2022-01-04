const play_dl = require('play-dl')
const voice = require('@discordjs/voice');
const { SlashCommandBuilder } = require('@discordjs/builders');


let globalQueue = new Map()

let blank_field = '\u200b'


class serverQueue {
    constructor(songs, txtChannel, voiceChannel, connection, player) {

        this.songs = [];
        if (Array.isArray(songs)) {
            this.songs.concat(songs);
        } else {
            this.songs.push(songs);
        }
        console.log(this.songs)
        this.curPlayingSong = this.songs[0];
        this.loopState = serverQueue.loopStates.disabled;

        this.txtChannel = txtChannel;
        this.voiceChannel = voiceChannel;

        this.connection = connection;

        this.connection.on(voice.VoiceConnectionStatus.Disconnected, async(oldState, newState) => {
            try {
                await Promise.race([
                    voice.entersState(connection, voice.VoiceConnectionStatus.Signalling, 5000),
                    voice.entersState(connection, voice.VoiceConnectionStatus.Connecting, 5000),
                ]);
                // Seems to be reconnecting to a new channel - ignore disconnect
            } catch (error) {
                // Seems to be a real disconnect which SHOULDN'T be recovered from
                connection.destroy();
            }
        })

        this.player = player;
        this.player.on('stateChange', (oldState, newState) => {
            console.log(`Player passato da ${oldState.status} a ${newState.status}`);
        })

        this.player.on(voice.AudioPlayerStatus.Playing, (oldState, newState) => {
            let song = newState.resource.metadata;
            console.log(`Now playing: ${song.title}`);
            sendReply(this.txtChannel, fieldEmbed(this.txtChannel.guild, 'In riproduzione', `[**${song.title}**](${song.url})`), 10000);
        })

        this.player.on(voice.AudioPlayerStatus.Buffering, (oldState, newState) => {
            console.log(`Buffering ${newState.resource.metadata.title}`);
        })

        this.player.on(voice.AudioPlayerStatus.Idle, async(oldState, newState) => {
            let song = this.nextTrack();
            // console.log(song)
            if (song) {
                await this.play(song)
            } else {
                this.die();
                globalQueue.delete(this.txtChannel.guild.id);
                sendReply(this.txtChannel, titleEmbed(this.txtChannel.guild, serverQueue.responses.endQueue))
            }

        })
        this.player.on('error', error => {
            console.error(`Error: ${error.message} with resource ${error.resource.metadata.title}`);
        });

        //queue
        this.queueMsgId = undefined;
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
        emptyQueue: 'La coda è vuota'
    }

    static responses = {
        loopDisabled: 'Loop disabilitato',
        loopEnabled: 'Loop abilitato sulla coda',
        loopEnabledTrack: 'Loop abilitato sulla traccia',
        newTrack: 'Aggiunta alla coda',
        endQueue: 'Coda terminata',
    }

    static queueFormat = {
        start: '```javascript',
        end: '```'
    }

    static async getSongObject(args) {
        // isurl
        let query = args.join(' ');
        let type_url = await play_dl.validate(query)
        try {
            type_url = type_url.split('_')
        } catch (error) {}
        let songs;
        switch (type_url[0]) {
            //youtube
            case 'yt':
                switch (type_url[1]) {
                    case 'video':
                        {
                            let media = (await play_dl.video_basic_info(query)).video_details
                                // console.log(media)
                            songs = {
                                url: media.url,
                                title: media.title,
                                thumbnail: media.thumbnail,
                                duration: media.durationInSec,
                                durationRaw: media.durationRaw,
                            }
                        }

                        break;
                    case 'playlist':
                        {
                            let playlist = (await play_dl.playlist_info(query))
                                // console.log(playlist)
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
                        }
                        break;
                    case 'album':
                        break;
                }
                break;
                //spotify
            case 'sp':
                switch (type_url[1]) {
                    case 'album':
                        {
                            let playlist = (await play_dl.spotify(query))
                                // console.log(playlist)
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
                        }
                        break;
                    case 'playlist':
                        {
                            let playlist = (await play_dl.spotify(query))
                                // console.log(playlist)
                            let tracks = await playlist.fetched_tracks.get('1')
                                // console.log(tracks)
                            console.log(`fetching ${playlist.tracksCount} tracks from Youtube...`)
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
                        }
                        break;
                    case 'track':
                        {
                            let track = (await play_dl.spotify(query))
                            let yt_video = (await play_dl.search(track.name, { limit: 1, type: 'video' }))[0]

                            songs = {
                                url: yt_video.url,
                                title: yt_video.name,
                                thumbnail: yt_video.thumbnail,
                                duration: yt_video.durationInSec,
                                durationRaw: yt_video.durationRaw,

                            }
                        }
                        break;


                }
                //soundcloud
            case 'so':
                //not implemented 
                break;

            default:
                {
                    console.log(`Searching for '${query}' on YT`);
                    let media = (await play_dl.search(query, { type: 'video', limit: 1 }))[0]
                    songs = {
                        url: media.url,
                        title: media.title,
                        thumbnail: media.thumbnail,
                        duration: media.durationInSec,
                        durationRaw: media.durationRaw,
                    }
                }
                break;
        }

        return songs

    }

    static async getResource(song) {
        // Stream first from play-dl.stream('url')
        let resource;
        try {
            const stream = await play_dl.stream(song.url);
            resource = voice.createAudioResource(stream.stream, {
                metadata: song,
                inlineVolume: true,
                inputType: stream.type
            })
        } catch (error) {
            console.log(new Error(error));
            return undefined;
        }
        resource.volume.setVolume(0.5);
        console.log(resource)

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
        this.songs.concat(songs)
    }

    curPlayingIndex() {
        return this.songs.indexOf(this.curPlayingSong);
    }

    indexOfSong(song) {
        return this.songs.indexOf(song);
    }

    remove(index) {
        this.songs = this.songs.filter((val, i) => {
            return i != index
        })
    }

    changeLoopState() {
        this.loopState += 1
        if (this.loopState > serverQueue.loopStates.track) {
            this.loopState = serverQueue.loopStates.disabled;
        }
        return this.loopState;
    }

    getLoopState() {
        return this.loopState;
    }

    getSongs() {
        return this.songs;
    }

    pause() {
        this.player.pause();
    }

    resume() {
        this.player.unpause();
    }

    die() {
        try {
            this.connection.destroy();
        } catch (error) {}
    }

    static convertToRawDuration(seconds) {
        let hours = Math.floor(seconds / 3600);
        let minutes = Math.floor(seconds / 60);
        seconds = Math.round(seconds % 60);
        if (hours !== 0) return hours.toString() + ':' + Math.floor(minutes / 10).toString() + Math.floor(minutes % 10).toString() + ':' + Math.floor(seconds / 10).toString() + Math.floor(seconds % 10).toString()
        return minutes.toString() + ':' + Math.floor(seconds / 10).toString() + Math.floor(seconds % 10).toString();
    }

    getPlaybackDuration() {
            return this.player.state.playbackDuration;
        }
        //this function returns an array
    listQueue() {
        let curPlayingSongIndex = this.curPlayingIndex();
        let queue = [];
        let counter = 1;
        for (const song of songs) {
            let line = '';
            if (song === songs[curPlayingSongIndex]) {
                //currently playing
                console.log(song.duration - (Math.round((this.getPlaybackDuration()) / 1000)))
                line = `    ⬐In riproduzione\n${counter}. ${song.title}\t${serverQueue.convertToRawDuration(song.duration - (Math.round((this.getPlaybackDuration())/1000)))} rimasti\n    ⬑In riproduzione`
            } else {
                line = `${counter}. ${song.title}\t${song.durationRaw}`
            }
            queue.push(line);
            counter++;
        }

        return queue

    }

}

function titleEmbed(guild, title) {
    let embed = require('../../embed')(guild)
    embed.setTitle(title)
    embed.setDescription('')
    return embed;
}

function fieldEmbed(guild, title, content) {
    let embed = require('../../embed')(guild)
    embed.addField(title, content)
    embed.setDescription('')
        // console.log(embed)
    return embed;
}

async function sendReply(channel, embed, timeout = undefined) {
    if (!timeout) {
        channel.send({ embeds: [embed] })
    } else {
        channel.send({ embeds: [embed] }).then(msg => {
            setTimeout(() => {
                if (msg.editable)
                    msg.delete()
            }, timeout)
        });
    }

}

async function reactToMSg(msg, emoji) {
    await msg.react(emoji)
}

module.exports = {
    name: 'play',
    aliases: ['p', 'pause', 'skip', 's', 'jump', 'j', 'stop', 'die', 'l', 'loop', 'resume', 'q', 'queue', 'remove', 'r'],
    args: ['[input]'],
    description: 'plays some music!',
    once: false,
    disabled: false,
    // data: new SlashCommandBuilder()
    //     .setName('play')
    //     .setDescription('plays some music!')
    //     .addStringOption(input => {
    //         input.setRequired(true)
    //         input.setName('input')
    //     }),
    // async execute(interaction, bot) {
    //     const { commandName } = interaction
    //     let cmd = commandName
    // },

    async run(msg, args, bot) {
        const cmd = args.shift().toLowerCase()

        switch (cmd) {
            case 'play':
            case 'p':
                let voice_channel = await msg.member.voice.channel;
                if (!voice_channel) {
                    sendReply(msg.channel, titleEmbed(msg.guild, serverQueue.errors.voiceChannelNotFound), 10000);
                    return
                }

                if (!args[0]) {
                    sendReply(msg.channel, titleEmbed(msg.guild, serverQueue.errors.invalidArgument), 10000);
                    return
                }

                let item = await serverQueue.getSongObject(args);
                if (Array.isArray(item)) {
                    sendReply(msg.channel, fieldEmbed(msg.guild, 'Aggiunte alla coda', `**${item.length}** brani aggiunti alla coda!`));
                } else {
                    sendReply(msg.channel, fieldEmbed(msg.guild, 'Aggiunta alla coda', `[${item.title}](${item.url}) è in coda!`));
                }

                let server_queue = globalQueue.get(msg.guild.id);

                if (!server_queue) {
                    // connection
                    let connection;
                    try {
                        connection = voice.joinVoiceChannel({
                            channelId: voice_channel.id,
                            guildId: msg.guild.id,
                            adapterCreator: voice_channel.guild.voiceAdapterCreator,
                        });
                    } catch (error) {
                        console.log(new Error(error))
                        return
                    }
                    // player
                    let player = voice.createAudioPlayer({
                        behaviors: {
                            noSubscriber: voice.NoSubscriberBehavior.Play
                        }
                    })


                    connection.subscribe(player)

                    server_queue = new serverQueue(item, msg.channel, voice_channel, connection, player);
                    // adds songs to the global queue map
                    globalQueue.set(msg.guild.id, server_queue);
                    // plays the first song of the list
                    server_queue.play()
                } else {
                    if (Array.isArray(item)) {
                        server_queue.addMultiple(item);
                    } else {
                        server_queue.add(item);
                    }
                }
                reactToMSg(msg, '👌');

                break;

            case 'pause':
                {
                    let voice_channel = await msg.member.voice.channel;
                    if (!voice_channel) {
                        sendReply(msg.channel, titleEmbed(msg.guild, serverQueue.errors.voiceChannelNotFound), 10000);
                        return
                    }
                    let server_queue = globalQueue.get(msg.guild.id);
                    if (!server_queue) {
                        sendReply(msg.channel, titleEmbed(msg.guild, serverQueue.errors.queueNotFound), 10000);
                        return;
                    }
                    server_queue.pause();
                    reactToMSg(msg, '⏸️');

                }
                break;

            case 'resume':
                {
                    let voice_channel = await msg.member.voice.channel;
                    if (!voice_channel) {
                        sendReply(msg.channel, titleEmbed(msg.guild, serverQueue.errors.voiceChannelNotFound), 10000);
                        return
                    }
                    let server_queue = globalQueue.get(msg.guild.id);
                    if (!server_queue) {
                        sendReply(msg.channel, titleEmbed(msg.guild, serverQueue.errors.queueNotFound), 10000);
                        return;
                    }
                    server_queue.resume();
                    reactToMSg(msg, '▶️');
                }
                break

            case 'skip':
            case 's':
                {
                    let voice_channel = await msg.member.voice.channel;
                    if (!voice_channel) {
                        sendReply(msg.channel, titleEmbed(msg.guild, serverQueue.errors.voiceChannelNotFound), 10000);
                        return
                    }
                    let server_queue = globalQueue.get(msg.guild.id);
                    if (!server_queue) {
                        sendReply(msg.channel, titleEmbed(msg.guild, serverQueue.errors.queueNotFound), 10000);
                        return;
                    }
                    let song = server_queue.nextTrack(true);
                    console.log(song);
                    if (song) {
                        await server_queue.play(song);
                    } else {
                        server_queue.die();
                        globalQueue.delete(msg.guild.id);
                        sendReply(msg.channel, titleEmbed(msg.guild, serverQueue.responses.endQueue))
                    }
                    reactToMSg(msg, '⏭️');
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

                    let index = parseInt(args[0])
                    if (!index || index < 1 || index > server_queue.songs.length) {
                        sendReply(msg.channel, titleEmbed(msg.guild, `Inserire un numero tra 1 e ${server_queue.songs.length}`))
                        return;
                    }
                    let songs = server_queue.getSongs();
                    server_queue.play(songs[index - 1]);
                    reactToMSg(msg, '👍')
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
                    server_queue.die();
                    globalQueue.delete(msg.guild.id);
                    reactToMSg(msg, '👋');
                }
                break;

            case 'loop':
            case 'l':
                {
                    let voice_channel = await msg.member.voice.channel;
                    if (!voice_channel) {
                        sendReply(msg.channel, titleEmbed(msg.guild, serverQueue.errors.voiceChannelNotFound), 10000);
                        return
                    }
                    let server_queue = globalQueue.get(msg.guild.id);
                    if (!server_queue) {
                        sendReply(msg.channel, titleEmbed(msg.guild, serverQueue.errors.queueNotFound), 10000);
                        return;
                    }

                    switch (server_queue.changeLoopState()) {
                        case serverQueue.loopStates.disabled:
                            sendReply(msg.channel, titleEmbed(msg.guild, serverQueue.responses.loopDisabled))
                            reactToMSg(msg, '➡️');
                            break;
                        case serverQueue.loopStates.queue:
                            sendReply(msg.channel, titleEmbed(msg.guild, serverQueue.responses.loopEnabled));
                            reactToMSg(msg, '🔁');

                            break;
                        case serverQueue.loopStates.track:
                            sendReply(msg.channel, titleEmbed(msg.guild, serverQueue.responses.loopEnabledTrack));
                            reactToMSg(msg, '🔂');
                            break;
                    }
                }
                break;

            case 'queue':
            case 'q':
                {
                    let voice_channel = await msg.member.voice.channel;
                    if (!voice_channel) {
                        sendReply(msg.channel, titleEmbed(msg.guild, serverQueue.errors.voiceChannelNotFound), 10000);
                        return
                    }
                    let server_queue = globalQueue.get(msg.guild.id);
                    if (!server_queue) {
                        sendReply(msg.channel, titleEmbed(msg.guild, serverQueue.errors.queueNotFound), 10000);
                        return;
                    }

                    let songs = server_queue.getSongs();
                    if (songs.length === 0) {
                        sendReply(msg.channel, titleEmbed(msg.guild, serverQueue.errors.emptyQueue), 10000);
                        return;
                    }

                    //function in serverQueue
                    let queue = [serverQueue.queueFormat.start];
                    queue.concat(server_queue.listQueue());
                    queue.push(serverQueue.queueFormat.end);
                    queue = queue.join('\n');
                    msg.channel.send({ content: queue })

                }
                break

            case 'remove':
            case 'r':
                {
                    let voice_channel = await msg.member.voice.channel;
                    if (!voice_channel) {
                        sendReply(msg.channel, titleEmbed(msg.guild, serverQueue.errors.voiceChannelNotFound), 10000);
                        return
                    }
                    let server_queue = globalQueue.get(msg.guild.id);
                    if (!server_queue) {
                        sendReply(msg.channel, titleEmbed(msg.guild, serverQueue.errors.queueNotFound), 10000);
                        return;
                    }
                    let index = parseInt(args[0])
                    if (!index || index < 1 || index > server_queue.songs.length) {
                        sendReply(msg.channel, titleEmbed(msg.guild, `Inserire un numero tra 1 e ${server_queue.songs.length}`));
                        return;
                    }

                    server_queue.remove(index - 1);
                    reactToMSg(msg, '❌')
                }
                break
        }

    }
}