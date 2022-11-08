const { ShardingManager } = require('discord.js');
const { appendFile } = require('fs')
const { config } = require("dotenv")

config({
    path: __dirname + '/.env'
})

function getTimeStamp() {
    let date = new Date()
    return `[${date.getUTCDate()}/${date.getMonth()+1}/${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}]`
}

function getLogName(){
    let date = new Date()
    return `${date.getFullYear()}_${date.getMonth()+1}_${date.getUTCDate()}.log`
}

let origLog = console.log
console.log = function () {
    // origLog.call(console, getTimeStamp())
    process.stdout.write(getTimeStamp() + ': ')
    //write to file
    appendFile(`./logs/${getLogName()}`, `${getTimeStamp()}: ${arguments[0]}\n`, (err)=>{
        if(err){
            origLog(err)
        }
    })
    origLog.apply(console, arguments)
}

let warningLog = console.warn
console.error = function(){
    process.stdout.write(getTimeStamp() + ': ')
    appendFile(`./logs/${getLogName()}`, `${getTimeStamp()}: ${arguments[0]}\n`, (err)=>{
        if(err){
            warningLog(err)
        }
    })
    warningLog.apply(console, arguments)
}
const manager = new ShardingManager('./bot.js', { token: process.env.TOKEN });

manager.on('shardCreate', shard => console.log(`Launched shard ${shard.id}`));

manager.spawn();






