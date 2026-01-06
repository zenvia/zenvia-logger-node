const logger = require('./lib/logger');
const traceMiddlewareFactory = require('./middleware/trace');

const traceMiddleware = traceMiddlewareFactory();

module.exports = logger;
module.exports.logger = logger;
module.exports.traceMiddleware = traceMiddleware;
module.exports.default = logger;
