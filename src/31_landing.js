
// =================================================================== ROOM: THE LANDING (2nd floor hall)
// floor x 0..6.5, y 0..2.6. Right back wall y = 0: office door, Molnar's door. Left wall x = 0: hall window, roof ladder.
const LAND_WALL = papered(C.STS, C.ST1, C.DBR, C.TRIM, C.INK, 0.9, 0.5);
defRoom({
  id: 'landing', name: 'The landing', bounds: [0, 0, 6.5, 2.6], zmax: 3.1, start: [3.3, 1.1, 'SE'],
  ambient: -0.7,
  dark: (x, y, z) => (z > 2.2 ? -0.3 : 0),
  lights: [
    { x: 3.3, y: 1.2, z: 2.6, r: 3.0, k: 1.5 },         // bare bulb
    { x: 0.2, y: 1.4, z: 1.8, r: 1.6, k: 0.5 }          // grey window light
  ],
  occluders: [],
  walk: [[1.55, 0.3, 6.3, 2.45], [0.35, 0.3, 1.6, 1.0]],
  block: [[5.45, 1.75, 5.95, 2.25], [0, 0, 0.5, 0.9]],
  hotspots: [
    { id: 'officedoor', name: 'My office', at: [3.15, 0.55], pos: [3.15, 0], face: 'NE', exitDir: 'up',
      exit: { room: 'office', x: 0.5, y: 3.75, dir: 'SE', sfx: 'door' },
      look: "FRANK CALDER, PRIVATE INVESTIGATIONS. The sign painter charged by the letter. I should have gone by F.C." },
    { id: 'patches', name: 'Wet patches', at: [3.2, 1.75], pos: [3.2, 1.2], face: 'NE',
      look: () => [['say', 'frank', "Two dark patches on the runner, right in front of my door. Somebody stood here in a wet coat and dripped."], ['clue', 'wet_patches']],
      use: () => [['pose', 'frank', 'reach', 0.7, true], ['say', 'frank', "Still damp. Not soaked. They weren't here long, or they weren't standing still."], ['clue', 'wet_patches']] },
    { id: 'molnar', name: "Molnar & Son, Tailors", at: [5.25, 0.55], pos: [5.25, 0], face: 'NE',
      look: "MOLNAR & SON, TAILORS. Shut a month. Old Molnar went to his daughter's in Riverside. The son was never much of a tailor.",
      use: () => [['say', 'frank', "Locked. Dust on the handle. Nobody's been in there since May."]] },
    { id: 'bucket', name: 'Mop bucket', at: [5.15, 1.75], pos: [5.7, 2.0], face: 'SE',
      look: () => [['say', 'frank', "The janitor's bucket. Kovac. He clips his card to the handle so the landlord knows he did it."], ['say', 'frank', "'Landing and stairs mopped, 6:00 A.M. A. Kovac.'"], ['clue', 'mopped_six']],
      use: () => [['say', 'frank', "'Landing and stairs mopped, 6:00 A.M.' The floor's dry now, except by my door."], ['clue', 'mopped_six']] },
    { id: 'ladder', name: 'Roof hatch', at: [0.85, 0.65], pos: [0.1, 0.55], face: 'NW',
      look: () => [['say', 'frank', "Iron ladder up to the roof hatch."], ['say', 'frank', "The bolt's drawn back. And there's rust on the floor under it. Fresh flakes, not swept."], ['clue', 'roof_hatch']],
      use: () => [['say', 'frank', "The roof's the same roof as everyone else on Ferrier Street. You could walk the whole block up there and never touch the pavement."], ['clue', 'roof_hatch']] },
    { id: 'hallwin', name: 'Window', at: [0.75, 0.9], pos: [0, 1.5], face: 'NW',
      look: "The air shaft, and rain coming down it like it's got somewhere to be.", use: () => [['say', 'frank', "Painted shut in 1938. It's a building tradition."]] },
    { id: 'stairs', name: 'Stairs down to Ferrier Street', at: [0.85, 0.75], pos: [0.9, 1.6], face: 'SW', exitDir: 'down',
      exit: { room: 'ferrier', x: 2.2, y: 1.6, dir: 'SE', sfx: 'door', cond: () => flag('took_case'),
              no: () => [['say', 'frank', has('letter') ? "Not until I know what that note wants." : "Not before I know what's in that envelope."]] },
      look: "Twenty-two steps down to the street door. I've counted them going up drunk. It's twenty-four then." }
  ],
  build(rb, h) {
    const Wd = 6.5, D = 2.6, Ht = 3.0;
    setHot(0);
    // floor with a stairwell cut out at the front-left
    const fl = planks(0, C.BRN, C.WOOD, C.DBR, 21);
    rFloor(1.55, 0, Wd, D, 0, fl); rFloor(0, 0, 1.55, 1.0, 0, fl);
    rWallX(0, 0, D, 0, Ht, LAND_WALL); rWallY(0, 0, Wd, 0, Ht, LAND_WALL);
    rFloor(-0.15, 0, 0, D, Ht, flat(C.INK)); rFloor(-0.15, -0.15, Wd, 0, Ht, flat(C.INK));
    rWallX(Wd, -0.15, 0, -0.3, Ht, flat(C.BLK)); rWallY(D, -0.15, 0, -2.0, Ht, flat(C.BLK));
    rWallX(Wd, 0, D, -0.3, 0, flat(C.BLK)); rWallY(D, 1.55, Wd, -0.3, 0, flat(C.BLK));
    // runner
    rFloor(1.6, 0.9, Wd - 0.1, 1.55, 0.004, carpet(1.6, 0.9, Wd - 0.1, 1.55, C.OX, C.PLUM, C.PLUM, C.INK));
    // stairs going down toward the viewer
    setHot(h('stairs'));
    for (let k = 0; k < 8; k++) {
      const y0 = 1.0 + k * 0.2, z = -0.18 * (k + 1);
      rBox(0.1, y0, z - 0.18, 1.5, y0 + 0.2, z, (x, y, px, py) => bay(px, py) < 0.15 ? C.WOOD : C.BRN, flat(C.DBR), flat(C.DBR));
    }
    rWallX(0.1, 1.0, D, -1.8, 0, flat(C.TRIM));
    // banister
    setHot(0);
    rLine3(1.55, 1.0, 0.95, 1.55, 2.6, -0.5, C.WOOD, 1);
    for (let k = 0; k < 5; k++) { const y = 1.05 + k * 0.38; rLine3(1.55, y, 0.95 - (y - 1.0) * 0.9, 1.55, y, 0 - (y - 1.0) * 0.9, C.DBR); }
    rCyl(1.55, 1.0, 0.05, 0, 1.05, (a) => a < 0 ? C.WOOD : C.BRN, () => C.WOOD);
    // office door (right wall)
    setHot(h('officedoor'));
    rWallY(0.004, 2.65, 3.65, 0, 2.2, doorShader(2.65, 3.65, 2.2, C.BRN, C.DBR, C.DBR, C.CREAM, 1.15));
    rDecalY(0.012, 3.15, 1.75, ['ii.ii.i..i.ii', '.............', 'i.ii.ii.i.iii'], { i: C.INK });
    // Molnar's door with a CLOSED card
    setHot(h('molnar'));
    rWallY(0.004, 4.8, 5.7, 0, 2.2, doorShader(4.8, 5.7, 2.2, C.DBR, C.INK, C.INK, C.CRS, 1.15));
    rDecalY(0.012, 5.25, 1.55, ['ooooo', 'orrro', 'ooooo'], { o: C.CREAM, r: C.CRIM });
    // hall window (left wall) and radiator
    setHot(h('hallwin'));
    setMat(MAT_EMIT);
    rWallX(0.003, 1.2, 1.9, 1.0, 2.3, (y, z, px, py) => (Math.abs(y - 1.55) < 0.03 || Math.abs(z - 1.65) < 0.03) ? C.INK : (bay(px, py) < 0.3 ? C.S1 : C.SLT));
    setMat(0);
    rWallX(0.004, 1.12, 1.98, 0.92, 1.0, flat(C.WOOD));
    // roof ladder with the hatch at the top
    setHot(h('ladder'));
    for (const yy of [0.25, 0.75]) rLine3(0.08, yy, 0, 0.08, yy, 3.0, C.S1, 0);
    for (let z = 0.3; z < 3.0; z += 0.3) rLine3(0.08, 0.25, z, 0.08, 0.75, z, C.S0);
    rFloor(-0.1, 0.15, 0.9, 0.85, 3.0, (x, y) => (x < 0.02 || x > 0.78 || y < 0.2 || y > 0.8) ? C.S0 : C.BLK);
    // rust flakes on the floor under the ladder
    rFloor(0.1, 0.3, 0.8, 0.8, 0.003, (x, y, px, py) => hash(px, py) < 0.12 ? C.AMB : T);
    // mop bucket
    setHot(h('bucket'));
    rCyl(5.7, 2.0, 0.2, 0, 0.35, (a) => a < -0.2 ? C.S2 : a > 0.5 ? C.S0 : C.S1, (x, y) => x * x + y * y < 0.02 ? C.SLT : C.S0);
    rLine3(5.75, 2.05, 0.2, 5.5, 1.9, 1.5, C.WOOD);
    rStamp(5.7, 2.18, 0.2, ['ww', 'wi'], { w: C.CREAM, i: C.INK });
    // wet patches (dark blotches on the runner)
    setHot(h('patches'));
    rFloor(2.85, 1.05, 3.55, 1.45, 0.006, (x, y, px, py) => {
      const d1 = Math.hypot((x - 3.0) / 0.13, (y - 1.2) / 0.1), d2 = Math.hypot((x - 3.35) / 0.12, (y - 1.28) / 0.09);
      const d = Math.min(d1, d2);
      return d < 1 + bay(px, py) * 0.4 ? C.PLUM : T;
    });
    // bare bulb on a flex
    setHot(0);
    rLine3(3.3, 1.2, 3.0, 3.3, 1.2, 2.65, C.INK);
    setMat(MAT_EMIT);
    rSphere(3.3, 1.2, 2.58, 0.07, () => C.HOT);
    setMat(0);
  },
  drawBack(cx, cy) {
    // rain down the hall window
    for (let k = 0; k < 10; k++) {
      const y = 1.25 + hash(k, 31) * 0.6, ph = frac(tick * (0.4 + hash(k, 32) * 0.4) / 120 + hash(k, 33));
      const z = 2.25 - ph * 1.2, sx = toScreenX(0.003, y), sy = toScreenY(0.003, y, z);
      if (sx >= 0 && sy >= 0 && sx < W && sy < H && hb[sy * W + sx] === HS(this, 'hallwin')) fb[sy * W + sx] = C.S2;
    }
  },
  onEnter() { setAmbience(0.4, 0.15, 0, 0); return []; }
});
