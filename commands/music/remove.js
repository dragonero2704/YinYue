const { globalQueue } = require('../../misc/globals')

const { ServerQueue, check } = require('./serverQueue');
const { SlashCommandBuilder } = require('discord.js');
const { titleEmbed, fieldEmbed, sendReply, reactToMsg } = require('../../misc/functions')

module.exports = {
    name: "remove",
    data: new SlashCommandBuilder()
        .setName('remove')
        .setDescription('rimuove un brano dalla coda')
        .addNumberOption(num =>
            num.setName('index')
                .setDescription('Indice del brano che si vuole eliminare dalla coda')
                .setMinValue(1)
                .setRequired(true)),

    async execute(interaction, bot) {
        if (!check(interaction, globalQueue)) return;
        let index = interaction.options.getNumber('index');
        let server_queue = globalQueue.get(interaction.guild.id);
        if (!index || index < 1 || index > server_queue.songs.length) {
            interaction.reply({ embeds: [titleEmbed(interaction.guild, `Inserire un numero tra 1 e ${server_queue.songs.length}`)], ephemeral: true });
            return;
        }
        interaction.reply(`${ServerQueue.queueFormat.start}\n${index}. [${(server_queue.getSongs()[index - 1]).title}](${(server_queue.getSongs()[index - 1]).url}) rimossa\n${ServerQueue.queueFormat.end}`)
        server_queue.remove(index - 1);
    },

    async run(msg, args, bot) {
        if (!check(msg, globalQueue)) return;
        let server_queue = globalQueue.get(msg.guild.id);
        let index = parseInt(args[0])
        if (!index || index < 1 || index > server_queue.songs.length) {
            msg.reply({ embeds: [titleEmbed(msg.guild, `Inserire un numero tra 1 e ${server_queue.songs.length}`)], ephemeral: true });
            return;
        }
        server_queue.remove(index - 1);
        reactToMsg(msg, '❌')
    }
}