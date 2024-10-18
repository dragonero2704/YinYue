const { readdirSync } = require("fs");
const ascii_table = require("ascii-table");
const { Client } = require("discord.js");
/**
 *
 * @param {Client} client
 */
module.exports = (client) => {
  readdirSync("./languages/")
    .filter((file) => file.endsWith(".json"))
    .forEach((file) => {
      const pull = require(`../languages/${file}`)
      const key = pull.name ?? file.split('.')[0]
      client.locales.set(key, pull)
    });
  logger.info("Locales loaded");
};
