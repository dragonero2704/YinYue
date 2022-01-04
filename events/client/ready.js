module.exports = {
    name: 'ready',
    once: true,
    run(bot) {
        console.log(`${bot.user.tag} online!`)
        bot.user.setActivity({
            type: 'WATCHING',
            name: '-help'
        })



    },
}