const ytdl = require("ytdl-core-discord");
const play_dl = require("play-dl");
const { createAudioResource } = require("@discordjs/voice");

const ytdlPromise = (song) => {
  logger.debug(song)
  return new Promise((resolve, reject) => {
    const options = {
      filter: "audioonly",
      fmt: "mp3",
      highWaterMark: 1 << 30,
      liveBuffer: 20000,
      dlChunkSize: 4096,
      bitrate: 128,
      quality: "lowestaudio",
    };
    try {
      ytdl(song.url, options)
        .then((stream) => {
          let resource;
          try {
            resource = createAudioResource(stream, {
              metadata: song,
              // Do not uncomment, errors with discord opus may come up
              // inlineVolume: true,
              // inputType: StreamType.
              inputType: StreamType.Opus,
            });
          } catch (error) {
            reject(Error("YTDL Resource " + error));
          }
          resolve(resource);
        })
        .catch((error) => reject(error));
    } catch (e) {
      reject(e);
    }
  });
};

const playDlPromise = (song) => {
  console.debug(song)
  return new Promise((resolve, reject) => {
    // console.log("Creating stream")
    play_dl
      .stream(song.url, { quality: 1, discordPlayerCompatibility: true })
      .then((stream) => {
        let resource;
        // console.log("Creating Resource")
        try {
          resource = createAudioResource(stream.stream, {
            metadata: song,
            // Do not uncomment, errors with discord opus may come up
            // inlineVolume: true,
            inputType: stream.type,
          });
        } catch (error) {
          reject(error);
        }
        resolve(resource);
      })
      .catch((error) => reject(error));
  });
};

module.exports = {
  ytdlPromise,
  playDlPromise,
  module: true,
};
