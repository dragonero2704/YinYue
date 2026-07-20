import type {
  Guild,
  Message,
  EmojiIdentifierResolvable,
} from "discord.js";
import { EmbedBuilder } from "discord.js";
/**
 *
 * @param {Guild} guild
 * @returns
 */
export function embedFromGuild(guild: Guild) {
  let embed = new EmbedBuilder().setColor(guild.members.me?.displayColor ?? 0);
  return embed;
}

interface EmbedParams {
  guild: Guild;
  title: string;
  content?: string;
  url?: string;
}

export function titleEmbed({ guild, title, content, url }: EmbedParams) {
  let embed = embedFromGuild(guild);
  embed.setTitle(title);
  if (content) embed.setDescription(content);
  if (url) embed.setURL(url);
  return embed;
}

export function fieldEmbed({ guild, title, content }: EmbedParams) {
  return embedFromGuild(guild).addFields([
    { name: title, value: content ?? "" },
  ]);
}