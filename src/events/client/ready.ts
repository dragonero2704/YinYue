import ascii_table from "ascii-table";
import type { Client } from "../../interfaces";
import logger from "../../logger";
import { ActivityType, type GuildMember } from "discord.js";

export default {
  name: "ready",
  once: true,
  async run(bot: Client) {
    logger.info(`${bot?.user?.tag} online!`);

    // bot activity set
    bot.user?.setPresence({
      status: "online",
      afk: false,
      activities: [
        {
          name: "docs",
          state: "playing",
          type: ActivityType.Watching,
        },
      ],
    });

    // server listing
    let serverTable = new ascii_table("Servers");
    logger.info("Fetching servers...");
    serverTable.setHeading("Server", "Id", "Owner");
    let guilds = bot.guilds.cache.values();
    for (const guild of guilds) {
      const owner = (await guild.fetchOwner().catch((e) => {
        logger.warn(e.message);
      })) as GuildMember;
      serverTable.addRow(guild.name.trim(), guild.id, owner.user.tag);
    }
    logger.info("\n" + serverTable.toString());
  },
};
