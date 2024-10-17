const { readdirSync } = require("fs");
// const Song = require(ROOTDIR + "/classes/song");

const functions = new Map();

readdirSync("./libs")
  .filter((file) => file.endsWith(".js"))
  .forEach((file) => {
    const pull = require("./" + file);
    functions.set(file.split(".")[0], pull);
  });
/**
 * 
 * @param {string} query 
 * @param {Array} exclude 
 * @returns 
 */
const search = (query, exclude = []) => {
  const promises = [];
  for (const [key, value] of functions.entries()) {
    if (exclude.includes(key)) continue;
    const { search } = value;
    if (search) promises.push(search);
  }
  return Promise.any(promises.map(promise=>promise(query)));
};

/**
 * 
 * @param {string} url 
 * @param {Array} exclude 
 * @returns 
 */
const stream = (url, exclude = []) => {
  const promises = [];
  for (const [key, value] of functions.entries()) {
    if (exclude.includes(key)) continue;
    const { search } = value;
    if (search) promises.push(search);
  }
  return Promise.any(promises.map(promise=>promise(url)));
};

module.exports = { search, stream };
