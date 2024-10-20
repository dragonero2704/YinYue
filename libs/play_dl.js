const play_dl = require("play-dl");
const Song = require("../classes/song");
const internal = require("stream");
const { Cache } = require("../classes/cache");
const {
  NotImplemented,
  PlaylistNotFound,
  NoResults,
  VideoNotFound,
} = require("../classes/error");
const cache = new Cache({ size: 1000, enableKeyTTL: true });
const name = "play-dl";
/**
 *
 * @param {string} query
 * @returns {Promise<Array<Song>>} song
 */
const search = (query) => {
  // TODO
  return new Promise(async (resolve, reject) => {
    // cache check

    let typeUrl;
    if ((typeUrl = play_dl.validate(query))) {
      switch (typeUrl) {
        case "yt-video":
          // youtube video
          const video = await play_dl.video_info(query).catch((e) => reject(e));
          if (video) {
            resolve([
              new Song(
                video.video_details.url,
                video.video_details.title,
                video.video_details.channel.name,
                video.video_details.thumbnails.sort(
                  ({ width1 }, { width2 }) => width1 > width2
                )[0],
                video.video_details.durationRaw,
                video.video_details.durationInSec
              ),
            ]);
          } else {
            reject(new VideoNotFound(query));
          }
          break;
        case "yt-playlist":
          const playlist = await play_dl
            .playlist_info(query)
            .catch((e) => reject(e));
          if (playlist instanceof play_dl.YouTubePlayList) {
            const videos = await playlist.all_videos();
            const songs = videos.map((video) => {
              new Song(
                video.url,
                video.title,
                video.channel.name,
                video.thumbnails.sort(
                  ({ width1 }, { width2 }) => width1 > width2
                )[0],
                video.durationRaw,
                video.durationInSec
              );
            });
            resolve(songs);
          } else {
            reject(new PlaylistNotFound(query));
          }

          break;
        default:
          reject(new NotImplemented(query));
          break;
      }
    } else {
      // keyword search
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
        const { video_details } = video[0];
        resolve([
          new Song(
            video_details.url,
            video_details.title,
            video_details.channel.name,
            video.thumbnails.sort(
              ({ width1 }, { width2 }) => width1 > width2
            )[0],
            video_details.durationRaw,
            video_details.durationInSec
          ),
        ]);
      } else {
        reject(new NoResults(query));
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
