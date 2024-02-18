const { ShardingManager } = require('discord.js');
const { appendFile } = require('fs')
const { config } = require("dotenv")
// const { startWebServer } = require('./server/server');
const { listContent } = require(`./database/dbContent`)
const { syncModels } = require(`./database/dbInit`)

require("./misc/consoleOverride")();

const test = process.argv.includes('--test')

if(test){
    config({
        path: __dirname + '/test.env'
    })
}else{
    config({
        path: __dirname + '/.env'
    })
}

// startWebServer();

console.log('Syncing database')

const force = process.argv.includes('-f')||process.argv.includes('--force')

//sincronizzazione modelli
syncModels(force)
//contenuto tabelle database
console.log("listing content...")
// listContent()

const manager = new ShardingManager('./bot.js', {token: process.env.TOKEN, shardArgs: process.argv});
// console.log("hi")
manager.on('shardCreate', shard => {
    console.log(`Launched shard ${shard.id}`)
    shard.on("error",e=>console.error(e));
});

manager.spawn().catch(console.error);

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






