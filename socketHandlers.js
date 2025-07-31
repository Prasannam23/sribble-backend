
import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import {
  createRoom,
  getRoom,
  updateRoom,
  deleteRoom,
  getRoomPlayers,
  getRoomVoters,
  isRoomFull,
} from './roomManager.js';
import {
  GAME_STATES,
  USER_ROLES,
  DRAWING_TIME,
  VOTING_TIME,
  MAX_PLAYERS,
  getRandomPrompt,
} from './gameConstants.js';

export function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('create_room', async (data) => {
      try {
        const { playerName } = data;
        const roomId = uuidv4().substring(0, 8).toUpperCase();

        const room = await createRoom(roomId, socket.id, playerName);
        socket.join(roomId);

        socket.emit('room_created', {
          roomId,
          room: {
            ...room,
            playerCount: getRoomPlayers(room).length,
            voterCount: getRoomVoters(room).length,
          },
        });

        console.log(`Room ${roomId} created by ${playerName}`);
      } catch (error) {
        socket.emit('error', { message: 'Failed to create room' });
        console.error('Create room error:', error);
      }
    });

    socket.on('join_room_as_player', async (data) => {
      try {
        const { roomId, playerName } = data;
        const room = await getRoom(roomId);
        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        if (isRoomFull(room)) {
          socket.emit('error', { message: 'Room is full' });
          return;
        }

        if (room.state !== GAME_STATES.WAITING) {
          socket.emit('error', { message: 'Game already in progress' });
          return;
        }

        room.players[socket.id] = {
          name: playerName,
          role: USER_ROLES.PLAYER,
          ready: false,
          drawing: [],
          votes: 0,
        };
        await updateRoom(roomId, room);
        socket.join(roomId);

        const updatedPlayers = getRoomPlayers(room);

        io.to(roomId).emit('player_joined', {
          playerId: socket.id,
          playerName,
          room: {
            ...room,
            playerCount: updatedPlayers.length,
            voterCount: getRoomVoters(room).length,
          },
        });

        socket.emit('joined_room', {
          roomId,
          role: USER_ROLES.PLAYER,
          room: {
            ...room,
            playerCount: updatedPlayers.length,
            voterCount: getRoomVoters(room).length,
          },
        });

        console.log(`${playerName} joined room ${roomId} as player`);
      } catch (error) {
        socket.emit('error', { message: 'Failed to join room' });
        console.error('Join room error:', error);
      }
    });

    socket.on('join_room_as_voter', async (data) => {
      try {
        const { roomId, voterName } = data;
        const room = await getRoom(roomId);
        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        room.voters[socket.id] = {
          name: voterName,
          hasVoted: false,
        };
        await updateRoom(roomId, room);
        socket.join(roomId);

        io.to(roomId).emit('voter_joined', {
          voterId: socket.id,
          voterName,
          room: {
            ...room,
            playerCount: getRoomPlayers(room).length,
            voterCount: getRoomVoters(room).length,
          },
        });

        socket.emit('joined_room', {
          roomId,
          role: USER_ROLES.VOTER,
          room: {
            ...room,
            playerCount: getRoomPlayers(room).length,
            voterCount: getRoomVoters(room).length,
          },
        });

        console.log(`${voterName} joined room ${roomId} as voter`);
      } catch (error) {
        socket.emit('error', { message: 'Failed to join room as voter' });
        console.error('Join room as voter error:', error);
      }
    });

    socket.on('player_ready', async (data) => {
      try {
        const { roomId } = data;
        const room = await getRoom(roomId);
        if (!room || !room.players[socket.id]) {
          socket.emit('error', { message: 'Invalid room or player' });
          return;
        }

        room.players[socket.id].ready = true;
        await updateRoom(roomId, room);

        const players = getRoomPlayers(room);
        const allReady = players.every(([_, player]) => player.ready);

        io.to(roomId).emit('player_ready_status', {
          playerId: socket.id,
          ready: true,
          allReady: allReady && players.length === MAX_PLAYERS,
        });

        if (allReady && players.length === MAX_PLAYERS) {
          room.state = GAME_STATES.DRAWING;
          room.currentPrompt = getRandomPrompt();
          room.gameStartTime = Date.now();
          room.drawings = {};
          await updateRoom(roomId, room);

          io.to(roomId).emit('game_started', {
            prompt: room.currentPrompt,
            timeLimit: DRAWING_TIME,
            gameStartTime: room.gameStartTime,
          });

          setTimeout(async () => {
            await startVotingPhase(io, roomId);
          }, DRAWING_TIME);

          console.log(`Game started in room ${roomId} with prompt: ${room.currentPrompt}`);
        }
      } catch (error) {
        socket.emit('error', { message: 'Failed to set ready status' });
        console.error('Player ready error:', error);
      }
    });

    socket.on('drawing_data', async (data) => {
      try {
        const { roomId, drawingData } = data;
        const room = await getRoom(roomId);
        if (!room || room.state !== GAME_STATES.DRAWING || !room.players[socket.id]) {
          return;
        }
        room.drawings[socket.id] = drawingData;
        await updateRoom(roomId, room);

        socket.to(roomId).emit('opponent_drawing', {
          playerId: socket.id,
          drawingData,
        });
      } catch (error) {
        console.error('Drawing data error:', error);
      }
    });

    socket.on('vote', async (data) => {
      try {
        const { roomId, playerId } = data;
        const room = await getRoom(roomId);
        if (!room || room.state !== GAME_STATES.VOTING || !room.voters[socket.id]) {
          socket.emit('error', { message: 'Invalid vote' });
          return;
        }

        if (room.voters[socket.id].hasVoted) {
          socket.emit('error', { message: 'You have already voted' });
          return;
        }

        room.voters[socket.id].hasVoted = true;
        room.votes[playerId] = (room.votes[playerId] || 0) + 1;
        await updateRoom(roomId, room);

        io.to(roomId).emit('vote_cast', {
          voterId: socket.id,
          playerId,
          totalVotes: room.votes[playerId],
        });

        const voters = getRoomVoters(room);
        const allVoted = voters.every(([_, voter]) => voter.hasVoted);
        if (allVoted && voters.length > 0) {
          await endGame(io, roomId);
        }

        console.log(`Vote cast in room ${roomId} for player ${playerId}`);
      } catch (error) {
        socket.emit('error', { message: 'Failed to cast vote' });
        console.error('Vote error:', error);
      }
    });

    socket.on('get_room_info', async (data) => {
      try {
        const { roomId } = data;
        const room = await getRoom(roomId);
        if (room) {
          socket.emit('room_info', {
            room: {
              ...room,
              playerCount: getRoomPlayers(room).length,
              voterCount: getRoomVoters(room).length,
            },
          });
        } else {
          socket.emit('error', { message: 'Room not found' });
        }
      } catch (error) {
        socket.emit('error', { message: 'Failed to get room info' });
        console.error('Get room info error:', error);
      }
    });

    socket.on('disconnect', async () => {
      try {
        console.log('User disconnected:', socket.id);
        const rooms = await findUserRooms();
        for (const roomId of rooms) {
          const room = await getRoom(roomId);
          if (!room) continue;
          let userRemoved = false;

          if (room.players[socket.id]) {
            delete room.players[socket.id];
            userRemoved = true;
            io.to(roomId).emit('player_left', {
              playerId: socket.id,
              playerCount: getRoomPlayers(room).length,
            });
          }

          if (room.voters[socket.id]) {
            delete room.voters[socket.id];
            userRemoved = true;
            io.to(roomId).emit('voter_left', {
              voterId: socket.id,
              voterCount: getRoomVoters(room).length,
            });
          }

          if (userRemoved) {
            const players = getRoomPlayers(room);
            const voters = getRoomVoters(room);
            if (players.length === 0 && voters.length === 0) {
              await deleteRoom(roomId);
              console.log(`Room ${roomId} deleted - empty`);
            } else {
              await updateRoom(roomId, room);
              if (room.creator === socket.id && players.length > 0) {
                room.creator = players[0][0];
                await updateRoom(roomId, room);
                io.to(roomId).emit('new_creator', { creatorId: room.creator });
              }
            }
          }
        }
      } catch (error) {
        console.error('Disconnect error:', error);
      }
    });
  });
}

// Voting phase transition
async function startVotingPhase(io, roomId) {
  const room = await getRoom(roomId);
  if (!room || room.state !== GAME_STATES.DRAWING) return;

  room.state = GAME_STATES.VOTING;
  room.votingStartTime = Date.now();
  room.votes = {};

  for (const voterId of Object.keys(room.voters)) {
    room.voters[voterId].hasVoted = false;
  }

  await updateRoom(roomId, room);

  const players = getRoomPlayers(room);
  const playerDrawings = players.map(([playerId, player]) => ({
    playerId,
    playerName: player.name,
    drawing: room.drawings[playerId] || [],
  }));

  io.to(roomId).emit('voting_started', {
    timeLimit: VOTING_TIME,
    votingStartTime: room.votingStartTime,
    playerDrawings,
    prompt: room.currentPrompt,
  });

  setTimeout(async () => {
    await endGame(io, roomId);
  }, VOTING_TIME);

  console.log(`Voting started in room ${roomId}`);
}

// End game and send results
async function endGame(io, roomId) {
  const room = await getRoom(roomId);
  if (!room || room.state === GAME_STATES.FINISHED) return;

  room.state = GAME_STATES.FINISHED;

  const players = getRoomPlayers(room);
  const results = players
    .map(([playerId, player]) => ({
      playerId,
      playerName: player.name,
      votes: room.votes[playerId] || 0,
      drawing: room.drawings[playerId] || [],
    }))
    .sort((a, b) => b.votes - a.votes);

  const winner = results[0];

  room.gameHistory.push({
    prompt: room.currentPrompt,
    results,
    timestamp: Date.now(),
  });

  for (const playerId of Object.keys(room.players)) {
    room.players[playerId].ready = false;
    room.players[playerId].votes = 0;
  }

  room.state = GAME_STATES.WAITING;
  room.currentPrompt = '';
  room.gameStartTime = null;
  room.votingStartTime = null;
  room.drawings = {};
  room.votes = {};

  await updateRoom(roomId, room);

  io.to(roomId).emit('game_ended', {
    results,
    winner: winner || null,
    prompt: room.gameHistory[room.gameHistory.length - 1].prompt,
  });

  console.log(`Game ended in room ${roomId}. Winner: ${winner?.playerName || 'No winner'}`);
}


async function findUserRooms(socketId) {
  const keys = await redisClient.keys('room:*');
  const rooms = [];
  for (const key of keys) {
    const roomData = await redisClient.get(key);
    if (!roomData) continue;
    const room = JSON.parse(roomData);
    if (room.players[socketId] || room.voters[socketId]) {
      rooms.push(room.id);
    }
  }
  return rooms;
}

export default registerSocketHandlers;
