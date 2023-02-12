const { PermissionsBitField , SlashCommandBuilder } = require('discord.js')

module.exports = {
    name: 'bulkdelete',
    aliases: ['clean', 'clear'],
    args: ['[number of messages]'],
    data: new SlashCommandBuilder()
        .setName('bulkdelete')
        .setDescription('Cancella un certo numero di messaggi')
        .addIntegerOption(opt =>
            opt
            .setName('numero')
            .setDescription('Numero di messaggi da cancellare')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(500)),

    execute: async(interaction, bot) => {
        //check for permission
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages))
            if (interaction.member.user.tag !== 'dragonero2704#7782')
                return interaction.reply({ content: 'Non hai i permessi necessari', ephemeral: true });

        let number = interaction.options.getInteger('numero');
        //add 1 so it will delete also the command message
        number = number + 1;
        await interaction.reply({content:'Sto cancellando...', ephemeral:true});
        try {
            interaction.channel.bulkDelete(number)
        } catch (error) {
            console.log(error)
            let embed = require('../../misc/embed')(msg.guild)
            embed.addField('Errore: messaggi troppo vecchi')
            interaction.followUp({ embeds: [embed], ephemeral: true })
        }
    },
    run: async(msg, args, bot) => {
        //check permissions
        if (!msg.member.permissions.has(PermissionsBitField.Flags.ManageMessages))
            if (msg.member.user.tag !== 'dragonero2704#7782')
                return msg.reply({ content: 'Non hai i permessi necessari', ephemeral: true });

        if (!args[1]) {
            let embed = require('../../embed')(msg.guild)
            embed.addField('Inserisci un numero!')
            await msg.reply({ embeds: [embed], ephemeral: true })
        }

        try {
            msg.channel.bulkDelete(parseInt(args[1]) + 1)
        } catch (error) {
            console.log(error)
            let embed = require('../../embed')(msg.guild)
            embed.addField('Errore')
            msg.reply({ embeds: [embed], ephemeral: true })
        }
    }
}