import { readdirSync } from "fs";
import ascii_table from "ascii-table";
import logger from "../logger.js";
import type { Client } from "../interfaces.js";

/**
 *
 * @param {Client} client
 */
export default function handler(client: Client) {
  let table = new ascii_table("Events");
  table.setHeading("Event", "Status");
  readdirSync("./events/").forEach((dir) => {
    const events = readdirSync(`${__dirname}/../events/${dir}/`).filter(
      (file) => file.endsWith(".js")
    );

    for (const file of events) {
      const event = require(`../events/${dir}/${file}`).default;

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
}
