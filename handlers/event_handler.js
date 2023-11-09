const { readdirSync } = require('fs')
const ascii_table = require('ascii-table')
module.exports = (bot) => {
    let table = new ascii_table('Events')
    table.setHeading('Event', 'Status')
    readdirSync("./events/").forEach(dir => {
        const events = readdirSync(`./events/${dir}/`).filter(file => file.endsWith('.js'))

        for (let file of events) {

            let event = require(`../events/${dir}/${file}`)

            let event_name = event.name ?? file.split('.')[0];

            table.addRow(file, 'Online')
            if (event.once) {
                bot.once(event_name, (...args) => event.run(...args, bot))
            } else {
                bot.on(event_name, (...args) => event.run(...args, bot))
            }
        }
    })
    console.log("\n"+table.toString())
}