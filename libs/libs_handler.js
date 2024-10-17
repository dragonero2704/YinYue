const { readdirSync } = require("fs");
const { Stream } = require("stream");
// const Song = require(ROOTDIR + "/classes/song");

const functions = new Map();

const methods = readdirSync("./libs").filter(
  (file) => file.endsWith(".js") && file !== "libs_handler.js"
);

methods.forEach((file) => {
  const pull = require("./" + file);
  functions.set(file.split(".")[0], pull);
});
/**
 *
 * @param {string} query
 * @param {Array} exclude
 * @returns {Promise<Song>}
 */
const search = (query, exclude = []) => {
  const promises = [];
  for (const [key, value] of functions.entries()) {
    if (exclude.includes(key)) continue;
    const { search } = value;
    if (search) promises.push(search);
  }
  return Promise.any(promises.map((promise) => promise(query)));
};

/**
 *
 * @param {string} url
 * @param {Array} exclude
 * @returns {Promise<Stream>} 
 */
const stream = (url, exclude = []) => {
  const promises = [];
  for (const [key, value] of functions.entries()) {
    if (exclude.includes(key)) continue;
    const { stream } = value;
    if (stream) promises.push(stream);
  }
  return Promise.any(promises.map((promise) => promise(url)));
};

module.exports = { search, stream, methods : methods.map(file=>file.split('.')[0]) };
