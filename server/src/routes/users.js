import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { User } from '../models/User.js';

const router = Router(); router.use(requireAuth);
router.get('/', async (req, res) => {
  let filter = { _id: req.user._id };
  if (req.user.role === 'manager') filter = {};
  if (req.user.role === 'team_lead') filter = { $or: [{ _id: req.user._id }, { teamLead: req.user._id }] };
  res.json(await User.find(filter).select('-password').sort({ username: 1 }));
});
export default router;
