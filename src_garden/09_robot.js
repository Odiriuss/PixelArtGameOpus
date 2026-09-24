
// =================================================================== COMPANION ROBOT
const RB_W = 18, RB_H = 20, RAX = 7, RAY = 18;
const rbSpr = new Uint8Array(RB_W * RB_H);
const RB_LAG_F = 21, RB_LAG = RB_LAG_F / FPS, RB_GAP = 15, RB_LANE = 5;          // follows her pose 0.35 s late, 15 px behind, 5 px downstage
const rb = { x: STEP_X + RB_GAP, v: 0, face: -1, moving: 0, tread: 0, ex: 0, ey: 0, bounce: 0 };
const rbPose = pose();

function rbp(x, y, c) {
  const sx = x + RAX, sy = y + RAY;
  if (sx < 0 || sy < 0 || sx >= RB_W || sy >= RB_H) return;
  rbSpr[sy * RB_W + sx] = c;
}
function lastWalkDir(t) {
  // direction of the most recent WALK segment that has started (wraps to the final walk home)
  let d = -1;
  for (let i = 0; i < SEGS.length; i++) if (SEGS[i][0] === S.WALK && t >= SEGS[i][1]) d = SEGS[i][4] > SEGS[i][3] ? 1 : -1;
  return d;
}
function robotReset() { rb.x = STEP_X + RB_GAP; rb.v = 0; rb.face = -1; rb.moving = 0; rb.tread = 0; }
// fixed-step follower: trails her delayed state, stops when she stops
function robotUpdate(f, carSx, camX) {
  const t = f / FPS;
  let fd = f - RB_LAG_F; if (fd < 0) fd += LOOP_F;
  const td = fd / FPS;
  evalPose(fd, rbPose);
  const dir = lastWalkDir(td);
  const target = rbPose.x - dir * RB_GAP;
  const err = target - rb.x;
  let want = 0;
  if (Math.abs(err) > 1.2) want = clamp(err * 3.2, -26, 26);
  rb.v += (want - rb.v) * 0.12;
  if (Math.abs(rb.v) < 0.4 && want === 0) rb.v = 0;
  rb.x += rb.v * DT;
  rb.moving = Math.abs(rb.v) > 2 ? 1 : 0;
  if (rb.moving) { rb.face = rb.v > 0 ? 1 : -1; rb.tread += Math.abs(rb.v) * DT; }
  // eye / attention follows whatever she is looking at
  const g = rbPose.gaze;
  if (g === 3 && carSx > -60 && carSx < W + 60) {
    const rsx = rb.x - camX;
    rb.face = carSx > rsx ? 1 : -1; rb.ex = Math.abs(carSx - rsx) > 12 ? 1 : 0; rb.ey = -1;
  } else if (g === 2) { rb.ex = 1; rb.ey = -1; }
  else if (g === 1 && rbPose.bed >= 0) {
    const bc = BEDS[rbPose.bed].x + BED_W / 2;
    if (!rb.moving) rb.face = bc > rb.x ? 1 : -1;
    rb.ex = 1; rb.ey = 0;
  } else if (!rb.moving) { rb.face = rbPose.x > rb.x ? 1 : -1; rb.ex = 1; rb.ey = -1; }
  else { rb.ex = 1; rb.ey = 0; }
  const hb = t - (ROBOT_HAPPY_T + RB_LAG);
  rb.bounce = (hb > 0 && hb < 0.17) || (hb > 0.34 && hb < 0.5) ? 1 : 0;
}
function buildRobot(f) {
  const t = f / FPS;
  rbSpr.fill(T);
  const b = -rb.bounce;
  // treads (hub pixels roll with distance travelled)
  for (let x = -3; x <= 3; x++) { rbp(x, 0, C.INK); rbp(x, -2 + b * 0, C.INK); }
  rbp(-4, -1, C.INK); rbp(4, -1, C.INK);
  const tp = Math.floor(rb.tread / 1.5) % 3;
  for (let x = -3; x <= 3; x++) rbp(x, -1, ((x + 3 + tp) % 3) === 0 ? C.S1 : C.S0);
  // boxy riveted body
  for (let y = -8; y <= -3; y++) for (let x = -3; x <= 3; x++) {
    let c = x >= 1 ? C.S2 : C.S1;
    if (x === -3 || y === -3) c = C.S0;
    if (y === -8) c = C.S2;
    if (x === 0 && y > -8) c = C.S0;                                      // panel seam
    if ((x === -2 || x === 2) && (y === -7 || y === -4)) c = x > 0 ? C.S3 : C.S2;   // rivets
    rbp(x, y + b, c);
  }
  // pincer arms cradling a tray of seedlings
  rbp(4, -5 + b, C.S2); rbp(5, -6 + b, C.S2);
  for (let x = 4; x <= 9; x++) rbp(x, -7 + b, C.S1);
  rbp(4, -6 + b, C.S1); rbp(9, -6 + b, C.S2);
  rbp(5, -8 + b, C.F2); rbp(7, -8 + b, C.F2); rbp(8, -9 + b, C.F3); rbp(6, -9 + b, C.F3); rbp(6, -8 + b, C.F1);
  // neck and domed head
  rbp(0, -9 + b, C.S0); rbp(-1, -9 + b, C.S0);
  for (let x = -2; x <= 2; x++) { rbp(x, -10 + b, x < 0 ? C.S1 : C.S2); rbp(x, -11 + b, x < -1 ? C.S1 : C.S2); }
  for (let x = -1; x <= 1; x++) rbp(x, -12 + b, x > 0 ? C.S3 : C.S2);
  // single round amber lens, turned toward her attention
  const ex = rb.ex, ey = rb.ey;
  rbp(ex, -11 + ey + b, C.GLOW); rbp(ex + 1, -11 + ey + b, C.HOT);
  rbp(ex, -10 + ey + b, C.SK4); rbp(ex + 1, -10 + ey + b, C.GLOW);
  // thin whip antenna with a blinking tip
  const sw = rb.moving ? -1 : (osc(18, t, 0.2) > 0.4 ? 1 : 0);
  rbp(0, -13 + b, C.S1); rbp(0, -14 + b, C.S1); rbp(sw > 0 ? 1 : 0, -15 + b, C.S1); rbp(sw, -16 + b, C.S1);
  rbp(sw, -17 + b, frac(54 * t / LOOP_S) < 0.3 ? C.RED : C.OX);
}
