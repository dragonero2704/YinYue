// this file contains discod.js player listeners
const { AudioPlayerStatus } = require('@discordjs/voice')
const { titleEmbed, fieldEmbed, sendReply } = require('../../misc/functions');
const { globalQueue } = require('../../misc/globals')
/**
 * {function} @key  
 */
let listeners = new Map()
// state change
const stateChange = (oldState, newState) => {
    console.log(`Player state: ${oldState.status} => ${newState.status}`);
}
listeners.set('stateChange', stateChange)

//voice.AudioPlayerStatus.Buffering
const buffering = (oldState, newState) => {
    console.log(`Buffering ${newState.resource.metadata.title}`);
}
listeners.set(AudioPlayerStatus.Buffering, buffering)

//error
const error = (error) => {
    console.error(`Error: ${error.message} with resource ${error.resource.metadata.title}`, "error");
}
listeners.set('error', (error) => error.bind(this, error))


listeners.set(AudioPlayerStatus.Playing, async (oldState, newState) => {
    let song = newState.resource.metadata;
    this.log(`Now playing: ${song.title}`, "log");
    let embed = titleEmbed(this.getTextChannel().guild, `**${song.title}**`, 'In riproduzione', song.url)
    embed.setImage(song.thumbnailUrl)
    await sendReply(this.getTextChannel(), embed, 10000);
})

listeners.set(AudioPlayerStatus.Idle, async (oldState, newState) => {
    if (!globalQueue.get(this.getGuildId())) return;
    let song = this.nextTrack();
    if (song) {
        await this.play(song)
    } else {
        this.die();
    }
})

module.exports = { module: true, listeners }