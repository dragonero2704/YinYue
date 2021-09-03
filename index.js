const Discord = require('discord.js')
const { config } = require("dotenv")
const { readdirSync } = require('fs')


const Intents = Discord.Intents

const bot = new Discord.Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.GUILD_VOICE_STATES],
})

bot.commands = new Discord.Collection()
bot.aliases = new Discord.Collection()
bot.prefix = '-'

// console.log(bot.prefix)
let handler_path = __dirname + '/handlers'
readdirSync(handler_path).forEach((handler) => {
    require(`${handler_path}/${handler}`)(bot)
})


config({
    path: __dirname + '/.env'
})

// bot.on('message', (msg) => {
//     msg.guild.me.displayColor
// })

bot.login(process.env.TOKEN)