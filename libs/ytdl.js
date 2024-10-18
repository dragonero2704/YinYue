const ytdl = require("ytdl-core");
const ytdldiscord = require("ytdl-core-discord");
const Song = require("../classes/song");
const name = "ytdl";
/**
 *
 * @param {string} url
 */
const stream = (url, options = undefined) => {
  const defaultOptions = {
    filter: "audioonly",
    fmt: "mp3",
    highWaterMark: 1 << 30,
    liveBuffer: 20000,
    dlChunkSize: 4096,
    bitrate: 128,
    quality: "highestaudio",
  };
  return new Promise((resolve, reject) => {
    try {
      const str = ytdl(url, options ?? defaultOptions);
    } catch (error) {
      reject(error);
    }
    resolve(str);
  });
};

module.exports = { stream };
