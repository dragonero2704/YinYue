// this file contains discod.js player listeners
const {AudioPlayerStatus} = require('@discordjs/voice')
const { titleEmbed, fieldEmbed, sendReply } = require('../../misc/functions');
const {globalQueue} = require('../../misc/globals')
/**
 * {function} @key  
 */
let listeners = new Map()
// state change
const stateChange = (oldState, newState) => {
    console.log(`Player state: ${oldState.status} => ${newState.status}`);
}


//voice.AudioPlayerStatus.Buffering
const buffering = (oldState, newState) => {
    console.log(`Buffering ${newState.resource.metadata.title}`);
}
listeners.set(AudioPlayerStatus.Buffering, buffering)

//error
const error = (error) => {
    console.error(`Error: ${error.message} with resource ${error.resource.metadata.title}`, "error");
}
listeners.set('error', error)

module.exports = { module: true, listeners }