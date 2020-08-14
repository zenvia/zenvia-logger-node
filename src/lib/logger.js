/* eslint-disable no-param-reassign */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable no-use-before-define */

const winston = require('winston');
const path = require('path');
const appRootDir = require('app-root-dir').get();

const appPackage = require(path.join(appRootDir, 'package'));

const customFormatJson = winston.format((info) => {
  let stack;

  if (info.stack) {
    stack = info.stack;
    info.stack = undefined;
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
  customFormatJson(),
  winston.format.json(),
);

const customCombineSimple = winston.format.combine(
  winston.format.timestamp(),
  winston.format.printf((info) => (`${info.timestamp} - ${info.level}: ${info.message}`)),
);

const createConsoleTransport = () => new winston.transports.Console({
  stderrLevels: ['fatal', 'error'],
});

const logger = winston.createLogger({
  levels: {
    fatal: 0,
    error: 1,
    warn: 2,
    info: 3,
    debug: 4,
    verbose: 4,
    silly: 4,
  },
  level: process.env.LOGGING_LEVEL || 'debug',
  handleExceptions: true,
  format: process.env.LOGGING_FORMATTER_DISABLED && process.env.LOGGING_FORMATTER_DISABLED === 'true' ? customCombineSimple : customCombineJson,
  transports: [
    createConsoleTransport(),
  ],
  exitOnError: false,
});

function leveledLogFn(level) {
  return function log(...args) {
    return logFn(level, ...args);
  };
}

function logFn(level, msg, ...splat) {
  if (arguments.length === 1 && typeof level !== 'object') {
    return logger;
  }
  if (arguments.length === 2) {
    if (msg && typeof msg === 'object') {
      msg = {
        message: msg.message,
        stack: msg.stack,
        ...msg,
      };
    }
  }
  return logger.log(level, msg, ...splat);
}

function isLevelEnabledFn(level) {
  return function isLevelEnabled() {
    return logger.isLevelEnabled(level);
  };
}

module.exports = {
  ...logger,
  log: logFn,
  fatal: leveledLogFn('fatal'),
  error: leveledLogFn('error'),
  warn: leveledLogFn('warn'),
  info: leveledLogFn('info'),
  debug: leveledLogFn('debug'),
  verbose: leveledLogFn('verbose'),
  silly: leveledLogFn('silly'),
  isFatalEnabled: isLevelEnabledFn('fatal'),
};
