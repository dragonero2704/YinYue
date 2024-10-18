const ytstream = require("yt-stream");
const Song = require("../classes/song");
const cache = new Map();
const name = "yt-stream";
/**
 *
 * @param {string} query
 * @param {number} cacheTimer
 * @returns
 */
const search = (query, cacheTimer = 60_000) => {
  return new Promise((resolve, reject) => {
    if (cache.has(query)) resolve(cache.get(query));

    ytstream
      .search(query)
      .then((result) => {
        const video = result[0];
        const song = new Song(
          video.url,
          video.title,
          video.author,
          video.thumbnail,
          video.length_text,
          Math.round(video.length / 1000)
        );
        cache.set(query, song);
        setTimeout(cache.delete.bind(cache, query), cacheTimer);
        resolve(song);
      })
      .catch((error) => reject(error));
  });
};
/**
 *
 * @param {string} url
 * @returns
 */
const stream = (url) => {
  const options = {
    quality: "high",
    download: true, // non toccare - causa errore interno non recuperabile
    type: "audio",
  };
  return new Promise((resolve, reject) => {
    ytstream
      .stream(url, options)
      .then((s) => resolve(s.stream))
      .catch((error) => reject(error));
  });
};

module.exports = { search, stream };
