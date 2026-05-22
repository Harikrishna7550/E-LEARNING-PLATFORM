const { expect } = require('chai');
const sinon = require('sinon');
const bcrypt = require('bcryptjs');
const User = require('../../models/User');

describe('Unit: models/User', () => {
  afterEach(() => sinon.restore());

  it('2. requires email, name and password fields', () => {
    const user = new User({});
    const err = user.validateSync();
    expect(err).to.exist;
    expect(err.errors).to.have.property('name');
    expect(err.errors).to.have.property('email');
    expect(err.errors).to.have.property('password');
  });

  it('3. comparePassword delegates to bcrypt.compare with the stored hash', async () => {
    const user = new User({
      name: 'Bob',
      email: 'bob@example.com',
      password: 'hashedValue',
    });
    const compareStub = sinon.stub(bcrypt, 'compare').resolves(true);

    const ok = await user.comparePassword('plain-input');
    expect(ok).to.equal(true);
    expect(compareStub.calledOnceWith('plain-input', 'hashedValue')).to.equal(true);
  });
});
