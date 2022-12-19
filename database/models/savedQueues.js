const { connection } = require('../connection/connection')
const Sequelize = require('sequelize')

const SavedQueues = connection.define('savedQueues', {
    guildId: {
        type: Sequelize.STRING
    },
    queueSlot: {
        type: Sequelize.INTEGER
    },
    queueName: {
        type: Sequelize.STRING
    },
    songsJson: {
        type: Sequelize.TEXT
    }
})

Reflect.defineProperty(SavedQueues, 'getQueue', {
    value: async function getQueue(guildId, queueSlot) {
        const queueJson = await SavedQueues.findOne({
            where: {
                guildId: guildId,
                queueId: queueSlot
            }
        })

        if (queueJson) return queueJson.songsJson
        else return undefined;
    }
})

Reflect.defineProperty(SavedQueues, 'saveQueue', {
    value: async function saveQueue(guildId, queueSlot, songsJson, queueName) {
      return await SavedQueues.upsert({
        guildId:guildId,
        queueSlot:queueSlot,
        queueName:queueName,
        songsJson:songsJson
      })
    }
})



module.exports = { SavedQueues }