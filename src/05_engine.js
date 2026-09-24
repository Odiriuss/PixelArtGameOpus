
// =================================================================== ROOMS
const ROOMS = {};                  // id -> room definition (content files register here)
const mb = new Uint8Array(W * H);  // screen material buffer (copied from the room buffer)
const rsrc = new Int32Array(W * H);// screen reflection source (-1 none)
let room = null;                   // current room definition
function defRoom(def) { ROOMS[def.id] = def; return def; }
// hotspot numeric id inside the current build/room (index + 1)
function HS(room, name) {
  for (let i = 0; i < room.hotspots.length; i++) if (room.hotspots[i].id === name) return i + 1;
  throw new Error('no hotspot ' + name + ' in ' + room.id);
}
function buildRoomBuffer(r) {
  if (r.rb) return r.rb;
  const b = r.bounds, zmax = r.zmax || 3;
  const pad = r.pad || 24;
  const x0 = Math.floor(isoX(b[0], b[3])) - pad, x1 = Math.ceil(isoX(b[2], b[1])) + pad;
  const y0 = Math.floor(isoY(b[0], b[1], zmax)) - pad, y1 = Math.ceil(isoY(b[2], b[3], 0)) + pad;
  RB = makeRB(x0, y0, x1, y1);
  curHot = 0; curMat = 0; curBias = 0;
  r.build(RB, (name) => HS(r, name));
  curHot = 0; curMat = 0; curBias = 0;
  bakeRoom(RB, r);
  if (r.postBake) r.postBake(RB, (name) => HS(r, name));
  finishRB(RB);
  r.rb = RB; RB = null;
  buildGrid(r);
  return r.rb;
}

// =================================================================== WALK GRID + A*
const GRID = 0.25;
function buildGrid(r) {
  const b = r.bounds;
  const gw = Math.ceil((b[2] - b[0]) / GRID), gh = Math.ceil((b[3] - b[1]) / GRID);
  const g = new Uint8Array(gw * gh);
  const rad = 0.18;
  for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) {
    const x = b[0] + (i + 0.5) * GRID, y = b[1] + (j + 0.5) * GRID;
    let ok = false;
    for (const w of r.walk) if (x >= w[0] && x <= w[2] && y >= w[1] && y <= w[3]) { ok = true; break; }
    if (ok && r.block) for (const k of r.block) if (x > k[0] - rad && x < k[2] + rad && y > k[1] - rad && y < k[3] + rad) { ok = false; break; }
    g[j * gw + i] = ok ? 1 : 0;
  }
  r.grid = { g, gw, gh, x0: b[0], y0: b[1] };
}
function cellOf(gr, x, y) { return [clamp(Math.floor((x - gr.x0) / GRID), 0, gr.gw - 1), clamp(Math.floor((y - gr.y0) / GRID), 0, gr.gh - 1)]; }
function walkable(gr, x, y) {
  const i = Math.floor((x - gr.x0) / GRID), j = Math.floor((y - gr.y0) / GRID);
  if (i < 0 || j < 0 || i >= gr.gw || j >= gr.gh) return false;
  return gr.g[j * gr.gw + i] === 1;
}
function nearestWalkable(gr, x, y) {
  const c = cellOf(gr, x, y);
  let best = null, bd = 1e9;
  for (let r = 0; r < 40 && !best; r++) {
    for (let j = c[1] - r; j <= c[1] + r; j++) for (let i = c[0] - r; i <= c[0] + r; i++) {
      if (i < 0 || j < 0 || i >= gr.gw || j >= gr.gh || !gr.g[j * gr.gw + i]) continue;
      const cx = gr.x0 + (i + 0.5) * GRID, cy = gr.y0 + (j + 0.5) * GRID, d = (cx - x) ** 2 + (cy - y) ** 2;
      if (d < bd) { bd = d; best = [cx, cy]; }
    }
  }
  return best || [x, y];
}
function losClear(gr, ax, ay, bx, by) {
  const d = Math.hypot(bx - ax, by - ay), n = Math.ceil(d / 0.08);
  for (let k = 1; k < n; k++) { const t = k / n; if (!walkable(gr, lerp(ax, bx, t), lerp(ay, by, t))) return false; }
  return true;
}
function findPath(gr, sx, sy, tx, ty) {
  if (!walkable(gr, tx, ty)) { const n = nearestWalkable(gr, tx, ty); tx = n[0]; ty = n[1]; }
  if (!walkable(gr, sx, sy)) { const n = nearestWalkable(gr, sx, sy); sx = n[0]; sy = n[1]; }
  if (losClear(gr, sx, sy, tx, ty)) return [[tx, ty]];
  const s = cellOf(gr, sx, sy), t = cellOf(gr, tx, ty), gw = gr.gw, N = gw * gr.gh;
  const gs = new Float32Array(N).fill(1e9), from = new Int32Array(N).fill(-1), closed = new Uint8Array(N);
  const open = [s[1] * gw + s[0]]; gs[open[0]] = 0;
  const hfun = (i) => { const x = i % gw, y = (i / gw) | 0, dx = Math.abs(x - t[0]), dy = Math.abs(y - t[1]); return Math.max(dx, dy) + 0.414 * Math.min(dx, dy); };
  const goal = t[1] * gw + t[0];
  let found = false;
  while (open.length) {
    let bi = 0, bf = 1e18;
    for (let k = 0; k < open.length; k++) { const f = gs[open[k]] + hfun(open[k]); if (f < bf) { bf = f; bi = k; } }
    const cur = open[bi]; open[bi] = open[open.length - 1]; open.pop();
    if (cur === goal) { found = true; break; }
    if (closed[cur]) continue; closed[cur] = 1;
    const cx = cur % gw, cy = (cur / gw) | 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const nx = cx + dx, ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= gw || ny >= gr.gh) continue;
      const ni = ny * gw + nx;
      if (!gr.g[ni] || closed[ni]) continue;
      if (dx && dy && (!gr.g[cy * gw + nx] || !gr.g[ny * gw + cx])) continue;
      const ng = gs[cur] + (dx && dy ? 1.414 : 1);
      if (ng < gs[ni]) { gs[ni] = ng; from[ni] = cur; open.push(ni); }
    }
  }
  if (!found) return [];
  const cells = [];
  for (let c = goal; c !== -1; c = from[c]) cells.push(c);
  cells.reverse();
  const pts = cells.map(c => [gr.x0 + (c % gw + 0.5) * GRID, gr.y0 + (((c / gw) | 0) + 0.5) * GRID]);
  pts[pts.length - 1] = [tx, ty];
  // string pulling
  const out = []; let ax = sx, ay = sy, k = 0;
  while (k < pts.length) {
    let far = k;
    for (let m = pts.length - 1; m > k; m--) if (losClear(gr, ax, ay, pts[m][0], pts[m][1])) { far = m; break; }
    out.push(pts[far]); ax = pts[far][0]; ay = pts[far][1]; k = far + 1;
  }
  return out;
}

// =================================================================== ACTORS
// dir: 0 SE (front), 1 SW (front, mirrored), 2 NE (back), 3 NW (back, mirrored)
const DIRS = { SE: 0, SW: 1, NE: 2, NW: 3 };
const actors = [];          // actors present in the current room
function makeActor(id, cast) {
  return { id, cast: CAST[cast || id], x: 0, y: 0, dir: 0, anim: 'idle', af: 0, path: [], speed: 1.55,
           dist: 0, talking: 0, visible: true, hot: 0, name: CAST_DEFS[cast || id].name, color: CAST_DEFS[cast || id].color,
           idleT: 0, pose: null, poseT: 0, onArrive: null, look: null, noShadow: false };
}
const ACT = {};             // all actors by id (persist between rooms)
function actor(id) { return ACT[id]; }
function dirFromVec(vx, vy, cur) {
  const sxv = vx - vy, syv = vx + vy;
  if (Math.abs(sxv) < 1e-4 && Math.abs(syv) < 1e-4) return cur;
  if (syv >= -0.05) return sxv >= 0 ? 0 : 1;
  return sxv >= 0 ? 2 : 3;
}
function faceToward(a, x, y) { a.dir = dirFromVec(x - a.x, y - a.y, a.dir); }
function walkTo(a, x, y, cb) {
  a.path = findPath(room.grid, a.x, a.y, x, y);
  a.onArrive = cb || null;
  if (!a.path.length) { a.anim = 'idle'; if (cb) { a.onArrive = null; cb(false); } }
}
function updateActor(a) {
  if (a.path.length) {
    const p = a.path[0], dx = p[0] - a.x, dy = p[1] - a.y, d = Math.hypot(dx, dy), st = a.speed * DT;
    if (d <= st) { a.x = p[0]; a.y = p[1]; a.path.shift(); a.dist += d; }
    else { a.x += dx / d * st; a.y += dy / d * st; a.dist += st; a.dir = dirFromVec(dx, dy, a.dir); }
    a.anim = 'walk';
    if (!a.path.length) { a.anim = 'idle'; const cb = a.onArrive; a.onArrive = null; if (cb) cb(true); }
  } else if (a.anim === 'walk') a.anim = 'idle';
  if (a.talking > 0) a.talking--;
  if (a.poseT > 0) { a.poseT--; if (!a.poseT) a.pose = null; }
  a.idleT++;
}
function actorFrame(a) {
  if (a.frameFn) return a.frameFn(a);                       // custom animation (the test level's combat poses)
  const set = (a.dir >= 2) ? a.cast.back : a.cast.front;
  if (a.pose && set[a.pose]) { const fr = set[a.pose]; return fr[Math.floor(a.idleT / 10) % fr.length]; }
  if (a.anim === 'walk') return set.walk[Math.floor(a.dist / 0.2) % 6];
  if (a.talking > 0) return set.talk[Math.floor(a.idleT / 7) % 2];
  if (a.anim !== 'idle' && set[a.anim]) return set[a.anim][Math.floor(a.idleT / 10) % set[a.anim].length];
  return set.idle[Math.floor(a.idleT / 50) % 2];
}

// =================================================================== CAMERA
const cam = { x: 0, y: 0, tx: 0, ty: 0, follow: null, fixed: false };
function camTargetFor(x, y) {
  const rb = room.rb;
  let tx = isoX(x, y) - W / 2, ty = isoY(x, y, 0.9) - H / 2 - 4;
  if (room.camY !== undefined) ty = room.camY;
  ty += room.camBias || 0;
  // clamp to room buffer; centre if smaller than the screen
  if (rb.w <= W) tx = rb.ox + (rb.w - W) / 2; else tx = clamp(tx, rb.ox, rb.ox + rb.w - W);
  if (rb.h <= H) ty = rb.oy + (rb.h - H) / 2; else ty = clamp(ty, rb.oy, rb.oy + rb.h - H);
  return [tx, ty];
}
function updateCamera(snap) {
  if (cam.follow && !cam.fixed) { const t = camTargetFor(cam.follow.x, cam.follow.y); cam.tx = t[0]; cam.ty = t[1]; }
  if (snap) { cam.x = cam.tx; cam.y = cam.ty; return; }
  cam.x += (cam.tx - cam.x) * 0.06; cam.y += (cam.ty - cam.y) * 0.06;
}

// =================================================================== RENDER: ROOM + ACTORS
let tick = 0;                                   // global frame counter
function copyRoom(cx, cy) {
  const rb = room.rb, bg = room.bg === undefined ? C.BLK : room.bg;
  fb.fill(bg); zb.fill(-1e9); hb.fill(0); sm.fill(0); mb.fill(0); rsrc.fill(-1);
  for (let py = 0; py < H; py++) {
    const by = py + cy - rb.oy;
    if (by < 0 || by >= rb.h) continue;
    for (let px = 0; px < W; px++) {
      const bx = px + cx - rb.ox;
      if (bx < 0 || bx >= rb.w) continue;
      const i = by * rb.w + bx, c = rb.col[i];
      if (c === T) continue;
      const p = py * W + px;
      let col = c;
      const tg = rb.lgt[i];
      if (tg && lightState[tg]) col = rb.alt[i];
      fb[p] = col; zb[p] = rb.dep[i]; hb[p] = rb.hot[i]; mb[p] = rb.mat[i];
      if (rb.refl) {
        const s = rb.refl[i];
        if (s >= 0) {
          const sy = ((s / rb.w) | 0) + rb.oy - cy, sx = (s % rb.w) + rb.ox - cx;
          if (sx >= 0 && sy >= 0 && sx < W && sy < H) rsrc[p] = sy * W + sx;
        }
      }
    }
  }
}
// colours bright enough to show in a polished floor
const BRIGHT = new Uint8Array(256);
[C.GLOW, C.HOT, C.AMB, C.BRASS, C.PALEY, C.CREAM, C.WHITE, C.RIM, C.CORAL, C.RED, C.NBL, C.CYAN, C.GRNL, C.WL].forEach(c => { BRIGHT[c] = 1; });
// static reflections: sample the frame (room + dynamic room art, before actors)
function applyReflections() {
  const ph = tick >> 3;
  for (let p = 0; p < W * H; p++) {
    const s = rsrc[p];
    if (s < 0) continue;
    const m = mb[p];
    const py = (p / W) | 0, px = p - py * W;
    if (m & MAT_PUDDLE) {
      const jit = ((hashi(py, ph) & 7) === 0) ? ((hashi(py + 7, ph) & 1) ? 1 : -1) : 0;
      const src = fb[clamp(s + jit, 0, W * H - 1)];
      const rc = REFL[src];
      if (rc !== REFL[C.BLK] || bay(px, py) < 0.5) fb[p] = rc;
    } else if (m & MAT_GLOSS) {
      const src = fb[s];
      if (!BRIGHT[src]) continue;
      const dist = (py - ((s / W) | 0)) >> 1;                  // pixels below the mirror line
      if (dist < 26 && bay(px, py) < 0.6 * (1 - dist / 26)) fb[p] = REFL[src];
    }
  }
}
const rowLight = new Float32Array(SPR_H), rowTintV = new Float32Array(SPR_H), rowTintMap = new Array(SPR_H).fill(null);
function drawActor(a, cx, cy) {
  if (!a.visible) return;
  const f = actorFrame(a), flip = (a.dir === 1 || a.dir === 3);
  const sink = a.sink || 0, az = a.z || 0;                  // seated (sprite lowered into the floor) / standing on a stage
  const sx0 = Math.round(isoX(a.x, a.y)) - cx - SPR_AX, sy0 = Math.round(isoY(a.x, a.y, az)) - cy - SPR_BY + sink;
  const depth = a.x + a.y + 0.15;
  // contact shadow
  if (!a.noShadow && !sink) {
    const fx = sx0 + SPR_AX, fy = sy0 + SPR_BY;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -6; dx <= 6; dx++) {
      if ((dx * dx) / 36 + (dy * dy) / 5 > 1) continue;
      const x = fx + dx, y = fy + dy;
      if (x < 0 || y < 0 || x >= W || y >= H) continue;
      const p = y * W + x;
      if (zb[p] > depth + 0.6 || zb[p] < depth - 1.2) continue;
      if (bay(x, y) < 0.75) fb[p] = SHD[fb[p]];
    }
  }
  // per-row lighting (every other row; slats are ~2-3 rows tall on a figure)
  for (let r = 0; r < SPR_H; r++) {
    if ((r & 1) === 0) {
      rowLight[r] = lightLevelAt(room, a.x, a.y, (SPR_BY - r - sink) / ZH + az) + (a.lightBias || 0);
      rowTintMap[r] = spriteTint.map; rowTintV[r] = spriteTint.v;
    } else { rowLight[r] = rowLight[r - 1]; rowTintMap[r] = rowTintMap[r - 1]; rowTintV[r] = rowTintV[r - 1]; }
  }
  for (let r = 0; r < SPR_H; r++) {
    const y = sy0 + r; if (y < 0 || y >= H) continue;
    const L = rowLight[r], tmap = rowTintMap[r], tv = rowTintV[r];
    for (let i = 0; i < SPR_W; i++) {
      const c = f[r * SPR_W + (flip ? SPR_W - 1 - i : i)];
      if (c === T) continue;
      const x = sx0 + i; if (x < 0 || x >= W) continue;
      const p = y * W + x;
      if (depth < zb[p]) { if (a.xray && ((x + y) & 1)) fb[p] = a.xray; continue; }   // silhouette through walls
      let col = c;
      const b = bay(x, y), st = lightSteps(L, b);
      if (st > 0) { col = LIT[col]; if (st > 1) col = LIT[col]; }
      else if (st < 0) { col = SHD[col]; if (st < -1) col = SHD[col]; if (st < -2) col = SHD[col]; }
      if (tmap && b < tv) col = tmap[col];
      fb[p] = col; zb[p] = depth; sm[p] = 1; if (a.hot) hb[p] = a.hot;
    }
  }
  // reflection in puddles / polished floors: per column, only while the reflective surface runs
  // unbroken from the feet (a distant puddle must not show a floating head)
  const fyScreen = sy0 + SPR_BY;
  if (!sink && !az) for (let i = 0; i < SPR_W; i++) {
    const x = sx0 + i; if (x < 0 || x >= W) continue;
    let started = false;
    for (let k = 0; k <= SPR_BY; k++) {
      const y = fyScreen + k + 1; if (y < 0) continue; if (y >= H) break;
      const p = y * W + x, m = mb[p];
      if (sm[p] || !(m & (MAT_PUDDLE | MAT_GLOSS))) { if (started || k > 3) break; continue; }
      started = true;
      const c = f[(SPR_BY - k) * SPR_W + (flip ? SPR_W - 1 - i : i)];
      if (c === T) continue;
      if (m & MAT_GLOSS) { if (bay(x, y) < 0.45 * (1 - k / 18)) fb[p] = REFL[c]; }
      else fb[p] = REFL[c];
    }
  }
}
function drawActors(cx, cy) {
  const list = actors.filter(a => a.visible).sort((p, q) => (p.x + p.y) - (q.x + q.y));
  for (const a of list) drawActor(a, cx, cy);
}
// dynamic stamps (pick-ups, state-dependent props) drawn every frame with a depth test
function drawStampLive(x, y, z, rows, key, hot, cx, cy, flip) {
  const w = rows[0].length, h = rows.length;
  const sx0 = Math.round(isoX(x, y)) - (w >> 1) - cx, sy0 = Math.round(isoY(x, y, z)) - h - cy;
  const d = x + y + 0.05;
  for (let r = 0; r < h; r++) for (let i = 0; i < w; i++) {
    const ch = rows[r][flip ? w - 1 - i : i];
    if (ch === '.' || ch === ' ') continue;
    const c = key[ch]; if (c === undefined) continue;
    const px = sx0 + i, py = sy0 + r;
    if (px < 0 || py < 0 || px >= W || py >= H) continue;
    const p = py * W + px;
    if (d < zb[p]) continue;
    fb[p] = c; zb[p] = d; if (hot) hb[p] = hot;
  }
}
// world point -> screen
function toScreenX(x, y) { return Math.round(isoX(x, y)) - Math.round(cam.x); }
function toScreenY(x, y, z) { return Math.round(isoY(x, y, z)) - Math.round(cam.y); }
// depth-tested pixel for dynamic art
function dpset(px, py, c, d) {
  if (px < 0 || py < 0 || px >= W || py >= H) return;
  const p = py * W + px;
  if (d < zb[p]) return;
  fb[p] = c;
}
