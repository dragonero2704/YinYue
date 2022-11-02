const {Client, GatewayIntentBits, Collection} = require('discord.js')

const { config } = require("dotenv")

const { readdirSync } = require('fs')

const keepAlive = require('./server/server')




const bot = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMembers],
})

bot.commands = new Collection()
bot.aliases = new Collection()
bot.prefix = new Map()
bot.prefix.set('default', '-')

let handler_path = __dirname + '/handlers'
readdirSync(handler_path).forEach((handler) => {
    require(`${handler_path}/${handler}`)(bot)
})

config({
    path: __dirname + '/.env'
})

keepAlive()

bot.login(process.env.TOKEN)






