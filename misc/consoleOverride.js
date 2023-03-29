const {appendFile} = require('fs')
const { format } = require('util')

function getTimeStamp() {
    let date = new Date()
    return `[${date.getUTCDate().toLocaleString().padStart(2, '0')}/${(date.getMonth() + 1).toLocaleString().padStart(2, '0')}/${date.getFullYear()} ${date.getHours()}:${date.getMinutes().toLocaleString().padStart(2, '0')}:${date.getSeconds().toLocaleString().padStart(2, '0')}]`
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
        appendFile(`./logs/${getLogName()}`, `${getTimeStamp()}: ${format.apply(null,arguments)}\n`, (err) => {
            if (err) {
                origLog(err)
            }
        })
        origLog.apply(console, arguments)
    }

    let warningLog = console.warn
    console.warning = function () {
        process.stdout.write(getTimeStamp() + ': ')
        appendFile(`./logs/${getLogName()}`, `${getTimeStamp()}: ${format.apply(null,arguments)}\n`, (err) => {
            if (err) {
                warningLog(err)
            }
        })
        
        warningLog.apply(console, arguments)
    }

    let errorLog = console.error
    console.error = function(){
        process.stdout.write(getTimeStamp() + ': ')
        appendFile(`./logs/${getLogName()}`, `${getTimeStamp()}: ${format.apply(null,arguments)}\n`, (err) => {
            if (err) {
                errorLog(err)
            }
        })
        errorLog.apply(console,arguments)
    }
}