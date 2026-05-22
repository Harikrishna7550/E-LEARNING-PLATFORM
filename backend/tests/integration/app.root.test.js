const request = require('supertest');
const { expect } = require('chai');
const app = require('../../app');

describe('Integration: GET /', () => {
  it('11. responds with API welcome JSON', async () => {
    const res = await request(app).get('/');
    expect(res.status).to.equal(200);
    expect(res.body).to.deep.equal({ message: 'E-Learning Platform API' });
  });

  it('12. returns 404 for an unknown route', async () => {
    const res = await request(app).get('/this-route-does-not-exist');
    expect(res.status).to.equal(404);
  });
});
