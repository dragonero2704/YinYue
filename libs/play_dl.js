const play_dl = require("play-dl");
const Song = require(ROOTDIR + "/classes/song");

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
    } else {
    }
  });
};
/**
 *
 * @param {url} url
 * @returns
 */
const stream = (url) => {
  // TODO
  return new Promise((resolve, reject) => {
    play_dl
      .stream(url)
      .then((stream) => {
        resolve(stream);
      })
      .catch((error) => reject(error));
  });
};

module.exports = { search, stream };
