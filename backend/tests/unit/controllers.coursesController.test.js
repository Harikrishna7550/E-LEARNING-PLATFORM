const { expect } = require('chai');
const sinon = require('sinon');

const Course = require('../../models/Course');
const coursesController = require('../../controllers/coursesController');

const buildRes = () => {
  const res = {};
  res.status = sinon.stub().returns(res);
  res.json = sinon.stub().returns(res);
  return res;
};

describe('Unit: controllers/coursesController', () => {
  afterEach(() => sinon.restore());

  it('10. getCourses returns only published courses for non-admin users', async () => {
    const findChain = { sort: sinon.stub().resolves([{ title: 'A' }, { title: 'B' }]) };
    const findStub = sinon.stub(Course, 'find').returns(findChain);

    const req = { user: { id: 'u1', role: 'student' } };
    const res = buildRes();
    await coursesController.getCourses(req, res);

    expect(findStub.calledOnceWith({ published: true })).to.equal(true);
    expect(res.json.calledOnce).to.equal(true);
    expect(res.json.firstCall.args[0]).to.have.length(2);
  });
});
