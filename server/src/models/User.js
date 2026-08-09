import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['manager', 'team_lead', 'employee'], default: 'employee' },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  teamLead: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true, toJSON: { transform: (_, result) => { delete result.password; return result; } } });

userSchema.pre('save', async function hashPassword() {
  if (this.isModified('password')) this.password = await bcrypt.hash(this.password, 12);
});
userSchema.methods.comparePassword = function comparePassword(password) { return bcrypt.compare(password, this.password); };
export const User = mongoose.model('User', userSchema);
