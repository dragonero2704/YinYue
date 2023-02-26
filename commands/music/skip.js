const { globalQueue } = require('../../misc/globals')
const { ServerQueue, check } = require('./serverQueue');
const { SlashCommandBuilder, basename } = require('discord.js');
const { titleEmbed, fieldEmbed, sendReply, reactToMsg } = require('../../misc/functions')

const lang = require(`./languages/${basename(__filename).split('.')[0]}.json`)

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
            interaction.reply({ embeds: [titleEmbed(interaction.guild, ServerQueue.responses.endQueue)] })
        }
    },

    async run(msg, args, bot) {
        if (!check(msg, globalQueue)) return;
        let server_queue = globalQueue.get(msg.guild.id);

        let song = server_queue.nextTrack(true);
        // console.log(song);
        if (song) {
            await server_queue.play(song);
        } else {
            server_queue.die();
            globalQueue.delete(msg.guild.id);
            sendReply(msg.channel, titleEmbed(msg.guild, ServerQueue.responses.endQueue))
        }
        reactToMsg(msg, '⏭️');
    }
}