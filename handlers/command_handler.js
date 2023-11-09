const { readdirSync } = require('fs')
const ascii_table = require('ascii-table')

module.exports = (bot) => {
    let table = new ascii_table("Commands")
    table.setHeading("File", "Status")

    readdirSync("./commands/").forEach(dir => {
        const commands = readdirSync(`./commands/${dir}/`).filter(file => file.endsWith('.js'))

        for (let file of commands) {
            let pull = require(`../commands/${dir}/${file}`)
            if (pull.disabled) {
                table.addRow(file, 'Disabled')
                continue
            }
            if(pull.module){
                table.addRow(file, 'Module')
                continue
            }
            if (!pull.name) {
                table.addRow(file, 'Error')
                continue
            }
            bot.commands.set(pull.name, pull)
            table.addRow(file, 'Online')

            if (pull.aliases && Array.isArray(pull.aliases)) {
                pull.aliases.forEach(alias => {
                    bot.aliases.set(alias, pull.name)
                })
            }
        }

    })
    console.log("\n" + table.toString())
}