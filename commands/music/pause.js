const { globalQueue } = require('../../misc/globals')

const { ServerQueue, check } = require('./ServerQueue');
const { SlashCommandBuilder } = require('discord.js');
const { titleEmbed, fieldEmbed, sendReply, reactToMsg } = require('../../misc/functions')


module.exports = {
    name: "pause",

    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Mette in pausa'),

    async execute(interaction, bot) {
        if (!check(interaction, globalQueue)) return;
        let server_queue = globalQueue.get(interaction.guild.id);
        interaction.reply(`${ServerQueue.queueFormat.start}\nPausa\n${ServerQueue.queueFormat.end}`);
        server_queue.pause();
    },

    async run(msg, args, bot) {
        if (!check(msg, globalQueue)) return;
        let server_queue = globalQueue.get(msg.guild.id);
        server_queue.pause();
        reactToMsg(msg, '⏸️');
    }
}