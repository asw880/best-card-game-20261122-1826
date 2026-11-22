// Ember Duel — screenshot staging (?shot=title|table|win|loss).
// Each scene plays the real rules forward from a fresh seeded world, so a
// screenshot is what a short game really looks like and the same seed always
// gives the same frame. The autopilot is the AI planner from ai.js, so the
// table shot shows a plausible mid-duel, the win shot a duel actually won,
// and the loss shot a duel actually lost.

import { createWorld, startGame, playCard, endPlayerTurn, runAiTurnInstantly } from './world.js';
import { choosePlayerPlan } from './ai.js';

function playPlayerPlan(world, profile) {
  const plan = choosePlayerPlan(world, profile);
  for (const cardId of plan) {
    if (world.screen !== 'play') break;
    playCard(world, 'player', cardId);
  }
}

function playFullRound(world, playerProfile, rivalProfile) {
  playPlayerPlan(world, playerProfile);
  if (world.screen !== 'play') return;
  endPlayerTurn(world);
  runAiTurnInstantly(world, rivalProfile);
}

/** Stage `name` from a fresh world. Returns the staged world. */
export function stageShot(name, seed) {
  const world = createWorld(seed);
  if (name === 'title') return world;

  startGame(world);
  if (name === 'table') {
    // Three full rounds, then a fourth player turn with two cards played:
    // both lives dented, both hands full, the log telling the story.
    for (let round = 0; round < 3; round += 1) {
      playFullRound(world, 'normal', 'normal');
      if (world.screen !== 'play') break;
    }
    if (world.screen === 'play') {
      const plan = choosePlayerPlan(world, 'normal').slice(0, 2);
      for (const cardId of plan) playCard(world, 'player', cardId);
    }
  } else if (name === 'win') {
    // A sharp player against a reckless rival: the duel ends in victory.
    for (let round = 0; round < 40 && world.screen === 'play'; round += 1) {
      playFullRound(world, 'normal', 'reckless');
    }
  } else if (name === 'loss') {
    // A player who never plays a card against a steady rival: defeat.
    for (let round = 0; round < 40 && world.screen === 'play'; round += 1) {
      playFullRound(world, 'idle', 'normal');
    }
  }
  // Freeze the turn banner and the played-card pop for a clean frame.
  world.banner = null;
  if (world.lastPlayed) world.lastPlayed.t = world.time - 0.35;
  return world;
}
