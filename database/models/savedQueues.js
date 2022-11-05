const { connection } = require('../connection/connection')
const Sequelize = require('sequelize')

const SavedQueues = connection.define('savedQueues', {
    guildId: {
        type: Sequelize.STRING
    },
    queueId: {
        type: Sequelize.STRING
    },
    songsJson: {
        type: Sequelize.TEXT
    }
    /* url: video.url,
        title: video.title,
        thumbnail: video.thumbnail,
        duration: video.durationInSec,
         durationRaw: video.durationRaw,
    */
})

module.exports = { SavedQueues }