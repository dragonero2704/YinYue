const express = require('express')
    // import express from 'express'
const server = express()
const port = 3000
server.all("/", (req, res) => {
    res.send('bot running!')
})

function keepAlive() {
    server.listen(port, () => {
        console.log('Server pronto.')
    })
}

module.exports = keepAlive