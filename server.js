
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import registerSocketHandlers from './socketHandlers.js';
import redisClient from './redisClient.js';
import apiRoutes from './apiRoutes.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());
app.use('/api', apiRoutes);

registerSocketHandlers(io);

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(` Drawing Game Server running on port ${PORT}`);
  console.log(` Socket.io endpoint: http://localhost:${PORT}`);
  console.log(` REST API: http://localhost:${PORT}/api`);
});
