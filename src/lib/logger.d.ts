declare module 'zcc-logger' {
  import { LoggerInstance } from 'winston';
  const logger: LoggerInstance;
  export = logger;
}