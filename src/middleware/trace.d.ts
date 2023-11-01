import { IncomingMessage, ServerResponse } from 'http'
import rTracer from 'cls-rtracer';

declare const traceMiddleware: () =>
  ((req: IncomingMessage, res: ServerResponse, next: (err?: any) => void) => void) |
  ((fastify: any, options: rTracer.IFastifyOptions, done: (err?: any) => void) => void) |
  (rTracer.IHapiPlugin<rTracer.IOptions>) |
  ((ctx: { request: IncomingMessage; response: ServerResponse<IncomingMessage>; }, next: () => Promise<void>) => Promise<void>);

export default traceMiddleware;
