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

export const DRAWING_TIME = 120000; // 2 minutes
export const VOTING_TIME = 30000;   // 30 seconds
export const MAX_PLAYERS = 2;

export const DRAWING_PROMPTS = [
  'Apple', 'Ball', 'Cat', 'Dog', 'Fish', 'Sun', 'Moon', 'Star', 'Tree', 'House',
  'Car', 'Bus', 'Train', 'Book', 'Chair', 'Table', 'Shoe', 'Phone', 'Laptop', 'Camera',
  'Cloud', 'Rain', 'Snow', 'Flower', 'Bird', 'Cup', 'Bed', 'Door', 'Window', 'Key',
  'Lock', 'Hat', 'Cap', 'Sock', 'Glove', 'Shirt', 'Pants', 'Skirt', 'Dress', 'Watch',
  'Clock', 'Brush', 'Tooth', 'Comb', 'Bag', 'Box', 'Jar', 'Bottle', 'Fork', 'Spoon',
  'Knife', 'Plate', 'Bowl', 'Rocket', 'Plane', 'Boat', 'Truck', 'Drum', 'Guitar', 'Piano',
  'Bell', 'Pen', 'Pencil', 'Crayon', 'Marker', 'Paint', 'Globe', 'Map', 'Balloon', 'Kite',
  'Ladder', 'Tent', 'Candle', 'Lamp', 'Robot', 'Alien', 'Ghost', 'Angel', 'Heart', 'Leaf',
  'Banana', 'Mango', 'Orange', 'Pear', 'Grapes', 'Burger', 'Pizza', 'Cake', 'Cookie',
  'Icecream', 'Candy', 'Donut', 'Fries', 'Submarine', 'Castle', 'Bridge', 'Tower', 'Tunnel',
  'Road', 'Fence', 'Wheel', 'Tire', 'Helmet'
];

export function getRandomPrompt() {
  const index = Math.floor(Math.random() * DRAWING_PROMPTS.length);
  return DRAWING_PROMPTS[index];
}
