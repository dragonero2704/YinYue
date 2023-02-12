const { globalQueue } = require('../../misc/globals')

const { serverQueue, check } = require('./serverQueue');
const { SlashCommandBuilder } = require('discord.js');

module.exports={
    name:"remove",

    data: "",
    async execute(interaction, bot){

    },

    async run(msg, args, bot) {
        //remove !!
        if (!check(msg, globalQueue)) return;
        let index = interaction.options.getNumber('index');
        let server_queue = globalQueue.get(interaction.guild.id);
        if (!index || index < 1 || index > server_queue.songs.length) {
            interaction.reply({ embeds: [titleEmbed(interaction.guild, `Inserire un numero tra 1 e ${server_queue.songs.length}`)], ephemeral: true });
            return;
        }
        interaction.reply(`${serverQueue.queueFormat.start}\n${index}. [${(server_queue.getSongs()[index - 1]).title}](${(server_queue.getSongs()[index - 1]).url}) rimossa\n${serverQueue.queueFormat.end}`)
        server_queue.remove(index - 1);
        reactToMsg(interaction, '❌')
    }
}