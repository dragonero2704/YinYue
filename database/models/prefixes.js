const Sequelize = require('sequelize')
const {connection} = require('../connection/connection');

const Prefixes = connection.define('prefixes',{
    serverId:{
        type: Sequelize.STRING,
        unique: true
    },
    prefix:{
        type: Sequelize.STRING
    }
})

Reflect.defineProperty(Prefixes, 'getPrefix', {
    value: async function(id){
        let pref = await Prefixes.findOne({where:{serverId:id}})
        return pref ?? '-'
    }
})

Reflect.defineProperty(Prefixes, 'setPrefix', {
    value: async function(prefix, serverId){
        let pref = await Prefixes.upsert({serverId:serverId, prefix:prefix})
        return pref
    }
})

module.exports = {Prefixes}


