// roomManager.js
import redisClient from './redisClient.js';
import { getRandomPrompt, GAME_STATES, USER_ROLES, MAX_PLAYERS } from './gameConstants.js';

export async function createRoom(roomId, creatorSocketId, creatorName) {
  const room = {
    id: roomId,
    creator: creatorSocketId,
    state: GAME_STATES.WAITING,
    players: {
      [creatorSocketId]: {
        name: creatorName,
        role: USER_ROLES.PLAYER,
        ready: false,
        drawing: [],
        votes: 0,
      },
    },
    voters: {},
    currentPrompt: '',
    gameStartTime: null,
    votingStartTime: null,
    drawings: {},
    votes: {},
    gameHistory: [],
  };

  await redisClient.set(`room:${roomId}`, JSON.stringify(room), {
    ex: 3600, // 1 hour expiry
  });

  return room;
}

export async function getRoom(roomId) {
  const roomData = await redisClient.get(`room:${roomId}`);
  return roomData ?? null; 
}

export async function updateRoom(roomId, room) {
  await redisClient.set(`room:${roomId}`, JSON.stringify(room), {
    ex: 3600,
  });
}

export async function deleteRoom(roomId) {
  await redisClient.del(`room:${roomId}`);
}

export function getRoomPlayers(room) {
  return Object.entries(room.players).filter(([_, player]) => player.role === USER_ROLES.PLAYER);
}

export function getRoomVoters(room) {
  return Object.entries(room.voters);
}

export function isRoomFull(room) {
  return getRoomPlayers(room).length >= MAX_PLAYERS;
}
