const { globalQueue } = require('../../misc/globals')

const { serverQueue, check } = require('./serverQueue');
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    name: "shuffle",
    data: new SlashCommandBuilder()
        .setName('shuffle')
        .setDescription('Mixes the queue'),
    async execute() {
        if (!check(interaction, globalQueue)) return;
        let server_queue = globalQueue.get(interaction.guild.id);
        server_queue.shuffle()
        interaction.reply(`${serverQueue.queueFormat.start}\nShuffled ${server_queue.getSongsLength()} songs\n${serverQueue.queueFormat.end}`);
    },
    async run(msg, args, bot) {
        if (!check(msg, globalQueue)) return;
        let server_queue = globalQueue.get(interaction.guild.id);
        server_queue.shuffle()
        reactToMsg(msg, '🔀');
    }
}