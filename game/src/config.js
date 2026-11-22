// Ember Duel — table and card layout constants.
// One canvas, one fixed logical size (1280 x 800). The page scales it to the
// window; every position below is in logical pixels so a screenshot at
// 1280x800 is exactly what a player sees.

export const VIEW = { width: 1280, height: 800 };

export const RULES = {
  startLife: 20,
  startEmberMax: 3,
  maxEmber: 10,
  startHand: 4,
  drawPerTurn: 1,
  maxHand: 7,
};

// The four elements. Each one is told apart by colour AND by shape, never by
// text alone: flame, mountain, bolt and leaf are drawn as icons on every card.
export const ELEMENTS = {
  flame: { name: 'Flame', color: '#e5484d', light: '#ff7a6e', dark: '#7a171b', ink: '#ffd9d4' },
  stone: { name: 'Stone', color: '#d99a2b', light: '#f2c14e', dark: '#6e4a0c', ink: '#ffedbe' },
  storm: { name: 'Storm', color: '#8b5cf6', light: '#b79cff', dark: '#452a94', ink: '#e6dbff' },
  bloom: { name: 'Bloom', color: '#43b581', light: '#7ddba8', dark: '#175c39', ink: '#d2f5e2' },
};

export const CARD = { width: 150, height: 208, radius: 14 };
export const MINI_CARD = { width: 102, height: 142, radius: 10 };

// Table zones (logical pixels, 1280 x 800).
export const LAYOUT = {
  rivalHud: { x: 24, y: 14, height: 58 },
  rivalHand: { x: 240, y: 84, width: 800, height: 158 },
  center: { x: 24, y: 252, width: 1232, height: 208 },
  playedCard: { x: 60, y: 256 },
  log: { x: 250, y: 268, width: 780, lines: 4 },
  playerHud: { x: 24, y: 470, height: 56 },
  hand: { x: 40, y: 548, width: 1000, height: 240 },
  endTurn: { x: 1092, y: 566, width: 164, height: 64 },
  deckPile: { x: 1092, y: 664, width: 76, height: 104 },
  discardPile: { x: 1180, y: 664, width: 76, height: 104 },
};

// Animation timings (milliseconds).
export const TIMING = {
  drawSlide: 320,
  playFly: 380,
  floatRise: 900,
  banner: 1100,
  aiThink: 650,
  aiPlayGap: 750,
  shake: 260,
};

// Colours for the table itself.
export const TABLE = {
  felt: '#20291f',
  feltEdge: '#2c3a2b',
  wood: '#3a2c1e',
  gold: '#e8c15a',
  parchment: '#f4ead2',
  ink: '#241f18',
  muted: '#9aa58f',
  danger: '#ff5a4e',
};
