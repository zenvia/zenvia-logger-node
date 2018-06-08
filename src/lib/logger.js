/* eslint-disable no-param-reassign */
/* eslint-disable import/no-dynamic-require */

const winston = require('winston');
const path = require('path');
const appRootDir = require('app-root-dir').get();

const appPackage = require(path.join(appRootDir, 'package'));

function formatter(options) {
  let stack;
  if (options.meta) {
    if (options.meta.stack) {
      stack = options.meta.stack;
      options.meta.stack = undefined;
    }
    if (options.meta.message) {
      options.message = options.message ? `${options.message}: ${options.meta.message}` : options.meta.message;
      options.meta.message = undefined;
    }
  }
  return JSON.stringify(Object.assign(
    options.meta,
    {
      '@timestamp': new Date().toISOString(),
      '@version': 1,
      application: process.env.APP_NAME || appPackage.name,
      environment: process.env.NODE_ENV,
      host: process.env.HOST || process.env.HOSTNAME,
      message: options.message || '',
      level: ['verbose', 'silly'].includes(options.level) ? 'DEBUG' : options.level.toUpperCase(),
      stack_trace: stack,
    }));
}

function createConsoleTransport() {
  return new winston.transports.Console({
    level: process.env.LOGGING_LEVEL || 'debug',
    stderrLevels: ['fatal', 'error'],
    formatter,
    handleExceptions: true,
    humanReadableUnhandledException: true,
  });
}

const logger = new winston.Logger({
  levels: {
    fatal: 0,
    error: 1,
    warn: 2,
    info: 3,
    debug: 4,
    verbose: 4,
    silly: 4,
  },
  exitOnError: false,
  transports: [createConsoleTransport()],
});

module.exports = logger;
