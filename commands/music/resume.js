const { globalQueue } = require('../../misc/globals')
const { serverQueue, check } = require('./serverQueue');
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    name: "resume",
    aliases: ["r"],
    data: new SlashCommandBuilder()
        .setName('resume')
        .setDescription('Riprende la musica'),
    async execute(interaction, bot) {
        if (!check(interaction, globalQueue)) return;
        let server_queue = globalQueue.get(interaction.guild.id);

        interaction.reply(`${serverQueue.queueFormat.start}\nRiprendo\n${serverQueue.queueFormat.end}`);

        server_queue.resume();
    },

    async run(msg, args, bot) {
        if (!check(interaction, globalQueue)) return;
        let server_queue = globalQueue.get(interaction.guild.id);

        server_queue.resume();
        reactToMsg(msg, '▶️');
    }
}