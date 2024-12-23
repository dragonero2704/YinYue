const { connection } = require('../connection/connection')
const Sequelize = require('sequelize')
const { Cache } = require('../../classes/cache')
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

const cache = new Cache({enableKeyTTL:true})

Reflect.defineProperty(SavedQueues, 'getQueues', {
    value: async function getQueue(guildId) {
        let queueJson = await SavedQueues.findAll({
            where: {
                guildId: guildId
            }
        })

        if (queueJson.length !== 0) {

            queueJson = queueJson.map(val => {
                console.log(val.songsJson)
                val.songsJson = JSON.parse(val.songsJson)
                return val
            })
            // queueJson.songsJson = JSON.parse(queueJson.songsJson)
            return queueJson
        }
        else { return undefined; }
    }
})

Reflect.defineProperty(SavedQueues, 'getQueue', {
    value: async function getQueue(guildId, name) {
        let q = cache.get(name)
        if (q!== undefined) return q
        const queueJson = await SavedQueues.findOne({
            where: {
                guildId: guildId,
                queueName: name
            }
        })

        if (queueJson) {
            cache.set(name, JSON.parse(queueJson.songsJson))
            return JSON.parse(queueJson.songsJson)
        }
        else return undefined;
    }
})

Reflect.defineProperty(SavedQueues, 'saveQueue', {
    value: async function saveQueue(guildId, songsJson, queueName) {
        cache.delete(queueName)
        let q = await SavedQueues.getQueue(guildId, songsJson)
        if(q){
            return await SavedQueues.update({songsJson}, {where:{guildId, queueName}})
        }
        return await SavedQueues.upsert({
            guildId: guildId,
            queueName: queueName,
            songsJson: songsJson
        })
    }
})

Reflect.defineProperty(SavedQueues, 'getQueueTotal', {
    value: async function getQueue(guildId) {
        const queueJson = await SavedQueues.findAll({
            where: {
                guildId: guildId
            }
        })

        if (queueJson) {
            // queueJson = queueJson.map(val=>val.songsJson = JSON.parse(queueJson.songsJson))
            // queueJson.songsJson = JSON.parse(queueJson.songsJson)
            return queueJson.length
        }
        else { return undefined; }
    }
})

Reflect.defineProperty(SavedQueues, 'deleteQueue', {
    value: async function deleteQueue(guildId, queueName) {
        cache.clear()
        return await SavedQueues.destroy({where:{
            guildId: guildId,
            queueName: queueName,
        }})
    }
})



module.exports = { SavedQueues }