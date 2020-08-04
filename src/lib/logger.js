/* eslint-disable no-param-reassign */
/* eslint-disable import/no-dynamic-require */

const winston = require('winston');
const path = require('path');
const appRootDir = require('app-root-dir').get();

const appPackage = require(path.join(appRootDir, 'package'));

const customFormatJson = winston.format((info) => {
  let stack;

  if (info.stack) {
    if (info.stack) {
      stack = info.stack;
      info.stack = undefined;
    }
  }

  info = {
    ...info,
    '@timestamp': new Date().toISOString(),
    '@version': 1,
    application: info.application || process.env.APP_NAME || appPackage.name,
    environment: process.env.NODE_ENV,
    host: process.env.HOST || process.env.HOSTNAME,
    message: info.message || '',
    level: ['verbose', 'silly'].includes(info.level) ? 'DEBUG' : info.level.toUpperCase(),
    stack_trace: stack,
  };

  return info;
});

const customCombineJson = winston.format.combine(
  winston.format.splat(),
  customFormatJson(),
  winston.format.json(),
);

const customCombineSimple = winston.format.combine(
  winston.format.timestamp(),
  winston.format.splat(),
  winston.format.printf((info) => (`${info.timestamp} - ${info.level}: ${info.message}`)),
);

const customErrorFormatter = winston.format((info) => {
  if (info instanceof Error) {
    return {
      message: info.message,
      stack: info.stack,
      ...info,
    };
  }
  return info;
});

const createConsoleTransport = () => new winston.transports.Console({
  level: process.env.LOGGING_LEVEL || 'debug',
  stderrLevels: ['fatal', 'error'],
  format: process.env.LOGGING_FORMATTER_DISABLED && process.env.LOGGING_FORMATTER_DISABLED === 'true' ? customCombineSimple : customCombineJson,
  handleExceptions: true,
  humanReadableUnhandledException: true,
});

/* eslint-disable new-cap */
const logger = new winston.createLogger({
  levels: {
    fatal: 0,
    error: 1,
    warn: 2,
    info: 3,
    debug: 4,
    verbose: 4,
    silly: 4,
  },
  format: winston.format.combine(
    customErrorFormatter(),
    winston.format.json(),
  ),
  transports: [
    createConsoleTransport(),
  ],
  exitOnError: false,
});

module.exports = logger;
