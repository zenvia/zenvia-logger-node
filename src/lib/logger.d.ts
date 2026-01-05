import { Logger, LeveledLogMethod } from 'winston';

export interface ZenviaLogger extends Logger {
  fatal: LeveledLogMethod;
  isFatalEnabled(): boolean;
  runWithContext<T>(context: object, fn: () => Promise<T> | T): Promise<T>;
  addContext(context: object): void;
}

declare const logger: ZenviaLogger;
export default logger;
