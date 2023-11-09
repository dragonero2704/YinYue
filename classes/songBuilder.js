//includes
const ytdl = require('ytdl-core-discord')
const playDL = require('play-dl')

const isValidUrl = urlString => {
    try {
        return Boolean(new URL(urlString));
    }
    catch (e) {
        return false;
    }
}

/**
 * 
 * 
 */
class SongBuilder {
    #query
    #methods
    /**
     * 
     * @param {string} searchQuery The query to search for, can be an URL or a keyword
     */
    constructor(searchQuery) {
        console.log("Searchquery: " + searchQuery)
        this.#query = searchQuery
        this.#methods = [
            this.#playDlSearch
            // update this list every time a new search method is added
        ]
        // console.log(this.#query)
    }

    build(searchQuery = undefined) {
        if (searchQuery) this.#query = searchQuery
        const promiseLst = this.#methods.map((val) => val.call(this))
        return Promise.any(promiseLst)
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
     * @returns {Promise}
     */
    #playDlSearch() {
        return new Promise(async (resolve, reject) => {
            const query = this.#query
            // console.log('Query: '+query)
            let typeUrl = undefined
            if (isValidUrl(query)) {
                typeUrl = await playDL.validate(query).catch(error)
                typeUrl = typeUrl.split('_')
            }
            else {
                typeUrl = ['_', '_']
            }

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
                                // console.log(query)
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
                                                        } else { reject() }
                                                    })

                                                }))
                                            })
                                            resolve(Promise.allSettled(promises)
                                                .then(results => results.filter(val => val.status === 'fulfilled').map(val => val.value))
                                                .catch(error => reject(error)))
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
                                                                .catch(error => reject(error))
                                                        }))
                                                    })
                                                    return Promise.allSettled(promises)
                                                        .then(results => results.filter(val => val.status === 'fulfilled').map(val => val.value))
                                                        .catch(e => console.error)
                                                })
                                                .catch(error => reject(error))
                                        })
                                        .catch(error => reject(error))
                                }
                                break;
                            case 'track':
                                {
                                    playDL.spotify(query)
                                        .then(track => {
                                            playDL.search(track.name, { limit: 1 })
                                                .then(res => {
                                                    const ytVideo = res[0];
                                                    const song = {
                                                        url: ytVideo.url,
                                                        title: ytVideo.title,
                                                        thumbnailUrl: ytVideo.thumbnails[0].url,
                                                        duration: ytVideo.durationInSec,
                                                        durationRaw: ytVideo.durationRaw,
                                                    }
                                                    resolve(song)
                                                })
                                                .catch(error => reject(error));

                                        })

                                        .catch(error => reject(error));
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
                        // console.log(`Searching for '${query}' on YT`);
                        let media = undefined;

                        playDL.search(query, {
                            limit: 1, source: {
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
    }


}

module.exports = {
    module: true,
    SongBuilder
}