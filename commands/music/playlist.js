const { globalQueue } = require('../../misc/globals')

const { ServerQueue, check } = require('./ServerQueue');
const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, ComponentType } = require('discord.js');
const { titleEmbed, fieldEmbed, sendReply, reactToMsg } = require('../../misc/functions')
const { SavedQueues } = require('../../database/models/savedQueues')
const { SlotLimits } = require('../../database/models/slotLimits')

module.exports = {
    name: "playlist",
    // aliases:"",
    data: new SlashCommandBuilder()
        .setName('playlist')
        .setDescription('Playlist command list')
        .addSubcommand(sub =>
            sub.setName('load')
                .setDescription('Loads a saved queue'))

        .addSubcommand(sub =>
            sub.setName('list')
                .setDescription('Shows saved queue slots'))
        .addSubcommand(sub =>
            sub.setName('save')
                .setDescription('Saves the queue')
                .addStringOption(option =>
                    option
                        .setName('name')
                        .setDescription('Sets the name of the queue')
                        .setRequired(true)
                )),

    async execute(interaction, bot) {
        switch (interaction.options.getSubcommand()) {
            default:
                {
                    if (!check(interaction, globalQueue)) return;
                    let server_queue = globalQueue.get(interaction.guild.id);
                    await server_queue.showQueue(interaction)
                    break;
                }
            case 'save':
                {
                    if (!check(interaction, globalQueue)) return;
                    let server_queue = globalQueue.get(interaction.guild.id);

                    const name = interaction.options.getString('name')
                    // check limit
                    SavedQueues.saveQueue(interaction.guild.id, server_queue.getSongsJson(), name)
                        .then(() => interaction.reply({ embeds: [titleEmbed(interaction.guild, `Queue saved as '${name}'`)] }))
                        .catch(console.error)

                    break;
                }
            case 'load':
                {
                    //check if the user in a voice channel
                    let voice_channel = interaction.member.voice.channel;
                    if (!voice_channel) {
                        interaction.reply({ embeds: [titleEmbed(interaction.guild, ServerQueue.errors.voiceChannelNotFound)], ephemeral: true });
                        return;
                    }
                    let server_queue = globalQueue.get(interaction.guild.id);

                    const row = new ActionRowBuilder()
                    let selectMenu = new StringSelectMenuBuilder()
                        .setCustomId('queues')
                        .setPlaceholder('Select a queue')
                        .setMaxValues(1)
                        .setMinValues(1)


                    let songs = await SavedQueues.getQueues(interaction.guild.id)
                    if (!songs) {
                        return interaction.reply("Non ci sono playlist salvate in questo server")
                    }
                    for (const song of songs) {
                        selectMenu.addOptions({
                            label: song.queueName,
                            value: song.queueName
                        })
                    }

                    row.addComponents(selectMenu)
                    let msgmenu = await interaction.reply({ contents: 'Select your playlist', components: [row] })
                    const filter = i => {
                        i.deferUpdate();
                        return i.user.id === interaction.user.id;
                    };
                    msgmenu.awaitMessageComponent({ filter, componentType: ComponentType.StringSelect })
                        .catch(e => console.log)
                        .then(async i => {
                            const name = i.values[0]

                            if (!server_queue) {
                                //create a new server queue
                                let queueJson = await SavedQueues.getQueue(interaction.guild.id, name)
                                console.log(queueJson)
                                server_queue = new ServerQueue(queueJson, interaction.channel, voice_channel)
                                globalQueue.set(interaction.guild.id, server_queue)
                                await server_queue.play()

                            } else {
                                //add songs to existing server queue
                                if (server_queue.voiceChannel !== voice_channel) {
                                    interaction.editReply({ embeds: [titleEmbed(interaction.guild, ServerQueue.errors.differentVoiceChannel + `<@${bot.user.id}> !`)], ephemeral: true });
                                    return;
                                }
                                //add songs to the existing queue
                                let queueJson = await SavedQueues.getQueue(interaction.guild.id, name)
                                server_queue.addMultiple(queueJson)
                            }
                        })

                    break;
                }
        }
    },

    async run(msg, args, bot) {

    }
}