//includes
const ytdl = require("ytdl-core-discord");
const playDL = require("play-dl");

const isValidUrl = (urlString) => {
  try {
    return Boolean(new URL(urlString));
  } catch (e) {
    return false;
  }
};

function SecsToRaw(seconds) {
  let res = [];
  while (seconds > 0) {
    res.push(String(Math.floor(seconds % 60)).padStart(2, "0"));
    seconds /= 60;
    seconds = Math.floor(seconds);
  }
  return res.join(":");
}
/**
 *
 * @param {String} raw
 */
function RawToSecs(raw) {
  //             sec min hours
  const bases = [1, 60, 60 * 60];
  raw = "sa:da:sda";
  const arr = raw.split(":").reverse().slice(0, 3);
  let seconds = 0;
  arr.map((v, i) => v * bases[i]).forEach((v) => (seconds += v));
  return seconds;
}

/**
 *
 *
 */
class SongBuilder {
  #query;
  #methods;
  /**
   *
   * @param {string} searchQuery The query to search for, can be an URL or a keyword
   */
  constructor(searchQuery) {
    console.log("Searchquery: " + searchQuery);
    this.#query = searchQuery;
    this.#methods = [
      this.#playDlSearch,
      // update this list every time a new search method is added
    ];
    // console.log(this.#query)
  }

  build(searchQuery = undefined) {
    if (searchQuery) this.#query = searchQuery;
    const promiseLst = this.#methods.map((fun) => fun.call(this));
    return Promise.any(promiseLst);
  }
  /**
   * sets the query
   * @param {string} query
   */
  setQuery(query) {
    this.#query = query;
  }

  /**
   *
   * @returns {Promise}
   */
  #playDlSearch() {
    return new Promise(async (resolve, reject) => {
      const query = this.#query;
      // console.log('Query: '+query)
      let typeUrl = undefined;
      if (isValidUrl(query)) {
        typeUrl = await playDL.validate(query)
        .catch(console.error);
        typeUrl = typeUrl.split("_");
      } else {
        typeUrl = ["_", "_"];
      }

      switch (typeUrl[0]) {
        //youtube
        case "yt":
          switch (typeUrl[1]) {
            case "video":
              {
                const media = await playDL.video_basic_info(query).catch(error => reject(error));
                if(!media) reject("Can't retrieve video information")
                const video = media.video_details;
                const song = {
                  url: video.url,
                  title: video.title,
                  thumbnailUrl: video.thumbnails[0].url,
                  duration: video.durationInSec,
                  durationRaw: video.durationRaw,
                };
                resolve(song);
              }

              break;
            case "playlist":
              {
                // console.log(query)
                let videos = await playDL
                  .playlist_info(query)
                  .catch((error) => reject(error));
                videos = await videos
                  .all_videos()
                  .catch((error) => reject(error));
                let songs = [];
                for (const video of videos) {
                  let song = {
                    url: video.url,
                    title: video.title,
                    thumbnailUrl: video.thumbnails[0].url,
                    duration: video.durationInSec,
                    durationRaw: video.durationRaw,
                  };
                  songs.push(song);
                }
                resolve(songs);
              }
              break;
            case "album":
              break;
          }
          break;
        //spotify
        case "sp":
          if (playDL.is_expired()) {
            await playDL.refreshToken();
          }
          const playlist = await playDL
            .spotify(query)
            .catch((error) => reject(error));

          switch (typeUrl[1]) {
            case "album":
              {
                console.log(
                  `fetching ${playlist.tracksCount} tracks from Youtube...`
                );
                const traks = playlist
                  .all_tracks()
                  .catch((error) => reject(error));

                let promises = [];
                tracks.forEach((track) => {
                  promises.push(
                    new Promise((resolve, reject) => {
                      playDL
                        .search(track.name, {
                          type: "video",
                          limit: 1,
                          source: {
                            youtube: "video",
                          },
                        })
                        .then((ytVideo) => {
                          ytVideo = ytVideo[0];
                          if (ytVideo) {
                            resolve({
                              url: ytVideo.url,
                              title: ytVideo.title,
                              thumbnailUrl: ytVideo.thumbnails[0].url,
                              duration: ytVideo.durationInSec,
                              durationRaw: ytVideo.durationRaw,
                            });
                          } else {
                            reject();
                          }
                        });
                    })
                  );
                });
                resolve(
                  Promise.allSettled(promises)
                    .then((results) =>
                      results
                        .filter((val) => val.status === "fulfilled")
                        .map((val) => val.value)
                    )
                    .catch((error) => reject(error))
                );
              }
              break;
            case "playlist":
              {
                playDL
                  .spotify(query)
                  .then((playlist) => {
                    console.log(
                      `fetching ${playlist.tracksCount} tracks from Youtube...`
                    );
                    playlist
                      .all_tracks()
                      .then((tracks) => {
                        let promises = [];
                        tracks.forEach((track) => {
                          promises.push(
                            new Promise((resolve, reject) => {
                              playDL
                                .search(track.name, {
                                  type: "video",
                                  limit: 1,
                                  source: {
                                    youtube: "video",
                                  },
                                })
                                .then((ytVideo) => {
                                  ytVideo = ytVideo[0];
                                  if (ytVideo) {
                                    resolve({
                                      url: ytVideo.url,
                                      title: ytVideo.title,
                                      thumbnailUrl: ytVideo.thumbnails[0].url,
                                      duration: ytVideo.durationInSec,
                                      durationRaw: ytVideo.durationRaw,
                                    });
                                  } else reject();
                                })
                                .catch((error) => reject(error));
                            })
                          );
                        });
                        return Promise.allSettled(promises)
                          .then((results) =>
                            results
                              .filter((val) => val.status === "fulfilled")
                              .map((val) => val.value)
                          )
                          .catch((e) => console.error);
                      })
                      .catch((error) => reject(error));
                  })
                  .catch((error) => reject(error));
              }
              break;
            case "track":
              {
                playDL
                  .spotify(query)
                  .then((track) => {
                    playDL
                      .search(track.name, { limit: 1 })
                      .then((res) => {
                        const ytVideo = res[0];
                        const song = {
                          url: ytVideo.url,
                          title: ytVideo.title,
                          thumbnailUrl: ytVideo.thumbnails[0].url,
                          duration: ytVideo.durationInSec,
                          durationRaw: ytVideo.durationRaw,
                        };
                        resolve(song);
                      })
                      .catch((error) => reject(error));
                  })

                  .catch((error) => reject(error));
              }
              break;
          }

        //soundcloud
        case "so":
          //not implemented
          playDL
            .getFreeClientID()
            .then((clientID) => {
              playDL
                .setToken({
                  soundcloud: {
                    client_id: clientID,
                  },
                })
                .catch((e) => reject(e));
            })
            .catch((e) => reject(e));

          switch (typeUrl[1]) {
            case "track":
              let info = await playDL.soundcloud(query).catch((e) => reject(e));
              const song = {
                url: query,
                title: info.name,
                thumbnailUrl: info.thumbnail,
                duration: info.durationInSec,
                durationRaw: SecsToRaw(info.durationInSec),
              };
              resolve(song);
              break;

            default:
              break;
          }

          break;

        default:
          {
            let media = await playDL
              .search(query, {
                limit: 1,
                source: {
                  youtube: "video",
                },
              })
              .then((r) => r[0])
              .catch((error) => reject(error));
            console.debug(media);
            if (media === undefined) reject("No results");
            const song = {
              url: media.url,
              title: media.title,
              thumbnailUrl: media.thumbnails[0].url,
              duration: media.durationInSec,
              durationRaw: media.durationRaw,
            };
            console.log(`Match found: ${song.title}`);
            resolve(song);
          }
          break;
      }

      reject("Link not supported");
    });
  }
}

module.exports = {
  module: true,
  SongBuilder,
  SecsToRaw,
  RawToSecs,
};
