const { Client, Collection, Intents } = require('discord.js')
const { config } = require("dotenv")
const { readdirSync } = require('fs')

const bot = new Client({
    disableMentions: "everyone",
    intents: [Intents.FLAGS.GUILDS],
})

bot.commands = new Collection()
bot.aliases = new Collection()
bot.events = new Collection()

console.log(__dirname)
let handler_path = __dirname + '/handlers'
readdirSync(handler_path).forEach((handler) => {
    require(`${handler_path}/${handler}`)(bot)
})

config({
    path: __dirname + '/.env'
})

bot.on('ready', () => {
    console.log('Bot online!')
})

bot.on('message', (msg) => {
    console.log(msg)
})


bot.login(process.env.TOKEN)