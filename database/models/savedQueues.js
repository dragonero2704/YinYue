const { connection } = require('../connection/connection')
const Sequelize = require('sequelize')

const SavedQueues = connection.define('savedQueues', {
    guildId: {
        type: Sequelize.STRING
    },
    queueName: {
        type: Sequelize.STRING
    },
    songsJson: {
        type: Sequelize.TEXT
    }
})

Reflect.defineProperty(SavedQueues, 'getQueues', {
    value: async function getQueue(guildId) {
        const queueJson = await SavedQueues.findAll({
            where: {
                guildId: guildId
            }
        })

        if (queueJson) return queueJson
        else return undefined;
    }
})

Reflect.defineProperty(SavedQueues, 'saveQueue', {
    value: async function saveQueue(guildId, songsJson, queueName) {
      return await SavedQueues.upsert({
        guildId:guildId,
        queueName:queueName,
        songsJson:songsJson
      })
    }
})



module.exports = { SavedQueues }