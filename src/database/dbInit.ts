import { readdirSync } from "fs";
import ascii_table from "ascii-table";
import logger from "../logger";

export const syncModels = (force:boolean = false) => {
  let dbTable = new ascii_table("Database", null);
  dbTable.setHeading("Table", "Status");
  const dir = __dirname + "./database/models";
  readdirSync(dir).forEach((file) => {
    const [modelName, model] = require(`../${dir}/${file}`);
    let error = false;
    try {
      model.sync({ force });
    } catch (e) {
      error = true;
      logger.error(e);
    }

    if (error) dbTable.addRow(modelName, "error");
    else dbTable.addRow(modelName, "ok");
  });
  logger.debug("\n" + dbTable.toString());
};
