import { Router } from 'express';
import { z } from 'zod';
import { Task } from '../models/Task.js';
import { User } from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router(); router.use(requireAuth);
const taskSchema = z.object({ title: z.string().trim().min(3, 'Title needs at least 3 characters.').max(120), description: z.string().trim().max(1000).optional(), status: z.enum(['pending', 'completed']).optional(), assignedTo: z.string().optional() });
const idsFor = async user => {
  if (user.role === 'manager') return null;
  if (user.role === 'team_lead') return User.find({ $or: [{ _id: user._id }, { teamLead: user._id }] }).distinct('_id');
  return [user._id];
};
const canAssign = async (user, targetId) => {
  if (user.role === 'manager') return Boolean(await User.exists({ _id: targetId }));
  if (user.role === 'team_lead') return Boolean(await User.exists({ _id: targetId, $or: [{ _id: user._id }, { teamLead: user._id }] }));
  return user._id.equals(targetId);
};
const emit = (req, event, task) => req.app.get('io')?.emit('task:changed', { event, task });

router.get('/', async (req, res) => {
  const status = req.query.status;
  if (status && !['pending', 'completed'].includes(status)) return res.status(400).json({ message: 'Status must be pending or completed.' });
  const allowed = await idsFor(req.user);
  const filter = { ...(allowed ? { assignedTo: { $in: allowed } } : {}), ...(status ? { status } : {}) };
  res.json(await Task.find(filter).populate('createdBy assignedTo', 'username email role').sort({ updatedAt: -1 }));
});
router.post('/', async (req, res) => {
  const parsed = taskSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Please correct the task details.', details: parsed.error.issues.map(i => i.message) });
  const assignedTo = req.user.role === 'employee' ? req.user._id : (parsed.data.assignedTo || req.user._id);
  if (!(await canAssign(req.user, assignedTo))) return res.status(403).json({ message: 'You cannot assign a task to this user.' });
  const task = await Task.create({ ...parsed.data, assignedTo, createdBy: req.user._id });
  const populated = await task.populate('createdBy assignedTo', 'username email role'); emit(req, 'created', populated);
  res.status(201).json(populated);
});
router.patch('/:id', async (req, res) => {
  const parsed = taskSchema.partial().safeParse(req.body);
  if (!parsed.success || Object.keys(req.body).length === 0) return res.status(400).json({ message: 'Provide valid changes for the task.' });
  const allowed = await idsFor(req.user);
  const task = await Task.findOne({ _id: req.params.id, ...(allowed ? { assignedTo: { $in: allowed } } : {}) });
  if (!task) return res.status(404).json({ message: 'Task not found or you do not have access to it.' });
  if (parsed.data.assignedTo && !(await canAssign(req.user, parsed.data.assignedTo))) return res.status(403).json({ message: 'You cannot reassign this task to that user.' });
  Object.assign(task, parsed.data); await task.save(); const populated = await task.populate('createdBy assignedTo', 'username email role'); emit(req, 'updated', populated);
  res.json(populated);
});
router.delete('/:id', async (req, res) => {
  const allowed = await idsFor(req.user);
  const task = await Task.findOneAndDelete({ _id: req.params.id, ...(allowed ? { assignedTo: { $in: allowed } } : {}) });
  if (!task) return res.status(404).json({ message: 'Task not found or you do not have access to it.' });
  emit(req, 'deleted', { _id: task.id }); res.status(204).send();
});
export default router;
