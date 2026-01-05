/* eslint-disable prefer-rest-params */
/* eslint-disable no-param-reassign */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable no-use-before-define */

const winston = require('winston');
const path = require('path');
const appRootDir = require('app-root-dir').get();
const rTrace = require('cls-rtracer');
const { AsyncLocalStorage } = require('node:async_hooks');

const appPackage = require(path.join(appRootDir, 'package'));

const loggerStorage = new AsyncLocalStorage();

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
    traceId: rTrace.id(),
  };

  Object.keys(info).forEach((key) => {
    if (info[key] instanceof Function) {
      delete info[key];
    }
  });

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

const baseLogger = winston.createLogger({
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

function getActiveLogger() {
  const store = loggerStorage.getStore();
  return store ? store.current : baseLogger;
}

function leveledLogFn(level) {
  return function log(...args) {
    return logFn(level, ...args);
  };
}

function logFn(level, msg) {
  const currentLogger = getActiveLogger();
  if (arguments.length === 1 && typeof level !== 'object') {
    return currentLogger;
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
  return currentLogger.log(...arguments);
}

function isLevelEnabledFn(level) {
  return function isLevelEnabled() {
    return getActiveLogger().isLevelEnabled(level);
  };
}

const logger = {
  ...baseLogger,

  fatal: leveledLogFn('fatal'),
  error: leveledLogFn('error'),
  warn: leveledLogFn('warn'),
  info: leveledLogFn('info'),
  debug: leveledLogFn('debug'),
  verbose: leveledLogFn('verbose'),
  silly: leveledLogFn('silly'),
  log: logFn,
  isFatalEnabled: isLevelEnabledFn('fatal'),

  runWithContext: (context, fn) => {
    const parentLogger = loggerStorage.getStore()?.current || baseLogger;
    const child = parentLogger.child(context);
    return loggerStorage.run({ current: child }, fn);
  },

  addContext: (context) => {
    const store = loggerStorage.getStore();
    if (store) {
      store.current = store.current.child(context);
    } else {
      baseLogger.warn('Attempted to call addContext outside of an AsyncLocalStorage context');
    }
  },
};

module.exports = logger;
module.exports.default = logger;
