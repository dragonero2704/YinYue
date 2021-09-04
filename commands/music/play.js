const play_dl = require('play-dl')
const voice = require('@discordjs/voice');
const { MessageEmbed } = require('discord.js')

let queue = new Map()
let playing_song = new Map()
let loop = false
let blank_field = '\u200b'

module.exports = {
    name: 'play',
    once: false,
    async run(msg, args, bot, Discord) {
        cmd = args.shift().toLowerCase()

        switch (cmd) {
            case 'play':
            case 'p':

                let voice_channel = await msg.member.voice.channel
                if (!voice_channel) {
                    let embed = require('../../embed')(msg.guild)
                    embed.setTitle('Devi essere in un canale vocale per ascoltare la musica!')
                    msg.channel.send({ embeds: [embed] }).then(msg => {
                        setTimeout(() => msg.delete(), 10000)
                    });
                    return
                }

                if (!args[0]) {
                    let embed = require('../../embed')(msg.guild)
                    embed.setTitle('Inserisci una parola chiave')
                    msg.channel.send({ embeds: [embed] }).then(msg => {
                        setTimeout(() => msg.delete(), 10000)
                    });

                    return
                }

                //songs = getSongObject()

                // let media = undefined

                // let song = {
                //     url: undefined,
                //     title: undefined,
                //     thumbnail: undefined,
                //     pos: undefined,
                //     playing: undefined
                // }

                // if (play_dl.validate(args[0])) {
                //     media = (await play_dl.video_basic_info(args[0])).video_details
                //     song = {
                //         url: media.url,
                //         title: media.title,
                //         thumbnail: media.thumbnail,
                //         pos: 0,
                //         playing: true
                //     }
                // } else {
                //     let query = ''
                //     if (args.length > 1) {
                //         query = args.join(' ')
                //     } else {
                //         query = args[0]
                //     }
                //     media = (await play_dl.search(query, { type: 'video', limit: 1 }))[0]
                //         // console.log(media)
                //     song = {
                //             url: media.url,
                //             title: media.title,
                //             thumbnail: media.thumbnail,
                //             pos: 0,
                //             playing: true
                //         }
                //         // console.log(song)
                // }
                let item
                let server_queue = queue.get(msg.guild.id)
                if (!server_queue) {
                    item = await getSongObject(args, 0, msg.guild.id)
                } else {
                    item = await getSongObject(args, server_queue.songs.length, msg.guild.id)
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

                    queue_constructor.songs = queue_constructor.songs.concat(item)

                    try {
                        const connection = voice.joinVoiceChannel({
                            channelId: voice_channel.id,
                            guildId: msg.guild.id,
                            adapterCreator: voice_channel.guild.voiceAdapterCreator,
                        });
                        queue_constructor.connection = connection
                        let player = voice.createAudioPlayer()
                        connection.subscribe(player)
                        let resource = await getResource(item[0])
                        player.play(resource)
                        queue_constructor.player = player

                        let embed = require('../../embed.js')(msg.guild)
                            .addField('In riproduzione:', `[**${item[0].title}**](${item[0].url})`)
                            // .setURL(item.song.url)
                        msg.channel.send({ embeds: [embed] })
                            // console.log(queue.get(msg.guild.id))

                        player.on(voice.AudioPlayerStatus.Playing, (oldState, newState) => {
                            console.log('Music is playing!')
                            playing_song.set(newState.resource.metadata.guildID, newState.resource.metadata)

                        })
                        let server_queue = queue.get(msg.guild.id)
                        player.on(voice.AudioPlayerStatus.Idle, async(oldState, newState) => {
                            let last_song_pos = oldState.resource.metadata.pos
                            let next_resource = await getNextSong(queue, msg.guild.id, last_song_pos)
                            if (!next_resource) {
                                let embed = require('../../embed')(msg.guild)
                                    .setTitle('Coda terminata!')
                                server_queue.text_channel.send({ embeds: [embed] }).then(msg => {
                                    setTimeout(() => msg.delete(), 10000)
                                });
                                return
                            }
                            player.play(next_resource)
                            let embed = require('../../embed.js')(msg.guild)
                                .addField('In riproduzione', `[**${next_resource.metadata.title}**](${next_resource.metadata.url})`)
                            msg.channel.send({ embeds: [embed] }).then(msg => {
                                setTimeout(() => msg.delete(), 10000)
                            });

                        })
                        player.on('error', error => {
                            console.error(`Error: ${error.message} with resource ${error.resource.metadata.title}`);
                        });

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
                    if (server_queue.player.state === voice.AudioPlayerStatus.Paused) {
                        queue_constructor.songs = queue_constructor.songs.concat(item)
                        let embed = require('../../embed.js')(msg.guild)
                            .addField('In riproduzione', `[**${item[0].title}**](${item[0].url})`)
                        msg.channel.send({ embeds: [embed] })
                        server_queue.player.play(await getResource(item[0]))
                        return
                    }

                    queue_constructor.songs = queue_constructor.songs.concat(item)
                    let embed = require('../../embed.js')(msg.guild)
                        .addField('Aggiunta alla coda', `[${item[0].title}](${item[0].url}) è in coda!`)
                    msg.channel.send({ embeds: [embed] })
                    return

                }

                break;

            case 'pause':
                {
                    let voice_channel = await msg.member.voice.channel
                    if (!voice_channel) {
                        let embed = require('../../embed')(msg.guild)
                        embed.setTitle('Devi essere in un canale vocale per ascoltare la musica!')
                        msg.channel.send({ embeds: [embed] }).then(msg => {
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
                    let paused_song = playing_song.get(msg.guild.id)
                    server_queue.player.pause()
                    msg.channel.send(`Metto in pausa **${paused_song.title}**`).then(msg => {
                        setTimeout(() => msg.delete(), 10000)
                    });
                }
                break;

            case 'resume':
                {
                    let voice_channel = await msg.member.voice.channel
                    if (!voice_channel) {
                        let embed = require('../../embed')(msg.guild)
                        embed.setTitle('Devi essere in un canale vocale per ascoltare la musica!')
                        msg.channel.send({ embeds: [embed] }).then(msg => {
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
                    let resumed_song = playing_song.get(msg.guild.id)
                    server_queue.player.unpause()
                    msg.channel.send(`Riprendo **${resumed_song.title}**`).then(msg => {
                        setTimeout(() => msg.delete(), 10000)
                    });

                }
                break
                // da fixare
            case 'skip':
            case 's':
                {
                    let voice_channel = await msg.member.voice.channel
                    if (!voice_channel) {
                        let embed = require('../../embed')(msg.guild)
                        embed.setTitle('Devi essere in un canale vocale per ascoltare la musica!')
                        msg.channel.send({ embeds: [embed] }).then(msg => {
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

                    let currently_playing = undefined

                    for (let song of server_queue.songs) {
                        if (song.playing === true) {
                            currently_playing = song
                        }
                    }

                    let resource = await getNextSong(queue, msg.guild.id, currently_playing.pos)
                    if (!resource) {
                        let embed = require('../../embed')(msg.guild)
                            .setTitle('Coda terminata!')
                        server_queue.text_channel.send({ embeds: [embed] }).then(msg => {
                            setTimeout(() => msg.delete(), 10000)
                        });
                        return
                    }
                    server_queue.player.play(resource)
                    let embed = require('../../embed.js')(msg.guild)
                        .addField('In riproduzione', `[**${resource.metadata.title}**](${resource.metadata.url})`)
                    msg.channel.send({ embeds: [embed] }).then(msg => {
                        setTimeout(() => msg.delete(), 10000)
                    });

                }
                break;

            case 'jump':
            case 'j':
                {
                    let voice_channel = await msg.member.voice.channel
                    if (!voice_channel) {
                        let embed = require('../../embed')(msg.guild)
                        embed.setTitle('Devi essere in un canale vocale per ascoltare la musica!')
                        msg.channel.send({ embeds: [embed] }).then(msg => {
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
                    let num
                    try {
                        num = parseInt(args[0])
                    } catch (error) {
                        console.log(error)
                    }

                    if (num < 1 || num > server_queue.songs.length || !num) {
                        let embed = require('../../embed')(msg.guild)
                        embed.setTitle(`Per favore inserisci un numero valido tra 1 e ${server_queue.songs.length}`)
                        msg.channel.send({ embeds: [embed] })
                        return
                    }

                    server_queue.player.play(await getNextSong(queue, msg.guild.id, num - 2))
                    let selected_song = server_queue.songs[num - 1]
                    let embed = require('../../embed.js')(msg.guild)
                        .addField('In riproduzione', `[**${selected_song.title}**](${selected_song.url})`)
                        // .setURL(item.song.url)
                    msg.channel.send({ embeds: [embed] }).then(msg => {
                        setTimeout(() => msg.delete(), 10000)
                    });
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
                        let embed = require('../../embed')(msg.guild)
                        embed.setTitle('Devi essere in un canale vocale per ascoltare la musica!')
                        msg.channel.send({ embeds: [embed] }).then(msg => {
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
                        let embed = require('../../embed')(msg.guild)
                        embed.setTitle('Devi essere in un canale vocale per ascoltare la musica!')
                        msg.channel.send({ embeds: [embed] }).then(msg => {
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
                //da rifare
            case 'queue':
            case 'q':
                {


                    let server_queue = queue.get(msg.guild.id)

                    if (!server_queue || server_queue.songs.length == 0) {
                        msg.channel.send('Nessuna coda!').then(msg => {
                            setTimeout(() => msg.delete(), 10000)
                        });

                        return
                    }

                    let voice_channel = await msg.member.voice.channel
                    if (!voice_channel) {
                        let embed = require('../../embed')(msg.guild)
                        embed.setTitle('Devi essere in un canale vocale per ascoltare la musica!')
                        msg.channel.send({ embeds: [embed] }).then(msg => {
                            setTimeout(() => msg.delete(), 10000)
                        });
                        return
                    }

                    let embed = require('../../embed.js')(msg.guild)
                    for (let song of server_queue.songs) {
                        embed.addField('\u200b', `${(song.pos+1).toString()}) [${song.title}](${song.url})`)
                            .setTitle('Coda')
                    }

                    msg.channel.send({ embeds: [embed] })

                }
                break
                // da rifare
            case 'remove':
            case 'r':
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
                        let embed = require('../../embed')(msg.guild)
                        embed.setTitle('Devi essere in un canale vocale per ascoltare la musica!')
                        msg.channel.send({ embeds: [embed] }).then(msg => {
                            setTimeout(() => msg.delete(), 10000)
                        });
                        return
                    }
                    let num
                    try {
                        num = parseInt(args[0])
                    } catch (error) {
                        console.log(error)
                    }

                    if (num < 1 || num > server_queue.songs.length || !num) {
                        let embed = require('../../embed')(msg.guild)
                        embed.setTitle(`Inserisci un numero valido tra 1 e ${server_queue.songs.length}`)
                        msg.channel.send({ embeds: [embed] })
                        return
                    }

                    let target = server_queue.songs[num - 1]

                    server_queue.songs = server_queue.songs.filter((value) => {
                        if (value.pos > num - 1) {
                            value.pos = value.pos - 1
                            return true
                        }
                        return value.pos !== num - 1
                    })

                    let embed = require('../../embed')(msg.guild)
                    embed.addField('Traccia rimossa', `[${target.title}](${target.url}) è stata rimossa dalla coda`)

                    msg.channel.send({ embeds: [embed] })
                }

                break
        }

    },
    aliases: ['p', 'pause', 'skip', 'jump', 'j', 'stop', 'die', 'l', 'loop', 'resume', 'q', 'queue', 'remove', 'r']
}

async function getMediaStream(url) {
    return (await play_dl.stream(url)).stream
}
async function getResource(song) {
    return voice.createAudioResource(await getMediaStream(song.url), { metadata: song })
}

async function getNextSong(queue, guildID, last_song_pos) {
    let server_queue = queue.get(guildID)
    try {
        server_queue.songs[last_song_pos].playing = false
    } catch (error) {
        console.log(error)
    }

    let next_song_pos = last_song_pos + 1

    if (next_song_pos >= server_queue.songs.length && loop === false) {
        return undefined
    }
    if (next_song_pos >= server_queue.songs.length && loop === true) {
        next_song_pos = 0
    }

    try {
        server_queue.songs[next_song_pos].playing = true
    } catch (error) {
        console.log(error)
    }


    let song = server_queue.songs[next_song_pos]

    let resource = await getResource(song)
    return resource
}

async function getSongObject(args, songs_length, guildID) {
    //yt video
    if (play_dl.validate(args[0])) {
        let media = (await play_dl.video_basic_info(args[0])).video_details
        let song = [{
            url: media.url,
            title: media.title,
            thumbnail: media.thumbnail,
            pos: songs_length,
            guildID: guildID
        }]
        return song
    }
    //yt playlist
    if (play_dl.validate_playlist(args[0])) {
        let playlist = (await play_dl.playlist_info(args[0]))
        console.log(playlist)
        let songs = []
        for (let i = 0; i < playlist.videoCount; i++) {
            let song = {
                url: playlist[i].video_details.url,
                title: playlist[i].video_details.title,
                thumbnail: playlist[i].video_details.thumbnail,
                pos: songs_length + i,
                guildID: guildID
            }
            songs.push(song)
        }
        return songs
    }

    //spotify playlist --coming soon!

    let query = ''
    if (args.length > 1) {
        query = args.join(' ')
    } else {
        query = args[0]
    }
    let media = (await play_dl.search(query, { type: 'video', limit: 1 }))[0]
        // console.log(media)
    song = [{
        url: media.url,
        title: media.title,
        thumbnail: media.thumbnail,
        pos: songs_length,
        guildID: guildID
    }]
    return song
}


function getIndex(target, array) {
    return array.indexOf(target)
}