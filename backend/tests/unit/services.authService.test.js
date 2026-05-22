const { expect } = require('chai');
const sinon = require('sinon');

const User = require('../../models/User');
const authService = require('../../services/authService');

// authService destructures `findUserByEmail` from userService at import time,
// so we stub one layer deeper at the User model instead.
describe('Unit: services/authService', () => {
  afterEach(() => sinon.restore());

  it('9. loginUser throws "Email is not registered" when user not found', async () => {
    sinon.stub(User, 'findOne').resolves(null);

    try {
      await authService.loginUser({ email: 'missing@y.com', password: 'p' });
      throw new Error('should have thrown');
    } catch (err) {
      expect(err.status).to.equal(400);
      expect(err.message).to.equal('Email is not registered');
    }
  });
});
