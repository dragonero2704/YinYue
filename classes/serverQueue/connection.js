// this file contains the definitions of listeners functions for connections
const { entersState, VoiceConnectionStatus } = require('@discordjs/voice')
let listeners = new Map()

// stateChange
const stateChange = (oldState, newState) => {
    const oldNetworking = Reflect.get(oldState, 'networking');
    const newNetworking = Reflect.get(newState, 'networking');

    const networkStateChangeHandler = (oldNetworkState, newNetworkState) => {
        const newUdp = Reflect.get(newNetworkState, 'udp');
        clearInterval(newUdp?.keepAliveInterval);
    }

    oldNetworking?.off('stateChange', networkStateChangeHandler);
    newNetworking?.on('stateChange', networkStateChangeHandler);
};
listeners.set('stateChange', stateChange)

// error
const error = (error) => console.error(`Error: ${error.message} with resource ${error.resource.metadata.title}`);
listeners.set('error', (error)=>error.bind(this,error))


module.exports = { module: true, listeners }