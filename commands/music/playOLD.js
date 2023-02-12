const play_dl = require('play-dl');
const voice = require('@discordjs/voice');
const { ActionRowBuilder, ButtonBuilder, SlashCommandBuilder, ButtonStyle, ComponentType, ModalBuilder, TextInputBuilder, TextInputStyle, StringSelectMenuBuilder } = require('discord.js');
const { titleEmbed, fieldEmbed, sendReply, reactToMsg } = require('../../misc/functions')
const { SavedQueues } = require('../../database/models/savedQueues')
const { SlotLimits } = require('../../database/models/slotLimits')

let globalQueue = new Map()

let blank_field = '\u200b'





module.exports = {
    name: 'play',
    aliases: ['p', 'pause', 'skip', 's', 'jump', 'j', 'stop', 'die', 'l', 'loop', 'resume', 'q', 'queue', 'remove', 'r', 'shuffle', 'playlist'],
    args: ['[input]'],
    description: 'plays some music!',
    once: false,
    disabled: true,
    data: [

        new SlashCommandBuilder()
            .setName('pause')
            .setDescription('Mette in pausa'),

        

        

        new SlashCommandBuilder()
            .setName('jump')
            .setDescription('Salta al brano n')
            .addNumberOption(option =>
                option
                    .setName('index')
                    .setDescription('Un numero da 0 al numero dei brani della coda')
                    .setMinValue(1)
                    .setRequired(true)
            ),

        
        new SlashCommandBuilder()
            .setName('remove')
            .setDescription('rimuove un brano dalla coda')
            .addNumberOption(num =>
                num.setName('index')
                    .setDescription('Indice del brano che si vuole eliminare dalla coda')
                    .setMinValue(1)
                    .setRequired(true)),

        

        new SlashCommandBuilder()
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

        
    ],
    async execute(interaction, bot) {
        const { commandName } = interaction
        const cmd = commandName
        // await interaction.deferReply();
        switch (cmd) {
            
            
            case 'pause':
                {
                    if (!check(interaction, globalQueue)) return;
                    let server_queue = globalQueue.get(interaction.guild.id);

                    interaction.reply(`${serverQueue.queueFormat.start}\nPausa\n${serverQueue.queueFormat.end}`);
                    server_queue.pause();
                    // reactToMsg(interaction, '⏸️');
                }
                break;

            case 'resume':
                {
                    if (!check(interaction, globalQueue)) return;
                    interaction.reply(`${serverQueue.queueFormat.start}\nRiprendo\n${serverQueue.queueFormat.end}`);
                    let server_queue = globalQueue.get(interaction.guild.id);

                    server_queue.resume();
                    // reactToMsg(interaction, '▶️');
                }
                break

            
            case 'jump':
            case 'j':
                {
                    if (!check(interaction, globalQueue)) return;
                    let server_queue = globalQueue.get(interaction.guild.id);

                    let index = interaction.options.getNumber('index');
                    if (!index || index < 1 || index > server_queue.songs.length) {
                        interaction.reply({ embeds: [titleEmbed(interaction.guild, `Inserire un numero tra 1 e ${server_queue.getSongs().length}`)], ephemeral: true });
                        return;
                    }
                    interaction.reply(`${serverQueue.queueFormat.start}\nSalto a [${(server_queue.getSongs()[index - 1]).title}](${(server_queue.getSongs()[index - 1]).url})\n${serverQueue.queueFormat.end}`);

                    await server_queue.jump(index - 1);
                    // reactToMsg(interaction, '👍')
                }
                break;

            case 'playlist':
                {
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
                                    interaction.reply({ embeds: [titleEmbed(interaction.guild, serverQueue.errors.voiceChannelNotFound)], ephemeral: true });
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
                                        // i.editReply("Hai selezionato" + i.values.join(', '))
                                        const name = i.values[0]
                                        if (!server_queue) {
                                            //create a new server queue
                                            let queueJson = await SavedQueues.getQueue(interaction.guild.id, name)
                                            console.log(queueJson)
                                            server_queue = new serverQueue(queueJson, interaction.channel, voice_channel)
                                            globalQueue.set(interaction.guild.id, server_queue)
                                            await server_queue.play()

                                        } else {
                                            if (server_queue.voiceChannel !== voice_channel) {
                                                interaction.followUp({ embeds: [titleEmbed(interaction.guild, serverQueue.errors.differentVoiceChannel + `<@${bot.user.id}> !`)], ephemeral: true });
                                                return;
                                            }
                                            //add songs to the existing queue
                                            //add songs to the existing queue
                                            let queueJson = await SavedQueues.getQueue(interaction.guild.id, name)
                                            server_queue.addMultiple(queueJson)
                                        }
                                    })

                                break;
                            }
                    }
                }
                break

        }
    },

    async run(msg, args, bot) {
        const cmd = args.shift().toLowerCase()
        switch (cmd) {
            case 'pause':
                {
                    let voice_channel = await msg.member.voice.channel;
                    if (!voice_channel) {
                        return msg.reply({ embeds: [titleEmbed(msg.guild, serverQueue.errors.voiceChannelNotFound)], ephemeral: true });
                    }
                    let server_queue = globalQueue.get(msg.guild.id);
                    if (!server_queue) {
                        return msg.reply({ embeds: [titleEmbed(msg.guild, serverQueue.errors.queueNotFound)], ephemeral: true });
                    }
                    if (server_queue !== undefined) {
                        if (server_queue.voiceChannel !== voice_channel)
                            return msg.reply({ embeds: [titleEmbed(msg.guild, serverQueue.errors.differentVoiceChannel + `<@${bot.user.id}> !`)], ephemeral: true });
                    }

                    server_queue.pause();
                    reactToMsg(msg, '⏸️');

                }
                break;

            

            

            case 'jump':
            case 'j':
                {
                    let voice_channel = await msg.member.voice.channel;
                    if (!voice_channel) {
                        sendReply(msg.channel, titleEmbed(msg.guild, serverQueue.errors.voiceChannelNotFound), 10000);
                        return;
                    }
                    let server_queue = globalQueue.get(msg.guild.id);
                    if (!server_queue) {
                        sendReply(msg.channel, titleEmbed(msg.guild, serverQueue.errors.queueNotFound), 10000);
                        return;
                    }
                    if (server_queue !== undefined) {
                        if (server_queue.voiceChannel !== voice_channel)
                            return msg.reply({ embeds: [titleEmbed(msg.guild, serverQueue.errors.differentVoiceChannel + `<@${bot.user.id}> !`)], ephemeral: true });
                    }

                    let index = parseInt(args[0])
                    if (!index || index < 1 || index > server_queue.songs.length) {
                        msg.reply({ embeds: [titleEmbed(msg.guild, `Inserire un numero tra 1 e ${server_queue.songs.length}`)], ephemeral: true });
                        return;
                    }
                    let songs = server_queue.getSongs();
                    await server_queue.jump(index - 1);
                    reactToMsg(msg, '👍')
                }
                break;


            case 'queue':
            case 'q':
                {
                    let voice_channel = await msg.member.voice.channel;
                    if (!voice_channel) {
                        return msg.reply({ embeds: [titleEmbed(msg.guild, serverQueue.errors.voiceChannelNotFound)], ephemeral: true });
                    }
                    let server_queue = globalQueue.get(msg.guild.id);
                    if (!server_queue) {
                        return msg.reply({ embeds: [titleEmbed(msg.guild, serverQueue.errors.queueNotFound)], ephemeral: true });
                    }
                    if (server_queue !== undefined) {
                        if (server_queue.voiceChannel !== voice_channel)
                            return msg.reply({ embeds: [titleEmbed(msg.guild, serverQueue.errors.differentVoiceChannel + `<@${bot.user.id}> !`)], ephemeral: true });
                    }

                    let songs = server_queue.getSongs();
                    if (songs.length === 0) {
                        sendReply(msg.channel, titleEmbed(msg.guild, serverQueue.errors.emptyQueue), 10000);
                        return;
                    }

                    await server_queue.showQueue(msg)

                }
                break

            case 'remove':
            case 'r':
                {
                    let voice_channel = await msg.member.voice.channel;
                    if (!voice_channel) {
                        return msg.reply({ embeds: [titleEmbed(msg.guild, serverQueue.errors.voiceChannelNotFound)], ephemeral: true });
                    }
                    let server_queue = globalQueue.get(msg.guild.id);
                    if (!server_queue) {
                        return msg.reply({ embeds: [titleEmbed(msg.guild, serverQueue.errors.queueNotFound)], ephemeral: true });
                    }
                    if (server_queue !== undefined) {
                        if (server_queue.voiceChannel !== voice_channel)
                            return msg.reply({ embeds: [titleEmbed(msg.guild, serverQueue.errors.differentVoiceChannel + `<@${bot.user.id}> !`)], ephemeral: true });
                    }

                    let index = parseInt(args[0])
                    if (!index || index < 1 || index > server_queue.songs.length) {
                        msg.reply({ embeds: [titleEmbed(msg.guild, `Inserire un numero tra 1 e ${server_queue.songs.length}`)], ephemeral: true });
                        return;
                    }

                    server_queue.remove(index - 1);
                    reactToMsg(msg, '❌')
                }
                break

        }
    }
}