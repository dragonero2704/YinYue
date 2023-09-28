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
}

module.exports = {
    ServerQueue
}