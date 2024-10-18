const ascii_table = require('ascii-table')

module.exports = {
    name: 'ready',
    once: true,
    async run(bot) {
        logger.info(`${bot.user.tag} online!`)
        bot.user.setActivity({
            type: 'WATCHING',
            name: '-help'
        })

        // elenco dei server
        let serverTable = new ascii_table("Servers")

        serverTable.setHeading("Server", "Id", "Proprietario")
        logger.info('Fetching servers...')
        let guilds = bot.guilds.cache.values()
        for (const guild of guilds) {
            let owner = await guild.fetchOwner()
            serverTable.addRow(guild.name.trim(), guild.id, owner.user.tag)
        }

        logger.info('\n' + serverTable.toString())
    },
}