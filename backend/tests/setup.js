// Global setup loaded by mocha BEFORE any test file is required.
// Goal: prevent the real MongoDB connection from being opened when `app.js` is imported,
// and provide a deterministic environment for unit + integration tests.

const sinon = require('sinon');
const mongoose = require('mongoose');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';

// Stub mongoose.connect once for the entire test run.
if (!mongoose.connect.isSinonProxy) {
  sinon.stub(mongoose, 'connect').resolves({ connection: { host: 'in-memory-stub' } });
}

// Silence the logger noise during tests unless DEBUG_TESTS is set.
if (!process.env.DEBUG_TESTS) {
  // eslint-disable-next-line no-console
  console.log = () => {};
  // eslint-disable-next-line no-console
  console.error = () => {};
}
