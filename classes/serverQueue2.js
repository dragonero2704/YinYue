//includes
const { joinVoiceChannel, createAudioResource, AudioResource } = require('@discordjs/voice')
const { TextChannel, VoiceChannel } = require('discord.js')
const play_dl = require('play-dl')
const ytdl = require('ytdl-core')

//class definition
class ServerQueue {
    // private fields
    #songs
    #textChannel
    #voiceChannel
    #connection
    #guildId

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
    }



    /**
     * 
     * @param {string} msg the message to be displayed
     * @param {} aim "warning"||"error"||"log"
     * @returns 
     */
    log(msg, aim) {
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
        if (this.autodieInterval) {
            clearInterval(this.autodieInterval)
            this.autodieInterval = undefined
        } else {
            this.autodieInterval = setInterval(() => {
                if (this.voiceChannel.members.size <= 1) {
                    //il bot è da solo
                    this.die(true)
                }
            }, this.interval)
        }
    }
    /**
     * 
     * @param {{}} song the song object
     * @returns {Promise} a Promise to an AudioResource playable by the discord player
     */
    getResource(song) {
        // ytdl method
        const ytdlPromise = new Promise((resolve, reject) => {
            let stream, resource;
            try {
                stream = ytdl(song.url, { filter: 'audioonly', quality: 93 })
            } catch (error) {
                reject(error)
            }
            try {
                resource = createAudioResource(stream, {
                    metadata: song,
                    // Do not uncomment, errors with discord opus may come up
                    // inlineVolume: true,
                    inputType: stream.type,
                });
            } catch (error) {
                reject(Error("Resource" + error));
            }
            resolve(resource)
        })

        // play_dl method
        const playDlPromise = new Promise((resolve, reject) => {
            play_dl.stream(song.url, { quality: 1, discordPlayerCompatibility: true })
                .then(stream => {
                    let resource;
                    try {
                        resource = createAudioResource(stream.stream, {
                            metadata: song,
                            // Do not uncomment, errors with discord opus may come up
                            // inlineVolume: true,
                            inputType: stream.type,
                        });
                    } catch (error) {
                        reject(Error("Resource" + error));
                    }
                    resolve(resource)
                })
                .catch(error => {
                    reject(Error("Stream " + error))
                })
        })

        return Promise.any([playDlPromise, ytdlPromise])
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

    static convertToRawDuration(seconds) {
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
}

module.exports = {
    ServerQueue
}