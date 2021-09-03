const play_dl = require('play-dl')
const voice = require('@discordjs/voice');
const { MessageEmbed } = require('discord.js')

let queue = new Map()
let loop = false
let blank_field = '\u200b'

module.exports = {
    name: 'play',
    once: false,
    async run(msg, args, bot, Discord) {
        cmd = args.shift()

        switch (cmd) {
            case 'play':
            case 'p':

                let voice_channel = await msg.member.voice.channel
                if (!voice_channel) {
                    msg.channel.send('Devi essere in un canale vocale per ascoltare la musica!').then(msg => {
                        setTimeout(() => msg.delete(), 10000)
                    });
                    // console.log(cmd)
                    return
                }

                if (!args[0]) {
                    msg.channel.send('Per favore inserisci una parola chiave o un link!').then(msg => {
                        setTimeout(() => msg.delete(), 10000)
                    });

                    return
                }

                let media = undefined
                let server_queue = queue.get(msg.guild.id)
                let song = {
                    url: undefined,
                    title: undefined,
                    thumbnail: undefined
                }

                if (play_dl.validate(args[0])) {
                    media = (await play_dl.video_basic_info(args[0])).video_details
                    song = {
                        url: media.url,
                        title: media.title,
                        thumbnail: media.thumbnail
                    }
                } else {
                    let query = ''
                    if (args.length > 1) {
                        query = args.join(' ')
                    } else {
                        query = args[0]
                    }
                    media = (await play_dl.search(query, { type: 'video', limit: 1 }))[0]
                        // console.log(media)
                    song = {
                            url: media.url,
                            title: media.title,
                            thumbnail: media.thumbnail
                        }
                        // console.log(song)
                }

                if (!server_queue) {
                    const queue_constructor = {
                        voice_channel: voice_channel,
                        text_channel: msg.channel,
                        connection: null,
                        player: null,
                        songs: []
                    }

                    queue.set(msg.guild.id, queue_constructor)
                    let item = {
                        song: song,
                        pos: 0
                    }
                    queue_constructor.songs.push(item)

                    try {
                        const connection = voice.joinVoiceChannel({
                            channelId: voice_channel.id,
                            guildId: msg.guild.id,
                            adapterCreator: voice_channel.guild.voiceAdapterCreator,
                        });
                        queue_constructor.connection = connection
                        let player = voice.createAudioPlayer()
                        connection.subscribe(player)
                        let resource = await getResource(song)
                        player.play(resource)
                        queue_constructor.player = player

                        let embed = require('../../embed.js')(msg.guild)
                            .setTitle(`In riproduzione: [**${item.song.title}**](${item.song.url})`)
                            // .setURL(item.song.url)
                        msg.channel.send({ embeds: [embed] })
                            // console.log(queue.get(msg.guild.id))

                        player.on(voice.AudioPlayerStatus.Playing, (oldState, newState) => {
                            console.log('Music is playing!')

                        })
                        player.on(voice.AudioPlayerStatus.Idle, async(oldState, newState) => {

                            let next_resource = await getNextSong(queue, msg.guild.id)
                            if (!next_resource) {
                                return
                            }
                            player.play(next_resource)

                        })
                        player.on('error', error => {
                            console.error(`Error: ${error.message} with resource ${error.resource.metadata.title}`);
                        });



                        server_queue = queue.get(msg.guild.id)
                            // const connection = server_queue.connection
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


                    } catch (error) {
                        queue.delete(msg.guild.id)
                        console.log(error)
                        return
                    }

                } else {
                    let item = {
                        song: song,
                        pos: server_queue.songs.length
                    }
                    if (!item in server_queue.songs) server_queue.songs.push(item)
                    let embed = require('../../embed.js')(msg.guild)
                        .setTitle(`${item.song.title} è in coda!`)
                        .setURL(item.song.url)
                    msg.channel.send({ embeds: [embed] })

                    if (!server_queue.player.unpause()) {
                        server_queue.player.play(await getResource(server_queue.songs[0].song))
                    }
                    return

                }

                break;

            case 'pause':
                {
                    let voice_channel = await msg.member.voice.channel
                    if (!voice_channel) {
                        msg.channel.send('Devi essere in un canale vocale per ascoltare la musica!').then(msg => {
                            setTimeout(() => msg.delete(), 10000)
                        });
                        return
                    }
                    let server_queue = queue.get(msg.guild.id)
                    if (!server_queue || server_queue.songs.length == 0) {
                        msg.channel.send('Nessuna canzone in coda!').then(msg => {
                            setTimeout(() => msg.delete(), 10000)
                        });
                        return
                    }

                    server_queue.player.pause()
                    msg.channel.send(`Metto in pausa **${server_queue.songs[0].song.title}**`).then(msg => {
                        setTimeout(() => msg.delete(), 10000)
                    });
                }
                break;

            case 'resume':
                {
                    let voice_channel = await msg.member.voice.channel
                    if (!voice_channel) {
                        msg.channel.send('Devi essere in un canale vocale per ascoltare la musica!').then(msg => {
                            setTimeout(() => msg.delete(), 10000)
                        });
                        return
                    }
                    let server_queue = queue.get(msg.guild.id)
                    if (!server_queue || server_queue.songs.length == 0) {
                        msg.channel.send('Nessuna canzone in coda!').then(msg => {
                            setTimeout(() => msg.delete(), 10000)
                        });
                        return
                    }

                    server_queue.player.unpause()
                    msg.channel.send(`Riprendo **${server_queue.songs[0].song.title}**`).then(msg => {
                        setTimeout(() => msg.delete(), 10000)
                    });

                }
                break

            case 'skip':
            case 's':
                {
                    let voice_channel = await msg.member.voice.channel
                    if (!voice_channel) {
                        msg.channel.send('Devi essere in un canale vocale per ascoltare la musica!').then(msg => {
                            setTimeout(() => msg.delete(), 10000)
                        });
                        return
                    }

                    let server_queue = queue.get(msg.guild.id)
                    if (!server_queue || server_queue.songs.length == 0) {
                        msg.channel.send('Nessuna canzone in coda!').then(msg => {
                            setTimeout(() => msg.delete(), 10000)
                        });
                        return
                    }

                    server_queue.player.play(await getNextSong(queue, msg.guild.id))


                }
                break;

            case 'jump':
            case 'j':
                {
                    loop = true
                    let voice_channel = await msg.member.voice.channel
                    if (!voice_channel) {
                        msg.channel.send('Devi essere in un canale vocale per ascoltare la musica!').then(msg => {
                            setTimeout(() => msg.delete(), 10000)
                        });
                        return
                    }

                    let server_queue = queue.get(msg.guild.id)
                    if (!server_queue || server_queue.songs.length == 0) {
                        msg.channel.send('Nessuna canzone in coda!').then(msg => {
                            setTimeout(() => msg.delete(), 10000)
                        });
                        return
                    }

                    let num = parseInt(args[0])

                    if (num < 1 || num > server_queue.songs.length) {
                        msg.channel.send(`Per favore inserisci un numero valido tra 1 e ${server_queue.songs.length}`).then(msg => {
                            setTimeout(() => msg.delete(), 10000)
                        });
                        return
                    }

                    while (true) {
                        if (server_queue.songs[0].pos == num - 1) {
                            selected_song = server_queue.songs[0].song
                            break
                        }
                        let last = server_queue.songs.shift()
                        server_queue.songs.push(last)
                    }

                    server_queue.player.play(await getResource(selected_song))
                    msg.channel.send(`${selected_song.title}`)
                    loop = false
                }
                break;

            case 'die':
            case 'd':
                {

                    let server_queue = queue.get(msg.guild.id)

                    if (!server_queue || server_queue.songs.length == 0) {
                        msg.channel.send('Nessuna coda da cancellare!').then(msg => {
                            setTimeout(() => msg.delete(), 10000)
                        });

                        return
                    }

                    let voice_channel = await msg.member.voice.channel
                    if (!voice_channel) {
                        msg.channel.send('Devi essere in un canale vocale per ascoltare la musica!').then(msg => {
                            setTimeout(() => msg.delete(), 10000)
                        });
                        return
                    }

                    server_queue.songs = []
                    server_queue.connection.destroy()

                    queue.delete(msg.guild.id)
                    console.log(`${bot.user.tag} disconesso da ${voice_channel.name}`)
                }

                break;

            case 'loop':
            case 'l':
                {
                    let voice_channel = await msg.member.voice.channel
                    if (!voice_channel) {
                        msg.channel.send('Devi essere in un canale vocale per ascoltare la musica!').then(msg => {
                            setTimeout(() => msg.delete(), 10000)
                        });
                        return
                    }
                    if (loop === false) {
                        loop = true
                        let embed = require('../../embed.js')(msg.guild)
                            .setTitle('Loop abilitato')
                        msg.channel.send({ embeds: [embed] })
                    } else {
                        loop = false
                        let embed = require('../../embed.js')(msg.guild)
                            .setTitle('Loop disabilitato')
                        msg.channel.send({ embeds: [embed] })
                    }
                }
                break;

            case 'queue':
            case 'q':
                {
                    loop = true
                    let server_queue = queue.get(msg.guild.id)

                    if (!server_queue || server_queue.songs.length == 0) {
                        msg.channel.send('Nessuna coda da cancellare!').then(msg => {
                            setTimeout(() => msg.delete(), 10000)
                        });

                        return
                    }

                    let voice_channel = await msg.member.voice.channel
                    if (!voice_channel) {
                        msg.channel.send('Devi essere in un canale vocale per ascoltare la musica!').then(msg => {
                            setTimeout(() => msg.delete(), 10000)
                        });
                        return
                    }

                    let copy = server_queue.songs

                    while (true) {
                        if (copy[0].pos == 0) {
                            break
                        }
                        let last = copy.shift()
                        copy.push(last)
                    }
                    let embed = require('../../embed.js')(msg.guild)
                    for (let song of copy) {
                        // console.log(song)
                        embed.addField('\u200b', `${(song.pos+1).toString()}) [${song.song.title}](${song.song.url})`)
                            .setTitle('Coda')
                    }

                    msg.channel.send({ embeds: [embed] })

                }
                break
        }

    },
    aliases: ['p', 'pause', 'skip', 'jump', 'j', 'stop', 'die', 'l', 'loop', 'resume', 'q', 'queue']
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

    server_queue.songs.push(last_song)
    let song = server_queue.songs[0]

    if (song.pos === server_queue.songs.length - 1 && !loop) {
        server_queue.text_channel.send('Coda terminata!').then(msg => {
            setTimeout(() => msg.delete(), 10000)
        });
        server_queue.songs = []

        return undefined
    }

    let resource = await getResource(song.song)
    return resource
}