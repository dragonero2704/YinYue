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

    },

    async run(msg, args, bot, Discord) {

    }
}




async function ReactToMSg(msg, emoji) {
    await msg.react(emoji)
}

async function GetNextSong(queue, guildID, forceskip) {
    let server_queue = queue.get(guildID)

}

async function getSongObject(args, songs_length, guildID) {
    // isurl
    let type_url = play_dl.validate(args[0])
    try {
        type_url = type_url.split('_')
    } catch (error) {

    }

    switch (type_url[0]) {
        //youtube
        case 'yt':
            if (type_url[1] === 'video') {
                let media = (await play_dl.video_basic_info(args[0])).video_details
                console.log(media)
                let song = [{
                    url: media.url,
                    title: media.title,
                    thumbnail: media.thumbnail,
                    duration: media.durationInSec,
                    pos: songs_length,
                    guildID: guildID
                }]
                return song
            }
            if (type_url[1] === 'playlist') {
                let playlist = (await play_dl.playlist_info(args[0]))
                console.log(playlist)
                let songs = []
                for (let i = 0; i < playlist.videoCount; i++) {
                    let song = {
                        url: playlist[i].video_details.url,
                        title: playlist[i].video_details.title,
                        thumbnail: playlist[i].video_details.thumbnail,
                        duration: playlist[i].video_details.durationInSec,
                        pos: songs_length + i,
                        guildID: guildID
                    }
                    songs.push(song)
                }
                return songs
            }
            break;
            //spotify
        case 'sp':

            break;
            //soundcloud
        case 'so':

            break;

        default:
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
                duration: media.durationInSec,
                pos: songs_length,
                guildID: guildID
            }]
            return song
    }
}