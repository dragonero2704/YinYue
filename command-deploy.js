// const { SlashCommandBuilder } = require('@discordjs/builders');
const { config } = require('dotenv')
const { REST, Routes } = require('discord.js');

const { readdirSync } = require('fs')

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

let commands = []

readdirSync("./commands/").forEach(dir => {
    const files = readdirSync(`./commands/${dir}/`).filter(file => file.endsWith('.js'))

    for (let file of files) {
        const {data} = require(`./commands/${dir}/${file}`)
        if (data) {
            if (Array.isArray(data)) {
                data.forEach(cmd => commands.push(cmd.toJSON()))
            } else
                commands.push(data.toJSON());
        }
    }

})

console.log(commands)

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async() => {

    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands })
        .then(() => console.log('Successfully registered application commands.'))
        .catch(console.error());
})();
