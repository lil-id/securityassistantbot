const { createLogger, format, transports, addColors } = require('winston');

const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
}

addColors(colors);

const logger = createLogger({
    level: 'info',
    format: format.combine(
        format.colorize(),
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.printf(({ timestamp, level, message }) => `${timestamp} ${level}: ${message}`)
    ),
    transports: [
        new transports.Console(),
        process.env.NODE_ENV !== "test" &&
            new transports.File({ filename: "src/logs/error.log", level: "error" }),
        process.env.NODE_ENV !== "test" &&
            new transports.File({ filename: "src/logs/combined.log" })
    ].filter(Boolean),
});

module.exports = logger;