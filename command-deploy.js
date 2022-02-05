// const { SlashCommandBuilder } = require('@discordjs/builders');
const { config } = require('dotenv')
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { readdirSync } = require('fs')

config({
    path: __dirname + '/.env'
})

let commands = []

readdirSync("./commands/").forEach(dir => {
    const files = readdirSync(`./commands/${dir}/`).filter(file => file.endsWith('.js'))

    for (let file of files) {
        const pull = require(`./commands/${dir}/${file}`)
        if (pull.data) {
            if (Array.isArray(pull.data)) {
                pull.data.forEach(cmd => commands.push(cmd.toJSON()))
            } else
                commands.push(pull.data.toJSON());
        }
    }

})

console.log(commands)

const rest = new REST({ version: '9' }).setToken(process.env.TOKEN);

(async() => {

    await rest.put(Routes.applicationCommands(process.env.clientID), { body: commands })
        .then(() => console.log('Successfully registered application commands.'))
        .catch(console.error());
})();