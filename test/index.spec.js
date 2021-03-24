const { assert } = require('chai');
const { default: logger, traceMiddleware } = require('../src');

describe('Logger test', () => {
  it('should load correct module', () => {
    assert.isNotNull(logger);
    assert.isNotNull(traceMiddleware);
  });
});
