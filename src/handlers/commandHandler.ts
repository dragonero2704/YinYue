import { readdirSync } from "fs";
import ascii_table from "ascii-table";
import logger from "../logger";
import type { Client, Command } from "../interfaces";

export default function handler(client: Client) {
  let table = new ascii_table("Commands", null);
  table.setHeading("File", "Status");

  readdirSync("./commands/").forEach((dir) => {
    logger.info(`Reading commands/${dir}`);
    const commands = readdirSync(`${__dirname}/../commands/${dir}/`).filter(
      (file) => file.endsWith(".js")
    );
    logger.info(`Commands list: ${commands}`);
    commands.forEach((file) => {
      logger.info(`analyzing ${file}`);
      const pull: Command = require(`../commands/${dir}/${file}`).default;
      if (pull.disabled) {
        table.addRow(file, "Offline");
        return;
      }
      if (!pull.name) {
        table.addRow(file, "Missing [name] field. Skipping!");
        return;
      }
      table.addRow(file, "Online");
      client.commands.set(pull.name, pull);
    });
  });

  logger.info("\n" + table.toString());
}
