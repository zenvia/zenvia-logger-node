const os = require('os');
const stdMocks = require('std-mocks');
const sinon = require('sinon');
const logger = require('../../src/lib/logger');

describe('Logger test', () => {
  let brokenClock;

  before(() => {
    process.env.APP_NAME = 'application-name';
    stdMocks.use({ print: true });
    brokenClock = sinon.useFakeTimers(new Date('2018-06-05T18:20:42.345Z').getTime());
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

    it('should log empty message fields when message is not provided', () => {
      logger.info();
      const expectedOutput = {
        '@timestamp': '2018-06-05T18:20:42.345Z',
        '@version': 1,
        application: 'application-name',
        host: os.hostname(),
        message: '',
        level: 'INFO',
      };

      const actualOutput = stdMocks.flush().stdout[0];
      JSON.parse(actualOutput).should.be.deep.equal(expectedOutput);
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
      actualOutput.should.have.property('@timestamp').and.be.equal('2018-06-05T18:20:42.345Z');
      actualOutput.should.have.property('@version').and.be.equal(1);
      actualOutput.should.have.property('application').and.be.equal('application-name');
      actualOutput.should.have.property('message').and.be.equal('some message some reason');
      actualOutput.should.have.property('level').and.be.equal('INFO');
      actualOutput.should.have.property('stack_trace');
    });

    it('should log error message when message is not provided', () => {
      logger.info(new Error('some reason'));

      const actualOutput = JSON.parse(stdMocks.flush().stdout[0]);
      actualOutput.should.have.property('@timestamp').and.be.equal('2018-06-05T18:20:42.345Z');
      actualOutput.should.have.property('@version').and.be.equal(1);
      actualOutput.should.have.property('application').and.be.equal('application-name');
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
    it('should log as FATAL level', () => {
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
      const newLogger = require('../../src/lib/logger');
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
      const newLogger = require('../../src/lib/logger');
      newLogger.debug('some message');
      delete process.env.LOGGING_FORMATTER_DISABLED;
      delete require.cache[require.resolve('../../src/lib/logger')];

      const actualOutput = stdMocks.flush().stdout[0];
      actualOutput.should.be.equal('2018-06-05T18:20:42.345Z - debug: some message\n');
    });
  });
});
