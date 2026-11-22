// Ember Duel — mouse and keyboard input.
// Hit-testing mirrors the hand layout in render.js: the hand is fanned
// across LAYOUT.hand with the same spacing, so a click lands on the card
// the player sees. Keyboard: 1-7 plays a hand card, Space ends the turn,
// Enter starts, R restarts after a win or a loss.

import { VIEW, CARD, LAYOUT } from './config.js';
import { CARDS_BY_ID } from './cards.js';
import { startGame, playCard, endPlayerTurn, createWorld } from './world.js';

export function handCardRects(world) {
  const hand = world.player.deck.hand;
  const zone = LAYOUT.hand;
  const n = hand.length;
  if (n === 0) return [];
  const spacing = n <= 1 ? 0 : Math.min(168, (zone.width - CARD.width) / (n - 1));
  const totalW = CARD.width + spacing * (n - 1);
  const startX = zone.x + (zone.width - totalW) / 2;
  const baseY = zone.y + 8;
  return hand.map((cardId, i) => ({
    index: i,
    cardId,
    x: startX + i * spacing,
    y: baseY - 34 + Math.abs(i - (n - 1) / 2) * 4,
    width: CARD.width,
    height: CARD.height + 34,
  }));
}

export function hoverIndexAt(world, x, y) {
  const rects = handCardRects(world);
  // Topmost card wins: check from the rightmost (highest) first.
  for (let i = rects.length - 1; i >= 0; i -= 1) {
    const r = rects[i];
    if (x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height) return i;
  }
  return -1;
}

export function createInput(canvas, world, onRestart) {
  const ui = { mouse: { x: -1, y: -1 }, hoverIndex: -1 };
  let current = world;

  function toLogical(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (VIEW.width / rect.width),
      y: (event.clientY - rect.top) * (VIEW.height / rect.height),
    };
  }

  function restart() {
    const seed = Math.floor(Math.random() * 2147483647);
    const fresh = createWorld(seed);
    onRestart(fresh);
    current = fresh;
    return fresh;
  }

  canvas.addEventListener('mousemove', (event) => {
    const p = toLogical(event);
    ui.mouse = p;
    if (current.screen === 'play' && current.phase === 'player') {
      ui.hoverIndex = hoverIndexAt(current, p.x, p.y);
    } else {
      ui.hoverIndex = -1;
    }
  });

  canvas.addEventListener('click', (event) => {
    const p = toLogical(event);
    if (current.screen === 'title') {
      startGame(current);
      return;
    }
    if (current.screen === 'win' || current.screen === 'loss') {
      restart();
      return;
    }
    if (current.screen !== 'play') return;
    const btn = LAYOUT.endTurn;
    if (p.x >= btn.x && p.x <= btn.x + btn.width && p.y >= btn.y && p.y <= btn.y + btn.height) {
      if (current.phase === 'player') endPlayerTurn(current);
      return;
    }
    if (current.phase !== 'player') return;
    const index = hoverIndexAt(current, p.x, p.y);
    if (index >= 0) {
      const cardId = current.player.deck.hand[index];
      if (cardId) playCard(current, 'player', cardId);
    }
  });

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    if (current.screen === 'title' && (event.key === 'Enter' || event.key === ' ')) {
      startGame(current);
      return;
    }
    if ((current.screen === 'win' || current.screen === 'loss') && (event.key === 'r' || event.key === 'R' || event.key === 'Enter')) {
      restart();
      return;
    }
    if (current.screen !== 'play') return;
    if (event.key === ' ' && current.phase === 'player') {
      event.preventDefault();
      endPlayerTurn(current);
      return;
    }
    if (current.phase === 'player' && /^[1-7]$/.test(event.key)) {
      const index = Number(event.key) - 1;
      const cardId = current.player.deck.hand[index];
      if (cardId) playCard(current, 'player', cardId);
    }
  });

  return {
    ui,
    setWorld(next) {
      current = next;
    },
    restart,
  };
}
