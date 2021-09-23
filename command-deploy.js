const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { readdirSync } = require('fs')

let commands = []

readdirSync("./commands/").forEach(dir => {
    const files = readdirSync(`./commands/${dir}/`).filter(file => file.endsWith('.js'))

    for (let file of files) {
        const pull = require(`./commands/${dir}/${file}`)
        if(pull.data){
            commands.push(pull.data.toJSON());
        }
        
    }

})

const rest = new REST({ version: '9' }).setToken(process.env.TOKEN);

(async() => {
  
        await rest.put(Routes.applicationCommands(process.env.clientID), { body: commands })
        .then(()=>console.log('Successfully registered application commands.'))
        .catch(console.error());

    
})();