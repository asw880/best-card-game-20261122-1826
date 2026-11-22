// Ember Duel — the card catalogue.
// Twenty original cards across the four elements. An effect is a plain data
// object the world resolves; nothing here knows about drawing or input.
// Damage hits the rival's block first, then life. Block resets at the start
// of its owner's turn. "Draw" pulls from your deck. "Kindle" is a buff that
// only lives for the turn it is played in, so it rewards sequencing.

export const CARD_DEFS = [
  { id: 'spark', name: 'Spark', element: 'flame', cost: 1, text: 'Deal 2 damage.', effect: { damage: 2 } },
  { id: 'flame-lash', name: 'Flame Lash', element: 'flame', cost: 2, text: 'Deal 4 damage.', effect: { damage: 4 } },
  { id: 'meteor', name: 'Meteor', element: 'flame', cost: 4, text: 'Deal 8 damage.', effect: { damage: 8 } },
  { id: 'kindle', name: 'Kindle', element: 'flame', cost: 1, text: 'Your next Flame card deals +2 damage this turn.', effect: { kindle: 2 } },
  { id: 'ember-twin', name: 'Ember Twin', element: 'flame', cost: 2, text: 'Deal 3 damage. Draw 1 card.', effect: { damage: 3, draw: 1 } },
  { id: 'wildfire', name: 'Wildfire', element: 'flame', cost: 3, text: 'Deal 6 damage. You take 2 damage.', effect: { damage: 6, selfDamage: 2 } },
  { id: 'stone-wall', name: 'Stone Wall', element: 'stone', cost: 1, text: 'Gain 4 block.', effect: { block: 4 } },
  { id: 'aegis', name: 'Aegis', element: 'stone', cost: 2, text: 'Gain 7 block.', effect: { block: 7 } },
  { id: 'bulwark', name: 'Bulwark', element: 'stone', cost: 3, text: 'Gain 10 block. Draw 1 card.', effect: { block: 10, draw: 1 } },
  { id: 'thorn-mail', name: 'Thorn Mail', element: 'stone', cost: 2, text: 'Gain 5 block. Deal 2 damage.', effect: { block: 5, damage: 2 } },
  { id: 'chain-lightning', name: 'Chain Lightning', element: 'storm', cost: 3, text: 'Deal 3 damage, +1 per card played this turn.', effect: { damage: 3, perPlayed: 1 } },
  { id: 'scry', name: 'Scry', element: 'storm', cost: 1, text: 'Draw 2 cards.', effect: { draw: 2 } },
  { id: 'gale', name: 'Gale', element: 'storm', cost: 2, text: 'Deal 3 damage. Gain 1 ember.', effect: { damage: 3, ember: 1 } },
  { id: 'storm-surge', name: 'Storm Surge', element: 'storm', cost: 4, text: 'Deal 6 damage. Draw 1 card.', effect: { damage: 6, draw: 1 } },
  { id: 'ember-feast', name: 'Ember Feast', element: 'storm', cost: 2, text: 'Gain 3 ember this turn.', effect: { ember: 3 } },
  { id: 'mend', name: 'Mend', element: 'bloom', cost: 2, text: 'Heal 4 life.', effect: { heal: 4 } },
  { id: 'overgrowth', name: 'Overgrowth', element: 'bloom', cost: 3, text: 'Heal 6 life. Draw 1 card.', effect: { heal: 6, draw: 1 } },
  { id: 'spore-burst', name: 'Spore Burst', element: 'bloom', cost: 1, text: 'Deal 1 damage. Heal 2 life.', effect: { damage: 1, heal: 2 } },
  { id: 'root-grip', name: 'Root Grip', element: 'bloom', cost: 2, text: 'Deal 2 damage. Gain 4 block.', effect: { damage: 2, block: 4 } },
  { id: 'seedling', name: 'Seedling', element: 'bloom', cost: 0, text: 'Draw 1 card. Gain 1 ember.', effect: { draw: 1, ember: 1 } },
];

export const CARDS_BY_ID = {};
for (const def of CARD_DEFS) CARDS_BY_ID[def.id] = def;

// The starting deck: 24 cards. Basics appear twice so the opening hands are
// readable; the big finishers appear once, so drawing one feels earned.
export const DECK_LIST = [
  'spark', 'spark', 'flame-lash', 'flame-lash', 'meteor', 'kindle', 'ember-twin',
  'wildfire', 'stone-wall', 'stone-wall', 'aegis', 'aegis', 'bulwark', 'thorn-mail',
  'chain-lightning', 'chain-lightning', 'scry', 'gale', 'storm-surge', 'ember-feast',
  'mend', 'overgrowth', 'spore-burst', 'root-grip',
];

export function cardName(id) {
  return CARDS_BY_ID[id].name;
}

export function cardElement(id) {
  return CARDS_BY_ID[id].element;
}
