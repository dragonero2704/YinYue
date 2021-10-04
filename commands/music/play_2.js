const play_dl = require('play-dl')
const voice = require('@discordjs/voice');
const { SlashCommandBuilder } = require('@discordjs/builders');


let queue = new Map()

let blank_field = '\u200b'

let looping_states = {
    disabled: 0,
    queue: 1,
    track: 2,
}

module.exports = {
    name: 'play',
    aliases: ['p', 'pause', 'skip', 's', 'jump', 'j', 'stop', 'die', 'l', 'loop', 'resume', 'q', 'queue', 'remove', 'r'],
    args: ['[input]'],
    description: 'plays some music!',
    once: false,
    data: new SlashCommandBuilder()
        .setName(this.name)
        .setDescription(this.description)
        .addStringOption(input => {
            input.setRequired(true)
            input.setName('input')
        }),
    async execute(interaction, bot, Discord) {
        const { commandName } = interaction
        let cmd = commandName
    },

    async run(msg, args, bot, Discord) {
        cmd = args.shift().toLowerCase()

        switch (cmd) {
            case 'play':
            case 'p':

                let voice_channel = await msg.member.voice.channel
                if (!voice_channel) {
                    let embed = require('../../embed')(msg.guild)
                    embed.setTitle('Devi essere in un canale vocale per ascoltare la musica!')
                    Response(msg.channel, embed)
                    return
                }

                if (!args[0]) {
                    let embed = require('../../embed')(msg.guild)
                    embed.setTitle('Inserisci una parola chiave o un link')
                    Response(msg.channel, embed)
                    return
                }

                let item
                let server_queue = queue.get(msg.guild.id)
                if (!server_queue) {
                    item = await getSongObject(args, msg.guild.id)
                } else {
                    item = await getSongObject(args, msg.guild.id)
                }


                if (!server_queue) {
                    const queue_constructor = {
                        voice_channel: voice_channel,
                        text_channel: msg.channel,
                        connection: null,
                        player: null,
                        loop: null,
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
                    } catch (error) {
                        queue.delete(msg.guild.id)
                        console.log(error)
                        return
                    }

                    connection = queue_constructor.connection
                    let player = voice.createAudioPlayer({
                        behaviors: voice.NoSubscriberBehavior.Play
                    })
                    connection.subscribe(player)
                    queue_constructor.player = player
                    let resource = await getResource(item[0])

                    queue_constructor.player.play(resource)
                    msg.react('👌')

                    player.on('stateChange', (oldState, newState) => {
                        console.log(`Player passato da ${oldState.status} a ${newState.status}`)
                    })

                    player.on(voice.AudioPlayerStatus.Playing, (oldState, newState) => {
                        console.log('Music is playing!')
                        playing_song.set(newState.resource.metadata.guildID, newState.resource.metadata)
                        let song = newState.resource.metadata
                        let embed = require('../../embed.js')(msg.guild)
                            .addField('In riproduzione:', `[**${song.title}**](${song.url})`)
                            // .setURL(item.song.url)
                        Response(msg.channel, embed, 10000)
                    })

                    player.on(voice.AudioPlayerStatus.Buffering, (oldState, newState) => {
                        console.log(`Buffering ${newState.resource.metadata.title}`)
                    })

                    let server_queue = queue.get(msg.guild.id)
                    player.on(voice.AudioPlayerStatus.Idle, async(oldState, newState) => {

                        let last_song_pos = oldState.resource.metadata.pos

                        let next_resource = await getNextSong(queue, msg.guild.id, last_song_pos)
                        if (!next_resource) {
                            let embed = require('../../embed')(msg.guild)
                                .setTitle('Coda terminata!')
                            server_queue.text_channel.send({ embeds: [embed] }).then(msg => {
                                setTimeout(() => msg.delete(), 30000)
                            });
                            server_queue.connection.destroy()
                            queue.delete(server_queue.text_channel.guild.id)
                            return
                        }
                        player.play(next_resource)
                    })
                    player.on('error', error => {
                        console.error(`Error: ${error.message} with resource ${error.resource.metadata.title}`);
                    });

                    connection.on(voice.VoiceConnectionStatus.Disconnected, async(oldState, newState) => {
                        try {
                            await Promise.race([
                                voice.entersState(connection, voice.VoiceConnectionStatus.Signalling, 5000),
                                voice.entersState(connection, voice.VoiceConnectionStatus.Connecting, 5000),
                            ]);
                            // Seems to be reconnecting to a new channel - ignore disconnect
                        } catch (error) {
                            // Seems to be a real disconnect which SHOULDN'T be recovered from
                            connection.destroy();
                        }
                    })

                } else {
                    if (server_queue.player.state === voice.AudioPlayerStatus.Paused) {
                        server_queue.songs = server_queue.songs.concat(item)
                        server_queue.player.play(await getNextSong(queue, msg.guild.id, playing_song.get(msg.guild.id).pos))
                        msg.react('👌')
                        return
                    }

                    server_queue.songs = server_queue.songs.concat(item)

                    if (item.length > 1) {
                        let embed = require('../../embed.js')(msg.guild)
                            .addField('Aggiunte alla coda', `**${item.length}** brani aggiunti alla coda!`)
                        msg.channel.send({ embeds: [embed] })
                    } else {
                        let embed = require('../../embed.js')(msg.guild)
                            .addField('Aggiunta alla coda', `[${item[0].title}](${item[0].url}) è in coda!`)
                        msg.channel.send({ embeds: [embed] })
                    }

                    msg.react('👌')
                    return

                }

                break;

            case 'pause':
                {
                    let server_queue = queue.get(msg.guild.id)
                    if (!server_queue || server_queue.songs.length == 0) {
                        msg.channel.send('Nessuna canzone in coda!').then(msg => {
                            setTimeout(() => msg.delete(), 10000)
                        });
                        return
                    }
                    let voice_channel = await msg.member.voice.channel
                    if (!voice_channel || voice_channel !== server_queue.voice_channel) {
                        let embed = require('../../embed')(msg.guild)
                        embed.setTitle('Devi essere in un canale vocale per ascoltare la musica!')
                        msg.channel.send({ embeds: [embed] }).then(msg => {
                            setTimeout(() => msg.delete(), 10000)
                        });
                        return
                    }
                    let paused_song = playing_song.get(msg.guild.id)
                    server_queue.player.pause()
                    let embed = require('../../embed.js')(msg.guild)
                        .addField('Pausa', `[${paused_song.title}](${paused_song.url}) è in coda!`)
                    msg.react('⏸️')
                    msg.channel.send({ embeds: [embed] }).then(msg => {
                        setTimeout(() => msg.delete(), 10000)
                    });
                }
                break;

            case 'resume':
                {

                    let server_queue = queue.get(msg.guild.id)
                    if (!server_queue || server_queue.songs.length == 0) {
                        msg.channel.send('Nessuna canzone in coda!').then(msg => {
                            setTimeout(() => msg.delete(), 10000)
                        });
                        return
                    }
                    let voice_channel = await msg.member.voice.channel
                    if (!voice_channel || voice_channel !== server_queue.voice_channel) {
                        let embed = require('../../embed')(msg.guild)
                        embed.setTitle('Devi essere in un canale vocale per ascoltare la musica!')
                        msg.channel.send({ embeds: [embed] }).then(msg => {
                            setTimeout(() => msg.delete(), 10000)
                        });
                        return
                    }
                    server_queue.player.unpause()
                    msg.react('▶️')
                }
                break

            case 'skip':
            case 's':
                {
                    let server_queue = queue.get(msg.guild.id)
                    if (!server_queue || server_queue.songs.length == 0) {
                        msg.channel.send('Nessuna canzone in coda!').then(msg => {
                            setTimeout(() => msg.delete(), 10000)
                        });
                        return
                    }
                    let voice_channel = await msg.member.voice.channel
                    if (!voice_channel || voice_channel !== server_queue.voice_channel) {
                        let embed = require('../../embed')(msg.guild)
                        embed.setTitle('Devi essere in un canale vocale per ascoltare la musica!')
                        msg.channel.send({ embeds: [embed] }).then(msg => {
                            setTimeout(() => msg.delete(), 10000)
                        });
                        return
                    }
                    let currently_playing_pos = playing_song.get(msg.guild.id).pos + 1
                    if (currently_playing_pos >= server_queue.songs.length && server_queue.loop[0] === 'queue') {
                        currently_playing_pos = 0
                    }
                    let song
                    try {
                        song = server_queue.songs[currently_playing_pos]
                    } catch (error) {
                        song = undefined
                    }

                    let resource = await getResource(song)
                    if (!resource) {
                        let embed = require('../../embed')(msg.guild)
                            .setTitle('Coda terminata!')
                        server_queue.text_channel.send({ embeds: [embed] }).then(msg => {
                            setTimeout(() => msg.delete(), 10000)
                        });
                        server_queue.player.stop()
                        return
                    }
                    server_queue.player.play(resource)
                    msg.react('⏭️')
                }
                break;

            case 'jump':
            case 'j':
                {
                    let server_queue = queue.get(msg.guild.id)
                    if (!server_queue || server_queue.songs.length == 0) {
                        msg.channel.send('Nessuna canzone in coda!').then(msg => {
                            setTimeout(() => msg.delete(), 10000)
                        });
                        return
                    }
                    let voice_channel = await msg.member.voice.channel
                    if (!voice_channel || voice_channel !== server_queue.voice_channel) {
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
                        embed.setTitle(`Per favore inserisci un numero valido tra 1 e ${server_queue.songs.length}`)
                        msg.channel.send({ embeds: [embed] })
                        return
                    }

                    server_queue.player.play(await getNextSong(queue, msg.guild.id, num - 2))
                    let selected_song = server_queue.songs[num - 1]
                    let embed = require('../../embed.js')(msg.guild)
                        .addField('In riproduzione', `[**${selected_song.title}**](${selected_song.url})`)
                    msg.react('👍')
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
                    if (!voice_channel || voice_channel !== server_queue.voice_channel) {
                        let embed = require('../../embed')(msg.guild)
                        embed.setTitle('Devi essere in un canale vocale per ascoltare la musica!')
                        msg.channel.send({ embeds: [embed] }).then(msg => {
                            setTimeout(() => msg.delete(), 10000)
                        });
                        return
                    }

                    server_queue.songs = []
                    try {
                        server_queue.connection.destroy()
                    } catch (error) {
                        console.log(error)
                    }

                    queue.delete(msg.guild.id)
                    msg.react('👋')
                    console.log(`${bot.user.tag} disconesso da ${voice_channel.name}`)
                }

                break;

            case 'loop':
            case 'l':
                {
                    let server_queue = queue.get(msg.guild.id)
                    if (!server_queue || server_queue.songs.length == 0) {
                        msg.channel.send('Nessuna coda!').then(msg => {
                            setTimeout(() => msg.delete(), 10000)
                        });
                        return
                    }

                    let voice_channel = await msg.member.voice.channel
                    if (!voice_channel || voice_channel !== server_queue.voice_channel) {
                        let embed = require('../../embed')(msg.guild)
                        embed.setTitle('Devi essere in un canale vocale per ascoltare la musica!')
                        msg.channel.send({ embeds: [embed] }).then(msg => {
                            setTimeout(() => msg.delete(), 10000)
                        });
                        return
                    }

                    let loop_state = server_queue.loop.shift()
                    server_queue.loop.push(loop_state)

                    switch (server_queue.loop[0]) {
                        case 'no':
                            {
                                let embed = require('../../embed.js')(msg.guild)
                                    .setTitle('Loop disabilitato')
                                msg.react('➡️')
                                msg.channel.send({ embeds: [embed] })
                            }
                            break
                        case 'queue':
                            {
                                let embed = require('../../embed.js')(msg.guild)
                                    .setTitle('Loop abilitato')
                                msg.react('🔁')
                                msg.channel.send({ embeds: [embed] })
                            }
                            break
                        case 'track':
                            {
                                let embed = require('../../embed.js')(msg.guild)
                                    .setTitle('Loop abilitato sulla singola traccia')
                                msg.react('🔂')
                                msg.channel.send({ embeds: [embed] })
                            }
                            break
                    }
                }
                break;

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
                    if (!voice_channel || voice_channel !== server_queue.voice_channel) {
                        let embed = require('../../embed')(msg.guild)
                        embed.setTitle('Devi essere in un canale vocale per ascoltare la musica!')
                        msg.channel.send({ embeds: [embed] }).then(msg => {
                            setTimeout(() => msg.delete(), 10000)
                        });
                        return
                    }

                    let embed = require('../../embed.js')(msg.guild)
                    embed.setTitle('Coda')
                    for (let song of server_queue.songs) {
                        if (song === playing_song.get(msg.guild.id)) {
                            embed.addField('\u200b', `${(song.pos+1).toString()}) [${song.title}](${song.url})`, true)
                            embed.addField(blank_field, '*Now playing!*', true)
                        } else {
                            embed.addField('\u200b', `${(song.pos+1).toString()}) [${song.title}](${song.url})`)
                        }
                    }

                    Response(msg.channel, embed)

                }
                break

            case 'remove':
            case 'r':
                {
                    let server_queue = queue.get(msg.guild.id)

                    if (!server_queue || server_queue.songs.length == 0) {
                        let embed = require('../../embed')(msg.guild)
                        embed.setTitle('Devi essere in un canale vocale per ascoltare la musica!')
                        Response(msg.channel, embed, 10000)
                        return
                    }

                    let voice_channel = await msg.member.voice.channel
                    if (!voice_channel || voice_channel !== server_queue.voice_channel) {
                        let embed = require('../../embed')(msg.guild)
                        embed.setTitle('Devi essere in un canale vocale per ascoltare la musica!')
                        Response(msg.channel, embed, 10000)
                        return
                    }
                    let num
                    try {
                        num = parseInt(args[0])
                    } catch (error) {
                        console.log(error)
                        return
                    }

                    if (num < 1 || num > server_queue.songs.length || !num) {
                        let embed = require('../../embed')(msg.guild)
                        embed.setTitle(`Inserisci un numero valido tra 1 e ${server_queue.songs.length}`)
                        Response(msg.channel, embed)
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
                    ReactToMSg(msg, '⭕')
                    Response(msg.channel, embed)
                }

                break
        }
    }
}




async function ReactToMSg(msg, emoji) {
    await msg.react(emoji)
}

async function getIndex(array, target) {
    return array.indexOf(target)
}

async function Response(channel, embed, timeout = undefined) {
    try {
        if (!timeout) {
            channel.send({ embeds: [embed] }).then(msg => {
                setTimeout(() => msg.delete(), timeout)
            })
        } else {
            channel.send({ embeds: [embed] })
        }

    } catch (error) {
        console.log(error)
    }
}

async function GetNextSong(queue, guildID, forceskip) {
    let server_queue = queue.get(guildID)
    let loop = server_queue.loop

    if (!forceskip) {
        switch (loop) {
            case looping_states.disabled:

                break;
            case looping_states.queue:

                break;
            case looping_states.track:

                break;
            default:
                break;
        }
    } else {

    }

}

async function getSongObject(input, guildID) {
    // isurl
    let type_url = await play_dl.validate(input[0])
    try {
        type_url = type_url.split('_')
    } catch (error) {

    }

    switch (type_url[0]) {
        //youtube
        case 'yt':
            if (type_url[1] === 'video') {
                let media = (await play_dl.video_basic_info(input[0])).video_details
                console.log(media)
                let song = [{
                    url: media.url,
                    title: media.title,
                    thumbnail: media.thumbnail,
                    duration: media.durationInSec,
                    guildID: guildID
                }]
                return song
            }
            if (type_url[1] === 'playlist') {
                let playlist = (await play_dl.playlist_info(input[0]))
                console.log(playlist)
                let songs = []
                for (let i = 0; i < playlist.videoCount; i++) {
                    let song = {
                        url: playlist[i].video_details.url,
                        title: playlist[i].video_details.title,
                        thumbnail: playlist[i].video_details.thumbnail,
                        duration: playlist[i].video_details.durationInSec,
                        guildID: guildID
                    }
                    songs.push(song)
                }
                return songs
            }
            break;
            //spotify
        case 'sp':
            if (type_url[1] === 'album') {
                let playlist = (await play_dl.spotify(input[0]))
                console.log(playlist)
                let songs = []
                for (let i = 0; i < playlist.tracksCount; i++) {
                    let song = {
                        url: playlist[i].url,
                        title: playlist[i].title,
                        thumbnail: playlist[i].thumbnail,
                        duration: playlist[i].durationInSec,
                        guildID: guildID
                    }
                    songs.push(song)
                }
                return songs
            }
            if (type_url[1] === 'playlist') {
                let playlist = (await play_dl.spotify(input[0]))
                    // console.log(playlist)
                let tracks = await playlist.fetched_tracks.get('1')
                    // console.log(tracks)
                let songs = []
                console.log('fetching...')
                console.log(playlist.tracksCount)
                for (let i = 0; i < playlist.tracksCount; i++) {
                    let song = {
                        url: tracks[i].url,
                        title: tracks[i].name,
                        thumbnail: tracks[i].thumbnail,
                        duration: tracks[i].durationInSec,
                        guildID: guildID
                    }
                    songs.push(song)
                }
                console.log('done')
                return songs
            }
            if (type_url[1] === 'track') {
                let track = (await play_dl.spotify(input[0]))
                let yt_video = (await play_dl.search(track.name, { limit: 1, type: 'video' }))[0]
                let song = [{
                    url: yt_video.url,
                    title: yt_video.name,
                    thumbnail: yt_video.thumbnail,
                    duration: yt_video.durationInSec,
                    guildID: guildID
                }]

                song.push(song)

                return songs
            }

            break;
            //soundcloud
        case 'so':
            //bruh
            break;

        default:
            let query = ''
            if (input.length > 1) {
                query = input.join(' ')
            } else {
                query = input[0]
            }
            let media = (await play_dl.search(query, { type: 'video', limit: 1 }))[0]
                // console.log(media)
            song = [{
                url: media.url,
                title: media.title,
                thumbnail: media.thumbnail,
                duration: media.durationInSec,
                guildID: guildID
            }]
            return song
    }
}