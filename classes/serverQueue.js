//includes
const { joinVoiceChannel, createAudioResource, AudioResource, StreamType,
    createAudioPlayer, NoSubscriberBehavior, VoiceConnectionStatus, AudioPlayerStatus, demuxProbe } = require('@discordjs/voice')
const { TextChannel, VoiceChannel, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js')
const { readFileSync } = require('fs')
const { titleEmbed, fieldEmbed, sendReply } = require('../misc/functions');
const { globalQueue, botUserId } = require('../misc/globals');
// stream libraries
const play_dl = require('play-dl')
const ytdl = require('ytdl-core-discord')
// const ytdlexec = require('youtube-dl-exec')
const blank_field = '\u200b'

// listeners
const conListeners = require('./serverQueue/connection')
const playerListeners = require('./serverQueue/player');
const { promises } = require('dns');

// json paths
const loopStatesJson = "./serverQueue/messages/loopstates.json"
const errorsJson = "./serverQueue/messages/errors.json"
const responsesJson = "./serverQueue/messages/responses.json"

function check(interaction, globalQueue, locale = "en-GB") {
    let voice_channel = interaction.member.voice.channel;
    if (!voice_channel) {
        interaction.reply({ embeds: [titleEmbed(interaction.guild, ServerQueue.errors.voiceChannelNotFound[locale])], ephemeral: true });
        return false;
    }
    let server_queue = globalQueue.get(interaction.guild.id);
    if (!server_queue) {
        interaction.reply({ embeds: [titleEmbed(interaction.guild, ServerQueue.errors.queueNotFound[locale])], ephemeral: true });
        return false;
    }
    if (server_queue.getVoiceChannel() !== voice_channel && server_queue !== undefined) {
        interaction.reply({ embeds: [titleEmbed(interaction.guild, ServerQueue.errors.differentVoiceChannel[locale] + `<@${botUserId}> !`)], ephemeral: true });
        return false;
    }
    let songs = server_queue.getSongs();
    if (songs.length === 0) {
        interaction.reply({ embeds: [titleEmbed(interaction.guild, ServerQueue.errors.emptyQueue[locale])], ephemeral: true });
        return false;
    }
    return true;
}

//class definition
class ServerQueue {
    // private fields
    #songs
    #textChannel
    #voiceChannel
    #connection
    #guildId
    #loopState
    #currentIndex
    #player
    #sub
    #locale

    //autodie vars
    #interval
    #intervalId

    //queue vars
    #pageIndex = 0;
    #queueMsg = undefined
    #queueCollector = undefined

    static loopStates = require(loopStatesJson)
    static errors = require(errorsJson)
    static responses = require(responsesJson)
    static queueFormat = {
        start: '```Python',
        end: '```'
    }
    /**
     * 
     * @param {[]} songs 
     * @param {TextChannel} textChannel 
     * @param {VoiceChannel} voiceChannel 
     * @param {true} autodie 
     * @param {60_000} autodieInterval 
     * @param {"en-GB"} locale 
     */
    constructor(
        songs,                      // can be an array or not
        textChannel,                // default text channel to send error, events ecc...
        voiceChannel,               // voiceChannel to connect to
        autodie = true,             // autodie set by default to true
        autodieInterval = 60_000,   // autodie interval set by default to 1 minute
        locale = "en-GB"            // language messages. Defaults to english (anche se so italiano)
    ) {
        if (Array.isArray(songs)) {
            this.#songs = songs;
        } else {
            this.#songs = [songs];
        }

        // assign default textChannel
        this.#textChannel = textChannel;
        this.#guildId = textChannel.guild.id;
        this.#voiceChannel = voiceChannel
        this.#locale = locale
        // try to connect to voice channel
        this.log(`Connecting to voice channell #${this.#voiceChannel.id}`)
        try {
            this.#connection = joinVoiceChannel({
                channelId: this.#voiceChannel.id,
                guildId: this.#guildId,
                adapterCreator: this.#voiceChannel.guild.voiceAdapterCreator
            });
        } catch (e) {
            this.log(`voice connection error: ${e}`, 'error')
        }

        //set up autodie
        if (autodie) {
            this.#interval = autodieInterval
            this.#intervalId = undefined
            this.toggleAlwaysActive()
        }


        //set up queue variables
        this.#currentIndex = 0
        this.#loopState = ServerQueue.loopStates.disabled

        this.#player = createAudioPlayer({
            debug: false,
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Play
            }
        })

        this.#sub = this.#connection.subscribe(this.#player)
        this.initListeners()
    }

    initListeners() {
        //connection listeners
        conListeners.listeners.forEach((fun, event) => {
            this.#connection.on(event, fun.bind(this))
        })

        this.#connection.on(VoiceConnectionStatus.Disconnected, async (oldState, newState) => {
            try {
                await Promise.race([
                    entersState(connection, VoiceConnectionStatus.Signalling, 5000),
                    entersState(connection, VoiceConnectionStatus.Connecting, 5000),
                ]);
                // Seems to be reconnecting to a new channel - ignore disconnect
                this.#voiceChannel = this.#textChannel.guild.channels.cache.get(this.#connection.joinConfig.channelId)
            } catch (error) {
                // Seems to be a real disconnect which SHOULDN'T be recovered from
                this.log("Disconnected", "warning")
                this.#connection.destroy();
                this.die(true);
            }
        })

        //player listeners
        playerListeners.listeners.forEach((fun, event) => {
            this.#player.on(event, fun.bind(this))
        })

        this.#player.on(AudioPlayerStatus.Playing, async (oldState, newState) => {
            let song = newState.resource.metadata;
            this.log(`Now playing: ${song.title}`, "log");
            let embed = titleEmbed(this.#textChannel.guild, `**${song.title}**`, 'In riproduzione', song.url)
            embed.setImage(song.thumbnailUrl)
            await sendReply(this.#textChannel, embed, 10000);
        })

        this.#player.on(AudioPlayerStatus.Idle, async (oldState, newState) => {
            if (!globalQueue.get(this.#guildId)) return;
            let song = this.nextTrack();
            if (song) {
                await this.play(song)
            } else {
                this.die();
            }
        })
    }

    /**
     * 
     * @param {string} msg the message to be displayed
     * @param {} aim "warning"||"error"||"log"
     * @returns 
     */
    log(msg, aim = 'log') {
        const pref = `{Guild ${this.#guildId}} `
        switch (aim) {
            case 'log':
            default:
                console.log(pref + msg);
                break;
            case 'error':
                console.error(pref + msg);
                break;
            case 'warning':
                console.warning(pref + msg);
                break;
        }
        return
    }
    /**
     * Toggles the autodieInterval always active
     */
    toggleAlwaysActive() {
        if (this.#intervalId) {
            clearInterval(this.#intervalId)
            this.#intervalId = undefined
        } else {
            this.#intervalId = setInterval(() => {
                if (this.#voiceChannel.members.size <= 1) {
                    //il bot è da solo
                    this.die(true)
                }
            }, this.#interval)
        }
    }

    static METHODS = {
        "ytdl": 0,
        "play_dl": 1
        // ...
    }
    /**
     * 
     * @param {{}} song the song object
     * @param {Array} methods see static METHODS
     * @returns {Promise} a Promise to an AudioResource playable by the discord player
     */
    getResource(song, ...methods) {
        methods = methods.flat()
        
        // ytdl method
        const ytdlPromise = new Promise((resolve, reject) => {
            const options = {
                filter: 'audioonly',
                fmt: 'mp3',
                highWaterMark: 1 << 30,
                liveBuffer: 20000,
                dlChunkSize: 4096,
                bitrate: 128,
                quality: 'lowestaudio'
            }
            ytdl(song.url, options)
                .then(async stream => {
                    let resource;

                    try {
                        resource = createAudioResource(stream, {
                            metadata: song,
                            // Do not uncomment, errors with discord opus may come up
                            // inlineVolume: true,
                            // inputType: StreamType.
                            inputType: StreamType.Opus
                        });
                    } catch (error) {
                        reject(Error("YTDL Resource " + error));
                    }
                    resolve(resource)
                })
                .catch((error) => reject(error))
        })

        // play_dl method
        const playDlPromise = new Promise((resolve, reject) => {
            // console.log("Creating stream")
            play_dl.stream(song.url, { quality: 1, discordPlayerCompatibility: true })
                .then((stream) => {
                    let resource;
                    // console.log("Creating Resource")
                    try {
                        resource = createAudioResource(stream.stream, {
                            metadata: song,
                            // Do not uncomment, errors with discord opus may come up
                            // inlineVolume: true,
                            inputType: stream.type,
                        });
                    } catch (error) {
                        reject(error);
                    }
                    resolve(resource)
                })
                .catch((error) => {
                    reject("PlayDl Stream " + error)
                })
        })

        /*============================= End Promises definition ================================*/
        const promises = [ytdlPromise, playDlPromise];
        const defintivePromises = promises.filter((val, index) => {
            return methods.includes(index)
        });
        return Promise.any(defintivePromises)
    }
    /**
     * 
     * @param {{}} song 
     */
    async play(song = undefined) {
        if (!song) {
            song = this.#songs[this.#currentIndex];
        }
        this.getResource(song, ServerQueue.METHODS.play_dl)
            .then((resource) => {
                try {
                    this.#player.play(resource);
                    this.#currentIndex = this.#songs.indexOf(song);
                } catch (error) {
                    this.log(error,'error')
                }
            })
            .catch((error) => {
                this.getResource(song, ServerQueue.METHODS.play_dl, ServerQueue.METHODS.ytdl)
                    .then(resource => {
                        try {
                            this.#player.play(resource);
                            this.#currentIndex = this.#songs.indexOf(song);
                        } catch (error) {
                            this.log(error,'error')
                        }
                    })
                    .catch(error => this.log(error + '\n' + error.errors, 'error'))
            })
    }
    /**
     * 
     * @param {boolean} forceskip 
     * @returns {{}} nextSong
     */
    nextTrack(forceskip = false) {
        let curIndex = this.#currentIndex;
        let nextIndex = curIndex + 1;
        let songsLenght = this.#songs.length;
        let nextSong = undefined;
        if (!forceskip) {
            switch (this.#loopState) {
                case ServerQueue.loopStates.disabled:
                    if (nextIndex < songsLenght) {
                        nextSong = this.#songs[nextIndex];
                    }
                    break;
                case ServerQueue.loopStates.queue:
                    if (nextIndex >= songsLenght) {
                        nextIndex = 0;
                    }
                    nextSong = this.#songs[nextIndex];
                    break;
                case ServerQueue.loopStates.track:
                    nextIndex = curIndex;
                    nextSong = this.#songs[nextIndex];
                    break;
            }
        } else {
            switch (this.#loopState) {
                case ServerQueue.loopStates.disabled:
                    if (nextIndex < songsLenght) {
                        nextSong = this.#songs[nextIndex];
                    }
                    break;
                case ServerQueue.loopStates.queue:
                case ServerQueue.loopStates.track:
                    if (nextIndex >= songsLenght) {
                        nextIndex = 0;
                    }
                    nextSong = this.#songs[nextIndex];
                    break;
            }
        }


        return nextSong;
    }
    /**
     * 
     * @param {number} index The index to jump to, ranging between 0 and songs.size-1 
     */
    async jump(index) {
        await this.play(this.#songs[index]);
    }
    /**
     * 
     * @param  {...any} songs 
     */
    add(...songs) {
        songs.flatMap(val => val).forEach(song => {
            if (this.#songs.indexOf(song) === -1)
                this.#songs.push(song)
        })
    }

    /**
     * 
     * @param {number} index 
     */
    remove(index) {
        this.#songs = this.#songs.filter((val, i) => {
            return i !== index
        })
    }
    /**
     * Changes loopState of the queue
     * @param {string} loopState if 
     * ´´´ts
     * undefined
     * ´´´
     * @returns 
     */
    changeLoopState(loopState = undefined) {
        if (!loopState) {
            this.#loopState += 1
            if (this.#loopState > ServerQueue.loopStates.track) {
                this.#loopState = ServerQueue.loopStates.disabled;
            }
            return this.#loopState;
        } else {
            switch (loopState.toLowerCase()) {
                case 'off':
                case 'disabled':
                    this.#loopState = ServerQueue.loopStates.disabled;

                    break;
                case 'q':
                case 'queue':
                    this.#loopState = ServerQueue.loopStates.queue;

                    break;

                case 't':
                case 'track':
                    this.#loopState = ServerQueue.loopStates.track;
                    break;

                default:
                    this.#loopState += 1
                    if (this.#loopState > ServerQueue.loopStates.track) {
                        this.#loopState = ServerQueue.loopStates.disabled;
                    }

                    break;
            }
            return this.#loopState;
        }
    }



    getSongsLength() {
        return this.#songs.length
    }

    pause() {
        try {
            this.#player.pause();
        } catch (error) {
            this.log(error, "warning")
        }
    }

    resume() {
        try {
            this.#player.unpause();
        } catch (error) {
            this.log(error, "warning")
        }
    }
    shuffle() {
        for (let i = this.#songs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.#songs[i], this.#songs[j]] = [this.#songs[j], this.#songs[i]];
        }
    }

    die(force = false) {
        try {
            this.#player.stop()
        } catch (error) {

        }
        this.#sub.unsubscribe();
        this.#player = undefined;
        try {
            this.#connection.destroy();
        } catch (error) { }

        globalQueue.delete(this.#guildId);

        if (!force) sendReply(this.#textChannel, titleEmbed(this.#textChannel.guild, ServerQueue.responses.endQueue[this.#locale]))
    }

    static toRawDuration(seconds) {
        let res = []
        while (seconds > 0) {
            res.push(String(Math.floor(seconds % 60)).padStart(2, '0'))
            seconds /= 60
            seconds = Math.floor(seconds)
        }
        return res.join(':')
    }

    getPlaybackDuration() {
        return this.#player.state.playbackDuration ?? 0;
    }

    getSongsJson() {
        return JSON.stringify(this.getSongs())
    }

    getSongs() {
        return this.#songs
    }

    getCurrentIndex() {
        return this.#currentIndex
    }

    getLoopState() {
        return this.#loopState;
    }

    getSongs() {
        return this.#songs;
    }

    getVoiceChannel() {
        return this.#voiceChannel
    }

    getTextChannel() {
        return this.#textChannel
    }

    getGuildId() {
        return this.#guildId
    }

    //this function returns an array
    queuePages() {
        let queue = [];
        this.#songs.forEach((song, index) => {
            let line = ''
            if (song === this.curPlayingSong) {
                line = `    ⬐In riproduzione\n${index + 1}. ${song.title}\t${ServerQueue.convertToRawDuration(song.duration - (Math.round((this.getPlaybackDuration()) / 1000)))} rimasti\n    ⬑In riproduzione`
            } else {
                line = `${index + 1}. ${song.title}\t${song.durationRaw}`
            }
            queue.push(line);
        })
        // console.log(queue)
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
        this.#pageIndex = 0;
        this.#queueMsg = msg;
        const filter = (inter) => {
            return buttonIds.includes(inter.customId)
        }

        let pages = this.queuePages();

        this.#queueCollector = this.#queueMsg.createMessageComponentCollector({
            filter
        })

        this.#queueCollector.on('collect', (inter) => {
            if (!inter.message.editable) inter.message.fetch()
            inter.deferUpdate({
                fetchReply: false,
            })
            switch (inter.component.customId) {
                case buttonIds[0]:
                    this.#pageIndex = 0;
                    break;
                case buttonIds[1]:
                    this.#pageIndex -= 1;
                    if (this.#pageIndex < 0) this.#pageIndex = 0;
                    break;

                case buttonIds[2]:
                    this.#pageIndex += 1;
                    if (this.#pageIndex >= pages.length) this.#pageIndex = pages.length - 1;
                    break;
                case buttonIds[3]:
                    this.#pageIndex = pages.length - 1;
                    break;

                default:
                    // console.log('default event')
                    break;
            }

            let content = [ServerQueue.queueFormat.start];
            content = content.concat(pages[this.#pageIndex]);
            content.push(ServerQueue.queueFormat.end);
            inter.message.edit(content.join('\n'));
        })
    }

    stopCollector() {
        if (this.#queueCollector) {
            this.#queueCollector.stop();
        }
        this.#queueCollector = undefined;
        try {
            if (this ?? queueMsg ?? editable === false) {
                this.#queueMsg.fetch()
            }
            try {
                this.#queueMsg.delete()
            } catch (error) {
                //message is too old
            }
        } catch (error) {
            this.log(error, "warning")
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
}

module.exports = {
    module: true,
    ServerQueue,
    check
}