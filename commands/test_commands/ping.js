module.exports = {
    name: 'ping',
    run(msg, args, bot, Discord) {
        // msg.channel.send('Pinging...').then(m => {
        //     let ping = m.createdTimestamp - msg.createdTimestamp
        //     m.edit(`Il tuo ping è ${ping}ms`)
        // })
        msg.channel.send(`Ping: ${bot.ws.ping}`)
    },
}