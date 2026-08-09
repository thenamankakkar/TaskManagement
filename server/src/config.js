import 'dotenv/config';

const defaultClientOrigins = ['http://localhost:4200', 'https://taskmanagement-agca.onrender.com'];
const clientOrigins = (process.env.CLIENT_ORIGIN ? process.env.CLIENT_ORIGIN.split(',') : defaultClientOrigins)
  .map(origin => origin.trim().replace(/\/+$/, ''))
  .filter(Boolean);

export const config = {
  port: Number(process.env.PORT || 3000),
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET || 'development-only-secret-change-me',
  clientOrigins
};
