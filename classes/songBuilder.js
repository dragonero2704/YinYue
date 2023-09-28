//includes
const ytdl = require('ytdl-core')
const playDL = require('play-dl')

/**
 * 
 * 
 */
class songBuilder {
    #query
    /**
     * 
     * @param {string} searchQuery The query to search for, can be an URL or a keyword
     */
    constructor(searchQuery) {
        this.#query = searchQuery
    }

    build() {

    }

    async playDlSearch() {
        let query = this.#query
        let type_url = await playDL.validate(query)
        try {
            type_url = type_url.split('_')
        } catch (error) { }
        switch (type_url[0]) {
            //youtube
            case 'yt':
                switch (type_url[1]) {
                    case 'video':
                        {
                            let media = (await playDL.video_info(query)).video_details
                            // console.log(media)
                            let song = {
                                url: media.url,
                                title: media.title,
                                thumbnailUrl: media.thumbnails[0].url,
                                duration: media.durationInSec,
                                durationRaw: media.durationRaw,
                            }
                            return song;
                        }

                        break;
                    case 'playlist':
                        {
                            let songs = []
                            console.log(query)
                            let videos = await (await playDL.playlist_info(query)).all_videos()
                            for (const video of videos) {
                                let song = {
                                    url: video.url,
                                    title: video.title,
                                    thumbnailUrl: video.thumbnails[0].url,
                                    duration: video.durationInSec,
                                    durationRaw: video.durationRaw,
                                }
                                songs.push(song)
                            }
                            return songs;
                        }
                        break;
                    case 'album':
                        break;
                }
                break;
            //spotify
            case 'sp':
                if (playDL.is_expired()) { await playDL.refreshToken() }
                let playlist = await playDL.spotify(query)

                switch (type_url[1]) {
                    case 'album':
                        {
                            let tracks = await playlist.all_tracks()
                            console.log(`fetching ${playlist.tracksCount} tracks from Youtube...`);
                            let promises = [];
                            tracks.forEach(track => {
                                promises.push(new Promise((resolve, reject) => {
                                    playDL.search(track.name, {
                                        type: 'video', limit: 1, source: {
                                            youtube: "video"
                                        }
                                    }).then(ytVideo => {
                                        ytVideo = ytVideo[0]
                                        if (ytVideo) {
                                            resolve({
                                                url: ytVideo.url,
                                                title: ytVideo.title,
                                                thumbnailUrl: ytVideo.thumbnails[0].url,
                                                duration: ytVideo.durationInSec,
                                                durationRaw: ytVideo.durationRaw,
                                            })
                                        } else
                                            reject()
                                    })

                                }))
                            })
                            return Promise.allSettled(promises)
                                .then(results => results.filter(val => val.status === 'fulfilled').map(val => val.value))
                                .catch(e => console.log)

                        }
                        break;
                    case 'playlist':
                        {
                            let playlist = await playDL.spotify(query)
                            let tracks = await playlist.all_tracks()
                            console.log(`fetching ${playlist.tracksCount} tracks from Youtube...`);
                            let promises = [];
                            tracks.forEach(track => {
                                promises.push(new Promise((resolve, reject) => {
                                    playDL.search(track.name, {
                                        type: 'video', limit: 1, source: {
                                            youtube: "video"
                                        }
                                    }).then(ytVideo => {
                                        ytVideo = ytVideo[0]
                                        if (ytVideo) {
                                            resolve({
                                                url: ytVideo.url,
                                                title: ytVideo.title,
                                                thumbnailUrl: ytVideo.thumbnails[0].url,
                                                duration: ytVideo.durationInSec,
                                                durationRaw: ytVideo.durationRaw,
                                            })
                                        } else
                                            reject()
                                    })

                                }))
                            })
                            return Promise.allSettled(promises)
                                .then(results => results.filter(val => val.status === 'fulfilled').map(val => val.value))
                                .catch(e => console.log)
                        }
                        break;
                    case 'track':
                        {
                            let track = await playDL.spotify(query);
                            let yt_video = (await playDL.search(track.name, { limit: 1 }))[0]

                            let song = {
                                url: yt_video.url,
                                title: yt_video.title,
                                thumbnailUrl: yt_video.thumbnails[0].url,
                                duration: yt_video.durationInSec,
                                durationRaw: yt_video.durationRaw,
                            }
                            return song;
                        }
                        break;
                }
            //soundcloud
            case 'so':
                //not implemented 
                playDL.getFreeClientID().then((clientID) => playDL.setToken({
                    soundcloud: {
                        client_id: clientID
                    }
                }))
                break;

            default:
                {
                    console.log(`Searching for '${query}' on YT`);
                    let media = undefined;
                    try {
                        media = (await playDL.search(query, {
                            type: 'video', limit: 1, source: {
                                youtube: "video"
                            }
                        }))[0];
                    } catch (error) {
                        console.log(error)
                    }

                    if (!media) return undefined;
                    let song = {
                        url: media.url,
                        title: media.title,
                        thumbnailUrl: media.thumbnails[0].url,
                        duration: media.durationInSec,
                        durationRaw: media.durationRaw,
                    }
                    console.log(`Match found: ${song.title}`)
                    return song;
                }
                break;
        }
        return undefined
    }
}