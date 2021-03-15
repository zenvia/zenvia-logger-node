declare const traceMiddleware: () => (req: IncomingMessage, res: ServerResponse, next: (err?: any) => void) => void;

export default traceMiddleware;