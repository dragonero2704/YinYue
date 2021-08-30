const { readdirSync } = require('fs')
const ascii_table = require('ascii-table')
const chalk = require('chalk')


module.exports = (bot) => {

    let table = new ascii_table("Commands")
    table.setHeading("File", "Status")

    readdirSync("./commands/").forEach(dir => {
        const commands = readdirSync(`./commands/${dir}/`).filter(file => file.endsWith('.js'))

        for (let file of commands) {
            let pull = require(`../commands/${dir}/${file}`)
            if (pull.name) {
                bot.commands.set(pull.name, pull)
                table.addRow(file, 'Online')
            } else {
                table.addRow(file, 'Errore')
                continue
            }

            if (pull.aliases && Array.isArray(pull.aliases)) {
                pull.aliases.forEach(alias => {
                    bot.aliases.set(alias, pull.name)
                })
            }
        }

    })

    console.log(table.toString())
}