import {
  Client as DiscordClient,
  GatewayIntentBits,
  Collection,
} from "discord.js";
import { readdirSync } from "fs";
import type { Client, Command } from "./interfaces";

const client = new DiscordClient({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ],
}) as Client;

client.commands = new Collection<string, Command>();

const handler_path = __dirname + "/handlers";
readdirSync(handler_path)
  .filter((file) => file.endsWith(".js"))
  .forEach((file) => {
    const handler = require(`${handler_path}/${file}`).default;
    handler(client)
  });

client.login(process.env.TOKEN);
