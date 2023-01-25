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
            console.log('Could not sync ' + modelName + ': ' + e)
        }
        // modelTable.setHeading(Object.keys(model.rawAttributes))
        let values = await model.findAll()
        values = JSON.parse(JSON.stringify(values))
        // console.log(values[0])
        if(values.length == 0) return

        modelTable.setHeading(Object.keys(values[0]))
        // modelTable.addRow("sample", "sample", "sample","sample","sample","sample")
        // modelTable.addRow(values.dataValues.values())

        values.forEach((v)=>{
            const vals = Object.values(v).map(val=>{
                // console.log(val)
                if (typeof val === 'string' && val.length > 30)
                    return val.substring(0,27)+'...'
                return val
            })
            modelTable.addRow(vals)
        })
        if(modelTable.toString()) console.log('\n' + modelTable.toString());

    })
}

module.exports = {listContent}

// listContent()