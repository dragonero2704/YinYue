const Discord = require('discord.js');
const { config } = require("dotenv");
const { readdirSync } = require('fs');

const bot = new Discord.Client({
    disableMentions: "everyone"
})

bot.commads = new Discord.Collection()


let handler_path = __dirname + './handlers';
readdirSync(handler_path).forEach((handler) => {
    require(handler_path + handler)(bot)
})

config({
    path: __dirname + './.env'
})



bot.on('ready', () => {
    console.log('Bot online!')
})

bot.login(process.env.TOKEN)