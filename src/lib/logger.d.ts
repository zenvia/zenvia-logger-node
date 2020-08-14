declare module '@zenvia/logger' {
  import { Logger, LeveledLogMethod } from 'winston';

  interface ZenviaLogger extends Logger {
    fatal: LeveledLogMethod;
    isFatalEnabled(): boolean;
  }

  const logger: ZenviaLogger;
  export = logger;
}
