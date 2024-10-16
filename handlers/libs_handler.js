const {readdirSync} = require('fs')
/**
 * @returns {Map} result
 */
module.exports = ()=>{
    const files = readdirSync(ROOTDIR+"/libs").filter(file=>file.endsWith(".js"))
    const result = new Map()
    files.forEach(file=>{
        const pull = require(ROOTDIR+"/libs/"+file)
        result.set(file.split('.')[0], pull)
    })
    return result
}