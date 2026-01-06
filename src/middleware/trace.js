const rTracer = require('cls-rtracer');

const traceMiddlewareFactory = () => {
  const frameworkMiddleware = process.env.LOGGING_FRAMEWORK_MIDDLEWARE;

  const RTRACER_OPTIONS = {
    useHeader: true,
    headerName: process.env.LOGGING_TRACE_HEADER || 'X-TraceId',
    echoHeader: true,
  };

  const middleware = {
    EXPRESS: rTracer.expressMiddleware(RTRACER_OPTIONS),
    FASTIFY: rTracer.fastifyPlugin,
    HAPI: rTracer.hapiPlugin,
    KOA: rTracer.koaMiddleware(RTRACER_OPTIONS),
  };

  // eslint-disable-next-line no-prototype-builtins
  if (frameworkMiddleware && !middleware.hasOwnProperty(frameworkMiddleware)) {
    throw new Error(`Invalid framework middleware value. Please check environment variable "LOGGING_FRAMEWORK_MIDDLEWARE". Allowed values: [${Object.keys(middleware)}]`);
  }

  return middleware[frameworkMiddleware || 'EXPRESS'];
};

module.exports = traceMiddlewareFactory;
module.exports.traceMiddleware = traceMiddlewareFactory;
module.exports.default = traceMiddlewareFactory;
