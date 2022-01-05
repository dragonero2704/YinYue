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
                }
            })
        })
    },
}