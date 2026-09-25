// =================================================================== SOUND: POSITIONED EFFECTS, ENGINES, TYRES, THE CHASE MUSIC
// All synthesized. Effects fade with distance from the camera and pan with their screen position.
function sfxBus(x, y, gain) {
  if (!AUD.ctx || AUD.muted) return null;
  const d = Math.hypot(x - CAMF.x, y - CAMF.y), v = Math.pow(clamp(1 - d / 70, 0, 1), 1.6) * (gain || 1);
  if (v < 0.02) return null;
  const g = AUD.ctx.createGain(); g.gain.value = v;
  if (AUD.ctx.createStereoPanner) { const p = AUD.ctx.createStereoPanner(); p.pan.value = clamp((isoX(x, y) - isoX(CAMF.x, CAMF.y)) / 220, -0.9, 0.9); g.connect(p); p.connect(AUD.master); }
  else g.connect(AUD.master);
  setTimeout(() => { try { g.disconnect(); } catch (e) { /* already gone */ } }, 3000);
  return g;
}
function sweep(t, f0, f1, dur, type, vol, dest) {
  const o = AUD.ctx.createOscillator(), g = AUD.ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  env(g, t, 0.004, vol, dur); o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.05);
}
function sfxAt(name, x, y, amt) {
  const d = sfxBus(x, y, name === 'crash' ? clamp((amt || 5) / 10, 0.3, 1.3) : 1); if (!d) return;
  const t = AUD.ctx.currentTime + 0.005;
  switch (name) {
    case 'revolver': noiseBurst(t, 0.04, 0.5, 'highpass', 2500, 0.7, d); noiseBurst(t, 0.32, 0.8, 'lowpass', 1300, 0.7, d); tone(80, t, 0.28, 'sine', 0.55, d); break;
    case 'pistol': noiseBurst(t, 0.03, 0.35, 'highpass', 3000, 0.7, d); noiseBurst(t, 0.2, 0.5, 'lowpass', 2000, 0.7, d); tone(120, t, 0.16, 'sine', 0.35, d); break;
    case 'tommy': noiseBurst(t, 0.1, 0.5, 'bandpass', 1300, 0.8, d); tone(105, t, 0.08, 'square', 0.12, d); break;
    case 'ping': tone(1850, t, 0.22, 'sine', 0.12, d); tone(2710, t, 0.16, 'sine', 0.08, d); noiseBurst(t, 0.03, 0.2, 'highpass', 4000, 1, d); break;
    case 'rico': sweep(t, 3200, 900, 0.38, 'sine', 0.1, d); break;
    case 'whiz': { const s = AUD.ctx.createBufferSource(), f = AUD.ctx.createBiquadFilter(), g = AUD.ctx.createGain(); s.buffer = AUD.noise; f.type = 'bandpass'; f.Q.value = 4;
      f.frequency.setValueAtTime(3500, t); f.frequency.exponentialRampToValueAtTime(900, t + 0.14); env(g, t, 0.02, 0.25, 0.12); s.connect(f); f.connect(g); g.connect(d); s.start(t, rnd()); s.stop(t + 0.2); break; }
    case 'boom': noiseBurst(t, 1.4, 1.0, 'lowpass', 500, 0.7, d); tone(42, t, 1.1, 'sine', 0.8, d); noiseBurst(t, 0.2, 0.6, 'bandpass', 1500, 0.5, d); break;
    case 'crash': noiseBurst(t, 0.45, 0.7, 'lowpass', 800, 0.8, d); tone(310, t, 0.3, 'square', 0.06, d); tone(467, t + 0.02, 0.25, 'square', 0.05, d);
      noiseBurst(t + 0.03, 0.35, 0.25, 'highpass', 5000, 0.6, d); break;
    case 'thud': tone(70, t, 0.16, 'sine', 0.45, d); noiseBurst(t, 0.1, 0.35, 'lowpass', 400, 1, d); break;
    case 'kerb': tone(55, t, 0.12, 'sine', 0.3, d); noiseBurst(t, 0.08, 0.2, 'lowpass', 250, 1, d); break;
    case 'horn': { const f = AUD.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1400; f.connect(d);
      tone(349, t, 0.4, 'square', 0.1, f); tone(440, t, 0.4, 'square', 0.08, f); break; }
    case 'bell': for (const u of [0, 0.32, 0.95]) { tone(1318, t + u, 1.1, 'sine', 0.14, d); tone(2637, t + u, 0.5, 'sine', 0.05, d); } break;
    case 'click': noiseBurst(t, 0.02, 0.25, 'highpass', 3000, 1, d); tone(900, t, 0.03, 'square', 0.05, d); break;
    case 'splash': noiseBurst(t, 0.8, 0.6, 'lowpass', 1200, 0.6, d); noiseBurst(t + 0.1, 1.2, 0.3, 'bandpass', 600, 0.5, d); break;
    default: if (typeof sfxExtra === 'function') sfxExtra(name, t, d);            // a level's own sounds
  }
}
// ------------------------------------------------------------------ engines and tyres: continuous voices
const VOICE = { on: false, eng: null, eng2: null, scr: null };
function engineVoice() {
  const ctx = AUD.ctx, g = ctx.createGain(), f = ctx.createBiquadFilter(), o1 = ctx.createOscillator(), o2 = ctx.createOscillator();
  o1.type = 'sawtooth'; o2.type = 'square'; f.type = 'lowpass'; f.frequency.value = 300; f.Q.value = 3; g.gain.value = 0;
  o1.connect(f); o2.connect(f); f.connect(g); g.connect(AUD.master); o1.start(); o2.start();
  return { g, f, o1, o2 };
}
function voicesStart() {
  if (!AUD.ctx || VOICE.on) return;
  VOICE.on = true; VOICE.eng = engineVoice(); VOICE.eng2 = engineVoice();
  const ctx = AUD.ctx, s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = AUD.noise; s.loop = true; f.type = 'bandpass'; f.frequency.value = 1150; f.Q.value = 5; g.gain.value = 0;
  s.connect(f); f.connect(g); g.connect(AUD.master); s.start(); VOICE.scr = { g, f };
}
const GEARS = [0, 5.5, 10.5, 15.5, 99];
function rpmOf(V) {
  const v = Math.abs(vehFwd(V)); let k = 1; while (v > GEARS[k] && k < 4) k++;
  return 0.22 + 0.78 * clamp((v - GEARS[k - 1]) / (GEARS[k] - GEARS[k - 1]), 0, 1) * (k === 4 ? 0.6 : 1) + (V.thr > 0 && v < 1 ? 0.25 : 0);
}
function setEngine(E, V, vol) {
  const t = AUD.ctx.currentTime, r = V ? rpmOf(V) : 0.2, big = V && V.M.mass > 2000 ? 0.75 : 1;
  E.o1.frequency.setTargetAtTime((34 + r * 85) * big, t, 0.05); E.o2.frequency.setTargetAtTime((17 + r * 42) * big, t, 0.05);
  E.f.frequency.setTargetAtTime(160 + r * 520 + (V && V.thr ? 250 : 0), t, 0.08);
  E.g.gain.setTargetAtTime(AUD.muted ? 0 : vol, t, 0.08);
}
function audioTick() {
  if (!AUD.ctx) return;
  voicesStart();
  const P = PLAYER.car && !PLAYER.car.wreck ? PLAYER.car : null;
  setEngine(VOICE.eng, P, P ? 0.07 + (P.thr ? 0.05 : 0) : 0);
  // the loudest other engine nearby (the sedan, usually)
  let O = null, od = 40;
  for (const V of VEH) if (V !== P && !V.gone && !V.wreck && !V.kin && !V.parked && V.driver) { const d = Math.hypot(V.x - CAMF.x, V.y - CAMF.y); if (d < od) { od = d; O = V; } }
  setEngine(VOICE.eng2, O, O ? 0.07 * Math.pow(1 - od / 40, 1.5) : 0);
  let sk = 0; for (const V of VEH) if (V.skid && !V.gone) { const d = Math.hypot(V.x - CAMF.x, V.y - CAMF.y); sk = Math.max(sk, clamp(1 - d / 45, 0, 1) * clamp(vehSpeed(V) / 8, 0, 1)); }
  VOICE.scr.g.gain.setTargetAtTime(AUD.muted ? 0 : sk * 0.09, AUD.ctx.currentTime, 0.05);
  musicTick();
}
// ------------------------------------------------------------------ music: a driving minor riff for the chase, a low pulse for the fight
const MUS = { mode: 'none', next: 0, step: 0, bus: null };
const RIFF = [40, 40, 43, 40, 45, 40, 47, 45, 40, 40, 43, 40, 38, 38, 35, 38];
function setMusic(mode) { if (MUS.mode !== mode) { MUS.mode = mode; MUS.step = 0; if (AUD.ctx) MUS.next = AUD.ctx.currentTime + 0.1; } }
function musicTick() {
  const ctx = AUD.ctx; if (!ctx) return;
  if (!MUS.bus) { MUS.bus = ctx.createGain(); MUS.bus.gain.value = 0.5; MUS.bus.connect(AUD.master); }
  if (MUS.mode === 'none' || AUD.muted) { MUS.next = ctx.currentTime + 0.1; return; }
  const chase = MUS.mode === 'chase', tense = MUS.mode === 'tension', step = chase ? 60 / 152 / 2 : tense ? 60 / 76 / 2 : 60 / 112 / 2;
  while (MUS.next < ctx.currentTime + 0.15) {
    const t = MUS.next, s = MUS.step % 16, bar = Math.floor(MUS.step / 16) % 4, b = MUS.bus;
    if (chase) {
      const n = RIFF[s] + (bar === 2 ? 5 : bar === 3 ? 3 : 0);
      tone(mtof(n), t, step * 0.9, 'sawtooth', 0.09, b); tone(mtof(n - 12), t, step * 0.9, 'triangle', 0.12, b);
      if (s % 8 === 0) { tone(55, t, 0.18, 'sine', 0.35, b); }
      if (s % 8 === 4) noiseBurst(t, 0.12, 0.2, 'bandpass', 1800, 0.7, b);
      noiseBurst(t, 0.03, 0.05, 'highpass', 6000, 0.7, b);
      if (s === 0 && (bar & 1) === 0) for (const k of [0, 3, 7]) tone(mtof(64 + k + (bar === 2 ? 5 : 0)), t, 0.22, 'square', 0.035, b);
      if (s === 14 && bar === 3) for (const k of [0, 4, 7]) tone(mtof(66 + k), t, 0.3, 'square', 0.035, b);
    } else if (tense) {                                    // someone is looking for him: a heartbeat and a held high note
      if (s % 8 === 0) tone(52, t, 0.16, 'sine', 0.3, b);
      if (s % 8 === 1) tone(46, t, 0.14, 'sine', 0.18, b);
      if (s === 0) tone(mtof(33 + (bar & 1)), t, step * 15, 'triangle', 0.05, b);
      if (s === 8 && bar !== 1) tone(mtof(76 + (bar === 3 ? 1 : 0)), t, step * 6, 'sine', 0.018, b);
    } else {
      if (s % 4 === 0) tone(mtof(28 + (bar === 3 ? 1 : 0)), t, step * 3.5, 'sawtooth', 0.07, b);
      if (s === 0 || s === 6 || s === 10) tone(70, t, 0.2, 'sine', 0.3, b);
      if (s === 12 && (bar & 1)) for (const k of [0, 1, 6]) tone(mtof(52 + k), t, 0.5, 'triangle', 0.04, b);
      noiseBurst(t, 0.02, 0.03, 'highpass', 7000, 0.7, b);
    }
    MUS.next += step; MUS.step++;
  }
}
