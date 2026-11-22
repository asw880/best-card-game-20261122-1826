// Ember Duel — everything the player sees, drawn on one canvas.
// Title, table, win and loss screens, cards, life bars, ember pips, floating
// damage numbers and the ember motes that drift over the table. Every card
// shows its element by colour AND by a drawn shape, so the game reads at a
// glance even shrunk to a thumbnail.

import { VIEW, CARD, MINI_CARD, LAYOUT, ELEMENTS, TABLE } from './config.js';
import { CARDS_BY_ID } from './cards.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_WIN = 'win';
export const SCREEN_LOSS = 'loss';

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Draw one of the four element icons, centred at (x, y), in `color`. */
export function drawElementIcon(ctx, element, x, y, size, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, size * 0.08);
  ctx.lineJoin = 'round';
  const s = size / 2;
  if (element === 'flame') {
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.bezierCurveTo(s * 0.9, -s * 0.2, s * 0.7, s * 0.4, s * 0.25, s * 0.75);
    ctx.bezierCurveTo(s * 0.1, s * 0.95, -s * 0.1, s * 0.95, -s * 0.25, s * 0.75);
    ctx.bezierCurveTo(-s * 0.7, s * 0.4, -s * 0.9, -s * 0.2, 0, -s);
    ctx.fill();
    ctx.fillStyle = '#fff3c4';
    ctx.beginPath();
    ctx.moveTo(0, s * 0.1);
    ctx.bezierCurveTo(s * 0.35, s * 0.4, s * 0.2, s * 0.7, 0, s * 0.8);
    ctx.bezierCurveTo(-s * 0.2, s * 0.7, -s * 0.35, s * 0.4, 0, s * 0.1);
    ctx.fill();
  } else if (element === 'stone') {
    ctx.beginPath();
    ctx.moveTo(-s, s * 0.8);
    ctx.lineTo(-s * 0.35, -s * 0.55);
    ctx.lineTo(0, s * 0.1);
    ctx.lineTo(s * 0.4, -s * 0.9);
    ctx.lineTo(s, s * 0.8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.moveTo(-s * 0.35, -s * 0.55);
    ctx.lineTo(0, s * 0.1);
    ctx.lineTo(-s * 0.05, s * 0.8);
    ctx.lineTo(-s, s * 0.8);
    ctx.closePath();
    ctx.fill();
  } else if (element === 'storm') {
    ctx.beginPath();
    ctx.moveTo(s * 0.25, -s);
    ctx.lineTo(-s * 0.55, s * 0.15);
    ctx.lineTo(-s * 0.05, s * 0.15);
    ctx.lineTo(-s * 0.25, s);
    ctx.lineTo(s * 0.55, -s * 0.15);
    ctx.lineTo(s * 0.05, -s * 0.15);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.bezierCurveTo(s * 0.95, -s * 0.7, s * 0.9, s * 0.55, 0, s * 0.95);
    ctx.bezierCurveTo(-s * 0.9, s * 0.55, -s * 0.95, -s * 0.7, 0, -s);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.8);
    ctx.lineTo(0, s * 0.85);
    ctx.stroke();
  }
  ctx.restore();
}

/** A full card face. `w`/`h` let the same drawing serve the rival's mini cards. */
export function drawCardFace(ctx, cardId, x, y, w, h) {
  const def = CARDS_BY_ID[cardId];
  const el = ELEMENTS[def.element];
  const scale = w / CARD.width;
  ctx.save();
  ctx.translate(x, y);
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = 12 * scale;
  ctx.shadowOffsetY = 4 * scale;
  roundRect(ctx, 0, 0, w, h, CARD.radius * scale);
  ctx.fillStyle = TABLE.parchment;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  // Element band across the top.
  roundRect(ctx, 0, 0, w, 44 * scale, CARD.radius * scale);
  ctx.fillStyle = el.color;
  ctx.fill();
  ctx.fillRect(0, 30 * scale, w, 14 * scale);
  // Cost gem, top left.
  ctx.beginPath();
  ctx.arc(20 * scale, 22 * scale, 15 * scale, 0, Math.PI * 2);
  ctx.fillStyle = '#241f18';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(20 * scale, 22 * scale, 12 * scale, 0, Math.PI * 2);
  ctx.fillStyle = '#ffd76a';
  ctx.fill();
  ctx.fillStyle = '#241f18';
  ctx.font = `bold ${17 * scale}px Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(def.cost), 20 * scale, 23 * scale);
  // Element name, top right.
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${13 * scale}px system-ui, sans-serif`;
  ctx.textAlign = 'right';
  ctx.fillText(el.name.toUpperCase(), w - 10 * scale, 22 * scale);
  // Icon in the middle.
  drawElementIcon(ctx, def.element, w / 2, 84 * scale, 46 * scale, el.color);
  // Name.
  ctx.fillStyle = TABLE.ink;
  ctx.font = `bold ${19 * scale}px Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.fillText(def.name, w / 2, 128 * scale);
  // Divider.
  ctx.strokeStyle = el.color;
  ctx.lineWidth = 2 * scale;
  ctx.beginPath();
  ctx.moveTo(18 * scale, 140 * scale);
  ctx.lineTo(w - 18 * scale, 140 * scale);
  ctx.stroke();
  // Effect text.
  ctx.fillStyle = '#3d3428';
  ctx.font = `${14.5 * scale}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  const lines = wrapText(ctx, def.text, w - 20 * scale);
  lines.slice(0, 3).forEach((line, i) => {
    ctx.fillText(line, w / 2, 162 * scale + i * 18 * scale);
  });
  ctx.restore();
}

function drawLifeBar(ctx, x, y, w, life, maxLife, block, label) {
  ctx.save();
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#f4ead2';
  ctx.fillText(label, x, y + 11);
  const barX = x + 64;
  const barW = w - 64;
  roundRect(ctx, barX, y, barW, 22, 11);
  ctx.fillStyle = '#10160f';
  ctx.fill();
  const frac = Math.max(0, life / maxLife);
  if (frac > 0) {
    roundRect(ctx, barX + 2, y + 2, (barW - 4) * frac, 18, 9);
    const grad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
    grad.addColorStop(0, '#ff7a6e');
    grad.addColorStop(1, '#e5484d');
    ctx.fillStyle = grad;
    ctx.fill();
  }
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${life} / ${maxLife}`, barX + barW / 2, y + 12);
  if (block > 0) {
    ctx.fillStyle = '#7fb3ff';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`🛡 ${block}`, barX + barW + 10, y + 12);
  }
  ctx.restore();
}

function drawEmberPips(ctx, x, y, ember, emberMax, label) {
  ctx.save();
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#f4ead2';
  ctx.fillText(label, x, y + 9);
  for (let i = 0; i < emberMax; i += 1) {
    const px = x + 64 + i * 22;
    drawElementIcon(ctx, 'flame', px + 8, y + 10, 15, i < ember ? '#ff9a3d' : '#4a4238');
  }
  ctx.fillStyle = ember > 0 ? '#ffd76a' : '#9aa58f';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillText(`${ember}`, x + 64 + emberMax * 22 + 6, y + 10);
  ctx.restore();
}

function drawPile(ctx, x, y, w, h, count, label) {
  ctx.save();
  roundRect(ctx, x, y, w, h, 8);
  ctx.fillStyle = '#2c3a2b';
  ctx.fill();
  ctx.strokeStyle = TABLE.gold;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#f4ead2';
  ctx.font = 'bold 20px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(count), x + w / 2, y + h / 2 - 10);
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillStyle = '#c9d2bd';
  ctx.fillText(label, x + w / 2, y + h - 16);
  ctx.restore();
}

function drawTable(ctx, world) {
  const g = ctx.createLinearGradient(0, 0, 0, VIEW.height);
  g.addColorStop(0, '#232d22');
  g.addColorStop(0.5, TABLE.felt);
  g.addColorStop(1, '#1a241b');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.strokeStyle = 'rgba(232,193,90,0.18)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(640, 400, 560, 300, 0, 0, Math.PI * 2);
  ctx.stroke();
  // Drifting ember motes.
  for (const p of world.particles) {
    if (p.kind !== 'mote') continue;
    ctx.globalAlpha = Math.max(0, Math.min(0.7, p.life / p.maxLife));
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawRivalArea(ctx, world) {
  const hud = LAYOUT.rivalHud;
  // Portrait.
  ctx.save();
  ctx.beginPath();
  ctx.arc(52, hud.y + 28, 26, 0, Math.PI * 2);
  ctx.fillStyle = '#452a94';
  ctx.fill();
  ctx.strokeStyle = TABLE.gold;
  ctx.lineWidth = 2;
  ctx.stroke();
  drawElementIcon(ctx, 'flame', 52, hud.y + 28, 30, '#ff7a6e');
  ctx.restore();
  ctx.fillStyle = '#f4ead2';
  ctx.font = 'bold 17px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('PYRA', 88, hud.y + 16);
  ctx.fillStyle = '#c9d2bd';
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText('Cinder Rival', 88, hud.y + 38);
  drawLifeBar(ctx, 300, hud.y + 6, 340, world.rival.life, 20, world.rival.block, 'LIFE');
  drawEmberPips(ctx, 720, hud.y + 8, world.rival.ember, world.rival.emberMax, 'EMBER');
  drawPile(ctx, 1150, hud.y + 2, 56, 44, world.rival.deck.drawPile.length, 'DECK');
  ctx.fillStyle = '#c9d2bd';
  ctx.font = '13px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`Turn ${world.turn}`, 1136, hud.y + 30);
  // Rival hand, face up.
  const hand = world.rival.deck.hand;
  const zone = LAYOUT.rivalHand;
  const total = hand.length * (MINI_CARD.width + 10) - 10;
  let x = zone.x + (zone.width - total) / 2;
  hand.forEach((cardId, i) => {
    const wobble = Math.sin((i - hand.length / 2) * 0.5) * 4;
    drawCardFace(ctx, cardId, x, zone.y + wobble, MINI_CARD.width, MINI_CARD.height);
    x += MINI_CARD.width + 10;
  });
  ctx.fillStyle = '#9aa58f';
  ctx.font = '12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText("Pyra's hand — face up, so you can read her plan", 640, zone.y + zone.height - 6);
}

function drawCenter(ctx, world) {
  const center = LAYOUT.center;
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  roundRect(ctx, center.x, center.y, center.width, center.height, 12);
  ctx.fill();
  // Last played card.
  if (world.lastPlayed) {
    const age = world.time - world.lastPlayed.t;
    if (age < 2.2) {
      const pop = Math.min(1, age / 0.18);
      ctx.save();
      ctx.globalAlpha = age > 1.6 ? Math.max(0, 1 - (age - 1.6) / 0.6) : 1;
      const px = LAYOUT.playedCard.x;
      const py = LAYOUT.playedCard.y;
      ctx.translate(px + CARD.width / 2, py + CARD.height / 2);
      ctx.scale(pop, pop);
      ctx.translate(-CARD.width / 2, -CARD.height / 2);
      drawCardFace(ctx, world.lastPlayed.cardId, 0, 0, CARD.width, CARD.height);
      ctx.restore();
      ctx.fillStyle = '#c9d2bd';
      ctx.font = '12px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(world.lastPlayed.by === 'player' ? 'YOU PLAYED' : 'PYRA PLAYED', px + CARD.width / 2, py - 10);
    }
  }
  // Duel log.
  const log = LAYOUT.log;
  ctx.fillStyle = '#f4ead2';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('DUEL LOG', log.x, log.y + 8);
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillStyle = '#d8e0cc';
  world.log.slice(-4).forEach((line, i) => {
    ctx.globalAlpha = 0.55 + (i / 4) * 0.45;
    ctx.fillText(line, log.x, log.y + 34 + i * 24);
  });
  ctx.globalAlpha = 1;
  // Turn hint.
  ctx.fillStyle = '#9aa58f';
  ctx.font = '13px system-ui, sans-serif';
  ctx.textAlign = 'right';
  const hint = world.phase === 'player'
    ? 'Click a card to play it · 1–7 keys play · Space ends your turn'
    : 'Pyra is thinking…';
  ctx.fillText(hint, 1256, center.y + center.height - 12);
}

function drawPlayerArea(ctx, world, ui) {
  const hud = LAYOUT.playerHud;
  drawLifeBar(ctx, 24, hud.y + 6, 300, world.player.life, 20, world.player.block, 'LIFE');
  drawEmberPips(ctx, 430, hud.y + 8, world.player.ember, world.player.emberMax, 'EMBER');
  if (world.player.kindle > 0) {
    ctx.fillStyle = '#ffd76a';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Kindled +${world.player.kindle} on next Flame`, 700, hud.y + 18);
  }
  drawPile(ctx, LAYOUT.deckPile.x, LAYOUT.deckPile.y, LAYOUT.deckPile.width, LAYOUT.deckPile.height, world.player.deck.drawPile.length, 'DECK');
  drawPile(ctx, LAYOUT.discardPile.x, LAYOUT.discardPile.y, LAYOUT.discardPile.width, LAYOUT.discardPile.height, world.player.deck.discardPile.length, 'DISCARD');
  // End turn button.
  const btn = LAYOUT.endTurn;
  const hovering = ui.mouse.x >= btn.x && ui.mouse.x <= btn.x + btn.width && ui.mouse.y >= btn.y && ui.mouse.y <= btn.y + btn.height;
  ctx.save();
  roundRect(ctx, btn.x, btn.y, btn.width, btn.height, 12);
  ctx.fillStyle = world.phase === 'player' ? (hovering ? '#f2c14e' : '#d99a2b') : '#4a4238';
  ctx.fill();
  ctx.strokeStyle = '#241f18';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#241f18';
  ctx.font = 'bold 20px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(world.phase === 'player' ? 'END TURN' : "PYRA'S TURN", btn.x + btn.width / 2, btn.y + btn.height / 2);
  ctx.restore();
  // Player hand, fanned.
  const hand = world.player.deck.hand;
  const zone = LAYOUT.hand;
  const n = hand.length;
  const spacing = n <= 1 ? 0 : Math.min(168, (zone.width - CARD.width) / (n - 1));
  const totalW = CARD.width + spacing * (n - 1);
  const startX = zone.x + (zone.width - totalW) / 2;
  const baseY = zone.y + 8;
  hand.forEach((cardId, i) => {
    const hovered = ui.hoverIndex === i;
    const lift = hovered ? 34 : 0;
    const rot = (i - (n - 1) / 2) * 0.045;
    const cx = startX + i * spacing;
    const cy = baseY - lift + Math.abs(i - (n - 1) / 2) * 4;
    ctx.save();
    ctx.translate(cx + CARD.width / 2, cy + CARD.height / 2);
    ctx.rotate(rot);
    if (hovered) ctx.scale(1.07, 1.07);
    ctx.translate(-CARD.width / 2, -CARD.height / 2);
    const affordable = world.phase === 'player' && CARDS_BY_ID[cardId].cost <= world.player.ember;
    drawCardFace(ctx, cardId, 0, 0, CARD.width, CARD.height);
    if (!affordable) {
      // Dim the card, and say what it needs on a tag above it — never over
      // the card's own text.
      ctx.fillStyle = 'rgba(10,10,12,0.35)';
      roundRect(ctx, 0, 0, CARD.width, CARD.height, CARD.radius);
      ctx.fill();
      const label = `NEEDS ${CARDS_BY_ID[cardId].cost} EMBER`;
      ctx.font = 'bold 12px system-ui, sans-serif';
      const tw = ctx.measureText(label).width + 18;
      ctx.fillStyle = '#d99a2b';
      roundRect(ctx, CARD.width / 2 - tw / 2, -26, tw, 20, 10);
      ctx.fill();
      ctx.fillStyle = '#241f18';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, CARD.width / 2, -15);
    }
    ctx.restore();
  });
  if (n === 0) {
    ctx.fillStyle = '#9aa58f';
    ctx.font = '15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('No cards in hand — end your turn to draw.', 640, baseY + 100);
  }
}

function drawFloaters(ctx, world) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const f of world.floaters) {
    const p = f.t / f.life;
    ctx.globalAlpha = 1 - p;
    ctx.font = `bold ${30 + p * 10}px Georgia, serif`;
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y - p * 70);
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawParticles(ctx, world) {
  for (const p of world.particles) {
    if (p.kind !== 'burst') continue;
    ctx.globalAlpha = Math.max(0, Math.min(1, p.life / p.maxLife));
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawBanner(ctx, world) {
  if (!world.banner || world.time > world.bannerUntil) return;
  const remain = world.bannerUntil - world.time;
  const alpha = Math.min(1, remain / 0.4) * Math.min(1, (1.1 - remain) / 0.2 + 0.2);
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 54px Georgia, serif';
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillText(world.banner, 642, 402);
  ctx.fillStyle = '#f4ead2';
  ctx.fillText(world.banner, 640, 400);
  ctx.restore();
}

function drawTitle(ctx, world) {
  drawTable(ctx, world);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // Ember glow behind the title.
  const glow = ctx.createRadialGradient(640, 250, 10, 640, 250, 420);
  glow.addColorStop(0, 'rgba(229,72,77,0.35)');
  glow.addColorStop(1, 'rgba(229,72,77,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  drawElementIcon(ctx, 'flame', 640, 130, 84, '#ff7a6e');
  ctx.fillStyle = '#f4ead2';
  ctx.font = 'bold 96px Georgia, serif';
  ctx.fillText('EMBER DUEL', 640, 250);
  ctx.fillStyle = TABLE.gold;
  ctx.font = 'italic 26px Georgia, serif';
  ctx.fillText('A duel of four elements. Twenty cards. One rival.', 640, 316);
  // Element legend.
  const names = ['flame', 'stone', 'storm', 'bloom'];
  const labels = ['Flame — damage', 'Stone — block', 'Storm — combos', 'Bloom — heal'];
  names.forEach((el, i) => {
    const x = 640 + (i - 1.5) * 210;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    roundRect(ctx, x - 96, 368, 192, 64, 12);
    ctx.fill();
    drawElementIcon(ctx, el, x - 66, 400, 34, ELEMENTS[el].color);
    ctx.fillStyle = '#f4ead2';
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(labels[i], x - 42, 400);
  });
  ctx.fillStyle = '#d8e0cc';
  ctx.font = '17px system-ui, sans-serif';
  ctx.fillText('Outplay Pyra: spend ember, chain your cards, guard your life.', 640, 480);
  ctx.fillText('First to 0 life loses. Her hand is face up — read it, then answer it.', 640, 510);
  ctx.fillStyle = TABLE.gold;
  ctx.font = 'bold 24px Georgia, serif';
  const pulse = 0.65 + 0.35 * Math.sin(world.time * 3);
  ctx.globalAlpha = pulse;
  ctx.fillText('CLICK OR PRESS ENTER TO BEGIN', 640, 590);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#9aa58f';
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText('An original card game · no network · plays in your browser', 640, 640);
  ctx.restore();
}

function drawEndScreen(ctx, world, won) {
  drawTable(ctx, world);
  ctx.fillStyle = 'rgba(10,12,10,0.72)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  drawParticles(ctx, world);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (won) {
    drawElementIcon(ctx, 'flame', 640, 150, 90, '#ff7a6e');
    ctx.fillStyle = TABLE.gold;
    ctx.font = 'bold 92px Georgia, serif';
    ctx.fillText('VICTORY!', 640, 268);
    ctx.fillStyle = '#f4ead2';
    ctx.font = 'italic 26px Georgia, serif';
    ctx.fillText("Pyra's embers are yours. The table is silent.", 640, 336);
  } else {
    drawElementIcon(ctx, 'stone', 640, 150, 90, '#6e4a0c');
    ctx.fillStyle = '#ff5a4e';
    ctx.font = 'bold 92px Georgia, serif';
    ctx.fillText('DEFEAT', 640, 268);
    ctx.fillStyle = '#f4ead2';
    ctx.font = 'italic 26px Georgia, serif';
    ctx.fillText("Pyra's embers outlasted yours. The table is hers.", 640, 336);
  }
  // Stats.
  const s = world.stats;
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  roundRect(ctx, 390, 390, 500, 120, 14);
  ctx.fill();
  ctx.fillStyle = '#f4ead2';
  ctx.font = 'bold 18px system-ui, sans-serif';
  ctx.fillText(`Turns played      ${s.turns}`, 640, 424);
  ctx.fillText(`Damage dealt      ${s.damageDealt}`, 640, 452);
  ctx.fillText(`Cards played      ${s.cardsPlayed}    ·    Life healed      ${s.healed}`, 640, 480);
  ctx.fillStyle = TABLE.gold;
  ctx.font = 'bold 24px Georgia, serif';
  const pulse = 0.65 + 0.35 * Math.sin(world.time * 3);
  ctx.globalAlpha = pulse;
  ctx.fillText('PRESS R OR CLICK TO PLAY AGAIN', 640, 580);
  ctx.globalAlpha = 1;
  ctx.restore();
}

/** The one entry point: draw the whole frame for the world's screen. */
export function render(ctx, world, ui) {
  ctx.save();
  if (world.shake > 0) {
    ctx.translate((Math.random() - 0.5) * world.shake, (Math.random() - 0.5) * world.shake);
  }
  if (world.screen === SCREEN_TITLE) {
    drawTitle(ctx, world);
  } else if (world.screen === SCREEN_WIN) {
    drawEndScreen(ctx, world, true);
  } else if (world.screen === SCREEN_LOSS) {
    drawEndScreen(ctx, world, false);
  } else {
    drawTable(ctx, world);
    drawRivalArea(ctx, world);
    drawCenter(ctx, world);
    drawPlayerArea(ctx, world, ui);
    drawParticles(ctx, world);
    drawFloaters(ctx, world);
    drawBanner(ctx, world);
  }
  ctx.restore();
}
