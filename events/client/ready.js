const { setToken, getFreeClientID } = require('play-dl')
const ascii_table = require('ascii-table')
const { listContent } = require(`../../database/dbContent`)
const { syncModels } = require(`../../database/dbInit`)
const { botUserId } = require('../../misc/globals')


module.exports = {
    name: 'ready',
    once: true,
    async run(bot) {
        // botUserId = bot.user.id;

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
            })
        })

        // elenco dei server
        let serverTable = new ascii_table("Servers")

        serverTable.setHeading("Server", "Id", "Proprietario")
        console.log('Fetching servers...')
        let guilds = bot.guilds.cache.values()
        for (const guild of guilds) {
            let owner = await guild.fetchOwner()
            serverTable.addRow(guild.name.trim(), guild.id, owner.user.tag)
        }

        console.log('\n' + serverTable.toString())
    },
}