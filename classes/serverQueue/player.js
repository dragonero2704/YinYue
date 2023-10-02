// this file contains discod.js player listeners
const {AudioPlayerStatus} = require('@discordjs/voice')
const { titleEmbed, fieldEmbed, sendReply } = require('../misc/functions');
const {globalQueue} = require('../../misc/globals')
let listeners = new Map()
// state change
const stateChange = (oldState, newState) => {
    console.log(`Player state: ${oldState.status} => ${newState.status}`);
}
listeners.set('stateChange', stateChange)

const playing = async (oldState, newState) => {
    let song = newState.resource.metadata;
    console.log(`Now playing: ${song.title}`);
    let embed = titleEmbed(this.#txtChannel.guild, `**${song.title}**`, 'In riproduzione', song.url)
    embed.setImage(song.thumbnailUrl)
    await sendReply(this.#txtChannel, embed, 10000);
}
listeners.set(AudioPlayerStatus.Playing, playing)

//voice.AudioPlayerStatus.Buffering
const buffering = (oldState, newState) => {
    console.log(`Buffering ${newState.resource.metadata.title}`);
}
listeners.set(AudioPlayerStatus.Buffering, buffering)

//voice.AudioPlayerStatus.Idle
const idle = async (oldState, newState) => {
    if (!globalQueue.get(this.#guildId)) return;
    let song = await this.nextTrack();
    if (song) {
        await this.play(song)
    } else {
        this.die();
    }
}
listeners.set(AudioPlayerStatus.Idle, idle)

//error
const error = (error) => {
    console.error(`Error: ${error.message} with resource ${error.resource.metadata.title}`);
}
listeners.set('error', error)

module.exports = { module: true, listeners }