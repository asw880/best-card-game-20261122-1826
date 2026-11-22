// Ember Duel — deck, hand and discard piles.
// A deck is a plain object: draw pile (shuffled, face down), hand and
// discard pile. Drawing from an empty pile reshuffles the discard back in,
// so a long duel never stalls. All shuffles use the duel's seeded rng.

import { shuffle } from './random.js';
import { DECK_LIST } from './cards.js';

export function createDeck(rng) {
  return {
    drawPile: shuffle(DECK_LIST.slice(), rng),
    discardPile: [],
    hand: [],
  };
}

export function drawCards(deck, count, rng) {
  const drawn = [];
  for (let i = 0; i < count; i += 1) {
    if (deck.drawPile.length === 0) {
      if (deck.discardPile.length === 0) break;
      deck.drawPile = shuffle(deck.discardPile, rng);
      deck.discardPile = [];
    }
    drawn.push(deck.drawPile.pop());
  }
  return drawn;
}

export function discardCard(deck, cardId) {
  deck.discardPile.push(cardId);
}

export function deckCount(deck) {
  return deck.drawPile.length;
}

export function discardCount(deck) {
  return deck.discardPile.length;
}
