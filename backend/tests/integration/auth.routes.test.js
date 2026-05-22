const request = require('supertest');
const { expect } = require('chai');
const sinon = require('sinon');

const app = require('../../app');
const authService = require('../../services/authService');

describe('Integration: /api/auth', () => {
  afterEach(() => sinon.restore());

  it('13. GET /api/auth/me without token returns 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).to.equal(401);
    expect(res.body).to.have.property('message');
  });

  it('14. POST /api/auth/send-otp returns the service success payload', async () => {
    sinon.stub(authService, 'sendSignupOtp').resolves({ message: 'OTP sent to your email' });

    const res = await request(app)
      .post('/api/auth/send-otp')
      .send({ name: 'A', email: 'a@b.com', password: 'pass123' });

    expect(res.status).to.equal(200);
    expect(res.body).to.deep.equal({ message: 'OTP sent to your email' });
  });

  it('15. POST /api/auth/login propagates service errors with correct status', async () => {
    const err = new Error('Email is not registered');
    err.status = 400;
    sinon.stub(authService, 'loginUser').rejects(err);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'missing@x.com', password: 'whatever' });

    expect(res.status).to.equal(400);
    expect(res.body).to.deep.equal({ message: 'Email is not registered' });
  });
});
