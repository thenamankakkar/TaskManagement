import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/User.js';
import { config } from '../config.js';

const router = Router();
const registerSchema = z.object({ username: z.string().trim().min(2).max(50), email: z.string().trim().email(), password: z.string().min(8).max(72), role: z.enum(['manager', 'team_lead', 'employee']).default('employee'), manager: z.string().optional(), teamLead: z.string().optional() });
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });
const tokenFor = user => jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, { expiresIn: '8h' });

router.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Please correct the highlighted fields.', details: parsed.error.issues.map(i => i.message) });
  const { email } = parsed.data;
  if (await User.exists({ email: email.toLowerCase() })) return res.status(409).json({ message: 'An account with that email already exists.' });
  const user = await User.create(parsed.data);
  res.status(201).json({ user, token: tokenFor(user) });
});
router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Email and password are required.' });
  const user = await User.findOne({ email: parsed.data.email.toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(parsed.data.password))) return res.status(401).json({ message: 'Incorrect email or password.' });
  res.json({ user: user.toJSON(), token: tokenFor(user) });
});
export default router;
