// Ember Duel — the rival's brain.
// The AI plans its whole turn on a copy of the numbers (life, block, ember,
// hand) and plays the plan in order, so its turn is readable: it attacks
// when it can win, blocks when it is hurt, heals when it is low, and plays
// its draw cards early so the rest of the plan can use what it finds. The
// same planner drives the screenshot autopilot, with a different profile.

import { CARDS_BY_ID } from './cards.js';

function cloneDuelist(d) {
  return {
    life: d.life, block: d.block, ember: d.ember, emberMax: d.emberMax,
    hand: d.deck.hand.slice(), kindle: d.kindle, cardsPlayed: d.cardsPlayed,
  };
}

/** Value of playing `card` now, in a simulated duel. Higher is better. */
function scoreCard(world, me, foe, def, profile) {
  const fx = def.effect;
  let value = 0;
  let damage = fx.damage || 0;
  if (fx.perPlayed) damage += fx.perPlayed * me.cardsPlayed;
  if (def.element === 'flame' && me.kindle > 0 && damage > 0) damage += me.kindle;

  if (damage > 0) {
    const through = Math.max(0, damage - foe.block);
    value += through * 2;
    if (foe.life - through <= 0) value += 100; // lethal: always take it
    if (profile === 'reckless') value += damage;
  }
  if (fx.block) {
    const need = profile === 'coward' ? 3 : me.life < 9 ? 2 : 0.6;
    value += fx.block * need;
  }
  if (fx.heal) {
    const missing = 20 - me.life;
    value += Math.min(fx.heal, missing) * (me.life < 11 ? 2.2 : 0.7);
  }
  if (fx.draw) value += fx.draw * 2.4;
  if (fx.ember) value += fx.ember * 1.4;
  if (fx.kindle) value += me.hand.some((id) => CARDS_BY_ID[id].element === 'flame' && id !== def.id) ? 3.5 : 0.5;
  if (fx.selfDamage) value -= fx.selfDamage * (me.life <= 4 ? 6 : 2);
  // Cheap cards that do something beat sitting on ember.
  value += (3 - def.cost) * 0.15;
  return value;
}

function simulatePlay(me, foe, def) {
  const fx = def.effect;
  me.ember -= def.cost;
  me.cardsPlayed += 1;
  const index = me.hand.indexOf(def.id);
  if (index >= 0) me.hand.splice(index, 1);
  let damage = fx.damage || 0;
  if (fx.perPlayed) damage += fx.perPlayed * (me.cardsPlayed - 1);
  if (fx.kindle) me.kindle += fx.kindle;
  if (damage > 0) {
    if (def.element === 'flame' && me.kindle > 0) {
      damage += me.kindle;
      me.kindle = 0;
    }
    const absorbed = Math.min(foe.block, damage);
    foe.block -= absorbed;
    foe.life -= damage - absorbed;
  }
  if (fx.block) me.block += fx.block;
  if (fx.heal) me.life = Math.min(20, me.life + fx.heal);
  if (fx.ember) me.ember = Math.min(10, me.ember + fx.ember);
  if (fx.selfDamage) me.life -= fx.selfDamage;
}

/**
 * Plan the rival's turn: a list of card ids to play, in order. Greedy:
 * each step scores every affordable card in the simulated duel and takes
 * the best while it is worth playing. `profile` tunes the nerve:
 * 'normal' plays to win, 'reckless' attacks into anything, 'coward'
 * blocks and heals first.
 */
export function choosePlan(world, profile = 'normal') {
  const me = cloneDuelist(world.rival);
  const foe = cloneDuelist(world.player);
  const plan = [];
  for (let step = 0; step < 12; step += 1) {
    let best = null;
    let bestValue = profile === 'coward' ? 1.2 : 0.4;
    for (const cardId of me.hand) {
      const def = CARDS_BY_ID[cardId];
      if (def.cost > me.ember) continue;
      const value = scoreCard(world, me, foe, def, profile);
      if (value > bestValue) {
        bestValue = value;
        best = def;
      }
    }
    if (!best) break;
    plan.push(best.id);
    simulatePlay(me, foe, best);
    if (foe.life <= 0) break;
    if (me.life <= 0) break;
  }
  return plan;
}

/**
 * Plan the player's side the same way, for the screenshot autopilot.
 * `profile` lets a shot stage a strong player ('normal') or a doomed one
 * ('idle' plays nothing at all).
 */
export function choosePlayerPlan(world, profile = 'normal') {
  if (profile === 'idle') return [];
  const me = cloneDuelist(world.player);
  const foe = cloneDuelist(world.rival);
  const plan = [];
  for (let step = 0; step < 12; step += 1) {
    let best = null;
    let bestValue = 0.4;
    for (const cardId of me.hand) {
      const def = CARDS_BY_ID[cardId];
      if (def.cost > me.ember) continue;
      const value = scoreCard(world, me, foe, def, profile);
      if (value > bestValue) {
        bestValue = value;
        best = def;
      }
    }
    if (!best) break;
    plan.push(best.id);
    simulatePlay(me, foe, best);
    if (foe.life <= 0) break;
    if (me.life <= 0) break;
  }
  return plan;
}
