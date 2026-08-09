import request from 'supertest';
import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app.js';
import { config } from '../src/config.js';
import { User } from '../src/models/User.js';
import { Task } from '../src/models/Task.js';

let mongo;
const app = createApp();
const tokenFor = user => jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret);

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});
afterEach(async () => { await Promise.all([User.deleteMany({}), Task.deleteMany({})]); });
afterAll(async () => { await mongoose.disconnect(); await mongo.stop(); });

describe('role-based team authorization', () => {
  it('broadcasts newly registered employees for live manager updates', async () => {
    const emit = jest.fn();
    app.set('io', { emit });
    const response = await request(app).post('/api/auth/register').send({ username: 'New Employee', email: 'new@test.dev', password: 'password1', role: 'employee' });
    expect(response.status).toBe(201);
    expect(emit).toHaveBeenCalledWith('user:changed', expect.objectContaining({ event: 'created', role: 'employee' }));
    app.set('io', undefined);
  });

  it('lets a manager attach an employee to a team lead and exposes only that team', async () => {
    const [manager, lead, employee, outsider] = await User.create([
      { username: 'Manager', email: 'manager@test.dev', password: 'password1', role: 'manager' },
      { username: 'Lead', email: 'lead@test.dev', password: 'password1', role: 'team_lead' },
      { username: 'Employee', email: 'employee@test.dev', password: 'password1', role: 'employee' },
      { username: 'Outsider', email: 'outsider@test.dev', password: 'password1', role: 'employee' }
    ]);
    const assigned = await request(app).patch(`/api/users/${employee.id}`).set('Authorization', `Bearer ${tokenFor(manager)}`).send({ teamLead: lead.id });
    expect(assigned.status).toBe(200);
    const visible = await request(app).get('/api/users').set('Authorization', `Bearer ${tokenFor(lead)}`);
    expect(visible.body.map(user => user.email).sort()).toEqual(['employee@test.dev', 'lead@test.dev']);
    expect(visible.body.some(user => user._id === outsider.id)).toBe(false);
  });

  it('shows a team lead both manager-assigned personal work and team-member work', async () => {
    const [manager, lead, employee] = await User.create([
      { username: 'Manager', email: 'manager@test.dev', password: 'password1', role: 'manager' },
      { username: 'Lead', email: 'lead@test.dev', password: 'password1', role: 'team_lead' },
      { username: 'Employee', email: 'employee@test.dev', password: 'password1', role: 'employee' }
    ]);
    employee.teamLead = lead._id; await employee.save();
    await Task.create([
      { title: 'Lead task from manager', createdBy: manager._id, assignedTo: lead._id },
      { title: 'Employee team task', createdBy: manager._id, assignedTo: employee._id }
    ]);
    const response = await request(app).get('/api/tasks').set('Authorization', `Bearer ${tokenFor(lead)}`);
    expect(response.status).toBe(200);
    expect(response.body.map(task => task.title).sort()).toEqual(['Employee team task', 'Lead task from manager']);
  });

  it('forces employee-created tasks to be self-assigned', async () => {
    const [lead, employee] = await User.create([
      { username: 'Lead', email: 'lead@test.dev', password: 'password1', role: 'team_lead' },
      { username: 'Employee', email: 'employee@test.dev', password: 'password1', role: 'employee' }
    ]);
    const response = await request(app).post('/api/tasks').set('Authorization', `Bearer ${tokenFor(employee)}`).send({ title: 'My own task', assignedTo: lead.id });
    expect(response.status).toBe(201);
    expect(response.body.assignedTo._id).toBe(employee.id);
  });
});
