const { connection } = require('../connection/connection')
const Sequelize = require('sequelize')

const SlotLimits = connection.define('slotLimits', {
    guildId: {
        type: Sequelize.DataTypes.STRING
    },
    slots: {
        type: Sequelize.DataTypes.INTEGER
    }
})

Reflect.defineProperty(SlotLimits, 'getLimit', {
    value: async function getLimit(guildId){
        const limit = await SlotLimits.findOne({
            where:{
                guildId: guildId
            }
        })
        return limit??5
        
    }
})


module.exports = { SlotLimits }