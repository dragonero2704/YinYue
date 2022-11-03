const { Client, GatewayIntentBits, Collection } = require('discord.js')

const { config } = require("dotenv")

const { readdirSync } = require('fs')
const fs = require('fs')
// const keepAlive = require('./server/server')




const bot = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMembers, GatewayIntentBits.MessageContent],
})

bot.commands = new Collection()
bot.aliases = new Collection()
// bot.prefix = new Map()
// bot.prefix.set('default', '-')

let origLog = console.log

function getTimeStamp() {
    let date = new Date()
    return `[${date.getDay()}/${date.getMonth()}/${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}]`
}

function getLogName(){
    let date = new Date()
    return `${date.getDay()}_${date.getMonth()}_${date.getFullYear()}.log`
}


let handler_path = __dirname + '/handlers'
readdirSync(handler_path).forEach((handler) => {
    require(`${handler_path}/${handler}`)(bot)
})

config({
    path: __dirname + '/.env'
})

// keepAlive()
console.log = function () {
    // origLog.call(console, getTimeStamp())
    process.stdout.write(getTimeStamp() + ': ')
    
    //write to file
    fs.appendFile(`./logs/${getLogName()}`, `${getTimeStamp()}: ${arguments[0]}\n`, (err)=>{
        if(err){
            origLog(err)
        }else{
            // origLog('file wrote successfully')
        }
    })
    origLog.apply(console, arguments)
}

bot.login(process.env.TOKEN)






