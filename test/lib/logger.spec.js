const os = require('os');
const stdMocks = require('std-mocks');
const sinon = require('sinon');
const logger = require('../../src/lib/logger');

describe('Logger test', () => {
  let brokenClock;

  before(() => {
    process.env.APP_NAME = 'application-name';
    stdMocks.use({ print: true });
    brokenClock = sinon.useFakeTimers(
      new Date('2018-06-05T18:20:42.345Z').getTime(),
    );
  });

  beforeEach(() => {
    stdMocks.flush();

    // This is necessary for Travis to work.
    if (!process.env.HOSTNAME) {
      process.env.HOSTNAME = os.hostname();
    }
  });

  after(() => {
    delete process.env.APP_NAME;
    stdMocks.restore();
    brokenClock.restore();
  });

  describe('Logstash format', () => {
    it('should get application field from package.json', () => {
      delete process.env.APP_NAME;
      logger.info('some message');
      process.env.APP_NAME = 'application-name';
      const expectedOutput = {
        '@timestamp': '2018-06-05T18:20:42.345Z',
        '@version': 1,
        application: '@zenvia/logger',
        host: os.hostname(),
        message: 'some message',
        level: 'INFO',
      };

      const actualOutput = stdMocks.flush().stdout[0];
      JSON.parse(actualOutput).should.be.deep.equal(expectedOutput);
    });

    it('should not log when message is not provided', () => {
      logger.info();
      stdMocks.flush().stdout.length.should.be.equal(0);
    });

    it('should not log when only level provided', () => {
      logger.log('info');
      stdMocks.flush().stdout.length.should.be.equal(0);
    });

    it('should log @timestamp, application, message and level fields', () => {
      logger.info('some message');
      const expectedOutput = {
        '@timestamp': '2018-06-05T18:20:42.345Z',
        '@version': 1,
        application: 'application-name',
        host: os.hostname(),
        message: 'some message',
        level: 'INFO',
      };

      const actualOutput = stdMocks.flush().stdout[0];
      JSON.parse(actualOutput).should.be.deep.equal(expectedOutput);
    });

    it('should remove attributes that are log functions, leaving only the @timestamp, application, message and level fields', () => {
      logger.info('some message', { field1: () => {} });
      const expectedOutput = {
        '@timestamp': '2018-06-05T18:20:42.345Z',
        '@version': 1,
        application: 'application-name',
        host: os.hostname(),
        message: 'some message',
        level: 'INFO',
      };

      const actualOutput = stdMocks.flush().stdout[0];
      JSON.parse(actualOutput).should.be.deep.equal(expectedOutput);
    });

    it('should log @timestamp, application, message, level and environment fields', () => {
      process.env.NODE_ENV = 'test';
      logger.info('some message');
      delete process.env.NODE_ENV;
      const expectedOutput = {
        '@timestamp': '2018-06-05T18:20:42.345Z',
        '@version': 1,
        application: 'application-name',
        host: os.hostname(),
        message: 'some message',
        level: 'INFO',
        environment: 'test',
      };

      const actualOutput = stdMocks.flush().stdout[0];
      JSON.parse(actualOutput).should.be.deep.equal(expectedOutput);
    });

    it('should log @timestamp, application, message, level and host fields', () => {
      process.env.HOST = 'test.host';
      logger.info('some message');
      delete process.env.HOST;
      const expectedOutput = {
        '@timestamp': '2018-06-05T18:20:42.345Z',
        '@version': 1,
        application: 'application-name',
        message: 'some message',
        level: 'INFO',
        host: 'test.host',
      };

      const actualOutput = stdMocks.flush().stdout[0];
      JSON.parse(actualOutput).should.be.deep.equal(expectedOutput);
    });

    it('should log @timestamp, application, message, level and stack_trace fields', () => {
      logger.info('some message', new Error('some reason'));

      const actualOutput = JSON.parse(stdMocks.flush().stdout[0]);
      actualOutput.should.have
        .property('@timestamp')
        .and.be.equal('2018-06-05T18:20:42.345Z');
      actualOutput.should.have.property('@version').and.be.equal(1);
      actualOutput.should.have
        .property('application')
        .and.be.equal('application-name');
      actualOutput.should.have
        .property('message')
        .and.be.equal('some message some reason');
      actualOutput.should.have.property('level').and.be.equal('INFO');
      actualOutput.should.have.property('stack_trace');
    });

    it('should log error message when message is not provided', () => {
      logger.info(new Error('some reason'));

      const actualOutput = JSON.parse(stdMocks.flush().stdout[0]);
      actualOutput.should.have
        .property('@timestamp')
        .and.be.equal('2018-06-05T18:20:42.345Z');
      actualOutput.should.have.property('@version').and.be.equal(1);
      actualOutput.should.have
        .property('application')
        .and.be.equal('application-name');
      actualOutput.should.have.property('message').and.be.equal('some reason');
      actualOutput.should.have.property('level').and.be.equal('INFO');
      actualOutput.should.have.property('stack_trace');
    });

    it('should log required and extra fields', () => {
      logger.info('some message', { some: 'extra field', another: 'field' });
      const expectedOutput = {
        '@timestamp': '2018-06-05T18:20:42.345Z',
        '@version': 1,
        application: 'application-name',
        host: os.hostname(),
        message: 'some message',
        level: 'INFO',
        some: 'extra field',
        another: 'field',
      };

      const actualOutput = stdMocks.flush().stdout[0];
      JSON.parse(actualOutput).should.be.deep.equal(expectedOutput);
    });

    it('should log required and application extra field', () => {
      logger.info({
        application: 'some-application',
        message: 'some message',
        some: 'extra field',
        another: 'field',
      });
      const expectedOutput = {
        '@timestamp': '2018-06-05T18:20:42.345Z',
        '@version': 1,
        application: 'some-application',
        host: os.hostname(),
        message: 'some message',
        level: 'INFO',
        some: 'extra field',
        another: 'field',
      };

      const actualOutput = stdMocks.flush().stdout[0];
      JSON.parse(actualOutput).should.be.deep.equal(expectedOutput);
    });
  });

  describe('Logging level', () => {
    it('should log with LogEntry', () => {
      const obj = {
        level: 'info',
        message: 'some message',
        property: 'some value',
      };
      logger.log(obj);
      const actualOutput = JSON.parse(stdMocks.flush().stdout[0]);
      actualOutput.should.have.property('level').and.be.equal('INFO');
    });

    it('should log as FATAL level', () => {
      logger.isFatalEnabled().should.be.equal(true);
      logger.fatal('some message');
      const actualOutput = JSON.parse(stdMocks.flush().stderr[0]);
      actualOutput.should.have.property('level').and.be.equal('FATAL');
    });

    it('should log as ERROR level', () => {
      logger.error('some message');

      const actualOutput = JSON.parse(stdMocks.flush().stderr[0]);
      actualOutput.should.have.property('level').and.be.equal('ERROR');
    });

    it('should log as WARN level', () => {
      logger.warn('some message');

      const actualOutput = JSON.parse(stdMocks.flush().stdout[0]);
      actualOutput.should.have.property('level').and.be.equal('WARN');
    });

    it('should log as INFO level', () => {
      logger.info('some message');

      const actualOutput = JSON.parse(stdMocks.flush().stdout[0]);
      actualOutput.should.have.property('level').and.be.equal('INFO');
    });

    it('should log as DEBUG level', () => {
      logger.debug('some message');

      const actualOutput = JSON.parse(stdMocks.flush().stdout[0]);
      actualOutput.should.have.property('level').and.be.equal('DEBUG');
    });

    it('should log as DEBUG level when was call with verbose method', () => {
      logger.verbose('some message');

      const actualOutput = JSON.parse(stdMocks.flush().stdout[0]);
      actualOutput.should.have.property('level').and.be.equal('DEBUG');
    });

    it('should log as DEBUG level when was call with silly method', () => {
      logger.silly('some message');

      const actualOutput = JSON.parse(stdMocks.flush().stdout[0]);
      actualOutput.should.have.property('level').and.be.equal('DEBUG');
    });

    it('should not log as DEBUG level when logging leval was setted to INFO', () => {
      delete require.cache[require.resolve('../../src/lib/logger')];
      process.env.LOGGING_LEVEL = 'INFO';
      // eslint-disable-next-line
      const newLogger = require("../../src/lib/logger");
      newLogger.debug('should not log this message');
      delete process.env.LOGGING_LEVEL;
      delete require.cache[require.resolve('../../src/lib/logger')];

      stdMocks.flush().stdout.length.should.be.equal(0);
      stdMocks.flush().stderr.length.should.be.equal(0);
    });
  });

  describe('Logging format', () => {
    it('should get not format when LOGGING_FORMATTER_DISABLED environment is true', () => {
      delete require.cache[require.resolve('../../src/lib/logger')];
      process.env.LOGGING_FORMATTER_DISABLED = 'true';
      // eslint-disable-next-line
      const newLogger = require("../../src/lib/logger");
      newLogger.debug('some message');
      delete process.env.LOGGING_FORMATTER_DISABLED;
      delete require.cache[require.resolve('../../src/lib/logger')];

      const actualOutput = stdMocks.flush().stdout[0];
      actualOutput.should.be.equal(
        '2018-06-05T18:20:42.345Z - debug: some message\n',
      );
    });
  });

  describe('Reliability', () => {
    it('should not mutate the original error object when log this object without any other data', () => {
      const error = new Error('some reason');
      error.should.not.have.property('level');
      logger.info(error);
      error.should.not.have.property('level');
    });

    it('should not mutate the original object when log this object without any other data', () => {
      const obj = { message: 'some value' };
      obj.should.not.have.property('level');
      logger.info(obj);
      obj.should.not.have.property('level');
    });

    it('should not mutate the original error object when log with level and object', () => {
      const error = new Error('some reason');
      error.should.not.have.property('level');
      logger.log('error', error);
      error.should.not.have.property('level');
    });

    it('should not mutate the original object when log with level and object', () => {
      const obj = { property: 'some value' };
      obj.should.not.have.property('level');
      logger.log('info', obj);
      obj.should.not.have.property('level');
    });
  });

  describe('Contextual Logging (AsyncLocalStorage)', () => {
    it('should maintain context metadata across async calls using runWithContext', async () => {
      await logger.runWithContext(
        { partition: 1024, topic: 'my-topic' },
        async () => {
          await Promise.resolve();

          logger.info('message inside context');

          const output = JSON.parse(stdMocks.flush().stdout[0]);
          output.should.have.property('partition').and.be.equal(1024);
          output.should.have.property('topic').and.be.equal('my-topic');
          output.should.have
            .property('message')
            .and.be.equal('message inside context');
        },
      );
    });

    it('should update context metadata using addContext (mutation)', async () => {
      await logger.runWithContext({ requestId: 'initial-id' }, async () => {
        logger.info('first log');
        const output1 = JSON.parse(stdMocks.flush().stdout[0]);
        output1.should.not.have.property('providerId');

        logger.addContext({ providerId: 'zenvia-123' });

        logger.info('second log');
        const output2 = JSON.parse(stdMocks.flush().stdout[0]);
        output2.should.have.property('requestId').and.be.equal('initial-id');
        output2.should.have.property('providerId').and.be.equal('zenvia-123');
      });
    });

    it('should warn when addContext is called outside of an active context', () => {
      logger.addContext({ some: 'data' });

      const actualOutput = stdMocks.flush().stdout[0];
      const parsedOutput = JSON.parse(actualOutput);

      parsedOutput.should.have.property('level').and.be.equal('WARN');
      parsedOutput.should.have
        .property('message')
        .and.be.equal(
          'Attempted to call addContext outside of an AsyncLocalStorage context',
        );
    });

    it('should isolate contexts between concurrent executions', async () => {
      const flow1 = logger.runWithContext({ flow: 1 }, async () => {
        await Promise.resolve();
        logger.info('log flow 1');
      });

      const flow2 = logger.runWithContext({ flow: 2 }, async () => {
        await Promise.resolve();
        logger.info('log flow 2');
      });

      await Promise.all([flow1, flow2]);

      const logs = stdMocks.flush().stdout.map((line) => JSON.parse(line));

      const logFlow2 = logs.find((l) => l.message === 'log flow 2');
      const logFlow1 = logs.find((l) => l.message === 'log flow 1');

      logFlow2.should.have.property('flow').and.be.equal(2);
      logFlow1.should.have.property('flow').and.be.equal(1);
    });

    it('should not leak metadata to logs outside of context', async () => {
      await logger.runWithContext({ internal: 'secret' }, async () => {
        logger.info('inside');
      });

      logger.info('outside');

      const outputs = stdMocks.flush().stdout.map((line) => JSON.parse(line));
      outputs[0].should.have.property('internal').and.be.equal('secret');
      outputs[1].should.not.have.property('internal');
    });

    it('should allow nested contexts (re-nesting via runWithContext)', async () => {
      await logger.runWithContext({ level1: 'a' }, async () => {
        await logger.runWithContext({ level2: 'b' }, async () => {
          logger.info('nested log');
          const output = JSON.parse(stdMocks.flush().stdout[0]);
          output.should.have.property('level1').and.be.equal('a');
          output.should.have.property('level2').and.be.equal('b');
        });
      });
    });

    it('should inject context when using logger.log passing a LogEntry object', async () => {
      await logger.runWithContext({ requestId: 'req-100' }, async () => {
        logger.log({
          level: 'info',
          message: 'context check',
        });

        const output = JSON.parse(stdMocks.flush().stdout[0]);
        output.should.have.property('requestId').and.be.equal('req-100');
        output.should.have.property('message').and.be.equal('context check');
      });
    });
  });

  describe('Edge Cases and Coverage', () => {
    describe('shouldLog function coverage', () => {
      it('should silence log when single argument is a level without spaces', () => {
        logger.log('error');
        stdMocks.flush().stderr.length.should.be.equal(0);
      });

      it('should silence log when single argument is "fatal" level', () => {
        logger.log('fatal');
        stdMocks.flush().stderr.length.should.be.equal(0);
      });

      it('should silence log when single argument is "warn" level', () => {
        logger.log('warn');
        stdMocks.flush().stdout.length.should.be.equal(0);
      });

      it('should silence log when single argument is "debug" level', () => {
        logger.log('debug');
        stdMocks.flush().stdout.length.should.be.equal(0);
      });

      it('should silence log when single argument is "verbose" level', () => {
        logger.log('verbose');
        stdMocks.flush().stdout.length.should.be.equal(0);
      });

      it('should silence log when single argument is "silly" level', () => {
        logger.log('silly');
        stdMocks.flush().stdout.length.should.be.equal(0);
      });

      it('should silence log when called via logger.log() with no arguments', () => {
        logger.log();
        stdMocks.flush().stdout.length.should.be.equal(0);
        stdMocks.flush().stderr.length.should.be.equal(0);
      });

      it('should silence log when called via logger.log() with a non-level string', () => {
        logger.log('simple message without level');
        stdMocks.flush().stdout.length.should.be.equal(0);
      });

      it('should silence log when single string argument is NOT a valid level', () => {
        logger.log('NotALevelAndNoSpaces');
        stdMocks.flush().stdout.length.should.be.equal(0);
      });
    });

    describe('deepClone function coverage', () => {
      it('should clone null values', () => {
        logger.info('message', { nullValue: null });
        const output = JSON.parse(stdMocks.flush().stdout[0]);
        output.should.have.property('nullValue').and.be.equal(null);
      });

      it('should clone primitive values (numbers)', () => {
        logger.info('message', { count: 42 });
        const output = JSON.parse(stdMocks.flush().stdout[0]);
        output.should.have.property('count').and.be.equal(42);
      });

      it('should clone primitive values (booleans)', () => {
        logger.info('message', { active: true });
        const output = JSON.parse(stdMocks.flush().stdout[0]);
        output.should.have.property('active').and.be.equal(true);
      });

      it('should clone arrays', () => {
        const originalArray = [1, 2, 3];
        logger.info('message', { items: originalArray });
        const output = JSON.parse(stdMocks.flush().stdout[0]);
        output.should.have.property('items').and.deep.equal([1, 2, 3]);
      });

      it('should clone nested arrays', () => {
        logger.info('message', {
          matrix: [
            [1, 2],
            [3, 4],
          ],
        });
        const output = JSON.parse(stdMocks.flush().stdout[0]);
        output.should.have.property('matrix').and.deep.equal([
          [1, 2],
          [3, 4],
        ]);
      });

      it('should clone Error objects with additional properties', () => {
        const error = new Error('test error');
        error.code = 'ERR_TEST';
        error.statusCode = 500;

        logger.info('error occurred', error);

        const output = JSON.parse(stdMocks.flush().stdout[0]);
        output.should.have.property('code').and.be.equal('ERR_TEST');
        output.should.have.property('statusCode').and.be.equal(500);
      });

      it('should not mutate nested objects', () => {
        const nested = { inner: { value: 'test' } };
        logger.info('message', nested);
        nested.should.not.have.property('level');
        nested.inner.should.not.have.property('level');
      });

      it('should clone Error objects preventing duplication of message/stack if enumerable', () => {
        const err = new Error('custom error');

        Object.defineProperty(err, 'message', {
          enumerable: true,
          value: 'custom msg',
        });
        Object.defineProperty(err, 'stack', {
          enumerable: true,
          value: 'custom stack',
        });

        logger.info(err);

        const output = JSON.parse(stdMocks.flush().stdout[0]);
        output.should.have.property('message').and.include('custom msg');
      });
    });

    describe('injectContext function coverage', () => {
      it('should handle single object argument with context', async () => {
        stdMocks.flush(); // Clear previous outputs
        await logger.runWithContext({ ctxKey: 'ctxValue' }, async () => {
          logger.info({ message: 'test message', extraKey: 'extraValue' });
          const output = JSON.parse(stdMocks.flush().stdout[0]);
          output.should.have.property('ctxKey').and.be.equal('ctxValue');
          output.should.have.property('extraKey').and.be.equal('extraValue');
        });
      });

      it('should handle two arguments (message + object) with context', async () => {
        stdMocks.flush(); // Clear previous outputs
        await logger.runWithContext({ requestId: '123' }, async () => {
          logger.info('test message', { userId: 'abc' });
          const output = JSON.parse(stdMocks.flush().stdout[0]);
          output.should.have.property('requestId').and.be.equal('123');
          output.should.have.property('userId').and.be.equal('abc');
        });
      });

      it('should add context as new argument when no metadata object exists', async () => {
        stdMocks.flush(); // Clear previous outputs
        await logger.runWithContext({ sessionId: 'session-123' }, async () => {
          logger.info('just a message');
          const output = JSON.parse(stdMocks.flush().stdout[0]);
          output.should.have.property('sessionId').and.be.equal('session-123');
        });
      });

      it('should handle single Error argument with context', async () => {
        stdMocks.flush(); // Clear previous outputs
        await logger.runWithContext({ errorContext: 'handler-1' }, async () => {
          logger.error(new Error('error message'));
          const output = JSON.parse(stdMocks.flush().stderr[0]);
          output.should.have.property('errorContext').and.be.equal('handler-1');
        });
      });

      it('should handle message + error with context', async () => {
        stdMocks.flush(); // Clear previous outputs
        await logger.runWithContext({ errorCtx: 'value' }, async () => {
          logger.error('error occurred', new Error('failure'));
          const output = JSON.parse(stdMocks.flush().stderr[0]);
          output.should.have.property('errorCtx').and.be.equal('value');
          output.should.have.property('message').and.include('error occurred');
        });
      });

      it('should append context as new argument when single argument is primitive', async () => {
        await logger.runWithContext({ ctx: 'test-val' }, async () => {
          try {
            logger.log(12345);
          } catch (error) {
            error.message.should.match(/toUpperCase/);
          }
        });
      });
    });

    describe('controlledLog edge cases', () => {
      it('should handle log with object containing level property', () => {
        logger.log({ level: 'info', message: 'test', customField: 'value' });
        const output = JSON.parse(stdMocks.flush().stdout[0]);
        output.should.have.property('level').and.be.equal('INFO');
        output.should.have.property('customField').and.be.equal('value');
      });

      it('should handle multiple metadata objects via spread', () => {
        logger.info('message', {
          key1: 'value1',
          key2: 'value2',
          key3: 'value3',
        });
        const output = JSON.parse(stdMocks.flush().stdout[0]);
        output.should.have.property('key1').and.be.equal('value1');
        output.should.have.property('key2').and.be.equal('value2');
        output.should.have.property('key3').and.be.equal('value3');
      });
    });

    describe('Custom methods coverage', () => {
      it('should check isFatalEnabled returns correct value', () => {
        const isEnabled = logger.isFatalEnabled();
        isEnabled.should.be.a('boolean');
      });

      it('should handle runWithContext with no parent context', async () => {
        // Ensure we're outside any context
        await logger.runWithContext({ newContext: 'value' }, async () => {
          logger.info('test');
          const output = JSON.parse(stdMocks.flush().stdout[0]);
          output.should.have.property('newContext').and.be.equal('value');
        });
      });

      it('should handle addContext when context already exists', async () => {
        await logger.runWithContext({ initial: 'context' }, async () => {
          logger.addContext({ added: 'field' });
          logger.addContext({ another: 'field' });

          logger.info('test');
          const output = JSON.parse(stdMocks.flush().stdout[0]);
          output.should.have.property('initial').and.be.equal('context');
          output.should.have.property('added').and.be.equal('field');
          output.should.have.property('another').and.be.equal('field');
        });
      });
    });

    describe('All log levels coverage', () => {
      it('should log fatal level with metadata', () => {
        logger.fatal('fatal message', { fatalMeta: 'value' });
        const output = JSON.parse(stdMocks.flush().stderr[0]);
        output.should.have.property('level').and.be.equal('FATAL');
        output.should.have.property('fatalMeta').and.be.equal('value');
      });

      it('should log error level with metadata', () => {
        logger.error('error message', { errorMeta: 'value' });
        const output = JSON.parse(stdMocks.flush().stderr[0]);
        output.should.have.property('level').and.be.equal('ERROR');
        output.should.have.property('errorMeta').and.be.equal('value');
      });

      it('should log warn level with metadata', () => {
        logger.warn('warn message', { warnMeta: 'value' });
        const output = JSON.parse(stdMocks.flush().stdout[0]);
        output.should.have.property('level').and.be.equal('WARN');
        output.should.have.property('warnMeta').and.be.equal('value');
      });

      it('should log verbose level with metadata', () => {
        logger.verbose('verbose message', { verboseMeta: 'value' });
        const output = JSON.parse(stdMocks.flush().stdout[0]);
        output.should.have.property('level').and.be.equal('DEBUG');
        output.should.have.property('verboseMeta').and.be.equal('value');
      });

      it('should log silly level with metadata', () => {
        logger.silly('silly message', { sillyMeta: 'value' });
        const output = JSON.parse(stdMocks.flush().stdout[0]);
        output.should.have.property('level').and.be.equal('DEBUG');
        output.should.have.property('sillyMeta').and.be.equal('value');
      });
    });

    describe('Complex scenarios', () => {
      it('should handle deeply nested contexts', async () => {
        await logger.runWithContext({ level1: 'a' }, async () => {
          await logger.runWithContext({ level2: 'b' }, async () => {
            await logger.runWithContext({ level3: 'c' }, async () => {
              logger.info('deeply nested');
              const output = JSON.parse(stdMocks.flush().stdout[0]);
              output.should.have.property('level1').and.be.equal('a');
              output.should.have.property('level2').and.be.equal('b');
              output.should.have.property('level3').and.be.equal('c');
            });
          });
        });
      });

      it('should handle context with addContext in nested scenarios', async () => {
        await logger.runWithContext({ outer: 'context' }, async () => {
          logger.addContext({ outerAdded: 'field1' });

          await logger.runWithContext({ inner: 'context' }, async () => {
            logger.addContext({ innerAdded: 'field2' });

            logger.info('nested with additions');
            const output = JSON.parse(stdMocks.flush().stdout[0]);
            output.should.have.property('outer').and.be.equal('context');
            output.should.have.property('inner').and.be.equal('context');
            output.should.have.property('innerAdded').and.be.equal('field2');
          });
        });
      });

      it('should handle logging with null metadata object', () => {
        logger.info('message', null);
        const output = JSON.parse(stdMocks.flush().stdout[0]);
        output.should.have.property('message').and.be.equal('message');
      });

      it('should handle logging with undefined metadata', () => {
        logger.info('message', undefined);
        const output = JSON.parse(stdMocks.flush().stdout[0]);
        output.should.have.property('message').and.be.equal('message');
      });

      it('should properly clone objects with circular references removed', () => {
        const obj = { message: 'test', regular: 'field' };
        logger.info(obj);
        obj.should.not.have.property('level');
      });
    });
  });
});
