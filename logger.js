const winston = require("winston");
require("winston-daily-rotate-file");

const fileRotateTransport = new winston.transports.DailyRotateFile({
  filename: "logs/%DATE%.log",
  datePattern: "YYYY-MM-DD",
  maxFiles: "21d",
  zippedArchive: true,
  format: winston.format.combine(
    winston.format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    winston.format.uncolorize(),
    winston.format.align(),
    winston.format.printf(
      (info) => `${info.level} [${info.timestamp}] : ${info.message}`
    )
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
    winston.format.printf(
      (info) => `${info.level} [${info.timestamp}] : ${info.message}`
    )
  ),
});

global.logger = logger;
