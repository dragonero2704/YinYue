const { Client, GatewayIntentBits, Collection } = require("discord.js");
const { readdirSync } = require("fs");
const logger = require("./logger");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();
client.aliases = new Collection();

const handler_path = __dirname + "/handlers";
readdirSync(handler_path).forEach((handler) => {
  require(`${handler_path}/${handler}`)(client);
});

client.login(process.env.TOKEN);
