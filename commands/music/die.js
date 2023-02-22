const { globalQueue } = require('../../misc/globals')
const { ServerQueue, check } = require('./serverQueue');
const { SlashCommandBuilder } = require('discord.js');
const { titleEmbed, fieldEmbed, sendReply, reactToMsg } = require('../../misc/functions')

const blank_field = '\u200b'


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
        if (!check(msg, globalQueue)) return
        let server_queue = globalQueue.get(msg.guild.id);
        server_queue.die(true);
        globalQueue.delete(msg.guild.id);
        reactToMsg(msg, '👋');
    }
}