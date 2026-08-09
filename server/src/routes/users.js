import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { User } from '../models/User.js';

const router = Router();
router.use(requireAuth);
const managerOnly = (req, res, next) => req.user.role === 'manager' ? next() : res.status(403).json({ message: 'Only managers can manage users.' });
const createSchema = z.object({ username: z.string().trim().min(2).max(50), email: z.string().trim().email(), password: z.string().min(8).max(72), role: z.enum(['manager', 'team_lead', 'employee']), teamLead: z.string().nullable().optional() });
const updateSchema = z.object({ username: z.string().trim().min(2).max(50).optional(), email: z.string().trim().email().optional(), role: z.enum(['manager', 'team_lead', 'employee']).optional(), teamLead: z.string().nullable().optional() }).strict();
const validTeamLead = async id => Boolean(id && mongoose.isValidObjectId(id) && await User.exists({ _id: id, role: 'team_lead' }));

router.get('/', async (req, res) => {
  let filter = { _id: req.user._id };
  if (req.user.role === 'manager') filter = {};
  if (req.user.role === 'team_lead') filter = { $or: [{ _id: req.user._id }, { role: 'employee', teamLead: req.user._id }] };
  res.json(await User.find(filter).select('-password').populate('teamLead', 'username email role').sort({ username: 1 }));
});
router.post('/', managerOnly, async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Please provide valid user details.' });
  if (await User.exists({ email: parsed.data.email.toLowerCase() })) return res.status(409).json({ message: 'An account with that email already exists.' });
  if (parsed.data.teamLead && (parsed.data.role !== 'employee' || !(await validTeamLead(parsed.data.teamLead)))) return res.status(400).json({ message: 'Employees can only be assigned to a valid Team Lead.' });
  const user = await User.create({ ...parsed.data, manager: req.user._id, teamLead: parsed.data.role === 'employee' ? parsed.data.teamLead : null });
  req.app.get('io')?.emit('user:changed', { event: 'created', userId: user.id, role: user.role });
  res.status(201).json(user);
});
router.patch('/:id', managerOnly, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid user id.' });
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success || !Object.keys(parsed.data).length) return res.status(400).json({ message: 'Provide valid user changes.' });
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found.' });
  const nextRole = parsed.data.role || user.role;
  const nextTeamLead = Object.hasOwn(parsed.data, 'teamLead') ? parsed.data.teamLead : user.teamLead;
  if (nextTeamLead && (nextRole !== 'employee' || !(await validTeamLead(nextTeamLead)))) return res.status(400).json({ message: 'Employees can only be assigned to a valid Team Lead.' });
  Object.assign(user, parsed.data, { teamLead: nextRole === 'employee' ? nextTeamLead : null });
  await user.save();
  req.app.get('io')?.emit('user:changed', { event: 'updated', userId: user.id, role: user.role });
  res.json(user);
});
export default router;
