
import { ZenviaLogger } from './lib/logger';
import traceMiddlewareFactory from './middleware/trace';

type ZenviaLoggerModule = ZenviaLogger & {
  default: ZenviaLogger;
  traceMiddleware: typeof traceMiddlewareFactory;
};

declare const loggerModule: ZenviaLoggerModule;
export = loggerModule;
