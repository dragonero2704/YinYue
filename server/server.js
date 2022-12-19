const express = require('express');

const path = require('path')
    // import express from 'express'
const server = express()
const port = 3000

server.use(express.static(__dirname));

server.get("/", (req, res) => {
    // res.send('bot running!')
    res.render(path.join(__dirname, 'index.html'),(err)=>{
        console.log(err);
    })
})

function startWebServer() {
    server.listen(port, () => {
        console.log('Server pronto.')
    })
}

module.exports = {startWebServer}