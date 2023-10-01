//includes
const { joinVoiceChannel, createAudioResource, AudioResource, StreamType, 
    createAudioPlayer, NoSubscriberBehavior } = require('@discordjs/voice')
const { TextChannel, VoiceChannel } = require('discord.js')
const { readFileSync } = require('fs')
// stream libraries
const play_dl = require('play-dl')
const ytdl = require('ytdl-core')

// listeners
const conListeners = require('./serverQueue/connection')
const playerListeners = require('./serverQueue/player')

// json paths
const loopStatesJson = "./serverQueue/messages/loopstates.json"
const errorsJson = "./serverQueue/messages/errors.json"
const responsesJson = "./serverQueue/messages/responses.json"

//class definition
class ServerQueue {
    // private fields
    #songs
    #textChannel
    #voiceChannel
    #connection
    #guildId
    #loopstate
    #curIndex
    #player

    //autodie vars
    #autodie
    #interval
    #intervalId

    static loopStates = JSON.parse(readFileSync(loopStatesJson));
    static errors = JSON.parse(readFileSync(errorsJson))
    static responses = JSON.parse(readFileSync(responsesJson))

    /**
     * 
     * @param {[]} songs 
     * @param {TextChannel} textChannel 
     * @param {VoiceChannel} voiceChannel 
     * @param {true} autodie 
     * @param {60_000} autodieInterval 
     * @param {"en-UK"} locale 
     */
    constructor(
        songs,                      // can be an array or not
        textChannel,                // default text channel to send error, events ecc...
        voiceChannel,               // voiceChannel to connect to
        autodie = true,             // autodie set by default to true
        autodieInterval = 60_000,   // autodie interval set by default to 1 minute
        locale = "en-UK"            // language messages. Defaults to english (anche se so italiano)
    ) {
        if (Array.isArray(songs)) {
            this.#songs = songs;
        } else {
            this.#songs = [songs];
        }

        // assign default textChannel
        this.#textChannel = textChannel;
        this.#guildId = textChannel.guild.id;
        // try to connect to voice channel
        try {
            this.#connection = joinVoiceChannel({
                channelId: this.#voiceChannel.id,
                guildId: this.#guildId,
                adapterCreator: this.#voiceChannel.guild.adapterCreator
            });
        } catch (e) {
            this.log(`voice connection error: ${e}`)
        }
        //connection listeners
        conListeners.forEach((key, fun)=>{
            this.#connection.on(key, fun)
        })

        //set up autodie
        this.#autodie = autodie
        this.#interval = autodieInterval
        this.#intervalId = undefined
        this.toggleAlwaysActive()

        //set up queue variables
        this.#curIndex = 0
        this.#loopstate = ServerQueue.loopStates.disabled

        this.#player = createAudioPlayer({
            debug:false,
            behaviors:{
                noSubscriber: NoSubscriberBehavior.Play
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
                if (this.voiceChannel.members.size <= 1) {
                    //il bot è da solo
                    this.die(true)
                }
            }, this.#interval)
        }
    }
    /**
     * 
     * @param {{}} song the song object
     * @returns {Promise} a Promise to an AudioResource playable by the discord player
     */
    getResource(song) {
        // ytdl method
        let ytdlPromise = new Promise((resolve, reject) => {
            ytdl(song.url, { filter: 'audioonly', quality: 'highestaudio' })
                .then(stream => {
                    let resource;
                    try {
                        resource = createAudioResource(stream, {
                            metadata: song,
                            // Do not uncomment, errors with discord opus may come up
                            // inlineVolume: true,
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
        let playDlPromise = new Promise((resolve, reject) => {
            console.log("Creating stream")
            play_dl.stream(song.url, { quality: 1 })
                .then((stream) => {
                    let resource;
                    console.log("Creating Resource")
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

        return Promise.any([playDlPromise, ytdlPromise])
    }
    /**
     * 
     * @param {{}} song 
     */
    async play(song = undefined) {
        if (!song) {
            song = this.curPlayingSong;
        }
        this.getResource(song)
            .then((resource) => {
                try {
                    this.player.play(resource);
                    this.curPlayingSong = song;
                } catch (error) {
                    console.error(error)
                }
            })
            .catch((error) => this.log(error, 'error'))
    }
    /**
     * 
     * @param {boolean} forceskip 
     * @returns {{}} nextSong
     */
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
    /**
     * 
     * @param {number} index The index to jump to, ranging between 0 and songs.size-1 
     */
    async jump(index) {
        await this.play(this.songs[index]);
    }
    /**
     * 
     * @param  {...any} songs 
     */
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
    /**
     * 
     * @param {number} index 
     */
    remove(index) {
        this.songs = this.songs.filter((val, i) => {
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
            this.loopState += 1
            if (this.loopState > ServerQueue.loopStates.track) {
                this.loopState = ServerQueue.loopStates.disabled;
            }
            return this.loopState;
        } else {
            switch (loopState.toLowerCase()) {
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
        } catch (error) {

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
        return this.player.state.playbackDuration ?? 0;
    }

    getSongsJson() {
        return JSON.stringify(this.getSongs())
    }
}

module.exports = {
    ServerQueue
}