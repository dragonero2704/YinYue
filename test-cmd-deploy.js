const { SlashCommandBuilder } = require('@discordjs/builders');
const { config } = require('dotenv')
const { REST, Routes } = require('discord.js');
const { readdirSync } = require('fs')

// const test = process.argv.includes('--test')
const test = true

if(test){
    config({
        path: __dirname + '/test.env'
    })
}else{
    config({
        path: __dirname + '/.env'
    })
}

let commands = []

readdirSync("./commands/").forEach(dir => {
    const files = readdirSync(`./commands/${dir}/`).filter(file => file.endsWith('.js'))

    for (let file of files) {
        const pull = require(`./commands/${dir}/${file}`)
        if(pull.disabled) continue
        if (pull.data) {
            if (Array.isArray(pull.data)) {
                pull.data.forEach(cmd => commands.push(cmd.toJSON()))
            } else
                commands.push(pull.data.toJSON());
        }
    }

})

// console.log(commands)

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
const guilds = ["1055036547608629248", "689115254713745423"];
(async() => {
    guilds.forEach(async id=>{
        await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, id), { body: commands })
        .then(() => console.log('Successfully registered application commands.'))
        .catch(console.error());
    })
    
})();