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
    /**
     * sets the query
     * @param {string} query 
     */
    setQuery(query) {
        this.#query = query
    }

    /**
     * 
     * @returns {{url: media.url,title: media.title,thumbnailUrl: "media.thumbnails[0].url",duration: media.durationInSec,durationRaw: media.durationRaw,}}
     */
    playDlSearch() {
        return new Promise((resolve, reject) => {
            let query = this.#query
            let typeUrl = playDL.validate(query)
                .then(async typeUrl => {
                    if (typeUrl !== "search") typeUrl = typeUrl.split('_')
                    switch (typeUrl[0]) {
                        //youtube
                        case 'yt':
                            switch (typeUrl[1]) {
                                case 'video':
                                    {
                                        playDL.video_info(query)
                                            .then(res => {
                                                const media = res.video_details
                                                const song = {
                                                    url: media.url,
                                                    title: media.title,
                                                    thumbnailUrl: media.thumbnails[0].url,
                                                    duration: media.durationInSec,
                                                    durationRaw: media.durationRaw,
                                                }
                                                resolve(song)
                                            })
                                            .catch(error => reject(error))
                                    }

                                    break;
                                case 'playlist':
                                    {
                                        let songs = []
                                        console.log(query)
                                        playDL.playlist_info(query)
                                            .then(res => res.all_videos())
                                            .then(videos => {
                                                let songs = []
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
                                                resolve(songs)
                                            })
                                            .catch(error => reject(error))
                                    }
                                    break;
                                case 'album':
                                    break;
                            }
                            break;
                        //spotify
                        case 'sp':
                            if (playDL.is_expired()) { await playDL.refreshToken() }
                            let playlist = playDL.spotify(query).then(playlist => {
                                switch (typeUrl[1]) {
                                    case 'album':
                                        {
                                            console.log(`fetching ${playlist.tracksCount} tracks from Youtube...`);
                                            playlist.all_tracks()
                                                .then(tracks => {
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
                                                    resolve(Promise.allSettled(promises)
                                                        .then(results => results.filter(val => val.status === 'fulfilled').map(val => val.value))
                                                        .catch(e => console.error))
                                                })
                                                .catch(error => reject(error))
                                        }
                                        break;
                                    case 'playlist':
                                        {
                                            playDL.spotify(query)
                                                .then(playlist => {
                                                    console.log(`fetching ${playlist.tracksCount} tracks from Youtube...`)
                                                    playlist.all_tracks()
                                                        .then(tracks => {
                                                            let promises = [];
                                                            tracks.forEach(track => {
                                                                promises.push(new Promise((resolve, reject) => {
                                                                    playDL.search(track.name, {
                                                                        type: 'video', limit: 1, source: {
                                                                            youtube: "video"
                                                                        }
                                                                    })
                                                                    .then(ytVideo => {
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
                                                                    .catch(error=>console.error)
                                                                }))
                                                            })
                                                            return Promise.allSettled(promises)
                                                                .then(results => results.filter(val => val.status === 'fulfilled').map(val => val.value))
                                                                .catch(e => console.log)
                                                        })
                                                        .catch(error => reject(error))
                                                })
                                                .catch(error=>reject(error))
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
                            })
                                .catch(error => reject(error))


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

                                playDL.search(query, {
                                    type: 'video', limit: 1, source: {
                                        youtube: "video"
                                    }
                                })
                                    .then(results => results[0])
                                    .then(media => {
                                        if (!media) reject("No results")
                                        const song = {
                                            url: media.url,
                                            title: media.title,
                                            thumbnailUrl: media.thumbnails[0].url,
                                            duration: media.durationInSec,
                                            durationRaw: media.durationRaw,
                                        }
                                        console.log(`Match found: ${song.title}`)
                                        resolve(song)
                                    })
                                    .catch(error => reject(error))



                            }
                            break;
                    }
                })
                .catch(error => console.error)
        })
    }
}