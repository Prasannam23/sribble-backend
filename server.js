

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import registerSocketHandlers from './socketHandlers.js';
import redisClient from './redisClient.js';
import apiRoutes from './apiRoutes.js';
import { startKeepAlive } from './keepAlive.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});
app.use(cors({
  origin: ['http://localhost:3000', 'https://scribble-frontend-lake.vercel.app/'], 
  credentials: true
}));

app.use(cors());
app.use(express.json());

// Health check endpoint to keep Render instance active
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', apiRoutes);

registerSocketHandlers(io);

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(` Drawing Game Server running on port ${PORT}`);
  console.log(` Socket.io endpoint: http://localhost:${PORT}`);
  console.log(` REST API: http://localhost:${PORT}/api`);
  
  // Start keep-alive for Render deployment
  const baseUrl = process.env.SERVER_URL || `http://localhost:${PORT}`;
  startKeepAlive(baseUrl);
});
