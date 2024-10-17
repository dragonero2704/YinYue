const play_dl = require("play-dl");
const Song = require("../classes/song");
const internal = require("stream");

const name = "play-dl";
/**
 *
 * @param {string} query
 * @returns {Promise<Object>} song
 */
const search = (query) => {
  // TODO
  return new Promise(async (resolve, reject) => {
    let typeUrl;
    if ((typeUrl = play_dl.validate(query))) {
      switch (typeUrl) {
        case "yt-video":
          // youtube video
          const video = await play_dl.video_info(query).catch((e) => reject(e));
          if (video) {
            resolve(
              new Song(
                video.video_details.url,
                video.video_details.title,
                video.video_details.channel.name,
                video.video_details.thumbnails[0].url,
                video.video_details.durationRaw,
                video.video_details.durationInSec
              )
            );
          } else {
            reject("Couldn't fetch info from url " + query);
          }
          break;

        default:
          reject("Not implemented");
          break;
      }
    } else {
      // query
      const options = {
        source: {
          youtube: "video",
        },
        limit: 1,
      };
      const video = await play_dl
        .search(query, {
          source: {
            youtube: "video",
          },
          limit: 1,
        })
        .catch((e) => reject(e));
      if (video) {
        const {video_details} = video[0]
        resolve(
          new Song(
            video_details.url,
            video_details.title,
            video_details.channel.name,
            video_details.thumbnails[0].url,
            video_details.durationRaw,
            video_details.durationInSec
          )
        );
      } else {
        reject("Couldn't find any result " + query);
      }
    }
  });
};
/**
 *
 * @param {url} url
 * @returns {Promise<internal.Readable>}
 */
const stream = (url) => {
  const options = {
    discordPlayerCompatibility: true,
    //quality: 2
  };
  return new Promise((resolve, reject) => {
    play_dl
      .stream(url, options)
      .then((stream) => {
        resolve(stream.stream);
      })
      .catch((error) => reject(error));
  });
};

module.exports = { search, stream };
