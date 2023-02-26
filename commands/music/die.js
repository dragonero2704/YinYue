const { globalQueue } = require('../../misc/globals')
const { ServerQueue, check } = require('./serverQueue');
const { SlashCommandBuilder, basename } = require('discord.js');
const { titleEmbed, fieldEmbed, sendReply, reactToMsg } = require('../../misc/functions')

const blank_field = '\u200b'

const lang = require(`./languages/${basename(__filename).split('.')[0]}.json`)

module.exports = {
    name: "die",
    aliases: ["d"],
    data: new SlashCommandBuilder()
        .setName('die')
        .setNameLocalizations(lang.name)
        .setDescription('Turns off music and leaves voice channel')
        .setDescriptionLocalizations(lang.description)
    ,
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