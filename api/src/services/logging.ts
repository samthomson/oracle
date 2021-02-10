import * as appRoot from 'app-root-path'
import { createLogger, format, transports } from 'winston'
import 'winston-daily-rotate-file'

// define the custom settings for each transport (file, console)
const commonLoggingOptions = {
    handleExceptions: true,
    handleRejections: true, // doesn't work
    format: format.combine(
        format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss',
        }),
        format.json(),
    ),
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    colorize: true,
}

const options = {
    fileAll: {
        level: process.env.LOG_LEVEL || 'info',
        // write logs locally
        filename: `${appRoot}/logs/server-log.json`,
        ...commonLoggingOptions,
    },
    console: {
        level: process.env.LOG_LEVEL || 'silly',
        handleExceptions: true,
        handleRejections: true,
        format: format.combine(format.colorize(), format.simple()),
        maxsize: 5242880, // 5MB
        maxFiles: 5,
    },
}

// instantiate a new Winston Logger with the settings defined above
const logger = createLogger({
    transports: [
        // output logs to disk
        new transports.DailyRotateFile(options.fileAll),
    ],
    exitOnError: false, // do not exit on handled exceptions
})

if (process.env.NODE_ENV === 'development') {
    // output to the console too
    logger.add(new transports.Console(options.console))
}

// create a stream object with a 'write' function that will be used by `morgan`
logger.stream = {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    write: (message: string) => {
        // use the 'info' log level so the output will be picked up by both transports (file and console)
        logger.info(message)
    },
}

// have this since handling rejections isn't working with winston
process.on('unhandledRejection', (reason) => {
    throw reason
})

export default logger
