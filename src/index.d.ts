import logger from './lib/logger';
import middleware from './middleware/trace';

export default logger;
export const traceMiddleware = middleware();
