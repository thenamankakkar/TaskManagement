import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();
describe('authentication validation', () => {
  it('rejects invalid registration data', async () => {
    const response = await request(app).post('/api/auth/register').send({ email: 'bad', password: '123' });
    expect(response.status).toBe(400); expect(response.body.message).toMatch(/correct/i);
  });
  it('requires a token on protected endpoints', async () => {
    const response = await request(app).get('/api/tasks');
    expect(response.status).toBe(401);
  });
});
