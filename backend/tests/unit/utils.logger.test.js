const { expect } = require('chai');
const sinon = require('sinon');

describe('Unit: utils/logger', () => {
  let consoleSpy;
  let logger;

  beforeEach(() => {
    delete require.cache[require.resolve('../../utils/logger')];
    consoleSpy = sinon.spy(console, 'log');
    logger = require('../../utils/logger');
  });

  afterEach(() => {
    consoleSpy.restore();
  });

  it('1. logger prefixes the message with [LOG]:', () => {
    logger('hello world');
    expect(consoleSpy.calledOnce).to.equal(true);
    expect(consoleSpy.firstCall.args[0]).to.equal('[LOG]: hello world');
  });
});
