module.exports = {
    name: 'ready',
    once: true,
    run(bot, Discord) {
        console.log(`${bot.user.tag} online!`)
        bot.user.setActivity({
            type: 'CUSTOM',
            name: '**-help**'
        })
    },
}