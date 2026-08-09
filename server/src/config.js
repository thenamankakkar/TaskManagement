import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT || 3000),
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET || 'development-only-secret-change-me',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:4200'
};
