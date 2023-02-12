const { globalQueue } = require('../../misc/globals')

const { serverQueue, check } = require('./serverQueue');
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    name: "loop",
    aliases: ["l"],
    data: new SlashCommandBuilder()
        .setName('loop')
        .setDescription('Cambia lo stato del loop')
        .addSubcommand(sub =>
            sub
                .setName('disabled')
                .setDescription('Loop disabilitato')
        )
        .addSubcommand(sub =>
            sub
                .setName('queue')
                .setDescription('Loop abilitato sulla coda')
        )
        .addSubcommand(sub =>
            sub
                .setName('track')
                .setDescription('Loop sul brano')
        ),
    async execute(interaction, bot) {
        if (!check(interaction, globalQueue)) return;
        let server_queue = globalQueue.get(interaction.guild.id);

        let mode = interaction.options.getSubcommand()
        if (!mode) return
        switch (server_queue.changeLoopState(mode)) {
            case serverQueue.loopStates.disabled:
                interaction.reply(`${serverQueue.queueFormat.start}\nLoop: disabled\n${serverQueue.queueFormat.end}`);
                break;
            case serverQueue.loopStates.queue:
                interaction.reply(`${serverQueue.queueFormat.start}\nLoop: queue\n${serverQueue.queueFormat.end}`);
                break;
            case serverQueue.loopStates.track:
                interaction.reply(`${serverQueue.queueFormat.start}\nLoop: track\n${serverQueue.queueFormat.end}`);
                break;
        }
    },

    async run(msg, args, bot) {
        if (!check(interaction, globalQueue)) return;
        let server_queue = globalQueue.get(interaction.guild.id);

        let mode = undefined
        if (args.length !== 0)
            mode = args[0];

        switch (server_queue.changeLoopState(mode)) {
            case serverQueue.loopStates.disabled:
                // sendReply(msg.channel, titleEmbed(msg.guild, serverQueue.responses.loopDisabled))
                reactToMsg(msg, '➡️');
                break;
            case serverQueue.loopStates.queue:
                // sendReply(msg.channel, titleEmbed(msg.guild, serverQueue.responses.loopEnabled));
                reactToMsg(msg, '🔁');

                break;
            case serverQueue.loopStates.track:
                // sendReply(msg.channel, titleEmbed(msg.guild, serverQueue.responses.loopEnabledTrack));
                reactToMsg(msg, '🔂');
                break;
        }
    }
}