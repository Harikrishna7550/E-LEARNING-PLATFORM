const { expect } = require('chai');
const sinon = require('sinon');
const authorize = require('../../middlewares/authorize');

const buildRes = () => {
  const res = {};
  res.status = sinon.stub().returns(res);
  res.json = sinon.stub().returns(res);
  return res;
};

describe('Unit: middlewares/authorize', () => {
  it('6. returns 401 when req.user is missing', () => {
    const req = {};
    const res = buildRes();
    const next = sinon.spy();

    authorize('admin')(req, res, next);

    expect(res.status.calledWith(401)).to.equal(true);
    expect(res.json.calledWithMatch({ message: 'Not authorized' })).to.equal(true);
    expect(next.notCalled).to.equal(true);
  });

  it('7. returns 403 when role is not allowed', () => {
    const req = { user: { id: 'u1', role: 'student' } };
    const res = buildRes();
    const next = sinon.spy();

    authorize('admin', 'instructor')(req, res, next);

    expect(res.status.calledWith(403)).to.equal(true);
    expect(next.notCalled).to.equal(true);
  });

  it('8. calls next() when role is allowed', () => {
    const req = { user: { id: 'u1', role: 'instructor' } };
    const res = buildRes();
    const next = sinon.spy();

    authorize('admin', 'instructor')(req, res, next);

    expect(next.calledOnce).to.equal(true);
    expect(res.status.notCalled).to.equal(true);
  });
});
