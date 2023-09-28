const { globalQueue } = require('../../misc/globals')

const { ServerQueue, check } = require('../../classes/serverQueue');
const { SlashCommandBuilder, basename } = require('discord.js');
const { titleEmbed, fieldEmbed, sendReply, reactToMsg } = require('../../misc/functions')

const lang = require(`./languages/${basename(__filename).split('.')[0]}.json`)

module.exports = {
    name: "queue",
    aliases: ["q"],
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Shows the queue'),

    async execute(interaction, bot, locale, ...params) {
        if (!check(interaction, globalQueue)) return;
        let server_queue = globalQueue.get(interaction.guild.id);
        let songs = server_queue.getSongs();
        if (songs.length === 0) {
            interaction.reply({embeds:[titleEmbed(msg.guild, ServerQueue.errors.emptyQueue)]});
            return;
        }
        await server_queue.showQueue(interaction)
    },

    async run(msg, args, bot) {
        if (!check(msg, globalQueue)) return;
        let server_queue = globalQueue.get(msg.guild.id);
        let songs = server_queue.getSongs();
        if (songs.length === 0) {
            msg.reply({embeds:[titleEmbed(msg.guild, ServerQueue.errors.emptyQueue)]});
            return;
        }
        await server_queue.showQueue(msg)
    }
}

