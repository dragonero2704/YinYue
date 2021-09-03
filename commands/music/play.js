// const ytdl = require('ytdl-core')
// const ytsr = require('ytsr')
// const fs = require('fs');
const play_dl = require('play-dl')
const voice = require('@discordjs/voice');


let queue = new Map()
let loop = false

module.exports = {
    name: 'play',
    once: false,
    async run(msg, args, bot, Discord) {

        switch (args[0]) {
            case 'play' || 'p':
                {
                    let voice_channel = await msg.member.voice.channel
                    if (!voice_channel) {
                        let response = await msg.channel.send('Devi essere in un canale vocale per ascoltare la musica!')
                        await response.delete({ timeout: 50000 })
                        return
                    }

                    if (!args[1]) {
                        let response = await msg.channel.send('Per favore inserisci una parola chiave o un link!')
                        await response.delete({ timeout: 50000 })
                        return
                    }

                    let media
                    let server_queue = queue.get(msg.guild.id)
                    let song = {
                        url: undefined,
                        title: undefined,
                        thumbnail: undefined
                    }

                    if (play_dl.validate(args[1])) {
                        media = (await play_dl.video_basic_info(args[1])).video_details
                        song = {
                            url: media.url,
                            title: media.title,
                            thumbnail: media.thumbnail
                        }
                    } else {
                        let query
                        if (args.length > 2) {
                            query = args.shift().join(' ')
                        } else {
                            query = args[1]
                        }
                        media = await play_dl.search(query, { limit: 1 })
                        console.log(media)
                        song = {
                            url: media.url,
                            title: media.title,
                            thumbnail: media.thumbnail
                        }
                    }

                    let player = voice.createAudioPlayer()
                    let resource = await getResource(song)
                    if (!server_queue) {
                        const queue_constructor = {
                            voice_channel: voice_channel,
                            text_channel: msg.channel,
                            connection: null,
                            songs: []
                        }



                        try {
                            const connection = voice.joinVoiceChannel({
                                channelId: voice_channel.id,
                                guildId: msg.guild.id,
                                adapterCreator: voice_channel.guild.voiceAdapterCreator,
                            });

                            connection.subscribe(player)
                            player.play(resource)
                            queue_constructor.songs.push(song)
                            queue_constructor.connection = connection
                            queue.set(msg.guild.id, queue_constructor)


                        } catch (error) {
                            queue.delete(msg.guild.id)
                            console.log(error)
                        }

                    } else {
                        server_queue.songs.push(song)
                        msg.channel.send('Canzone aggiunta alla coda!')
                    }

                    player.on(voice.AudioPlayerStatus.Playing, (oldState, newState) => {
                        console.log('Music is playing!')
                    })
                    player.on(voice.AudioPlayerStatus.Idle, (oldState, newState) => {
                        player.play(getNextSong(queue, msg.guild.id))
                    })
                    player.on('error', error => {
                        console.error(`Error: ${error.message} with resource ${error.resource.metadata.title}`);
                        player.play(getNextResource());
                    });
                    server_queue = queue.get(msg.guild.id)
                    const connection = server_queue.connection
                    connection.on(voice.VoiceConnectionStatus.Disconnected, async(oldState, newState) => {
                        try {
                            await Promise.race([
                                voice.entersState(connection, voice.VoiceConnectionStatus.Signalling, 50000),
                                voice.entersState(connection, voice.VoiceConnectionStatus.Connecting, 50000),
                            ]);
                            // Seems to be reconnecting to a new channel - ignore disconnect
                        } catch (error) {
                            // Seems to be a real disconnect which SHOULDN'T be recovered from
                            connection.destroy();
                        }
                    })
                }

                break

            case 'pause':
                {
                    let voice_channel = await msg.member.voice.channel
                    if (!voice_channel) {
                        let response = await msg.channel.send('Devi essere in un canale vocale per ascoltare la musica!')
                        await response.delete({ timeout: 50000 })
                        return
                    }
                }
                break

            case 'skip':
                {
                    let voice_channel = await msg.member.voice.channel
                    if (!voice_channel) {
                        let response = await msg.channel.send('Devi essere in un canale vocale per ascoltare la musica!')
                        await response.delete({ timeout: 50000 })
                        return
                    }
                }
                break

            case 'jump' || 'j':
                {
                    let voice_channel = await msg.member.voice.channel
                    if (!voice_channel) {
                        let response = await msg.channel.send('Devi essere in un canale vocale per ascoltare la musica!')
                        await response.delete({ timeout: 50000 })
                        return
                    }
                }
                break

            case 'die' || 'd':
                {
                    let server_queue = queue.get(msg.guild.id)
                    if (!server_queue || server_queue.songs.length == 0) {
                        let response = await msg.channel.send('Nessuna coda da cancellare!')
                        await response.delete({ timeout: 50000 })
                        return
                    }

                    if (!voiceChannelCheck(msg.member)) {
                        let response = await msg.channel.send('Devi essere in un canale vocale per ascoltare la musica!')
                        await response.delete({ timeout: 50000 })
                        return
                    }

                    server_queue.songs = []
                    server_queue.connection.destroy()
                }

                break

            case 'loop' || 'l':
                {
                    let voice_channel = await msg.member.voice.channel
                    if (!voice_channel) {
                        let response = await msg.channel.send('Devi essere in un canale vocale per ascoltare la musica!')
                        await response.delete({ timeout: 50000 })
                        return
                    }
                    if (loop === false)
                        loop = true
                    else
                        loop = false
                }
                break


        }





    },
    aliases: ['p', 'pause', 'skip', 'jump', 'j', 'stop', 'die']
}

async function getMediaStream(url) {
    return (await play_dl.stream(url)).stream
}
async function getResource(song) {
    return voice.createAudioResource(await getMediaStream(song.url), { metadata: song })
}

async function getNextSong(queue, guildID) {
    let server_queue = queue.get(guildID)
    let last_song = server_queue.songs.shift()
    if (loop) {
        server_queue.songs.push(last_song)
    }
    let song = server_queue.songs[0]

    if (!song) {
        server_queue.songs = []
        server_queue.connection.destroy()
    }
}

async function voiceChannelCheck(member) {
    let voice_channel = await member.voice.channel
    if (!voice_channel)
        return false
    else
        return true
}