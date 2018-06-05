/* eslint-disable no-param-reassign */

const winston = require('winston');

let instance = null;

class Logger {
  constructor() {
    if (instance) {
      return instance;
    }

    this.logger = Logger.logger();

    instance = this;
  }

  static console() {
    return new winston.transports.Console({
      level: 'debug',
      stderrLevels: ['fatal', 'error'],
      formatter: Logger.formatter,
      handleExceptions: true,
      humanReadableUnhandledException: true,
    });
  }

  static formatter(options) {
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
        application: process.env.APP_NAME,
        environment: process.env.NODE_ENV,
        host: process.env.HOST,
        message: options.message || '',
        level: ['verbose', 'silly'].includes(options.level) ? 'DEBUG' : options.level.toUpperCase(),
        stack_trace: stack,
      }));
  }

  static logger() {
    return new winston.Logger({
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
      transports: [Logger.console()],
    });
  }
}

module.exports = new Logger().logger;
