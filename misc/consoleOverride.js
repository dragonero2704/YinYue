const {appendFile} = require('fs')
const { format } = require('util')
const {redBright,cyan,yellowBright,whiteBright} = require("cli-color")


function getTimeStamp() {
    let date = new Date()
    return cyan(`[${date.getUTCDate().toLocaleString().padStart(2, '0')}/${(date.getMonth() + 1).toLocaleString().padStart(2, '0')}/${date.getFullYear()} ${date.getHours()}:${date.getMinutes().toLocaleString().padStart(2, '0')}:${date.getSeconds().toLocaleString().padStart(2, '0')}]`)
}

function getLogName() {
    let date = new Date()
    return `${date.getFullYear()}_${(date.getMonth() + 1).toLocaleString().padStart(2, '0')}_${date.getUTCDate().toLocaleString().padStart(2, '0')}.log`
}

module.exports = () => {
    let origLog = console.log
    console.log = function () {
        // origLog.call(console, getTimeStamp())
        process.stdout.write(getTimeStamp() + ': ')
        //write to file
        appendFile(`./logs/${getLogName()}`, `${getTimeStamp()}: ${format(...arguments)}\n`, (err) => {
            if (err) {
                origLog.apply(console, [whiteBright(format(...arguments))])
            }
        })
        origLog.apply(console, [whiteBright((format(...arguments)))])
    }

    let warningLog = console.warn
    console.warning = function () {
        process.stdout.write(getTimeStamp() + ': ')
        appendFile(`./logs/${getLogName()}`, `${getTimeStamp()}: ${format(...arguments)}\n`, (err) => {
            if (err) {
                warningLog.apply(console, [yellowBright(format(...arguments))])
            }
        })
        
        warningLog.apply(console, [yellowBright(format(...arguments))])
    }

    let errorLog = console.error
    console.error = function(){
        process.stdout.write(getTimeStamp() + ': ')
        appendFile(`./logs/${getLogName()}`, `${getTimeStamp()}: ${format(...arguments)}\n`, (err) => {
            if (err) {
                errorLog.apply(console,[redBright(format(...arguments))])
            }
        })
        errorLog.apply(console,[redBright(format(...arguments))])
    }
}