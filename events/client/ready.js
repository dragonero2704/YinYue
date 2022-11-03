const { setToken, getFreeClientID } = require('play-dl')
const ascii_table = require('ascii-table')
const tables = require('../../database/tables');

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

        //sincronizzazione modelli
        let dbTable = new ascii_table("Database");
        dbTable.setHeading("Table", "Status")
        Object.entries(tables).forEach(entry=>{
            const [modelName, model] = entry;
            try{
                model.sync();
            }catch(e){
                // console.log(`Sincronizzazione ${modelName} fallita`)
                dbTable.addRow(modelName, 'error')
            }finally{
                // console.log(`Sincronizzazione ${modelName} completata`)
                dbTable.addRow(modelName, 'ok')
            }
        })

        console.log(dbTable.toString());

        // elenco dei server
        let serverTable = new ascii_table("Servers")

        serverTable.setHeading("Server", "Id", "Proprietario")
        console.log('Fetching servers...')
        let guilds = bot.guilds.cache.values()
        for (const guild of guilds) {
            
            let owner = await guild.fetchOwner()
            serverTable.addRow(guild.name.trim(), guild.id, owner.user.tag)
        }
        // .forEach(async (guild) => {
        //     let owner = await bot.users.fetch(guild.ownerId).tag
        //     serverTable.addRow(guild.name, guild.id, owner)
        // })

        console.log(serverTable.toString())
    },
}