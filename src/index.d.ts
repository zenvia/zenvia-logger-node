
import { ZenviaLogger } from './lib/logger';
import traceMiddlewareFactory from './middleware/trace';

type TraceMiddlewareInstance = ReturnType<typeof traceMiddlewareFactory>;
type ZenviaLoggerModule = ZenviaLogger & {
  default: ZenviaLogger;
  traceMiddleware: TraceMiddlewareInstance;
};

declare const loggerModule: ZenviaLoggerModule;
export = loggerModule;
