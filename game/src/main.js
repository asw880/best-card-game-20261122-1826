// Ember Duel — bootstrap and game loop.
// One canvas, one fixed logical size (1280 x 800), scaled by CSS to fit the
// window. The loop updates the world and draws every frame. With
// ?shot=title|table|win|loss the game stages that scene from a seeded world
// instead, advances it a fixed amount so particles settle, draws once and
// signals "shot-ready" in the document title for the screenshot tool.

import { VIEW } from './config.js';
import { createWorld, updateWorld } from './world.js';
import { render } from './render.js';
import { createInput } from './input.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');
canvas.width = VIEW.width;
canvas.height = VIEW.height;

function fitCanvas() {
  const scale = Math.min(window.innerWidth / VIEW.width, window.innerHeight / VIEW.height);
  canvas.style.width = `${Math.floor(VIEW.width * scale)}px`;
  canvas.style.height = `${Math.floor(VIEW.height * scale)}px`;
}
window.addEventListener('resize', fitCanvas);
fitCanvas();

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seed = Number(params.get('seed') || '1') || 1;

let world = shot ? stageShot(shot, seed) : createWorld(seed);
const input = createInput(canvas, world, (fresh) => {
  world = fresh;
  input.setWorld(fresh);
  announce();
});

function announce() {
  if (!status) return;
  if (world.screen === 'title') status.textContent = 'Ember Duel. Press Enter to begin.';
  else if (world.screen === 'play') {
    status.textContent = world.phase === 'player'
      ? `Your turn. Life ${world.player.life}, ember ${world.player.ember}.`
      : 'Pyra is playing her turn.';
  } else if (world.screen === 'win') status.textContent = 'Victory! Press R to play again.';
  else status.textContent = 'Defeat. Press R to play again.';
}

if (shot) {
  // Settle the staged scene: advance the world a fixed amount so the win
  // burst is mid-flight and floaters have risen, then draw once.
  for (let i = 0; i < 30; i += 1) updateWorld(world, 1 / 30);
  render(ctx, world, input.ui);
  announce();
  document.title = 'shot-ready';
} else {
  let last = performance.now();
  let lastAnnounced = '';
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    updateWorld(world, dt);
    render(ctx, world, input.ui);
    const key = `${world.screen}|${world.phase}|${world.turn}`;
    if (key !== lastAnnounced) {
      lastAnnounced = key;
      announce();
    }
    requestAnimationFrame(frame);
  }
  announce();
  requestAnimationFrame(frame);
}

// Exposed for play-testing in the browser console.
window.__emberDuel = { get world() { return world; } };
