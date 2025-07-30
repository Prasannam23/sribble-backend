// gameConstants.js
export const GAME_STATES = {
    WAITING: 'waiting',
    READY_CHECK: 'ready_check',
    DRAWING: 'drawing',
    VOTING: 'voting',
    FINISHED: 'finished',
  };
  
  export const USER_ROLES = {
    PLAYER: 'player',
    VOTER: 'voter',
  };
  
  export const DRAWING_TIME = 120000; // 2 minutes in ms
  export const VOTING_TIME = 30000;   // 30 seconds in ms
  export const MAX_PLAYERS = 2;
  
  export const DRAWING_PROMPTS = [
    'A cat wearing a hat',
    'A house in the mountains',
    'A robot playing guitar',
    'A dragon flying over a castle',
    'A submarine under the ocean',
    'A tree with rainbow leaves',
    'A superhero saving the day',
    'A pizza with unusual toppings',
    'A spaceship landing on Mars',
    'A dancing elephant',
    'A butterfly on a flower',
    'A knight fighting a monster',
    'A magical potion bottle',
    'A race car at full speed',
    'A witch on a broomstick',
  ];
  
  export function getRandomPrompt() {
    return DRAWING_PROMPTS[Math.floor(Math.random() * DRAWING_PROMPTS.length)];
  }
  