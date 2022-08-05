const express = require('express')
const path = require('path')
    // import express from 'express'
const server = express()
const port = 3000

server.use(express.static(__dirname));

server.all("/", (req, res) => {
    // res.send('bot running!')
    res.sendFile(path.join(__dirname, 'index.html'))
})

function keepAlive() {
    server.listen(port, () => {
        console.log('Server pronto.')
    })
}

module.exports = keepAlive