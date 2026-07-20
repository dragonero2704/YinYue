import type {
  SlashCommandBuilder,
  Client as DiscordClient,
  Collection,
} from "discord.js";

export interface Command {
  name: string;
  data: SlashCommandBuilder;
  run: Function;
  once?: boolean;
  disabled?: boolean;
}

export interface Client extends DiscordClient {
  commands: Collection<string, Command>;
}

export interface Song {
  url: string;
  title: string;
  author: string;
  thubnailUrl: string;
  textDuration: string;
  secondsDuration: string;
}

export type { Locale } from "discord.js";