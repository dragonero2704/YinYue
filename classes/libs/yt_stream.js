const ytstream = require("yt-stream");
const Song = require("../song");
const cache = new Map();
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
        const songsArray = result.map(
          (video) =>
            new Song(
              video.url,
              video.title,
              video.author,
              video.thumbnail,
              video.length_text,
              video.length
            )
        );
        cache.set(query, songsArray);
        setTimeout(cache.delete.bind(cache, query), cacheTimer);
      })
      .catch((error) => reject(error));
  });
};

const stream = (url) => {
  return new Promise((resolve, reject) => {
    ytstream
      .stream(url, { quality: "high", download: false, type: "audio" })
      .then((stream) => resolve(stream))
      .catch((error) => reject(error));
  });
};

module.exports = { search, stream };
