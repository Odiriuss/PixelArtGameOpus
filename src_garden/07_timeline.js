
// =================================================================== STATE MACHINE TIMELINE
const S = { IDLE: 0, WALK: 1, LIFT: 2, POUR: 3, SETTLE: 4 };
// [state, t0, t1, x0, x1, bed, final]
const SEGS = [
  [S.IDLE, 0.0, 5.0, STEP_X, STEP_X, -1, 0],
  [S.WALK, 5.0, 8.6, STEP_X, STAND[0], -1, 0],
  [S.LIFT, 8.6, 9.6, STAND[0], STAND[0], 0, 0],
  [S.POUR, 9.6, 13.2, STAND[0], STAND[0], 0, 0],
  [S.SETTLE, 13.2, 16.2, STAND[0], STAND[0], 0, 0],
  [S.WALK, 16.2, 19.7, STAND[0], STAND[1], -1, 0],
  [S.LIFT, 19.7, 20.7, STAND[1], STAND[1], 1, 0],
  [S.POUR, 20.7, 24.3, STAND[1], STAND[1], 1, 0],
  [S.SETTLE, 24.3, 27.3, STAND[1], STAND[1], 1, 0],
  [S.WALK, 27.3, 30.8, STAND[1], STAND[2], -1, 0],
  [S.LIFT, 30.8, 31.8, STAND[2], STAND[2], 2, 0],
  [S.POUR, 31.8, 35.4, STAND[2], STAND[2], 2, 0],
  [S.SETTLE, 35.4, 42.4, STAND[2], STAND[2], 2, 1],
  [S.WALK, 42.4, 53.0, STAND[2], STEP_X, -1, 0],
  [S.IDLE, 53.0, LOOP_S, STEP_X, STEP_X, -1, 0]
];
// facing changes: [time, new facing]
const TURNS = [[1.5, 1], [8.65, -1], [15.9, 1], [19.75, -1], [27.0, 1], [30.85, -1], [36.4, 1], [42.05, -1]];
const AIRCAR_T0 = 36.6, AIRCAR_T1 = 42.2, ROBOT_HAPPY_T = 36.1;
const STRIDE_PX = 18;                // one full walk cycle (two steps)

function pose() {
  return { x: STEP_X, face: -1, state: 0, seg: 0, u: 0, walking: 0, speed: 0, phase: 0, arm: 0, tilt: 0,
           head: 0, hem: 0, scarf: 0, hair: 0, pourX: 0, pouring: 0, bed: -1, gaze: 0, final: 0, turnAge: 9 };
}
function faceAt(t) {
  let f = -1;
  for (let i = 0; i < TURNS.length; i++) if (t >= TURNS[i][0]) f = TURNS[i][1];
  return f;
}
// evaluate every pose parameter at loop time t (no allocation: writes into out)
function evalPose(fr, out) {
  const t = fr / FPS;
  let si = 0;
  while (si < SEGS.length - 1 && t >= SEGS[si][2]) si++;
  const sg = SEGS[si], st = sg[0], u = clamp((t - sg[1]) / (sg[2] - sg[1]), 0, 1), dur = sg[2] - sg[1];
  out.state = st; out.seg = si; out.u = u; out.bed = sg[5]; out.final = sg[6];
  out.face = faceAt(t);
  let age = t + (LOOP_S - TURNS[TURNS.length - 1][0]);           // time since the last turn (wraps)
  for (let k = 0; k < TURNS.length; k++) if (t >= TURNS[k][0]) age = t - TURNS[k][0];
  out.turnAge = age;
  out.walking = 0; out.speed = 0; out.arm = 0; out.tilt = 0; out.head = 0; out.pouring = 0; out.gaze = 0;
  out.x = sg[3];
  let walkDist = 0;
  if (st === S.WALK) {
    const a = 0.14, vmax = 1 / (1 - a), r1 = 1 - u;               // trapezoid velocity profile
    const e = u < a ? 0.5 * vmax * u * u / a : u < 1 - a ? vmax * (u - a / 2) : 1 - 0.5 * vmax * r1 * r1 / a;
    out.x = lerp(sg[3], sg[4], e);
    walkDist = Math.abs(out.x - sg[3]);
    const v = (u < a ? u / a : u > 1 - a ? (1 - u) / a : 1);
    out.walking = 1; out.speed = v * Math.abs(sg[4] - sg[3]) / (dur * (1 - a));
  } else if (st === S.LIFT) {
    out.head = -0.7 * smooth(u / 0.45);
    out.arm = smooth((u - 0.2) / 0.8);
    out.tilt = 0.2 * smooth((u - 0.5) / 0.5);
    out.gaze = 1;
  } else if (st === S.POUR) {
    const sw = 0.5 - 0.5 * Math.cos(TAU * 0.75 * smooth(u * 1.08));
    out.arm = 1 + 0.35 * sw;
    out.tilt = Math.min(0.2 + 0.8 * smooth(u / 0.1), 1 - 0.8 * smooth((u - 0.9) / 0.1));
    out.head = -0.8 - 0.2 * sw;
    out.pouring = out.tilt > 0.55 ? 1 : 0;
    const bx = BEDS[sg[5]].x, near = bx + BED_W - 6, far = bx + 3;
    out.pourX = lerp(near, far, sw);
    out.gaze = 1;
  } else if (st === S.SETTLE) {
    if (!sg[6]) {
      out.arm = 1 - smooth(u / 0.25);
      out.tilt = 0.2 * (1 - smooth(u / 0.12));
      out.head = u < 0.3 ? lerp(-0.8, 0, smooth((u - 0.08) / 0.22))
               : u < 0.8 ? 0.9 * smooth((u - 0.36) / 0.14) : 0.9 * (1 - smooth((u - 0.8) / 0.1));
      out.gaze = (u > 0.35 && u < 0.85) ? 2 : 0;
    } else {
      out.arm = 1 - smooth(u / 0.1);
      out.tilt = 0.2 * (1 - smooth(u / 0.06));
      out.head = u < 0.14 ? lerp(-0.8, 0, smooth(u / 0.1))
               : u < 0.86 ? 0.95 * smooth((u - 0.17) / 0.09) : 0.95 * (1 - smooth((u - 0.86) / 0.06));
      out.gaze = (u > 0.16 && u < 0.9) ? 3 : 0;
    }
  }
  // walk cycle phase from distance travelled (legs together at phase 0)
  out.phase = frac(walkDist / STRIDE_PX);
  // secondary motion: skirt hem, scarf tails, loose hair strands
  const ta = out.turnAge, kick = Math.exp(-ta * 2.6) * Math.cos(ta * 8.5);
  const breeze = 0.5 * osc(12, t, 0) + 0.3 * osc(30, t, 0.2);
  out.hem = out.walking * 0.9 * Math.sin(TAU * out.phase * 2 - 0.9) * Math.min(1, out.speed / 12) - 1.3 * kick + 0.35 * breeze;
  out.scarf = 0.8 * osc(36, t, 0.1) + 0.45 * osc(90, t, 0.4) + out.walking * 0.8 + breeze * 0.5;
  out.hair = 0.7 * osc(45, t, 0.6) + 0.5 * osc(108, t, 0.1) + out.walking * 0.5;
  return out;
}

// =================================================================== CAMERA PATH
// keyframes: [time, mode(0 fixed, 1 follow), x, y]; blended with smootherstep, then circularly smoothed
const CAM_KEYS = [
  [0.0, 0, 160, 0], [4.6, 0, 116, 0], [8.4, 1, 0, 16], [9.9, 0, 0, 12], [13.0, 0, 0, 12],
  [16.2, 1, 0, 16], [19.9, 1, 0, 16], [21.0, 0, 18, 12], [24.2, 0, 18, 12], [27.2, 1, 0, 16],
  [30.9, 1, 0, 16], [32.1, 0, 88, 12], [35.3, 0, 88, 12], [37.0, 0, 160, 8], [42.2, 0, 160, 8],
  [44.8, 1, 0, 16], [47.0, 1, 0, 16], [51.6, 0, 160, 0], [LOOP_S, 0, 160, 0]
];
const camPathX = new Float32Array(LOOP_F), camPathY = new Float32Array(LOOP_F);
const camFaceSm = new Float32Array(LOOP_F);
function buildCameraPath() {
  const tmp = pose();
  const hx = new Float32Array(LOOP_F);
  for (let f = 0; f < LOOP_F; f++) { evalPose(f, tmp); hx[f] = tmp.x; camFaceSm[f] = tmp.face; }
  circularBlur(camFaceSm, 45, 2);
  const follow = (f, axis) => axis ? 16 : hx[f] - lerp(213, 107, (camFaceSm[f] + 1) / 2);
  for (let f = 0; f < LOOP_F; f++) {
    const t = f / FPS;
    let k = 0; while (k < CAM_KEYS.length - 2 && t >= CAM_KEYS[k + 1][0]) k++;
    const A = CAM_KEYS[k], B = CAM_KEYS[k + 1], w = smoother((t - A[0]) / (B[0] - A[0]));
    const ax = A[1] ? follow(f, 0) : A[2], ay = A[1] ? follow(f, 1) : A[3];
    const bx = B[1] ? follow(f, 0) : B[2], by = B[1] ? follow(f, 1) : B[3];
    camPathX[f] = clamp(lerp(ax, bx, w), 0, CAM_MAX_X);
    camPathY[f] = clamp(lerp(ay, by, w), 0, CAM_MAX_Y);
  }
  circularBlur(camPathX, 28, 3); circularBlur(camPathY, 28, 3);
}
function circularBlur(a, r, passes) {
  const n = a.length, tmp = new Float32Array(n);
  for (let p = 0; p < passes; p++) {
    let sum = 0;
    for (let k = -r; k <= r; k++) sum += a[(k + n) % n];
    for (let i = 0; i < n; i++) {
      tmp[i] = sum / (2 * r + 1);
      sum += a[(i + r + 1) % n] - a[(i - r + n) % n];
    }
    a.set(tmp);
  }
}
