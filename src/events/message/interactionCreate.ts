import { InteractionType, CommandInteraction } from "discord.js";
import type { Client } from "../../interfaces";
import logger from "../../logger";
export default {
  name: "interactionCreate",
  /**
   *
   * @param {CommandInteraction} interaction
   * @param {Client} bot
   * @returns
   */
  async run(interaction: CommandInteraction, bot: Client) {
    if (!bot) return;
    if (interaction.type !== InteractionType.ApplicationCommand) return;
    const { commandName, locale } = interaction;
    logger.info(
      `${
        ((interaction?.member?.user.username as string) +
          interaction?.member?.user.discriminator) as string
      } run /${commandName.toLowerCase()} in guild ${interaction?.guild?.name}`,
    );
    try {
      bot?.commands?.get(commandName)?.run(interaction, bot, locale);
    } catch (warning) {
      logger.warn(warning);
    }
  },
};