Object.defineProperty(exports, '__esModule', {
  value: true,
});

const logger = require('./lib/logger');
const traceMiddleware = require('./middleware/trace');

exports.default = logger;
exports.traceMiddleware = traceMiddleware();
