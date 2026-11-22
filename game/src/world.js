// Ember Duel — the duel itself: state, turns and card resolution.
// One world holds both duelists. A turn is: reset your block, grow your
// ember, draw a card, play what you can afford, end your turn. The rival's
// turn runs the same rules through the AI planner in ai.js. Damage hits
// block first, then life; life at zero ends the duel at once.

import { RULES, TIMING } from './config.js';
import { makeRng } from './random.js';
import { CARDS_BY_ID } from './cards.js';
import { createDeck, drawCards, discardCard } from './deck.js';
import { choosePlan } from './ai.js';

export const SIDE_PLAYER = 'player';
export const SIDE_RIVAL = 'rival';

function createDuelist(rng) {
  return {
    life: RULES.startLife,
    block: 0,
    ember: RULES.startEmberMax,
    emberMax: RULES.startEmberMax,
    deck: createDeck(rng),
    kindle: 0,
    cardsPlayed: 0,
  };
}

export function createWorld(seed) {
  const rng = makeRng(seed);
  const world = {
    seed,
    rng,
    screen: 'title',
    phase: 'player',
    turn: 0,
    player: createDuelist(rng),
    rival: createDuelist(rng),
    log: [],
    floaters: [],
    particles: [],
    shake: 0,
    banner: null,
    bannerUntil: 0,
    lastPlayed: null,
    aiQueue: [],
    aiTimer: 0,
    aiThinking: false,
    winner: null,
    stats: { turns: 0, damageDealt: 0, cardsPlayed: 0, healed: 0 },
    time: 0,
  };
  seedAmbient(world);
  return world;
}

function seedAmbient(world) {
  for (let i = 0; i < 26; i += 1) {
    world.particles.push({
      kind: 'mote',
      x: world.rng.next() * 1280,
      y: world.rng.next() * 800,
      vx: (world.rng.next() - 0.5) * 8,
      vy: -6 - world.rng.next() * 14,
      life: 2 + world.rng.next() * 4,
      maxLife: 6,
      size: 1.5 + world.rng.next() * 2.5,
      color: world.rng.next() < 0.5 ? '#e8c15a' : '#e5484d',
    });
  }
}

export function sideOf(world, side) {
  return side === SIDE_PLAYER ? world.player : world.rival;
}

export function otherSide(world, side) {
  return side === SIDE_PLAYER ? world.rival : world.player;
}

export function sideName(side) {
  return side === SIDE_PLAYER ? 'You' : 'Pyra';
}

export function logLine(world, text) {
  world.log.push(text);
  if (world.log.length > 4) world.log.shift();
}

export function addFloater(world, x, y, text, color) {
  world.floaters.push({ x, y, text, color, t: 0, life: TIMING.floatRise / 1000 });
}

export function burst(world, x, y, color, count) {
  for (let i = 0; i < count; i += 1) {
    const angle = world.rng.next() * Math.PI * 2;
    const speed = 60 + world.rng.next() * 220;
    world.particles.push({
      kind: 'burst',
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 60,
      life: 0.7 + world.rng.next() * 0.8,
      maxLife: 1.5,
      size: 2 + world.rng.next() * 4,
      color,
    });
  }
}

/** Title -> table: deal both opening hands and start the first turn. */
export function startGame(world) {
  world.screen = 'play';
  world.phase = 'player';
  world.turn = 1;
  world.stats.turns = 1;
  const drawnPlayer = drawCards(world.player.deck, RULES.startHand, world.rng);
  world.player.deck.hand.push(...drawnPlayer);
  const drawnRival = drawCards(world.rival.deck, RULES.startHand, world.rng);
  world.rival.deck.hand.push(...drawnRival);
  beginTurn(world, SIDE_PLAYER);
  logLine(world, 'The duel begins. Your move.');
}

function beginTurn(world, side) {
  const duelist = sideOf(world, side);
  duelist.block = 0;
  duelist.kindle = 0;
  duelist.cardsPlayed = 0;
  duelist.emberMax = Math.min(10, duelist.emberMax + (world.turn > 1 ? 1 : 0));
  duelist.ember = duelist.emberMax;
  const drawn = drawCards(duelist.deck, RULES.drawPerTurn, world.rng);
  for (const cardId of drawn) {
    if (duelist.deck.hand.length < RULES.maxHand) duelist.deck.hand.push(cardId);
    else discardCard(duelist.deck, cardId);
  }
  world.banner = side === SIDE_PLAYER ? 'YOUR TURN' : "PYRA'S TURN";
  world.bannerUntil = world.time + TIMING.banner / 1000;
}

export function canPlayCard(world, side, cardId) {
  if (world.screen !== 'play') return false;
  // The player's turn is phase 'player'; the rival's turn is phase 'ai'.
  const active = side === SIDE_PLAYER ? world.phase === SIDE_PLAYER : world.phase === 'ai';
  if (!active) return false;
  const duelist = sideOf(world, side);
  const def = CARDS_BY_ID[cardId];
  if (!def) return false;
  if (!duelist.deck.hand.includes(cardId)) return false;
  return duelist.ember >= def.cost;
}

/** Resolve one card. Returns true when the card was played. */
export function playCard(world, side, cardId) {
  if (!canPlayCard(world, side, cardId)) return false;
  const duelist = sideOf(world, side);
  const foe = otherSide(world, side);
  const def = CARDS_BY_ID[cardId];
  duelist.ember -= def.cost;
  duelist.cardsPlayed += 1;
  const handIndex = duelist.deck.hand.indexOf(cardId);
  duelist.deck.hand.splice(handIndex, 1);
  discardCard(duelist.deck, cardId);
  world.lastPlayed = { cardId, by: side, t: world.time };
  if (side === SIDE_PLAYER) world.stats.cardsPlayed += 1;

  const fx = def.effect;
  let damage = fx.damage || 0;
  if (fx.perPlayed) damage += fx.perPlayed * (duelist.cardsPlayed - 1);
  if (fx.kindle) {
    duelist.kindle += fx.kindle;
    logLine(world, `${sideName(side)} kindles the next Flame card (+${fx.kindle}).`);
  }
  if (damage > 0) {
    if (def.element === 'flame' && duelist.kindle > 0) {
      damage += duelist.kindle;
      duelist.kindle = 0;
    }
    dealDamage(world, foe, damage, side);
    logLine(world, `${sideName(side)} plays ${def.name} — ${damage} damage.`);
  }
  if (fx.block) {
    duelist.block += fx.block;
    logLine(world, `${sideName(side)} gains ${fx.block} block.`);
  }
  if (fx.heal) {
    const healed = Math.min(fx.heal, RULES.startLife - duelist.life);
    duelist.life += healed;
    if (side === SIDE_PLAYER) world.stats.healed += healed;
    logLine(world, `${sideName(side)} heals ${healed} life.`);
  }
  if (fx.ember) {
    duelist.ember = Math.min(10, duelist.ember + fx.ember);
    logLine(world, `${sideName(side)} gains ${fx.ember} ember.`);
  }
  if (fx.draw) {
    const drawn = drawCards(duelist.deck, fx.draw, world.rng);
    for (const id of drawn) {
      if (duelist.deck.hand.length < RULES.maxHand) duelist.deck.hand.push(id);
      else discardCard(duelist.deck, id);
    }
  }
  if (fx.selfDamage) {
    duelist.life -= fx.selfDamage;
    logLine(world, `${sideName(side)} burns for ${fx.selfDamage}.`);
  }
  checkEnd(world);
  return true;
}

function dealDamage(world, target, amount, sourceSide) {
  let left = amount;
  if (target.block > 0) {
    const absorbed = Math.min(target.block, left);
    target.block -= absorbed;
    left -= absorbed;
  }
  if (left > 0) {
    target.life -= left;
    if (sourceSide === SIDE_PLAYER) world.stats.damageDealt += left;
  }
  const isRival = target === world.rival;
  addFloater(world, isRival ? 640 : 640, isRival ? 210 : 500, `-${amount}`, amount >= 6 ? '#ff5a4e' : '#ffd9d4');
  world.shake = Math.min(14, 4 + amount);
  burst(world, 640, isRival ? 120 : 560, '#e5484d', Math.min(10, 3 + amount));
}

function checkEnd(world) {
  if (world.rival.life <= 0) {
    world.rival.life = 0;
    endDuel(world, SIDE_PLAYER);
  } else if (world.player.life <= 0) {
    world.player.life = 0;
    endDuel(world, SIDE_RIVAL);
  }
}

function endDuel(world, winner) {
  world.winner = winner;
  world.screen = winner === SIDE_PLAYER ? 'win' : 'loss';
  world.phase = 'over';
  if (winner === SIDE_PLAYER) {
    burst(world, 640, 380, '#e8c15a', 90);
    burst(world, 420, 320, '#e5484d', 60);
    burst(world, 860, 320, '#8b5cf6', 60);
    logLine(world, 'Victory! The embers are yours.');
  } else {
    logLine(world, 'Defeat. Pyra takes the duel.');
  }
}

/** Player ends the turn: the rival starts hers (draw, ember, block reset), plans, then plays with visible pacing. */
export function endPlayerTurn(world) {
  if (world.screen !== 'play' || world.phase !== SIDE_PLAYER) return;
  beginTurn(world, SIDE_RIVAL);
  world.phase = 'ai';
  world.aiThinking = true;
  world.aiTimer = TIMING.aiThink / 1000;
  world.aiQueue = [];
}

/** Advance timers, particles, floaters and the rival's turn. dt in seconds. */
export function updateWorld(world, dt) {
  world.time += dt;
  if (world.shake > 0) world.shake = Math.max(0, world.shake - dt * 30);
  for (const floater of world.floaters) floater.t += dt;
  world.floaters = world.floaters.filter((f) => f.t < f.life);
  for (const p of world.particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += p.kind === 'burst' ? 160 * dt : 0;
    p.life -= dt;
    if (p.kind === 'mote' && p.life <= 0) {
      p.x = world.rng.next() * 1280;
      p.y = 800 + 10;
      p.life = 2 + world.rng.next() * 4;
      p.maxLife = 6;
    }
  }
  world.particles = world.particles.filter((p) => p.life > 0 || p.kind === 'mote');

  if (world.phase === 'ai' && world.screen === 'play') {
    world.aiTimer -= dt;
    if (world.aiTimer <= 0) {
      if (world.aiThinking) {
        world.aiThinking = false;
        world.aiQueue = choosePlan(world);
        world.aiTimer = TIMING.aiPlayGap / 1000;
      } else if (world.aiQueue.length > 0) {
        const next = world.aiQueue.shift();
        playCard(world, SIDE_RIVAL, next);
        world.aiTimer = TIMING.aiPlayGap / 1000;
        if (world.screen !== 'play') return;
      } else {
        world.turn += 1;
        world.stats.turns = world.turn;
        world.phase = 'player';
        beginTurn(world, SIDE_PLAYER);
      }
    }
  }
}

/** Run the rival's whole turn at once (screenshot staging, no pacing). */
export function runAiTurnInstantly(world, profile = 'normal') {
  if (world.phase !== 'ai') return;
  world.aiThinking = false;
  world.aiQueue = choosePlan(world, profile);
  while (world.aiQueue.length > 0 && world.screen === 'play') {
    playCard(world, SIDE_RIVAL, world.aiQueue.shift());
  }
  if (world.screen !== 'play') return;
  world.turn += 1;
  world.stats.turns = world.turn;
  world.phase = 'player';
  beginTurn(world, SIDE_PLAYER);
}
