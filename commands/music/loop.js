const { globalQueue } = require('../../misc/globals')

const { ServerQueue, check } = require('./serverQueue');
const { SlashCommandBuilder, basename } = require('discord.js');
const { titleEmbed, fieldEmbed, sendReply, reactToMsg } = require('../../misc/functions')

const lang = require(`./languages/${basename(__filename).split('.')[0]}.json`)

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
            case ServerQueue.loopStates.disabled:
                interaction.reply(`${ServerQueue.queueFormat.start}\nLoop: disabled\n${ServerQueue.queueFormat.end}`);
                break;
            case ServerQueue.loopStates.queue:
                interaction.reply(`${ServerQueue.queueFormat.start}\nLoop: queue\n${ServerQueue.queueFormat.end}`);
                break;
            case ServerQueue.loopStates.track:
                interaction.reply(`${ServerQueue.queueFormat.start}\nLoop: track\n${ServerQueue.queueFormat.end}`);
                break;
        }
    },

    async run(msg, args, bot) {
        if (!check(msg, globalQueue)) return;
        let server_queue = globalQueue.get(msg.guild.id);

        let mode = undefined
        if (args.length !== 0)
            mode = args[0];

        switch (server_queue.changeLoopState(mode)) {
            case ServerQueue.loopStates.disabled:
                // sendReply(msg.channel, titleEmbed(msg.guild, ServerQueue.responses.loopDisabled))
                reactToMsg(msg, '➡️');
                break;
            case ServerQueue.loopStates.queue:
                // sendReply(msg.channel, titleEmbed(msg.guild, ServerQueue.responses.loopEnabled));
                reactToMsg(msg, '🔁');

                break;
            case ServerQueue.loopStates.track:
                // sendReply(msg.channel, titleEmbed(msg.guild, ServerQueue.responses.loopEnabledTrack));
                reactToMsg(msg, '🔂');
                break;
        }
    }
}