const { globalQueue } = require('../../misc/globals')

const { ServerQueue, check } = require('./serverQueue');
const { SlashCommandBuilder, basename } = require('discord.js');

const lang = require(`./languages/${basename(__filename).split('.')[0]}.json`)

module.exports={
    name:"24/7",
    aliases:"",
    data: new SlashCommandBuilder()
    .setName("24/7")
    .setDescription("Stays in the channel 24/7"),
    disabled:true,
    async execute(interaction, bot){
        let serverQueue = globalQueue.get(interaction.guild.id)
        serverQueue.toggleAlwaysActive()
    },

    async run(msg, args, bot){

    }
}