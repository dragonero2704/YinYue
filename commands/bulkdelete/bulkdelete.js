module.exports = {
    name: 'bulkdelete',
    aliases: ['clean'],
    args: ['number of messages'],
    run: (msg, args, bot, Discord) => {

        if (!args[1]) {
            let embed = require('../../embed')(msg.guild)
            embed.addField('Inserisci un numero!')
            msg.channel.send({ embeds: [embed] }).then(msg => {
                setTimeout(() => msg.delete(), 10000)
            })
        }

        try {
            msg.channel.bulkDelete(parseInt(args[1]) + 1)
        } catch (error) {
            console.log(error)
            let embed = require('../../embed')(msg.guild)
            embed.addField('Errore')
            msg.channel.send({ embeds: [embed] }).then(msg => {
                setTimeout(() => msg.delete(), 10000)
            })
        }
    }
}