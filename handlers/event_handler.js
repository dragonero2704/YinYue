const { readdirSync } = require("fs");
const {Client} = require('discord.js')
const ascii_table = require("ascii-table");

/**
 * 
 * @param {Client} client 
 */
module.exports = (client) => {
  let table = new ascii_table("Events");
  table.setHeading("Event", "Status");
  readdirSync("./events/").forEach((dir) => {
    const events = readdirSync(`./events/${dir}/`).filter((file) =>
      file.endsWith(".js")
    );

    for (const file of events) {
      const event = require(`../events/${dir}/${file}`);

      const event_name = event.name ?? file.split(".")[0];

      table.addRow(file, "Online");
      if (event.once) {
        client.once(event_name, (...args) => event.run(...args, client));
      } else {
        client.on(event_name, (...args) => event.run(...args, client));
      }
    }
  });
  logger.info("\n" + table.toString());
};
