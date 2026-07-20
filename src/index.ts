import { ShardingManager } from "discord.js";
// import { syncModels } from "./database/dbInit.js";
import { getFreeClientID, setToken } from "play-dl";
import logger from "./logger";
import {NotImplemented} from "./errors"

// Refresh soundcloud free token for play_dl
getFreeClientID().then((clientID) => {
  setToken({
    soundcloud: {
      client_id: clientID,
    },
  });
});

const force = process.argv.includes("-f") || process.argv.includes("--force");

//sincronizzazione modelli
// syncModels(force);

const manager = new ShardingManager("./bot.js", {
  token: process.env.TOKEN as string,
  shardArgs: process.argv,
});

manager.on("shardCreate", (shard) => {
  logger.info(`Launched shard ${shard.id}`);
  shard.on("error", (e) => logger.error(e));
});

manager.spawn().catch(({ message }) => logger.error(message));

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
