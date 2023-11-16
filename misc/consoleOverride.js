const { existsSync, mkdirSync, appendFileSync } = require('fs')
const { format } = require('util')
const { redBright, cyan, yellowBright, whiteBright } = require("cli-color")
const LOGDIRECTORY = "./logs"

function getTimeStamp() {
    const date = new Date()
    return `[${date.getUTCDate().toLocaleString().padStart(2, '0')}/${(date.getMonth() + 1).toLocaleString().padStart(2, '0')}/${date.getFullYear()} ${date.getHours().toLocaleString().padStart(2, '0')}:${date.getMinutes().toLocaleString().padStart(2, '0')}:${date.getSeconds().toLocaleString().padStart(2, '0')}]`
}

function getLogName() {
    const date = new Date()
    return `${date.getFullYear()}_${(date.getMonth() + 1).toLocaleString().padStart(2, '0')}_${date.getUTCDate().toLocaleString().padStart(2, '0')}.log`
}

module.exports = () => {
    // find logs folder
    if (!existsSync(LOGDIRECTORY)) mkdirSync(LOGDIRECTORY)

    const errorLog = console.error
    const warningLog = console.warn
    const origLog = console.log
    const debugLog = console.debug

    console.error = function () {
        process.stdout.write(cyan(getTimeStamp()) + ': ')
        errorLog.apply(console, [redBright(format(...arguments))])
        const logName = `${LOGDIRECTORY}/${getLogName()}`
        try {
            appendFileSync(logName, `${getTimeStamp()}: ${format(...arguments)}\n`)
        } catch (err) {
            warningLog(yellowBright(`Could not append data to \"${logName}\"`))
        }
    }

    console.warning = function () {
        process.stdout.write(cyan(getTimeStamp()) + ': ')
        warningLog.apply(console, [yellowBright(format(...arguments))])
        const logName = `${LOGDIRECTORY}/${getLogName()}`
        try {
            appendFileSync(logName, `${getTimeStamp()}: ${format(...arguments)}\n`)
        } catch (err) {
            warningLog(yellowBright(`Could not append data to \"${logName}\"`))
        }
    }

    console.log = function () {
        process.stdout.write(cyan(getTimeStamp()) + ': ')
        origLog.apply(console, [whiteBright(format(...arguments))])
        const logName = `${LOGDIRECTORY}/${getLogName()}`
        try {
            appendFileSync(logName, `${getTimeStamp()}: ${format(...arguments)}\n`)
        } catch (err) {
            warningLog(yellowBright(`Could not append data to \"${logName}\"`))
        }
    }

    console.debug = function () {
        if (!process.argv.includes("--test")) return
        process.stdout.write(cyan(getTimeStamp()) + ': ')
        debugLog.apply(console, [whiteBright(format(...arguments))])
        const logName = `${LOGDIRECTORY}/${getLogName()}`
        try {
            appendFileSync(logName, `${getTimeStamp()}: ${format(...arguments)}\n`)
        } catch (err) {
            warningLog(yellowBright(`Could not append data to \"${logName}\"`))
        }
    }
}