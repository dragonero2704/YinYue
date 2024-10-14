const { windowSize } = require("cli-color");
const winston = require("winston");
require("winston-daily-rotate-file");

function getTimeStamp() {
  const date = new Date();
  return `[${date.getUTCDate().toLocaleString().padStart(2, "0")}/${(
    date.getMonth() + 1
  )
    .toLocaleString()
    .padStart(2, "0")}/${date.getFullYear()} ${date
    .getHours()
    .toLocaleString()
    .padStart(2, "0")}:${date
    .getMinutes()
    .toLocaleString()
    .padStart(2, "0")}:${date.getSeconds().toLocaleString().padStart(2, "0")}]`;
}

function getLogName() {
  const date = new Date();
  return `${date.getFullYear()}_${(date.getMonth() + 1)
    .toLocaleString()
    .padStart(2, "0")}_${date
    .getUTCDate()
    .toLocaleString()
    .padStart(2, "0")}.log`;
}

const fileRotateTransport = new winston.transports.DailyRotateFile({
  filename: "logs/%DATE%.log",
  datePattern: "YYYY-MM-DD",
  maxFiles: "21d",
  format: winston.format.combine(
    winston.format.timestamp({
      format: "YYYY-MM-DD hh:mm:ss",
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
      format: "YYYY-MM-DD hh:mm:ss",
    }),
    winston.format.colorize({ all: true }),
    winston.format.align(),
    winston.format.printf(
      (info) => `${info.level} [${info.timestamp}] : ${info.message}`
    )
  ),
});

global.logger = logger;
