const { ShardingManager } = require("discord.js");
const { config } = require("dotenv");
const { syncModels } = require(`./database/dbInit`);
const { getFreeClientID, setToken } = require("play-dl");
// winston logger init
require("./logger");

// Refresh soundcloud free token for play_dl
getFreeClientID().then((clientID) => {
  setToken({
    soundcloud: {
      client_id: clientID,
    },
  });
});

// globals definitions
global.globalQueue = new Map();
global.ROOTDIR = __dirname;

if (process.argv.includes("--dev")) {
  logger.info("Usign [dev] enviroment [dev.env]");
  config({ path: __dirname + "/dev.env" });
} else {
  config({ path: __dirname + "/.env" });
}

logger.info("Syncing database");

const force = process.argv.includes("-f") || process.argv.includes("--force");

//sincronizzazione modelli
syncModels(force);

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
