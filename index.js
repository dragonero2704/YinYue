const { ShardingManager, VoiceChannel } = require('discord.js');
const { appendFile } = require('fs')
const { config } = require("dotenv")
const { startWebServer } = require('./server/server');
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
listContent()

const manager = new ShardingManager('./bot.js', { token: process.env["TOKEN"] });

manager.on('shardCreate', shard => {
    console.log(`Launched shard ${shard.id}`)
});

// const v = new VoiceChannel()
// v.members.size()

manager.spawn();

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






