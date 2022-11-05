const { readdirSync } = require('fs')
const ascii_table = require('ascii-table')

const listContent = (force = false) => {
    const dir = "./database/models"
    readdirSync(dir).forEach(async modelFile => {
        const modelJSON = require(`../${dir}/${modelFile}`)
        const [modelName, model] = Object.entries(modelJSON)[0]
        let modelTable = new ascii_table(modelName)
        let error = false
        //code
        try {
            model.sync({ force: force });
        } catch (e) {
            error = true
            console.log('Could not sync ' + modelName + ': ' + e)
        }
        modelTable.setHeading(Object.keys(model.rawAttributes))
        let values = await model.findAll()
        // modelTable.addRow("sample", "sample", "sample","sample","sample","sample")
        modelTable.addRowMatrix(values)
        console.log('\n' + modelTable.toString());

    })
}

module.exports = {listContent}

// listContent()