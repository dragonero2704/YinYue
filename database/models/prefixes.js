const Sequelize = require('sequelize')
const {connection} = require('../connection/connection');

const Prefixes = connection.define('prefix',{
    serverId:{
        type: Sequelize.STRING,
        unique: true
    },
    prefix:{
        type: Sequelize.STRING
    }
})

module.exports = {Prefixes}


