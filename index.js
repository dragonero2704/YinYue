const { ShardingManager } = require("discord.js");
const { appendFile } = require("fs");
const { config } = require("dotenv");
const { listContent } = require(`./database/dbContent`);
const { syncModels } = require(`./database/dbInit`);

// winston logger
require("./logger");
const { logger } = global;

// globals definitions
global.globalQueue = new Map();

const dev = process.argv.includes("--dev");

if (dev) {
  logger.info("Usign [dev] enviroment [dev.env]");
  config({
    path: __dirname + "/dev.env",
  });
} else {
  config({
    path: __dirname + "/.env",
  });
}

logger.info("Syncing database");

const force = process.argv.includes("-f") || process.argv.includes("--force");

//sincronizzazione modelli
syncModels(force);
//contenuto tabelle database

// listContent()

const manager = new ShardingManager("./bot.js", {
  token: process.env.TOKEN,
  shardArgs: process.argv,
});
manager.on("shardCreate", (shard) => {
  logger.info(`Launched shard ${shard.id}`);
  shard.on("error", (e) => logger.error(e));
});

manager.spawn().catch(logger.error);

// Lingue supportate da discord.js
/*
    'Indonesian', 'EnglishUS',    'EnglishGB',
    'Bulgarian',  'ChineseCN',    'ChineseTW',
    'Croatian',   'Czech',        'Danish',
    'Dutch',      'Finnish',      'French',
    'German',     'Greek',        'Hindi',
    'Hungarian',  'Italian',      'Japanese',
    'Korean',     'Lithuanian',   'Norwegian',
    'Polish',     'PortugueseBR', 'Romanian',
    'Russian',    'SpanishES',    'Swedish',
    'Thai',       'Turkish',      'Ukrainian',
    'Vietnamese'
*/
