import rTracer from 'cls-rtracer';

export type TracerMiddlewareResult =
  ReturnType<typeof rTracer.expressMiddleware> |
  ReturnType<typeof rTracer.fastifyPlugin> |
  typeof rTracer.hapiPlugin |
  ReturnType<typeof rTracer.koaMiddleware>;

declare const traceMiddlewareFactory: () => TracerMiddlewareResult;
export default traceMiddlewareFactory;
