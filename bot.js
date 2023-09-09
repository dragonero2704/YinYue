const { Client, GatewayIntentBits, Collection } = require('discord.js')
const { readdirSync } = require('fs')

const bot = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.GuildMessageReactions, 
        GatewayIntentBits.GuildVoiceStates, 
        GatewayIntentBits.GuildMembers, 
        GatewayIntentBits.MessageContent,
    ],
})

bot.commands = new Collection()
bot.aliases = new Collection()

//console overide
require('./misc/consoleOverride')()

let handler_path = __dirname + '/handlers'
readdirSync(handler_path).forEach((handler) => {
    require(`${handler_path}/${handler}`)(bot)
})

bot.login(process.env.TOKEN)






