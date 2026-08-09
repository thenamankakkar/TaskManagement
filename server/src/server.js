import mongoose from 'mongoose';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { createApp } from './app.js';
import { config } from './config.js';

if (!config.mongoUri) { console.error('MONGODB_URI is missing. Copy .env.example to .env and configure it.'); process.exit(1); }
try {
  await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 10_000 });
} catch (error) {
  const detail = error?.code === 'ECONNREFUSED' || error?.code === 'ENOTFOUND'
    ? 'MongoDB Atlas DNS cannot be reached. Check your network/DNS, then copy the current connection string from Atlas.'
    : 'MongoDB could not be reached. Check MONGODB_URI, Atlas Network Access, and database-user credentials.';
  console.error(`${detail}\n${error.message}`);
  process.exit(1);
}
const app = createApp(); const server = createServer(app); const io = new Server(server, { cors: { origin: config.clientOrigin } }); app.set('io', io);
io.on('connection', socket => socket.emit('connected', { message: 'Live updates enabled.' }));
server.listen(config.port, () => console.log(`API listening on port ${config.port}`));
