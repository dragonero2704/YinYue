const { globalQueue } = require('../../misc/globals')

const { serverQueue, check } = require('./serverQueue');
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    name: "die",
    aliases: ["d"],
    data: new SlashCommandBuilder()
        .setName('die')
        .setDescription('Spegne la musica e svuota la coda'),
    async execute(interaction, bot) {
        if (!check(interaction, globalQueue)) return
        let server_queue = globalQueue.get(interaction.guild.id);
        server_queue.die(true);
        globalQueue.delete(interaction.guild.id);
        interaction.reply(blank_field);
        interaction.deleteReply();
    },

    async run(msg, args, bot) {
        if (!check(interaction, globalQueue)) return
        let server_queue = globalQueue.get(interaction.guild.id);
        server_queue.die(true);
        globalQueue.delete(msg.guild.id);
        reactToMsg(msg, '👋');
    }
}