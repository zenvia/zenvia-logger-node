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
    level: ['verbose', 'silly'].includes(info.level)
      ? 'DEBUG'
      : info.level.toUpperCase(),
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
  winston.format.printf(
    (info) => `${info.timestamp} - ${info.level}: ${info.message}`,
  ),
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
  format:
    process.env.LOGGING_FORMATTER_DISABLED
    && process.env.LOGGING_FORMATTER_DISABLED === 'true'
      ? customCombineSimple
      : customCombineJson,
  transports: [createConsoleTransport()],
  exitOnError: false,
});

// HYBRID APPROACH: Monkey-Patching with Structured Functions
//
// Architecture: We use monkey-patching for backward compatibility (ensures
// `logger instanceof winston.Logger` === true), but extract all logic into
// isolated, testable functions (Wrapper pattern structure).
//
// This provides:
// - Full backward compatibility (exports real Winston instance)
// - High maintainability (isolated, testable functions)
// - Easy future migration to pure Wrapper pattern in major versions

// Preserve original log method before patching
const originalLog = baseLogger.log.bind(baseLogger);

/**
 * Determines if a log call should be silenced based on arguments.
 *
 * @param {Array} args - The arguments passed to the log function
 * @returns {boolean} - true if should log, false if should silence
 */
function shouldLog(args) {
  // Case 1: No arguments - silence
  if (args.length === 0) {
    return false;
  }

  // Case 2: Single string argument that's just a level - silence
  if (
    args.length === 1
    && typeof args[0] === 'string'
    && !args[0].includes(' ')
  ) {
    const possibleLevel = args[0].toLowerCase();
    if (
      ['fatal', 'error', 'warn', 'info', 'debug', 'verbose', 'silly'].includes(
        possibleLevel,
      )
    ) {
      return false;
    }
  }

  // Case 3: logger.log('info') - only level without message - silence
  if (args.length === 1 && typeof args[0] === 'string') {
    return false;
  }

  return true;
}

/**
 * Deep clones an object to prevent mutation.
 * Special handling for Error objects to preserve Winston's concatenation behavior.
 *
 * @param {*} obj - The object to clone
 * @returns {*} - The cloned object
 */
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Error) {
    // Create new Error instance to preserve Winston's error handling
    // (Winston concatenates message with error string)
    const cloned = new Error(obj.message);
    cloned.stack = obj.stack;

    // Copy additional properties
    Object.keys(obj).forEach((key) => {
      if (key !== 'message' && key !== 'stack') {
        cloned[key] = obj[key];
      }
    });
    return cloned;
  }

  if (Array.isArray(obj)) {
    return obj.map(deepClone);
  }

  const cloned = {};
  Object.keys(obj).forEach((key) => {
    cloned[key] = deepClone(obj[key]);
  });
  return cloned;
}

/**
 * Injects AsyncLocalStorage context metadata into log arguments.
 *
 * @param {Array} args - The log arguments
 * @returns {Array} - Arguments with context injected
 */
function injectContext(args) {
  const store = loggerStorage.getStore();
  if (!store || !store.context) {
    return args;
  }

  const newArgs = Array.from(args);
  let metaIndex = -1;

  // Determine where metadata object is in arguments
  if (newArgs.length === 1) {
    // logger.info(obj) or logger.info(error)
    if (typeof newArgs[0] === 'object') {
      metaIndex = 0;
    }
  } else if (newArgs.length === 2) {
    // logger.info('msg', obj) or logger.log('level', obj)
    if (typeof newArgs[1] === 'object') {
      metaIndex = 1;
    }
  } else if (newArgs.length >= 3) {
    // logger.log('level', 'msg', obj)
    metaIndex = 2;
  }

  if (metaIndex >= 0 && newArgs[metaIndex]) {
    // Merge context into existing metadata object
    newArgs[metaIndex] = {
      ...store.context,
      ...newArgs[metaIndex],
    };
  } else {
    // Add context as new argument
    newArgs.push(store.context);
  }

  return newArgs;
}

/**
 * Controlled log function with validation, cloning, and context injection.
 * This is the core logic that all log methods delegate to.
 *
 * @param {...*} args - Log arguments (level, message, metadata)
 * @returns {Logger} - The logger instance for chaining
 */
function controlledLog(...args) {
  // Step 1: Validate - should we log?
  if (!shouldLog(args)) {
    return this;
  }

  // Step 2: Clone arguments to prevent mutation
  let clonedArgs = args.map((arg) => {
    if (typeof arg === 'object' && arg !== null) {
      return deepClone(arg);
    }
    return arg;
  });

  // Step 3: Inject AsyncLocalStorage context
  clonedArgs = injectContext(clonedArgs);

  // Step 4: Delegate to original Winston log
  return originalLog(...clonedArgs);
}

// MONKEY-PATCHING: Apply controlled logic to Winston instance

// Override .log() method
baseLogger.log = controlledLog;

// Override convenience methods (info, error, warn, etc.)
['fatal', 'error', 'warn', 'info', 'debug', 'verbose', 'silly'].forEach(
  (level) => {
    baseLogger[level] = function leveledLog(...args) {
      return controlledLog.call(this, level, ...args);
    };
  },
);

// CUSTOM METHODS: Context management and utilities

/**
 * Check if FATAL level is enabled.
 *
 * @returns {boolean}
 */
baseLogger.isFatalEnabled = function isFatalEnabled() {
  return this.isLevelEnabled('fatal');
};

/**
 * Execute a function within a logging context.
 * Context metadata is automatically injected into all logs within the function.
 *
 * @param {Object} context - Metadata to inject (e.g., { requestId: '123' })
 * @param {Function} fn - Function to execute within context
 * @returns {*} - Return value of fn
 */
baseLogger.runWithContext = function runWithContext(context, fn) {
  const parentStore = loggerStorage.getStore();
  const mergedContext = parentStore && parentStore.context
    ? { ...parentStore.context, ...context }
    : context;

  return loggerStorage.run({ context: mergedContext }, fn);
};

/**
 * Add metadata to the current logging context.
 * This mutates the current context (useful for progressive enrichment).
 *
 * @param {Object} context - Additional metadata to merge
 */
baseLogger.addContext = function addContext(context) {
  const store = loggerStorage.getStore();
  if (store) {
    store.context = { ...store.context, ...context };
  } else {
    baseLogger.warn(
      'Attempted to call addContext outside of an AsyncLocalStorage context',
    );
  }
};

module.exports = baseLogger;
module.exports.default = baseLogger;
