const { globalQueue } = require('../../misc/globals')

const { ServerQueue, check } = require('../../classes/serverQueue');
const { SlashCommandBuilder, basename } = require('discord.js');
const { titleEmbed, fieldEmbed, sendReply, reactToMsg } = require('../../misc/functions')

const lang = require(`./languages/${basename(__filename).split('.')[0]}.json`)


module.exports = {
    name: "jump",
    aliases: ['j'],
    data: new SlashCommandBuilder()
        .setName('jump')
        .setDescription('Skips to {index} song')
        .addNumberOption(option =>
            option
                .setName('index')
                .setNameLocalizations(lang.options[0].names)
                .setDescription('{index} to jump to')
                .setDescriptionLocalizations(lang.options[0].descriptions)
                .setMinValue(1)
                .setRequired(true)
        ),

    async execute(interaction, bot, locale, ...params) {
        if (!check(interaction, globalQueue)) return;
        let server_queue = globalQueue.get(interaction.guild.id);

        let index = interaction.options.getNumber('index');
        if (!index || index < 1 || index > server_queue.getSongs().length) {
            interaction.reply({ embeds: [titleEmbed(interaction.guild, `Inserire un numero tra 1 e ${server_queue.getSongs().length}`)], ephemeral: true });
            return;
        }
        interaction.reply(`${ServerQueue.queueFormat.start}\nSalto a [${(server_queue.getSongs()[index - 1]).title}](${(server_queue.getSongs()[index - 1]).url})\n${ServerQueue.queueFormat.end}`);

        await server_queue.jump(index - 1);
    },

    async run(msg, args, bot) {
        if (!check(msg, globalQueue)) return;
        let server_queue = globalQueue.get(msg.guild.id);

        let index = parseInt(args[0])
        if (!index || index < 1 || index > server_queue.getSongs().length) {
            msg.reply({ embeds: [titleEmbed(msg.guild, `Inserire un numero tra 1 e ${server_queue.songs.length}`)], ephemeral: true });
            return;
        }
        await server_queue.jump(index - 1);
        reactToMsg(msg, '👍')
    }
}