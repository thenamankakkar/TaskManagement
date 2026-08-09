import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import taskRoutes from './routes/tasks.js';
import userRoutes from './routes/users.js';
import { config } from './config.js';
import { errorHandler, notFound } from './middleware/error.js';

export const createApp = () => {
  const app = express();
  app.use(helmet()); app.use(cors({ origin: (origin, callback) => {
    const normalizedOrigin = origin?.replace(/\/+$/, '');
    if (!origin || config.clientOrigins.includes(normalizedOrigin)) return callback(null, true);
    callback(new Error('This website is not allowed by CORS.'));
  } }));
  app.get('/', (req, res) => res.json({ message: 'TaskFlow API is running.', status: 'ok' }));
  app.use(express.json({ limit: '50kb' })); app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 100 }), authRoutes);
  app.use('/api/tasks', taskRoutes); app.use('/api/users', userRoutes); app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  app.use(notFound); app.use(errorHandler); return app;
};
