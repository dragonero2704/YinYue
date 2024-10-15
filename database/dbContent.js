const { readdirSync } = require('fs')
const ascii_table = require('ascii-table')

const listContent = async (force = false) => {
    const dir = "./database/models"
    readdirSync(dir).forEach(async modelFile => {
        const modelJSON = require(`../${dir}/${modelFile}`)
        const [modelName, model] = Object.entries(modelJSON)[0]
        let modelTable = new ascii_table(modelName)
        //code
        try {
            await model.sync({ force: force });
        } catch (e) {
            logger.warn('Could not sync ' + modelName + ': ' + e)
        }
        // modelTable.setHeading(Object.keys(model.rawAttributes))
        let values = await model.findAll()
        values = JSON.parse(JSON.stringify(values))
        if(values.length == 0) return

        modelTable.setHeading(Object.keys(values[0]))

        values.forEach((v)=>{
            const vals = Object.values(v).map(val=>{
                if (typeof val === 'string' && val.length > 30)
                    return val.substring(0,27)+'...'
                return val
            })
            modelTable.addRow(vals)
        })
        if(modelTable.toString()) logger.debug('\n' + modelTable.toString());

    })
}

module.exports = {listContent}

// listContent()