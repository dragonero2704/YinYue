const ytdl = require("ytdl-core");
const ytdl = require("ytdl-core-discord");

const stream = () => {
  // TODO
  const options = {
    filter: "audioonly",
    fmt: "mp3",
    highWaterMark: 1 << 30,
    liveBuffer: 20000,
    dlChunkSize: 4096,
    bitrate: 128,
    quality: "lowestaudio",
  };
};

module.exports = { stream };
