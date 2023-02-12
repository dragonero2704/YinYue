const { globalQueue } = require('../../misc/globals')
const { serverQueue, check } = require('./serverQueue');
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    name: "skip",
    aliases: ["s"],
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Salta al brano successivo'),
    async execute(interaction, bot) {
        if (!check(interaction, globalQueue)) return;
        let server_queue = globalQueue.get(interaction.guild.id);

        let song = server_queue.nextTrack(true);

        if (song) {
            interaction.reply({ embeds: [fieldEmbed(interaction.guild, 'Skip', `[${song.title}](${song.url})`)] });
            await server_queue.play(song);
        } else {
            server_queue.die();
            globalQueue.delete(interaction.guild.id);
            interaction.reply({ embeds: [titleEmbed(interaction.guild, serverQueue.responses.endQueue)] })
        }
    },

    async run(msg, args, bot) {
        if (!check(interaction, globalQueue)) return;
        let server_queue = globalQueue.get(interaction.guild.id);

        let song = server_queue.nextTrack(true);
        // console.log(song);
        if (song) {
            await server_queue.play(song);
        } else {
            server_queue.die();
            globalQueue.delete(msg.guild.id);
            sendReply(msg.channel, titleEmbed(msg.guild, serverQueue.responses.endQueue))
        }
        reactToMsg(msg, '⏭️');
    }
}