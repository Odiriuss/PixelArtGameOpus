// =================================================================== ICONS: EVERY ITEM DRAWN IN A FEW PIXELS, TO FIT ITS CELLS IN THE BAG
// An icon is drawn into a box (x, y, w, h) in the item's own colour with ink outlines; the shapes stretch with the
// box, so the same code draws a 1x1 slot on the paper doll and a 3x2 Thompson in the bag.
function drawIcon(it, x, y, w, h, noCount) {
  const I = ITEMS[it.key], c = I.col, dk = SHD[c], lt = LIT[c];
  const R = (fx, fy, fw, fh, col) => fillRect(Math.round(x + fx * w), Math.round(y + fy * h), Math.max(1, Math.round(fw * w)), Math.max(1, Math.round(fh * h)), col);
  const P = (fx, fy, col) => pset(Math.round(x + fx * w), Math.round(y + fy * h), col);
  const O = (fx, fy, fw, fh, col) => { R(fx, fy, fw, fh, C.INK); R(fx + 1 / w, fy + 1 / h, fw - 2 / w, fh - 2 / h, col); };        // a box with an ink edge
  const disc = (fx, fy, fr, col, edge) => { const cx = x + fx * w, cy = y + fy * h, r = fr * Math.min(w, h); for (let j = -Math.ceil(r); j <= Math.ceil(r); j++) for (let i = -Math.ceil(r); i <= Math.ceil(r); i++) { const d = Math.hypot(i, j); if (d > r) continue; const cc = d > r - 1 && edge !== undefined ? edge : col; if (cc !== T) pset(Math.round(cx + i), Math.round(cy + j), cc); } };
  switch (I.icon) {
    case 'revolver': R(0.3, 0.25, 0.65, 0.2, C.INK); R(0.3, 0.3, 0.6, 0.1, c); O(0.25, 0.2, 0.2, 0.4, dk); R(0.12, 0.45, 0.2, 0.5, C.WOOD); R(0.12, 0.45, 0.06, 0.5, C.INK); P(0.4, 0.6, C.INK); break;
    case 'auto': O(0.2, 0.2, 0.72, 0.3, c); R(0.25, 0.25, 0.6, 0.06, lt); R(0.2, 0.45, 0.22, 0.5, dk); R(0.2, 0.45, 0.06, 0.5, C.INK); P(0.45, 0.62, C.INK); break;
    case 'long': case 'rifle':
      R(0.0, 0.45, 0.35, 0.45, c); R(0.0, 0.45, 0.35, 0.1, C.INK); R(0.3, 0.35, 0.7, 0.2, C.INK); R(0.3, 0.4, 0.66, 0.08, C.S1);
      if (I.icon === 'rifle') { R(0.45, 0.15, 0.25, 0.18, C.INK); P(0.5, 0.25, C.S2); } else R(0.5, 0.55, 0.22, 0.25, c);
      break;
    case 'tommy': R(0.0, 0.35, 0.28, 0.3, c); R(0.25, 0.25, 0.75, 0.2, C.INK); R(0.3, 0.3, 0.62, 0.08, C.S1); disc(0.45, 0.65, 0.3, C.S0, C.INK); R(0.62, 0.45, 0.1, 0.4, c); R(0.8, 0.45, 0.1, 0.35, c); break;
    case 'proto': O(0.1, 0.3, 0.8, 0.35, C.BRASS); for (let k = 0; k < 4; k++) R(0.2 + k * 0.17, 0.25, 0.06, 0.45, C.OX); disc(0.35, 0.47, 0.13, C.CYAN, C.WHITE); R(0.2, 0.62, 0.2, 0.33, C.S0); break;
    case 'sap': R(0.4, 0.05, 0.2, 0.45, C.BRN); disc(0.5, 0.7, 0.3, c, C.BLK); break;
    case 'knuckles': for (let k = 0; k < 4; k++) disc(0.2 + k * 0.2, 0.4, 0.12, T, c); R(0.1, 0.55, 0.8, 0.2, c); R(0.1, 0.55, 0.8, 0.06, lt); break;
    case 'bar': R(0.4, 0.1, 0.2, 0.85, c); R(0.4, 0.1, 0.07, 0.85, lt); R(0.2, 0.02, 0.4, 0.08, c); R(0.55, 0.92, 0.35, 0.06, c); break;
    case 'bat': R(0.38, 0.05, 0.28, 0.55, c); R(0.43, 0.55, 0.16, 0.4, dk); R(0.38, 0.05, 0.06, 0.55, lt); R(0.38, 0.93, 0.26, 0.06, C.INK); break;
    case 'knife': R(0.15, 0.55, 0.45, 0.25, C.INK); R(0.18, 0.6, 0.38, 0.12, C.S0); R(0.55, 0.4, 0.4, 0.15, c); R(0.55, 0.4, 0.4, 0.05, C.WHITE); break;
    case 'bottle': R(0.4, 0.02, 0.2, 0.3, c); R(0.25, 0.3, 0.5, 0.65, c); R(0.25, 0.3, 0.12, 0.65, lt); R(0.3, 0.5, 0.4, 0.2, C.CREAM); if (it.key === 'molotov') R(0.42, 0.0, 0.16, 0.12, C.WHITE); break;
    case 'dynamite': for (let k = 0; k < 3; k++) { R(0.15 + k * 0.25, 0.3, 0.2, 0.65, c); R(0.15 + k * 0.25, 0.3, 0.06, 0.65, lt); } R(0.45, 0.05, 0.08, 0.28, C.CREAM); P(0.5, 0.05, C.HOT); break;
    case 'box': O(0.1, 0.25, 0.8, 0.65, C.CREAM); R(0.12, 0.45, 0.76, 0.2, c); break;
    case 'shells': for (let k = 0; k < 3; k++) { R(0.12 + k * 0.28, 0.15, 0.2, 0.55, c); R(0.12 + k * 0.28, 0.65, 0.2, 0.25, C.BRASS); } break;
    case 'cell': O(0.25, 0.1, 0.5, 0.85, C.S1); R(0.3, 0.3, 0.4, 0.12, C.CYAN); R(0.3, 0.6, 0.4, 0.12, C.CYAN); R(0.4, 0.02, 0.2, 0.1, C.BRASS); break;
    case 'hat': R(0.02, 0.6, 0.96, 0.22, dk); R(0.2, 0.15, 0.6, 0.5, c); R(0.2, 0.45, 0.6, 0.12, C.INK); R(0.3, 0.15, 0.4, 0.08, lt); break;
    case 'cap': R(0.15, 0.3, 0.6, 0.4, c); R(0.55, 0.6, 0.43, 0.15, dk); R(0.15, 0.3, 0.6, 0.08, lt); break;
    case 'coat': case 'jacket': {
      const L = I.icon === 'coat' ? 0.95 : 0.8;
      R(0.2, 0.05, 0.6, L - 0.05, c); R(0.02, 0.1, 0.2, L * 0.7, c); R(0.78, 0.1, 0.2, L * 0.7, c); R(0.47, 0.1, 0.06, L - 0.1, C.INK); R(0.35, 0.05, 0.3, 0.12, dk);
      R(0.2, 0.05, 0.05, L - 0.05, lt); break;
    }
    case 'vest': O(0.15, 0.1, 0.7, 0.8, c); for (let k = 0; k < 3; k++) R(0.2, 0.2 + k * 0.22, 0.6, 0.06, C.S2); break;
    case 'suit': R(0.2, 0.08, 0.6, 0.88, c); R(0.05, 0.12, 0.18, 0.6, c); R(0.77, 0.12, 0.18, 0.6, c); R(0.4, 0.08, 0.2, 0.35, C.CREAM); R(0.46, 0.12, 0.08, 0.3, C.CRIM); R(0.2, 0.08, 0.05, 0.88, lt); break;
    case 'shoes': R(0.05, 0.45, 0.4, 0.35, c); R(0.05, 0.75, 0.42, 0.12, C.INK); R(0.55, 0.45, 0.4, 0.35, c); R(0.55, 0.75, 0.42, 0.12, C.INK); P(0.2, 0.55, lt); P(0.7, 0.55, lt); break;
    case 'gloves': R(0.25, 0.35, 0.5, 0.55, c); for (let k = 0; k < 4; k++) R(0.25 + k * 0.13, 0.12, 0.1, 0.3, c); R(0.1, 0.45, 0.15, 0.2, c); break;
    case 'holster': R(0.05, 0.2, 0.9, 0.15, c); O(0.55, 0.2, 0.3, 0.7, dk); break;
    case 'bandage': disc(0.5, 0.5, 0.38, c, C.S3); disc(0.5, 0.5, 0.12, C.S3); break;
    case 'kit': O(0.1, 0.2, 0.8, 0.7, c); R(0.45, 0.3, 0.1, 0.5, C.RED); R(0.35, 0.47, 0.3, 0.16, C.RED); R(0.4, 0.1, 0.2, 0.12, C.S2); break;
    case 'cup': R(0.25, 0.3, 0.45, 0.6, c); R(0.7, 0.4, 0.15, 0.3, c); R(0.3, 0.3, 0.35, 0.1, C.DBR); break;
    case 'food': R(0.1, 0.35, 0.8, 0.4, C.TAN); R(0.1, 0.48, 0.8, 0.12, C.CRIM); R(0.1, 0.35, 0.8, 0.05, C.BRN); break;
    case 'pack': O(0.25, 0.15, 0.5, 0.75, C.WHITE); disc(0.5, 0.5, 0.16, c); R(0.35, 0.05, 0.1, 0.12, C.CREAM); break;
    case 'picks': R(0.15, 0.2, 0.08, 0.7, c); R(0.4, 0.2, 0.08, 0.7, c); R(0.4, 0.2, 0.3, 0.08, c); R(0.65, 0.3, 0.08, 0.6, c); R(0.65, 0.3, 0.2, 0.08, c); break;
    case 'torch': R(0.35, 0.3, 0.3, 0.65, c); R(0.25, 0.08, 0.5, 0.25, C.S3); R(0.3, 0.1, 0.4, 0.1, C.PALEY); break;
    case 'radio': O(0.08, 0.2, 0.84, 0.7, c); disc(0.3, 0.55, 0.15, C.S1, C.INK); R(0.55, 0.4, 0.3, 0.1, C.CREAM); R(0.8, 0.02, 0.05, 0.2, C.S2); break;
    case 'watch': R(0.4, 0.02, 0.2, 0.96, C.BRN); disc(0.5, 0.5, 0.32, C.CREAM, c); P(0.5, 0.4, C.INK); P(0.55, 0.5, C.INK); break;
    case 'ring': disc(0.5, 0.6, 0.3, T, c); disc(0.5, 0.28, 0.13, it.key === 'ring' ? C.WHITE : c, C.S3); break;
    case 'envelope': O(0.08, 0.25, 0.84, 0.55, c); for (let k = 0; k < 5; k++) { P(0.15 + k * 0.08, 0.3 + k * 0.06, C.S3); P(0.85 - k * 0.08, 0.3 + k * 0.06, C.S3); } if (it.key === 'cash') R(0.3, 0.2, 0.4, 0.1, C.G2); break;
    case 'papers': O(0.1, 0.15, 0.8, 0.7, c); for (let k = 0; k < 3; k++) R(0.2, 0.3 + k * 0.17, 0.55, 0.06, C.S2); break;
    case 'book': O(0.12, 0.08, 0.76, 0.86, c); R(0.12, 0.08, 0.12, 0.86, C.INK); R(0.35, 0.3, 0.4, 0.1, C.BRASS); break;
    case 'photo': O(0.1, 0.15, 0.8, 0.7, C.WHITE); R(0.18, 0.25, 0.64, 0.45, C.S1); disc(0.4, 0.45, 0.1, C.S3); disc(0.62, 0.45, 0.1, C.S3); break;
    case 'key': disc(0.3, 0.5, 0.22, T, c); R(0.45, 0.45, 0.5, 0.12, c); R(0.8, 0.55, 0.08, 0.2, c); R(0.65, 0.55, 0.08, 0.15, c); break;
    default: O(0.15, 0.15, 0.7, 0.7, c);
  }
  if (I.stack && it.n > 1 && !noCount) drawTiny(String(it.n), x + w - tinyWidth(String(it.n)) - 1, y + h - 6, C.CREAM, C.BLK);
}
// an empty slot on the paper doll shows the shape of what goes in it, dark on dark
const GHOST = { hat: 'fedora', coat: 'trench', suit: 'suit', shoes: 'brogues', gloves: 'gloves', belt: 'holster', side: 'service', long: 'pump', melee: 'blackjack', throw: 'dynamite' };
function drawGhost(slot, x, y, w, h) {
  drawIcon({ key: GHOST[slot], n: 1 }, x, y, w, h, true);
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) { const k = j * W + i; if (fb[k] !== C.INK) fb[k] = C.ST0; }
}
// ------------------------------------------------------------------ a 3x5 figure font for counts and slot numbers
const TINY = ['###|#.#|#.#|#.#|###', '.#.|##.|.#.|.#.|###', '##.|..#|.#.|#..|###', '##.|..#|.#.|..#|##.', '#.#|#.#|###|..#|..#',
  '###|#..|##.|..#|##.', '.##|#..|###|#.#|###', '###|..#|.#.|.#.|.#.', '###|#.#|###|#.#|###', '###|#.#|###|..#|##.'].map(g => g.split('|'));
function tinyWidth(s) { return s.length * 4 - 1; }
function drawTiny(s, x, y, c, oc) {
  if (oc !== undefined) fillRect(x - 1, y - 1, tinyWidth(s) + 2, 7, oc);
  for (let k = 0; k < s.length; k++) { const g = TINY[s.charCodeAt(k) - 48]; if (!g) continue; for (let r = 0; r < 5; r++) for (let i = 0; i < 3; i++) if (g[r][i] === '#') pset(x + k * 4 + i, y + r, c); }
}
