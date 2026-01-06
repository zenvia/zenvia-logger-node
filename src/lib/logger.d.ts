import { Logger, LeveledLogMethod } from 'winston';

export interface ZenviaLogger extends Logger {
  fatal: LeveledLogMethod;
  isFatalEnabled(): boolean;
}

declare const logger: ZenviaLogger;
export default logger;
