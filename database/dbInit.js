const { readdirSync } = require('fs')
const ascii_table = require('ascii-table')

module.exports = (force = false)=> { 
    let dbTable = new ascii_table("Database");
    dbTable.setHeading("Table", "Status")
    const dir = "./database/models"
    readdirSync(dir).forEach(modelFile=>{
        const modelJSON = require(`../${dir}/${modelFile}`)
        const [modelName, model] = Object.entries(modelJSON)[0]
        let error = false
        try{
            model.sync({force: force});
        }catch(e){
            error = true
            console.log(e)
        }
            
        if(error) dbTable.addRow(modelName, 'error')
        else dbTable.addRow(modelName, 'ok')
    })
    console.log('\n'+dbTable.toString());
}


