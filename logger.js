const winston = require("winston");
require("winston-daily-rotate-file");

/**
 *
 * @param {number} shard
 * @returns
 */
module.exports = () => {
  const infoFormat = (info) =>
    `${info.level} [${info.timestamp}] : ${info.message}`;
  const filename = `logs/%DATE%.log`;
  const fileRotateTransport = new winston.transports.DailyRotateFile({
    filename: filename,
    datePattern: "YYYY-MM-DD",
    maxFiles: "21d",
    zippedArchive: true,
    format: winston.format.combine(
      winston.format.timestamp({
        format: "YYYY-MM-DD HH:mm:ss",
      }),
      winston.format.uncolorize(),
      winston.format.align(),
      winston.format.printf(infoFormat)
    ),
  });

  const logger = winston.createLogger({
    transports: [
      new winston.transports.Console(),
      // new winston.transports.File({filename:getLogName()})
      fileRotateTransport,
    ],
    format: winston.format.combine(
      winston.format.timestamp({
        format: "YYYY-MM-DD HH:mm:ss",
      }),
      winston.format.colorize({ all: true }),
      winston.format.align(),
      winston.format.printf(infoFormat)
    ),
  });

  return logger;
};
