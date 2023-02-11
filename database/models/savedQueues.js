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
        queueJson.songsJson = JSON.parse(queueJson.songsJson)
        if (queueJson) return queueJson
        else return undefined;
    }
})

Reflect.defineProperty(SavedQueues, 'getQueue', {
    value: async function getQueue(guildId, name) {
        const queueJson = await SavedQueues.findOne({
            where: {
                guildId: guildId,
                queueName: name
            }
        })

        if (queueJson) return JSON.parse(queueJson.songsJson)
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