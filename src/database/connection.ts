import { Sequelize } from "sequelize";
import logger from "../logger";

const logging = (sql: string, timing?: number | undefined) => {
  logger.debug(sql, timing);
};

const connection: Sequelize = new Sequelize(
  "database",
  "YinYue",
  process.env.DB_PASS,
  {
    host: "localhost",
    dialect: "sqlite",
    logging: logging,
    // SQLite only
    storage: "./database/db.sqlite",
    define: {
      freezeTableName: true,
    },
  }
);

export default connection;
