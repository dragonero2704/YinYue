const { readdirSync } = require("fs");
const { logger } = global;
const ascii_table = require("ascii-table");
/**
 *
 * @param {Client} client a valid discord Client()
 */
module.exports = (client) => {
  let table = new ascii_table("Commands");
  table.setHeading("File", "Status");

  readdirSync("./commands/").forEach((dir) => {
    const commands = readdirSync(`./commands/${dir}/`).filter((file) =>
      file.endsWith(".js")
    );

    for (const file of commands) {
      let pull = require(`../commands/${dir}/${file}`);
      if (pull.disabled) {
        table.addRow(file, "Offline");
        continue;
      }
      if (!pull.name) {
        table.addRow(file, "Missing [name] field. Skipping!");
        continue;
      }
      client.commands.set(pull.name, pull);
      table.addRow(file, "Online");

      if (pull.aliases && Array.isArray(pull.aliases))
        pull.aliases.forEach((alias) => client.aliases.set(alias, pull.name));
    }
  });
  logger.info("\n" + table.toString());
};
