// apiRoutes.js
import express from 'express';
import { getRoom, getRoomPlayers, getRoomVoters } from './roomManager.js';

const router = express.Router();

router.get('/rooms/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await getRoom(roomId);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }
    return res.json({
      success: true,
      room: {
        ...room,
        playerCount: getRoomPlayers(room).length,
        voterCount: getRoomVoters(room).length,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Cron health endpoint (lightweight, for scheduled tasks)
router.get('/cron/health', (req, res) => {
  res.json({ 
    success: true,
    status: 'OK', 
    timestamp: new Date().toISOString() 
  });
});

export default router;
