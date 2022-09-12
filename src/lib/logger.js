/* eslint-disable prefer-rest-params */
/* eslint-disable no-param-reassign */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable no-use-before-define */

const winston = require('winston');
const path = require('path');
const appRootDir = require('app-root-dir').get();
const rTrace = require('cls-rtracer');

const appPackage = require(path.join(appRootDir, 'package'));

const sanitizeInfo = (info) => {
  const sanitizeCRLFInjection = (str) => str
    .replace(/\n|\r/g, (x) => (x === '\n' ? '#n' : '#r'));

  Object.keys(info).forEach((key) => {
    if (typeof info[key] === 'string') {
      info[key] = sanitizeCRLFInjection(info[key]);
      return;
    }

    if (info[key] instanceof Function) {
      delete info[key];
    }
  });
};

const customFormatJson = winston.format((info) => {
  sanitizeInfo(info);

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
    traceId: rTrace.id(),
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

function logFn(level, msg) {
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
  return logger.realLog(...arguments);
}

function isLevelEnabledFn(level) {
  return function isLevelEnabled() {
    return logger.isLevelEnabled(level);
  };
}

logger.fatal = leveledLogFn('fatal');
logger.error = leveledLogFn('error');
logger.warn = leveledLogFn('warn');
logger.info = leveledLogFn('info');
logger.debug = leveledLogFn('debug');
logger.verbose = leveledLogFn('verbose');
logger.silly = leveledLogFn('silly');
logger.isFatalEnabled = isLevelEnabledFn('fatal');
logger.realLog = logger.log;
logger.log = logFn;

module.exports = logger;
