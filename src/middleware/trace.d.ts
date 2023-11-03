import rTracer from 'cls-rtracer';

declare const traceMiddleware: () =>
  ReturnType<typeof rTracer.expressMiddleware> |
  ReturnType<typeof rTracer.fastifyPlugin> |
  typeof rTracer.hapiPlugin |
  ReturnType<typeof rTracer.koaMiddleware>;

export default traceMiddleware;
