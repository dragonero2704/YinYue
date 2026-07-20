import winston from "winston";
import "winston-daily-rotate-file";

const infoFormat = (info: winston.Logform.TransformableInfo) =>
  `[${info.timestamp}] [${info.level}]${info.message}`;
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

export default logger ;
