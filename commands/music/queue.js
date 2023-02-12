const { globalQueue } = require('../../misc/globals')

const { serverQueue, check } = require('./serverQueue');
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    name: "queue",
    alieses: ["q"],
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Mostra la coda'),

    async execute(interaction, bot) {
        if (!check(interaction, globalQueue)) return;
        let server_queue = globalQueue.get(interaction.guild.id);

        await server_queue.showQueue(interaction)
    },

    async run(msg, args, bot){
        if (!check(msg, globalQueue)) return;
        let server_queue = globalQueue.get(interaction.guild.id);

        await server_queue.showQueue(interaction)
    }
}

