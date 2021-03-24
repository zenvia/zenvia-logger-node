const stdMocks = require('std-mocks');
const rTrace = require('cls-rtracer');
const { assert } = require('chai');
const sinon = require('sinon');
const traceMiddleware = require('../../src/middleware/trace');

const DEFAULT_HEADER_NAME = 'X-TraceId';

describe('Trace middleware test', () => {
  let rTraceSpy;

  before(() => {
    stdMocks.use({ print: true });
    rTraceSpy = {
      EXPRESS: sinon.spy(rTrace, 'expressMiddleware'),
      KOA: sinon.spy(rTrace, 'koaMiddleware'),
    };
  });

  beforeEach(() => {
    stdMocks.flush();
  });

  afterEach(() => {
    stdMocks.restore();
    delete process.env.LOGGING_FRAMEWORK_MIDDLEWARE;
    delete process.env.LOGGING_TRACE_HEADER;
  });

  describe('Return correct middleware', () => {
    it('should return correct middlware EXPRESS when it is use default values', () => {
      const RTRACER_OPTIONS = {
        useHeader: true,
        headerName: DEFAULT_HEADER_NAME,
        echoHeader: true,
      };
      const middleware = traceMiddleware();

      assert.isFunction(middleware);
      assert.isTrue(rTraceSpy.EXPRESS.calledWith(RTRACER_OPTIONS));
      assert.equal(rTrace.expressMiddleware(RTRACER_OPTIONS).toString(), middleware.toString());
    });

    it('should return correct KOA middleware when environment is set to KOA', () => {
      process.env.LOGGING_FRAMEWORK_MIDDLEWARE = 'KOA';
      const RTRACER_OPTIONS = {
        useHeader: true,
        headerName: DEFAULT_HEADER_NAME,
        echoHeader: true,
      };
      const middleware = traceMiddleware();

      assert.isFunction(middleware);
      assert.isTrue(rTraceSpy.KOA.calledWith(RTRACER_OPTIONS));
      assert.equal(rTrace.koaMiddleware(RTRACER_OPTIONS).toString(), middleware.toString());
    });

    it('should return correct FASTIFY middleware when environment is set to FASTIFY', () => {
      process.env.LOGGING_FRAMEWORK_MIDDLEWARE = 'FASTIFY';
      const middleware = traceMiddleware();

      assert.isFunction(middleware);
      assert.equal(rTrace.fastifyPlugin.toString(), middleware.toString());
    });

    it('should return correct HAPI middleware when environment is set to HAPI', () => {
      process.env.LOGGING_FRAMEWORK_MIDDLEWARE = 'HAPI';
      const middleware = traceMiddleware();

      assert.isNotNull(middleware);
      assert.equal(rTrace.hapiPlugin, middleware);
    });

    it('should throw error "Invalid framework middleware value" when is set invalid value in LOGGING_FRAMEWORK_MIDDLEWARE environment variable', () => {
      process.env.LOGGING_FRAMEWORK_MIDDLEWARE = 'INVALID_VALUE';
      try {
        traceMiddleware();
      } catch (error) {
        assert.equal(
          error.message,
          'Invalid framework middleware value. Please check environment variable "LOGGING_FRAMEWORK_MIDDLEWARE". Allowed values: [EXPRESS,FASTIFY,HAPI,KOA]',
        );
      }
    });
  });

  describe('Use correct rTracer options', () => {
    it('should use default header name when is not set LOGGING_TRACE_HEADER', () => {
      process.env.LOGGING_FRAMEWORK_MIDDLEWARE = 'EXPRESS';
      const RTRACER_OPTIONS = {
        useHeader: true,
        headerName: DEFAULT_HEADER_NAME,
        echoHeader: true,
      };
      const middleware = traceMiddleware();

      assert.isFunction(middleware);
      assert.isTrue(rTraceSpy.EXPRESS.calledWith(RTRACER_OPTIONS));
    });

    it('should use correct header name when is set LOGGING_TRACE_HEADER', () => {
      const headerName = 'newHeaderName';
      process.env.LOGGING_FRAMEWORK_MIDDLEWARE = 'EXPRESS';
      process.env.LOGGING_TRACE_HEADER = headerName;
      const RTRACER_OPTIONS = {
        useHeader: true,
        headerName,
        echoHeader: true,
      };
      const middleware = traceMiddleware();

      assert.isFunction(middleware);
      assert.isTrue(rTraceSpy.EXPRESS.calledWith(RTRACER_OPTIONS));
      assert.equal(rTrace.expressMiddleware(RTRACER_OPTIONS).toString(), middleware.toString());
    });
  });
});
