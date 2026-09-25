// =================================================================== THE HUD: THE HOUR, THE WALLET, THE WOUNDS, THE GUN, THE LIGHT, THE HEAT, WHO IS LOOKING
function bar(x, y, w, h, f, c, back) {
  fillRect(x - 1, y - 1, w + 2, h + 2, C.BLK); fillRect(x, y, w, h, back === undefined ? C.INK : back);
  const n = Math.round(w * clamp(f, 0, 1)); if (n > 0) fillRect(x, y, n, h, c);
  if (n > 0 && h > 2) hline(x, x + n - 1, y, LIT[c]);
}
function drawBig(s, x, y, c, k) {
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i), bits = glyphBits[code], w = glyphW[code];
    if (bits) for (let r = 0; r < FONT_H; r++) for (let q = 0; q < w; q++) if (bits[r * w + q]) fillRect(x + q * k, y + r * k, k, k, c);
    x += (charW(code) + 1) * k;
  }
}
function bigWidth(s, k) { return textWidth(s) * k; }
function centred(s, y, c, oc) { drawTextOutlined(s, Math.round((W - textWidth(s)) / 2), y, c, oc); }
function panel(x, y, w, h) { remapRect(x, y, w, h, DIM); rectOutline(x - 1, y - 1, w + 2, h + 2, C.INK); }
// ------------------------------------------------------------------ words: toasts, a line of dialogue, the place he has come to
const TOASTS = [], LINES = [], PLACE = { name: '', t: 0, last: '' };
function toast(text) { if (TOASTS.some(t => t.text === text)) return; TOASTS.push({ text, t: 220 }); if (TOASTS.length > 3) TOASTS.shift(); }
function say(who, text, dur) { LINES.push({ who, text, t: 0, dur: dur || Math.max(180, text.length * 4) }); if (LINES.length > 3) LINES.shift(); }
function wordsTick() {
  if (LINES[0] && ++LINES[0].t > LINES[0].dur) LINES.shift();
  for (let i = TOASTS.length - 1; i >= 0; i--) if (--TOASTS[i].t <= 0) TOASTS.splice(i, 1);
  if (PLACE.t > 0) PLACE.t--;
  if (tick % 20 === 0 && FRANK) { const [x, y] = frankPos(), n = FRANK.B && !FRANK.inCar ? FRANK.B.name + (FRANK.F && FRANK.F.f > 0 ? (FRANK.B.enter === 'hotel' ? '  -  7TH FLOOR' : '  -  UPSTAIRS') : '') : placeName(x, y); if (n && n !== PLACE.last) { PLACE.name = n; PLACE.t = 180; } PLACE.last = n; }
}
function drawWords(taken) {
  let y = H - 16;
  const L = LINES[0];
  if (L) {
    const lines = wrapText(L.who.toUpperCase() + ':  ' + L.text, 280);
    y = H - 17 - lines.length * LINE_H;                           // above the light meter's row
    panel(14, y - 3, W - 28, lines.length * LINE_H + 4);
    lines.forEach((l, i) => drawText(l, Math.round((W - textWidth(l)) / 2), y + i * LINE_H, i === 0 ? C.CREAM : C.CRS));
    y -= 6;
  }
  for (let i = TOASTS.length - 1; i >= 0; i--) {                 // newest at the bottom; a long one wraps
    const lines = wrapText(TOASTS[i].text, W - 24);
    y -= lines.length * LINE_H + 2; lines.forEach((l, k) => centred(l, y + k * LINE_H, C.PALEY));
  }
  if (taken && y < H - 16) taken.push([0, y - 1, W, H - y + 1]);
  if (PLACE.t > 0) {
    const w = textWidth(PLACE.name); if (taken) taken.push([(W - w >> 1) - 2, 48, w + 4, 12]);
    if (!(PLACE.t < 30 && (tick & 2))) centred(PLACE.name, 50, C.CREAM);
  }
}
// what the people round him shout, over their heads, each where it doesn't cover anything else
const BARKQ = [];
function drawBarks(taken) {
  BARKQ.sort((a, b) => b.y - a.y);
  for (const b of BARKQ) {
    const w = textWidth(b.text), x = clamp(b.x - (w >> 1), 2, W - w - 2);
    for (const dy of [0, -11, -22, 11, -33, 22]) {
      const y = b.y + dy; if (y < 2 || y > H - 12) continue;
      if (taken.some(r => x - 1 < r[0] + r[2] && x + w + 1 > r[0] && y - 1 < r[1] + r[3] && y + 10 > r[1])) continue;
      taken.push([x - 1, y - 1, w + 2, 11]); drawTextOutlined(b.text, x, y, b.c); break;
    }
  }
  BARKQ.length = 0;
}
// ------------------------------------------------------------------ the minimap: the big map's picture of the city, a window of it round Frank
const MINI = { w: 84, h: 44, x: W - 88, y: 4, ox: 0, oy: 0 };
function miniXY(x, y) { const [bx, by] = bigXY(x, y); return [bx - MINI.ox, by - MINI.oy]; }
// a blip; off the window, work is pinned to its edge so he knows which way to go
function blip(x, y, c, big, pin) {
  let [mx, my] = miniXY(x, y); const k = big ? 1 : 0;
  if (mx < 0 || my < 0 || mx > MINI.w - 1 - k || my > MINI.h - 1 - k) { if (!pin) return; mx = clamp(mx, 0, MINI.w - 1 - k); my = clamp(my, 0, MINI.h - 1 - k); }
  fillRect(MINI.x + mx, MINI.y + my, 1 + k, 1 + k, c);
}
function drawMinimap() {
  const X = MINI.x, Y = MINI.y, M = BIGMAP, [fx, fy] = frankPos(), [bx, by] = bigXY(fx, fy);
  MINI.ox = bx - (MINI.w >> 1); MINI.oy = by - (MINI.h >> 1);
  fillRect(X - 1, Y - 1, MINI.w + 2, MINI.h + 2, C.INK);
  for (let j = 0; j < MINI.h; j++) {
    const sy = MINI.oy + j - M.y; if (sy < 0 || sy >= M.h) continue;
    for (let i = 0; i < MINI.w; i++) { const sx = MINI.ox + i - M.x; if (sx >= 0 && sx < M.w) fb[(Y + j) * W + X + i] = M.img[sy * M.w + sx]; }
  }
  const car = VEH.find(V => V.own && !V.gone); if (car && !FRANK.inCar) blip(car.x, car.y, C.TAN, true);
  for (const V of LAW.cars) if (!V.gone && (LAW.heat || PSTAT.scanner)) blip(V.x, V.y, (tick >> 3) & 1 ? C.RED : C.NBL, true);
  if (PSTAT.scanner) for (const V of VEH) if (V.model === 'police' && !V.gone) blip(V.x, V.y, C.NBL, true);
  for (const p of PEOPLE) if (p.ai && p.alive && p.ai.aware === AW.ALERT && hostile(p)) blip(p.x, p.y, C.CORAL);
  for (const J of JOBS) if (J.state === 'active') { const w = J.where(J); if (w && (tick >> 4) & 1) blip(w.x, w.y, J.ready && J.ready(J) ? C.GRNL : C.PALEY, true, true); }
  const cx = X + (MINI.w >> 1), cy = Y + (MINI.h >> 1);
  pset(cx - 1, cy, C.BLK); pset(cx + 1, cy, C.BLK); pset(cx, cy - 1, C.BLK); pset(cx, cy + 1, C.BLK); pset(cx, cy, C.WHITE);
  if ((tick >> 4) & 1) { pset(cx - 2, cy, C.WHITE); pset(cx + 2, cy, C.WHITE); pset(cx, cy - 2, C.WHITE); pset(cx, cy + 2, C.WHITE); }
}
// ------------------------------------------------------------------ the HUD itself
function drawHud(cx, cy) {
  if (!FRANK) return;
  const taken = [];                                              // what the barks must not cover
  drawAwareness(cx, cy);
  // top left: the hour, the money, the wounds, the gun
  let hw = textWidth(clockText()) + (WEATHER.rain > 0.1 ? 40 : 8), hh = 30;
  drawTextOutlined(clockText(), 4, 3, C.CREAM);
  if (WEATHER.rain > 0.1) drawTextOutlined('RAIN', 4 + textWidth(clockText()) + 6, 3, C.WL);
  drawTextOutlined(money(INV.money), 4, 13, C.GRNL);
  bar(4, 25, 54, 3, FRANK.hp / FRANK.maxHp, FRANK.hp < 30 ? C.RED : C.CREAM, C.OX);
  const g = FRANK.gun, it = PLAYER.slot >= 0 ? INV.quick[PLAYER.slot] : null;
  if (PLAYER.drawn && it) {
    const name = (PLAYER.slot + 1) + ' ' + ITEMS[it.key].name.toUpperCase(); hw = Math.max(hw, textWidth(name) + 8); hh = 58;
    drawTextOutlined(name, 4, 31, C.S3);
    if (g.G.kind === 'gun') {
      const n = Math.min(g.G.mag, 30), pw = n > 12 ? 2 : 4;
      for (let k = 0; k < n; k++) { const x = 5 + k * (pw + 1), full = k < g.ammo && !g.reload; fillRect(x - 1, 42, pw + 1, 5, C.BLK); fillRect(x, 43, pw - 1, 3, full ? C.BRASS : C.ST0); }
      const rs = String(ammoCount(g.G.ammo)); drawTextOutlined(rs, 8 + n * (pw + 1), 40, C.S2);
      if (g.reload) { if ((tick >> 3) & 1) drawTextOutlined('RELOADING', 4, 49, C.PALEY); }
      else if (g.ammo === 0) drawTextOutlined(ammoCount(g.G.ammo) ? 'R TO RELOAD' : 'EMPTY', 4, 49, C.CORAL);
    }
  }
  if (PLAYER.car) {
    const V = PLAYER.car; hw = Math.max(hw, textWidth(V.name) + 8, 62); hh = 84;
    drawTextOutlined(V.name, 4, 58, V.hp < V.maxHp * 0.3 ? C.CORAL : C.S2);
    bar(4, 69, 54, 2, V.hp / V.maxHp, V.hp < V.maxHp * 0.3 ? C.CORAL : C.S2);
    drawTextOutlined(Math.round(Math.abs(vehFwd(V)) * 2.237) + ' MPH', 4, 74, C.S1);
  }
  // top right: the map and the heat
  taken.push([0, 0, hw, hh]);
  drawMinimap();
  const rw = Math.max(MINI.w + 8, LAW.heat ? textWidth(LAW.wanted) + 8 : 0); taken.push([W - rw, 0, rw, LAW.heat ? 70 : MINI.h + 8]);
  if (LAW.heat) for (let k = 0; k < 5; k++) { const x = W - 88 + k * 9, on = k < LAW.heat, c = on ? ((tick >> 4) & 1 && LAW.heat >= 2 ? C.RED : C.NBL) : C.ST0; fillRect(x, 50, 7, 7, C.BLK); fillRect(x + 1, 51, 5, 5, c); if (on) pset(x + 3, 53, C.WHITE); }
  if (LAW.heat) drawTextOutlined(LAW.wanted, W - 4 - textWidth(LAW.wanted), 59, C.NBL);
  // bottom left: the light he stands in
  const L = LIGHTM.v, lx = 4, ly = H - 12;
  fillRect(lx - 1, ly - 1, 11, 7, C.BLK); fillRect(lx, ly, 9, 5, L > 0.55 ? C.PALEY : L > 0.25 ? C.S2 : C.ST0); fillRect(lx + 3, ly + 1, 3, 3, C.BLK);
  bar(lx + 13, ly + 1, 36, 3, L, L > 0.55 ? C.PALEY : L > 0.25 ? C.S3 : C.S1);
  drawTextOutlined(FRANK.crouch ? 'CROUCHED' : PLAYER.run ? 'RUNNING' : '', lx + 53, ly - 3, C.ST2); taken.push([0, ly - 4, 110, H - ly + 4]);
  // the prompt over his head
  if (PLAYER.prompt && FRANK.alive) {
    const [fx, fy] = frankPos(), [sx, hy] = hudAt(fx, fy, (FRANK.inCar ? 0 : FRANK.z) + 2.4, cx, cy), sy = hy - (PLAYER.car ? Math.round(8 * ZOOM.k) : 0), w = textWidth(PLAYER.prompt);
    const px = clamp(sx - (w >> 1), 2, W - w - 2), py = clamp(sy - 10, 64, H - 40); taken.push([px - 1, py - 1, w + 2, 11]);
    drawTextOutlined(PLAYER.prompt, px, py, PLAYER.car ? ((tick >> 3) & 1 ? C.RED : C.PALEY) : C.PALEY);
  }
  if (PLAYER.busy) { const b = PLAYER.busy; centred('PICKING THE LOCK', H - 44, C.PALEY); bar(W / 2 - 30, H - 32, 60, 3, 1 - b.t / b.max, C.PALEY); taken.push([W / 2 - 50, H - 46, 100, 18]); }
  if (CASE.on) { centred('CASING THE JOINT', 4, C.PALEY); taken.push([W / 2 - 50, 3, 100, 11]); }
  drawWords(taken);
  drawBarks(taken);
  if (PLAYER.drawn && !PLAYER.car) drawCrosshair();
}
function drawCrosshair() {
  const x = Math.round(INPUT.mx), y = Math.round(INPUT.my), hot = !!PLAYER.assist, c = hot ? C.RED : C.CREAM;
  for (const [dx, dy] of [[-4, 0], [-3, 0], [3, 0], [4, 0], [0, -4], [0, -3], [0, 3], [0, 4]]) pset(x + dx + 1, y + dy + 1, C.BLK);
  for (const [dx, dy] of [[-4, 0], [-3, 0], [3, 0], [4, 0], [0, -4], [0, -3], [0, 3], [0, 4]]) pset(x + dx, y + dy, c);
  if (hot) pset(x, y, C.RED);
}
// ------------------------------------------------------------------ who is looking: an eye, a question mark, an exclamation mark
const MARKS = {
  eye: ['.xxx.', 'x.x.x', '.xxx.'], q: ['.xxx.', 'x...x', '...x.', '..x..', '.....', '..x..'], ex: ['..x..', '..x..', '..x..', '..x..', '.....', '..x..']
};
function drawMark(m, x, y, c, fill) {
  const rows = MARKS[m], h = rows.length;
  for (let r = 0; r < h; r++) for (let i = 0; i < 5; i++) if (rows[r][i] === 'x') { pset(x + i - 1, y + r, C.BLK); pset(x + i + 1, y + r, C.BLK); pset(x + i, y + r - 1, C.BLK); pset(x + i, y + r + 1, C.BLK); }
  for (let r = 0; r < h; r++) for (let i = 0; i < 5; i++) if (rows[r][i] === 'x') pset(x + i, y + r, fill !== undefined && r / h < 1 - fill ? C.ST2 : c);
}
function drawAwareness(cx, cy) {
  for (const p of PEOPLE) {
    const ai = p.ai; if (!ai || !p.alive || p.down || p === FRANK) continue;
    const shown = personShown(p), [sx, sy] = hudAt(p.x, p.y, p.z + 2.35, cx, cy);
    if (ai.barkT > 0 && shown && sx > -20 && sx < W + 20 && sy > 0 && sy < H + 20) BARKQ.push({ text: ai.bark, x: sx, y: sy - 20, c: p.team === 'law' ? C.NBL : p.team === 'goons' ? C.CORAL : C.CREAM });
    if (!ai.guard || (ai.aware === AW.NONE && ai.sus < 0.05) || !hostileKind(p)) continue;
    const m = ai.aware === AW.ALERT ? 'ex' : ai.aware >= AW.SUS ? 'q' : 'eye', c = ai.aware === AW.ALERT ? C.RED : ai.aware >= AW.SUS ? C.AMB : C.CREAM;
    if (shown && sx >= 4 && sx < W - 4 && sy >= 4 && sy < H - 4) drawMark(m, sx - 2, sy - 8, c, m === 'q' ? ai.sus : undefined);
    else if (ai.aware >= AW.SUS && Math.hypot(p.x - FRANK.x, p.y - FRANK.y) < 40) edgeMark(p.x, p.y, p.z, cx, cy, c);
  }
}
function hostileKind(p) { return p.team === 'goons' || (p.team === 'law' && (LAW.heat > 0 || p.ai.aware >= AW.SUS)); }
function edgeMark(x, y, z, cx, cy, c) {
  const [sx, sy] = toHud(isoX(x, y) - cx, isoY(x, y, z + 1) - cy), mx = W / 2, my = H / 2, dx = sx - mx, dy = sy - my, k = Math.min((W / 2 - 8) / Math.abs(dx || 1e-3), (H / 2 - 8) / Math.abs(dy || 1e-3));
  const ax = Math.round(mx + dx * k), ay = Math.round(my + dy * k);
  fillRect(ax - 3, ay - 3, 7, 7, C.BLK); fillRect(ax - 2, ay - 2, 5, 5, c); pset(ax, ay, C.BLK);
}
// ------------------------------------------------------------------ noise: a ring on the ground where a sound was made, for a moment (drawn into the world)
function drawNoiseRings(cx, cy) {
  for (const n of NOISE.list) {
    const age = tick - n.t; if (age > 24 || Math.hypot(n.x - FRANK.x, n.y - FRANK.y) > 30) continue;
    const r = Math.min(n.r, 12) * (0.4 + age / 40), c = n.r >= 25 ? C.AMB : C.S3, z = FRANK.inCar ? 0 : FRANK.z;
    for (let k = 0; k < 32; k++) { if ((k + (age >> 2)) & 1) continue; const a = k / 32 * TAU, x = Math.round(isoX(n.x + Math.cos(a) * r, n.y + Math.sin(a) * r)) - cx, y = Math.round(isoY(n.x + Math.cos(a) * r, n.y + Math.sin(a) * r, z)) - cy; pset(x, y, c); }
  }
}
