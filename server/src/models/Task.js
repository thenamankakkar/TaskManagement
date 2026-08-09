import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, minlength: 3, maxlength: 120 },
  description: { type: String, trim: true, maxlength: 1000, default: '' },
  status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });
taskSchema.index({ assignedTo: 1, status: 1, updatedAt: -1 });
export const Task = mongoose.model('Task', taskSchema);
