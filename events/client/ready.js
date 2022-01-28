const { setToken, getFreeClientID } = require('play-dl')

module.exports = {
    name: 'ready',
    once: true,
    run(bot) {
        console.log(`${bot.user.tag} online!`)
        bot.user.setActivity({
            type: 'WATCHING',
            name: '-help'
        })

        getFreeClientID().then(clientID => {
            setToken({
                soundcloud: {
                    client_id: clientID
                },
                spotify: {
                    client_id: process.env.sp_client_id,
                    client_secret: process.env.sp_client_secret,
                    market: process.env.market,
                }
            })
        })
    },
}