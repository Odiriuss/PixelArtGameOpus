
// =================================================================== GARDEN TERRACE (parallax 1.0)
const gardenL = makeLayer(480, 150, F_GARDEN, L.GROUND);
const HOUSE_R = 105;                       // cottage right edge (rounded corner)
const COPING = 118, BED_RIM = 125, BED_SOIL = 123, BED_BASE = 132, WALL_BASE = 124, PATH_TOP = 125, PATH_BOT = 145, FEET = 136;
const BEDS = [{ x: 124, kind: 0 }, { x: 196, kind: 1 }, { x: 266, kind: 2 }];
const BED_W = 28, STAND = [158, 230, 300], STEP_X = 86;
const LAMPS = [{ x: 91, y: 101, porch: 1 }, { x: 172, y: 90, porch: 0 }, { x: 326, y: 90, porch: 0 }];
const PIPE_X = 346;
const CLOCHES = [187, 254, 372, 381, 390];
function slope(x) { return x < 130 ? 0 : Math.min(5, Math.floor((x - 130) / 36)); }
function groundY(x) { return FEET - slope(x); }
const shadowMask = new Uint8Array(480 * 150);   // baked static shadows (so dynamic ones don't double up)

function gset(x, y, c, id) { lset(gardenL, x, y, c, id); }
function gshade(x, y) {
  if (x < 0 || y < 0 || x >= 480 || y >= 150) return;
  const i = y * 480 + x;
  if (gardenL.ids[i] !== L.GROUND || shadowMask[i]) return;
  gardenL.buf[i] = SHD[gardenL.buf[i]]; shadowMask[i] = 1;
}

function buildPath() {
  // flagstones in path space (v = rows below the path top), courses grow toward the camera
  const COURSE = [0, 4, 9, 15, 22, 30];
  for (let x = 0; x < 480; x++) {
    const s = slope(x);
    for (let v = 0; v < 150 - PATH_TOP + 6; v++) {
      const y = PATH_TOP + v - s;
      if (y < 0 || y >= 150) continue;
      let c;
      if (v >= PATH_BOT - PATH_TOP) {                         // lawn edge below the path
        c = (v === PATH_BOT - PATH_TOP) ? C.INK : (hash(x >> 1, v) < 0.25 ? C.F1 : C.F0);
        gset(x, y, c, L.GROUND); continue;
      }
      let k = 0; while (k < 4 && v >= COURSE[k + 1]) k++;
      const cv = v - COURSE[k];
      const off = Math.floor(hash(k, 3) * 11) + k * 7;
      let sx = x + off, id = 0, acc = 0;
      while (true) { const w = 11 + Math.floor(hash(id, k * 31) * 9) + k * 3; if (sx < acc + w) break; acc += w; id++; }
      const inStone = sx - acc;
      const wet = hash(id, k * 7 + 1) < 0.3;
      if (cv === 0 || inStone === 0) c = C.ST0;
      else {
        c = wet ? C.ST0 : C.ST1;
        if (cv === 1 && !wet) c = C.ST2;                                            // lit leading edge
      }
      if (cv === 0 && inStone === 0) c = C.INK;
      gset(x, y, c, L.GROUND);
    }
  }
}
function buildWall() {
  for (let x = HOUSE_R + 1; x < 480; x++) {
    const s = slope(x);
    // coping stone (sunset-lit top) and block face
    gset(x, COPING - s, bay(x, 0) < 0.55 ? C.ST2 : C.SK3, L.WALL);
    gset(x, COPING + 1 - s, C.ST1, L.WALL);
    for (let y = COPING + 2; y <= WALL_BASE; y++) {
      const r = y - COPING - 2, course = r < 3 ? 0 : 1, joint = ((x + course * 5) % 10) === 0;
      let c = (r === 2 || joint) ? C.INK : C.ST0;
      if (!joint && r !== 2 && hash(x >> 1, y) < 0.18) c = C.ST1;
      gset(x, y - s, c, L.WALL);
    }
    // iron railing: top rail, balusters every 4px, posts with finials every 24px
    const rt = COPING - 10 - s;
    gset(x, rt, C.INK, L.WALL);
    if (((x - HOUSE_R) & 3) === 0) for (let y = rt + 1; y < COPING - s; y++) gset(x, y, C.INK, L.WALL);
    if (((x - HOUSE_R) % 24) === 12) {
      for (let y = rt - 2; y < COPING - s; y++) gset(x, y, C.INK, L.WALL);
      gset(x - 1, rt - 1, C.INK, L.WALL); gset(x + 1, rt - 1, C.INK, L.WALL); gset(x, rt - 3, C.INK, L.WALL);
      gset(x + 1, rt - 2, C.SK4, L.WALL);                                         // finial catching the sun
    }
    if (((x - HOUSE_R) & 3) === 2) gset(x, rt + 5, C.INK, L.WALL);               // scroll band
  }
}
function buildCottage() {
  const R = HOUSE_R;
  for (let y = 62; y <= WALL_BASE; y++) for (let x = 0; x <= R; x++) {
    if (y <= 64 && x >= R - 1 && (x - (R - 2)) + (65 - y) > 3) continue;          // rounded parapet corner
    let c = C.ST1;
    const lift = (x - 50) / 47 + (y < 70 ? 0.25 : 0);                               // cool stucco toward the corner
    if (bay(x, y) < lift) c = C.STUS;
    if (x >= 97) {                                                                // rounded corner catching sunset
      const u = (x - 97) / (R - 97);
      c = u < 0.25 ? (bay(x, y) < 0.4 ? C.STUL : C.STUS) : u < 0.8 ? C.STUL : (x === R ? C.RIM : C.CREAM);
    } else if (x < 4) c = C.TRIM;
    else if (y > 119) c = y > 121 ? C.TRIM : (bay(x, y) < 0.5 ? C.TRIM : c);      // ground contact occlusion
    if (y === 62) c = x > 90 ? C.RIM : C.STUL;                                    // parapet cap rim
    else if (y === 66) c = x >= 97 ? C.STUS : C.TRIM;
    gset(x, y, c, L.HOUSE);
  }
  // chrome speed-lines wrapping the corner
  for (let k = 0; k < 3; k++) {
    const y = 70 + k * 3;
    for (let x = 4; x <= R; x++) {
      gset(x, y, x >= 99 ? C.S3 : (x >= 93 ? C.S2 : C.S1), L.HOUSE);
      if (x < 97) gset(x, y + 1, C.TRIM, L.HOUSE);
    }
  }
  // porthole window
  for (let y = 84; y <= 96; y++) for (let x = 10; x <= 22; x++) {
    const d = Math.hypot(x - 16, y - 90);
    if (d > 5.6) continue;
    let c = d > 4.6 ? C.TRIM : d > 3.6 ? ((x > 16 && y < 90) ? C.S3 : C.S1) : (bay(x, y) < 0.5 ? C.SK4 : C.SK3);
    if (d <= 3.6 && x === 15 && y === 88) c = C.GLOW;
    gset(x, y, c, L.HOUSE);
  }
  // venetian-blind window glowing from within
  for (let x = 28; x <= 62; x++) { gset(x, 78, C.STUS, L.HOUSE); gset(x, 79, C.TRIM, L.HOUSE); gset(x, 105, x > 58 ? C.S3 : C.S2, L.HOUSE); }
  for (let y = 80; y <= 104; y++) for (let x = 30; x <= 60; x++) {
    let c;
    if (x === 30 || x === 60 || y === 80 || y === 104) c = C.TRIM;
    else if (x === 38 || x === 52) c = C.SK4;
    else { const r = (y - 81) % 3; c = r === 0 ? C.SK4 : r === 1 ? C.GLOW : (bay(x, y) < 0.6 ? C.HOT : C.GLOW); }
    gset(x, y, c, L.HOUSE);
  }
  // door, canopy, porch steps
  for (let y = 93; y <= WALL_BASE; y++) for (let x = 70; x <= 81; x++) {
    let c = C.TRIM;
    if (x === 70 || x === 81) c = C.INK;
    else if (y === 101 || y === 111) c = C.INK;
    gset(x, y, c, L.HOUSE);
  }
  gset(75, 97, C.GLOW, L.HOUSE); gset(76, 97, C.GLOW, L.HOUSE); gset(75, 98, C.SK4, L.HOUSE); gset(76, 98, C.GLOW, L.HOUSE);
  gset(79, 109, C.S3, L.HOUSE);
  for (let x = 64; x <= 88; x++) { gset(x, 89, C.STUL, L.HOUSE); gset(x, 90, C.TRIM, L.HOUSE); }
  for (let x = 66; x <= 88; x++) { gset(x, 123, C.ST2, L.PROP); gset(x, 124, C.ST1, L.PROP); gset(x, 125, C.INK, L.PROP); }
  for (let x = 62; x <= 92; x++) { gset(x, 126, C.ST2, L.PROP); gset(x, 127, C.ST1, L.PROP); gset(x, 128, C.ST1, L.PROP); gset(x, 129, C.INK, L.PROP); }
  // porch globe lamp on a bracket
  gset(88, 99, C.INK, L.HOUSE); gset(89, 99, C.INK, L.HOUSE); gset(90, 98, C.INK, L.HOUSE);
  // TV antenna + guy wire, vent stack
  for (let y = 33; y < 62; y++) gset(24, y, C.INK, L.HOUSE);
  for (let x = 18; x <= 30; x++) gset(x, 35, C.INK, L.HOUSE);
  for (let x = 19; x <= 29; x += 2) gset(x, 39, C.INK, L.HOUSE);
  for (let x = 20; x <= 28; x++) gset(x, 43, C.INK, L.HOUSE);
  for (let k = 0; k < 20; k++) if (k & 1) gset(24 - Math.round(k * 0.6), 41 + k, C.INK, L.HOUSE);
  gset(25, 35, C.SK4, L.HOUSE);
  for (let y = 55; y < 62; y++) for (let x = 58; x <= 62; x++) gset(x, y, y === 55 ? C.STUL : C.TRIM, L.HOUSE);
}
function drawBedBox(bx, s) {
  const top = BED_RIM - s, base = BED_BASE - s;
  for (let x = bx; x < bx + BED_W; x++) {
    gset(x, top, (x - bx) > BED_W - 7 && bay(x, 0) < 0.6 ? C.S3 : C.S2, L.BED);    // rolled rim
    for (let y = top + 1; y < base; y++) {
      const r = y - top, seam = ((x - bx) % 7) === 0;
      let c = r < 2 ? C.S1 : C.S0;                                                  // darker gunmetal box
      if (seam) c = C.INK;
      if ((r === 1 || r === base - top - 1) && ((x - bx) % 7) === 3) c = C.S2;       // rivets
      if (x === bx || x === bx + BED_W - 1) c = x === bx ? C.INK : C.S1;
      gset(x, y, c, L.BED);
    }
    if (x - bx < 2 || x - bx > BED_W - 3) gset(x, base, C.INK, L.BED);             // feet
  }
}
const MAXB = 40;
const bloomX = new Int16Array(MAXB), bloomY = new Int16Array(MAXB), bloomK = new Uint8Array(MAXB), bloomBed = new Uint8Array(MAXB);
const bloomPerk = new Float32Array(MAXB);
let bloomN = 0;
function addBloom(x, y, k, b) { bloomX[bloomN] = x; bloomY[bloomN] = y; bloomK[bloomN] = k; bloomBed[bloomN] = b; bloomN++; }
function buildPlants(b) {
  const bed = BEDS[b], bx = bed.x, s = slope(bx + 14), soilTop = BED_SOIL - s;
  const leaf = (x, y, lit) => gset(x, y, lit ? C.F2 : (bay(x, y) < 0.3 ? C.F0 : C.F1), L.BED);
  if (bed.kind === 0) {                                  // crimson roses
    for (let k = 0; k < 4; k++) {
      const cx = bx + 4 + k * 7;
      for (let y = soilTop - 6; y < soilTop; y++) for (let x = cx - 3; x <= cx + 3; x++) {
        const dx = (x - cx) / 3.4, dy = (y - (soilTop - 2.5)) / 3.6;
        if (dx * dx + dy * dy < 1 && hash(x, y) > 0.08) leaf(x, y, dx > 0.2 && dy < -0.2);
      }
      addBloom(cx - 1, soilTop - 7, 0, b);
      if (k !== 2) addBloom(cx + 2, soilTop - 5, k === 1 ? 1 : 0, b);
    }
  } else if (bed.kind === 1) {                           // marigolds
    for (let x = bx + 2; x < bx + BED_W - 2; x++) {
      const h = 3 + Math.round(pnoise(x / 3, 64, 5) * 2);
      for (let y = soilTop - h; y < soilTop; y++) leaf(x, y, y === soilTop - h && x & 1);
    }
    for (let k = 0; k < 8; k++) addBloom(bx + 3 + k * 3 + (k & 1), soilTop - 5 - ((k * 5) % 3 === 0 ? 1 : 0), k === 3 ? 3 : 2, b);
  } else {                                               // lavender + cream daisies
    for (let k = 0; k < 6; k++) {
      const x = bx + 2 + k * 2;
      for (let y = soilTop - 5; y < soilTop; y++) gset(x, y, C.F1, L.BED);
      gset(x + 1, soilTop - 1, C.F1, L.BED); gset(x - 1, soilTop - 2, C.F0, L.BED);
      addBloom(x, soilTop - 9 + (k % 3 === 1 ? 1 : 0), 4, b);
    }
    for (let k = 0; k < 5; k++) {
      const x = bx + 16 + k * 2 + (k & 1);
      const h = 4 + (k % 2) * 2;
      for (let y = soilTop - h; y < soilTop; y++) gset(x, y, C.F1, L.BED);
      gset(x - 1, soilTop - 2, C.F2, L.BED);
      addBloom(x, soilTop - h - 1, 5, b);
    }
  }
}
function buildProps() {
  // lamp posts
  for (let i = 1; i < LAMPS.length; i++) {
    const lx = LAMPS[i].x, s = slope(lx), ly = LAMPS[i].y - s;
    for (let y = ly + 3; y <= WALL_BASE - s; y++) gset(lx, y, C.INK, L.PROP);
    gset(lx - 1, WALL_BASE - s, C.INK, L.PROP); gset(lx + 1, WALL_BASE - s, C.INK, L.PROP);
    for (let x = lx - 2; x <= lx + 2; x++) { gset(x, ly - 3, C.INK, L.PROP); gset(x, ly + 3, C.INK, L.PROP); }
    gset(lx, ly - 4, C.INK, L.PROP); gset(lx, ly - 5, C.SK4, L.PROP);
    for (let y = ly - 2; y <= ly + 2; y++) { gset(lx - 2, y, C.INK, L.PROP); gset(lx + 2, y, C.INK, L.PROP); }
  }
  // copper standpipe with a brass pressure gauge and valve wheel
  const px = PIPE_X, s = slope(px);
  for (let y = 102 - s; y <= WALL_BASE - s; y++) { gset(px, y, C.SK4, L.PROP); gset(px + 1, y, C.SK3, L.PROP); gset(px + 2, y, C.SOILM, L.PROP); }
  for (let x = px + 3; x <= px + 5; x++) { gset(x, 116 - s, C.SK3, L.PROP); gset(x, 117 - s, C.SOILM, L.PROP); }
  gset(px + 5, 118 - s, C.SK3, L.PROP);
  for (let a = 0; a < 16; a++) gset(px - 2 + Math.round(2.2 * Math.cos(a / 16 * TAU)), 110 - s + Math.round(2.2 * Math.sin(a / 16 * TAU)), C.S1, L.PROP);
  gset(px - 2, 110 - s, C.MARI, L.PROP); gset(px - 1, 110 - s, C.S1, L.PROP);
  for (let y = -3; y <= 3; y++) for (let x = -3; x <= 3; x++) {
    const d = Math.hypot(x, y);
    if (d > 3.2) continue;
    gset(px + 1 + x, 99 - s + y, d > 2.2 ? (x > 0 && y < 0 ? C.PALEY : C.MARI) : C.CREAM, L.PROP);
  }
  gset(px + 1, 99 - s, C.INK, L.PROP); gset(px + 2, 98 - s, C.INK, L.PROP);
  // glass cloches over seedlings
  for (let i = 0; i < CLOCHES.length; i++) {
    const cx = CLOCHES[i], sc = slope(cx), base = WALL_BASE - sc;
    for (let y = base - 6; y <= base; y++) for (let x = cx - 3; x <= cx + 3; x++) {
      const dx = (x - cx) / 3.5, dy = (y - base) / 6.5, d = dx * dx + dy * dy;
      if (d > 1) continue;
      let c = T;
      if (d > 0.62) c = (x > cx && y < base - 3) ? C.S3 : C.S1;
      else if (y >= base - 2 && hash(x, y) < 0.7) c = y === base - 2 ? C.F3 : C.F2;
      else if (x === cx + 1 && y === base - 4) c = C.HAZE;
      if (c !== T) gset(x, y, c, L.GLASS);
    }
    gset(cx, base - 7, C.S2, L.GLASS);
  }
  // art-deco urn with a clipped shrub at the terrace end
  const ux = 430, us = slope(ux);
  for (let y = 112 - us; y <= WALL_BASE - us; y++) {
    const r = y - (112 - us), hw = r < 2 ? 5 : r < 7 ? 4 - (r > 4 ? 1 : 0) : 2;
    for (let x = ux - hw; x <= ux + hw; x++) gset(x, y, x === ux + hw ? C.ST2 : (r < 2 ? C.ST2 : C.ST1), L.PROP);
  }
  for (let y = 100 - us; y < 112 - us; y++) for (let x = ux - 6; x <= ux + 6; x++) {
    const dx = (x - ux) / 6, dy = (y - (106 - us)) / 6;
    if (dx * dx + dy * dy < 1) gset(x, y, dx > 0.3 && dy < 0 ? C.F2 : (bay(x, y) < 0.4 ? C.F0 : C.F1), L.PROP);
  }
}
// long cool shadows toward the camera, skewed away from the sun (static objects)
const SHADOW_SKEW = -0.35;
function castStatic(x0, x1, len, baseY) {
  for (let r = 0; r < len; r++) {
    const y = baseY + 1 + r, off = Math.round(r * SHADOW_SKEW), taper = r > len - 3 ? 0.5 : 1;
    for (let x = x0 + off; x <= x1 + off; x++) if (taper === 1 || bay(x, y) < taper) gshade(x, y);
  }
}
function buildShadows() {
  for (let x = HOUSE_R + 1; x < 480; x++) {                                   // wall + railing
    const s = slope(x);
    for (let r = 0; r < 7; r++) if (r < 5 || bay(x, WALL_BASE + r) < (r === 5 ? 0.6 : 0.3)) gshade(x, WALL_BASE + 1 + r - s);
  }
  for (let x = 0; x <= HOUSE_R; x++) for (let r = 0; r < 3; r++) if (r < 2 || bay(x, r) < 0.5) gshade(x, WALL_BASE + 1 + r);
  for (let b = 0; b < 3; b++) { const s = slope(BEDS[b].x + 14); castStatic(BEDS[b].x - 1, BEDS[b].x + BED_W - 2, 7, BED_BASE - s); }
  for (let i = 1; i < LAMPS.length; i++) castStatic(LAMPS[i].x, LAMPS[i].x, 16, WALL_BASE - slope(LAMPS[i].x));
  castStatic(PIPE_X, PIPE_X + 2, 11, WALL_BASE - slope(PIPE_X));
  for (let i = 0; i < CLOCHES.length; i++) castStatic(CLOCHES[i] - 2, CLOCHES[i] + 2, 4, WALL_BASE - slope(CLOCHES[i]));
  castStatic(425, 435, 8, WALL_BASE - slope(430));
}
function buildGarden() {
  buildPath(); buildWall(); buildCottage();
  for (let b = 0; b < 3; b++) { drawBedBox(BEDS[b].x, slope(BEDS[b].x + 14)); buildPlants(b); }
  buildProps(); buildShadows();
}
