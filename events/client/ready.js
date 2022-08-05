const { setToken, getFreeClientID } = require('play-dl')
const ascii_table = require('ascii-table')


module.exports = {
    name: 'ready',
    once: true,
    async run(bot) {
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

        // elenco dei server
        let table = new ascii_table("Servers")

        table.setHeading("Server", "Id", "Proprietario")

        let guilds = bot.guilds.cache.values()
        for (const guild of guilds) {
            
            let owner = await guild.fetchOwner()
            table.addRow(guild.name.trim(), guild.id, owner.user.tag)
        }
        // .forEach(async (guild) => {
        //     let owner = await bot.users.fetch(guild.ownerId).tag
        //     table.addRow(guild.name, guild.id, owner)
        // })

        console.log(table.toString())

    },
}