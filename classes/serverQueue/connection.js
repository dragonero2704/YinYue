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
listeners.set('error', error)

//disconnected - 
const disconnected = async (oldState, newState) => {
    try {
        await Promise.race([
            entersState(connection, voice.VoiceConnectionStatus.Signalling, 5000),
            entersState(connection, voice.VoiceConnectionStatus.Connecting, 5000),
        ]);
        // Seems to be reconnecting to a new channel - ignore disconnect
        this.#voiceChannel = await this.#txtChannel.guild.channels.cache.get(this.#connection.joinConfig.channelId)
    } catch (error) {
        // Seems to be a real disconnect which SHOULDN'T be recovered from
        console.log("Disconnected")
        this.#connection.destroy();
        this.die(true);
    }
}
listeners.set(VoiceConnectionStatus.Disconnected, disconnected)

module.exports = { module: true, listeners }