
// =================================================================== AUDIO (WebAudio synthesis, no samples)
const AUD = { ctx: null, muted: false, master: null, noise: null, rain: null, rainF: null, rainG: null,
              musicG: null, musicF: null, music: null, nextNote: 0, step: 0, timer: 0, loops: {}, want: { rain: 0, rainTone: 1, music: 0, musicTone: 1, song: 0 } };
function audioInit() {
  if (AUD.ctx) { if (AUD.ctx.state === 'suspended') AUD.ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  try { AUD.ctx = new AC(); } catch (e) { AUD.ctx = null; return; }
  const ctx = AUD.ctx;
  AUD.master = ctx.createGain(); AUD.master.gain.value = AUD.muted ? 0 : 0.55; AUD.master.connect(ctx.destination);
  const len = ctx.sampleRate * 2, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  AUD.noise = buf;
  // rain bed
  const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
  AUD.rainF = ctx.createBiquadFilter(); AUD.rainF.type = 'lowpass'; AUD.rainF.frequency.value = 2200;
  const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 300;
  AUD.rainG = ctx.createGain(); AUD.rainG.gain.value = 0;
  src.connect(hp); hp.connect(AUD.rainF); AUD.rainF.connect(AUD.rainG); AUD.rainG.connect(AUD.master); src.start();
  // music bus
  AUD.musicF = ctx.createBiquadFilter(); AUD.musicF.type = 'lowpass'; AUD.musicF.frequency.value = 8000;
  AUD.musicG = ctx.createGain(); AUD.musicG.gain.value = 0;
  AUD.musicF.connect(AUD.musicG); AUD.musicG.connect(AUD.master);
  AUD.timer = setInterval(musicScheduler, 30);
  audioApplyAmbience();
}
function audioApplyMute() { if (AUD.master) AUD.master.gain.setTargetAtTime(AUD.muted ? 0 : 0.55, AUD.ctx.currentTime, 0.05); }
// room ambience: rain level 0..1, rainTone 0 (muffled indoors) .. 1 (outside), music level, music tone
function setAmbience(rain, rainTone, music, musicTone) {
  AUD.want.rain = rain; AUD.want.rainTone = rainTone; AUD.want.music = music; AUD.want.musicTone = musicTone;
  audioApplyAmbience();
}
function audioApplyAmbience() {
  if (!AUD.ctx) return;
  const t = AUD.ctx.currentTime, w = AUD.want;
  AUD.rainG.gain.setTargetAtTime(w.rain * 0.22, t, 0.4);
  AUD.rainF.frequency.setTargetAtTime(400 + w.rainTone * 2600, t, 0.4);
  AUD.musicG.gain.setTargetAtTime(Math.max(w.music, w.song * 0.9) * 0.5, t, 0.6);
  AUD.musicF.frequency.setTargetAtTime(350 + (w.song ? 0.5 : w.musicTone) * 7000, t, 0.6);
}
function env(g, t, a, peak, dec) {
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec);
}
function tone(freq, t, dur, type, vol, dest, detune) {
  const ctx = AUD.ctx, o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type || 'sine'; o.frequency.value = freq; if (detune) o.detune.value = detune;
  env(g, t, 0.005, vol, dur); o.connect(g); g.connect(dest || AUD.master); o.start(t); o.stop(t + dur + 0.05);
  return o;
}
function noiseBurst(t, dur, vol, ftype, freq, q, dest) {
  const ctx = AUD.ctx, s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = AUD.noise; f.type = ftype || 'bandpass'; f.frequency.value = freq || 1000; f.Q.value = q || 1;
  env(g, t, 0.003, vol, dur); s.connect(f); f.connect(g); g.connect(dest || AUD.master);
  s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.05);
}
function sfx(name) {
  if (!AUD.ctx || AUD.muted) return;
  const t = AUD.ctx.currentTime + 0.01;
  switch (name) {
    case 'pick': tone(660, t, 0.12, 'triangle', 0.18); tone(990, t + 0.07, 0.18, 'triangle', 0.14); break;
    case 'note': noiseBurst(t, 0.08, 0.10, 'highpass', 3000, 0.7); noiseBurst(t + 0.09, 0.06, 0.08, 'highpass', 3500, 0.7); break;
    case 'deduce': tone(523, t, 0.5, 'sine', 0.16); tone(622, t + 0.12, 0.6, 'sine', 0.14); tone(784, t + 0.24, 0.9, 'sine', 0.12); break;
    case 'nope': tone(150, t, 0.18, 'triangle', 0.14); break;
    case 'tick': noiseBurst(t, 0.02, 0.12, 'highpass', 2500, 1); break;
    case 'page': noiseBurst(t, 0.22, 0.10, 'bandpass', 1800, 0.6); break;
    case 'door': noiseBurst(t, 0.25, 0.30, 'lowpass', 300, 1); tone(70, t, 0.25, 'sine', 0.25); noiseBurst(t + 0.05, 0.3, 0.05, 'bandpass', 900, 8); break;
    case 'step': noiseBurst(t, 0.04, 0.05, 'bandpass', 700 + Math.random() * 300, 2); break;
    case 'bell': streetcarBell(t); break;
    case 'match': noiseBurst(t, 0.12, 0.25, 'highpass', 2000, 0.8); noiseBurst(t + 0.1, 0.6, 0.08, 'bandpass', 600, 0.5); break;
    case 'burn': for (let i = 0; i < 12; i++) noiseBurst(t + i * 0.09 + Math.random() * 0.05, 0.03, 0.08, 'highpass', 1500, 1); break;
    case 'shot': noiseBurst(t, 0.35, 0.5, 'lowpass', 900, 0.7); tone(55, t, 0.3, 'sine', 0.35); break;
    case 'screech': { const o = AUD.ctx.createOscillator(), g = AUD.ctx.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(900, t); o.frequency.linearRampToValueAtTime(600, t + 0.8);
      const f = AUD.ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1200; f.Q.value = 3; env(g, t, 0.05, 0.08, 0.8); o.connect(f); f.connect(g); g.connect(AUD.master); o.start(t); o.stop(t + 1); break; }
    case 'hum': { const o = AUD.ctx.createOscillator(), g = AUD.ctx.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(180, t); o.frequency.exponentialRampToValueAtTime(1400, t + 4);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + 2); g.gain.exponentialRampToValueAtTime(0.0001, t + 5); o.connect(g); g.connect(AUD.master); o.start(t); o.stop(t + 5.2); break; }
    case 'lift': noiseBurst(t, 0.4, 0.06, 'bandpass', 400, 2); tone(880, t + 0.5, 0.4, 'sine', 0.08); break;
    case 'clunk': tone(90, t, 0.12, 'square', 0.08); noiseBurst(t, 0.06, 0.15, 'lowpass', 500, 1); break;
    case 'coin': tone(1800, t, 0.15, 'triangle', 0.08); tone(2400, t + 0.05, 0.2, 'triangle', 0.06); break;
    case 'crackle': for (let i = 0; i < 20; i++) noiseBurst(t + Math.random() * 1.5, 0.01, 0.05, 'highpass', 4000, 1); break;
  }
}
function streetcarBell(t) {
  const ding = (u) => { tone(1318, u, 1.1, 'sine', 0.12); tone(2637, u, 0.5, 'sine', 0.05); tone(3950, u, 0.25, 'sine', 0.03); };
  ding(t); ding(t + 0.32); ding(t + 0.95);           // twice, then once more slightly out of rhythm
}
// ------------------------------------------------------------------ looping effects (phone ring, engine idle)
function loopStart(name) {
  if (!AUD.ctx || AUD.loops[name]) return;
  const ctx = AUD.ctx, g = ctx.createGain(); g.gain.value = 0; g.connect(AUD.master);
  const L = { g, nodes: [], iv: 0 };
  if (name === 'phone') {
    const ring = () => {
      if (AUD.muted) return;
      const t = ctx.currentTime + 0.02;
      for (let k = 0; k < 2; k++) {
        const tt = t + k * 0.4;
        const o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), lfo = ctx.createOscillator(), lg = ctx.createGain(), gg = ctx.createGain();
        o1.frequency.value = 440; o2.frequency.value = 480; o1.type = o2.type = 'sine';
        lfo.frequency.value = 20; lg.gain.value = 0.5; lfo.connect(lg); lg.connect(gg.gain);
        gg.gain.setValueAtTime(0.0001, tt); gg.gain.linearRampToValueAtTime(0.10, tt + 0.02); gg.gain.setValueAtTime(0.10, tt + 0.35); gg.gain.linearRampToValueAtTime(0.0001, tt + 0.38);
        o1.connect(gg); o2.connect(gg); gg.connect(AUD.master);
        o1.start(tt); o2.start(tt); lfo.start(tt); o1.stop(tt + 0.4); o2.stop(tt + 0.4); lfo.stop(tt + 0.4);
      }
    };
    ring(); L.iv = setInterval(ring, 2600);
  } else if (name === 'engine') {
    const s = ctx.createBufferSource(); s.buffer = AUD.noise; s.loop = true;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 120;
    const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 38;
    const of = ctx.createBiquadFilter(); of.type = 'lowpass'; of.frequency.value = 200;
    const og = ctx.createGain(); og.gain.value = 0.25;
    s.connect(f); f.connect(g); o.connect(of); of.connect(og); og.connect(g);
    s.start(); o.start(); L.nodes.push(s, o);
    g.gain.setTargetAtTime(0.25, ctx.currentTime, 0.3);
  }
  AUD.loops[name] = L;
}
function loopStop(name) {
  const L = AUD.loops[name]; if (!L) return;
  if (L.iv) clearInterval(L.iv);
  const t = AUD.ctx.currentTime;
  L.g.gain.setTargetAtTime(0, t, 0.1);
  for (const n of L.nodes) { try { n.stop(t + 0.5); } catch (e) { /* already stopped */ } }
  delete AUD.loops[name];
}
function loopsStopAll() { for (const k in AUD.loops) loopStop(k); }

// ------------------------------------------------------------------ club jazz: 12-bar minor blues, swung eighths
const BPM = 112, BEAT = 60 / BPM;
const CHORDS = [ // root midi + chord tones (minor blues in C)
  [48, [0, 3, 7, 10]], [48, [0, 3, 7, 10]], [48, [0, 3, 7, 10]], [48, [0, 3, 7, 10]],
  [53, [0, 3, 7, 10]], [53, [0, 3, 7, 10]], [48, [0, 3, 7, 10]], [48, [0, 3, 7, 10]],
  [56, [0, 4, 7, 10]], [55, [0, 4, 7, 10]], [48, [0, 3, 7, 10]], [55, [0, 4, 7, 10]]
];
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
const MELODY = [ // trumpet phrase per bar: [beat offset, midi, length in beats] (sparse, bluesy)
  [[0, 72, 1.5], [2, 75, 0.5], [2.5, 72, 1]], [], [[1, 70, 0.5], [1.5, 72, 2]], [],
  [[0, 77, 1], [1, 75, 0.5], [1.5, 72, 1.5]], [], [[0.5, 75, 0.5], [1, 72, 0.5], [1.5, 70, 2]], [],
  [[0, 80, 1.5], [2, 79, 1]], [[0, 77, 1], [1, 74, 1]], [[0, 72, 3]], []
];
function musicScheduler() {
  if (!AUD.ctx) return;
  const ctx = AUD.ctx;
  if (AUD.want.music <= 0.001 && AUD.want.song <= 0) { AUD.nextNote = ctx.currentTime + 0.1; return; }
  while (AUD.nextNote < ctx.currentTime + 0.15) {
    const s = AUD.step, bar = Math.floor(s / 8) % 12, eighth = s % 8, t = AUD.nextNote;
    const ch = CHORDS[bar];
    const dest = AUD.musicF;
    if (AUD.want.song > 0) songStep(s, t, dest);
    else {
      // walking bass on quarters
      if ((eighth & 1) === 0) {
        const q = eighth >> 1, tones = ch[1];
        let n = ch[0] - 12 + (q === 0 ? 0 : tones[(q + (bar & 1)) % tones.length]);
        if (q === 3) n = CHORDS[(bar + 1) % 12][0] - 12 - 1 + (bar % 3 === 0 ? 2 : 0);
        tone(mtof(n), t, BEAT * 0.9, 'triangle', 0.22, dest);
      }
      // ride cymbal: ding, ding-a
      if ((eighth & 1) === 0 || eighth === 3 || eighth === 7) noiseBurst(t, 0.12, eighth & 1 ? 0.02 : 0.035, 'highpass', 7000, 0.5, dest);
      // comping piano on 2 and the and-of-3
      if (eighth === 2 || eighth === 5) for (const iv of ch[1]) tone(mtof(ch[0] + 12 + iv), t, 0.35, 'sine', 0.035, dest);
      // muted trumpet
      for (const m of MELODY[bar]) if (Math.abs(m[0] * 2 - eighth) < 0.01 || (m[0] * 2 === eighth + 0.5)) trumpet(mtof(m[1]), t, m[2] * BEAT, dest);
    }
    AUD.step++;
    AUD.nextNote += (eighth & 1) ? BEAT / 3 : BEAT * 2 / 3;          // swing
  }
}
function trumpet(freq, t, dur, dest) {
  const ctx = AUD.ctx, o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain(), v = ctx.createOscillator(), vg = ctx.createGain();
  o.type = 'sawtooth'; o.frequency.value = freq; f.type = 'bandpass'; f.frequency.value = freq * 2.2; f.Q.value = 2.5;
  v.frequency.value = 5.5; vg.gain.value = freq * 0.012; v.connect(vg); vg.connect(o.frequency);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.09, t + 0.05); g.gain.setValueAtTime(0.08, t + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(f); f.connect(g); g.connect(dest); o.start(t); v.start(t); o.stop(t + dur + 0.05); v.stop(t + dur + 0.05);
}
// Evelyn's acetate: a slow voice-like melody over piano, with a periodic non-musical pulse underneath
const SONG = [67, 70, 72, 70, 67, 65, 67, -1, 63, 65, 67, 70, 67, -1, 65, 63];
function songStep(s, t, dest) {
  const e = s % 8, bar = Math.floor(s / 8);
  if (e === 0 || e === 4) { const n = SONG[(bar * 2 + (e >> 2)) % SONG.length]; if (n > 0) voice(mtof(n), t, BEAT * 2, dest); }
  if (e === 0) for (const iv of [0, 3, 7]) tone(mtof(51 + iv + ((bar & 1) ? 5 : 0)), t, 1.2, 'sine', 0.03, dest);
  if (s % 11 === 0) { tone(2600, t, 0.03, 'square', 0.03, dest); tone(38, t, 0.08, 'sine', 0.12, dest); }  // the pulse: every 11 eighths, not in time
  if ((s & 3) === 0) noiseBurst(t, 0.3, 0.012, 'highpass', 3000, 0.5, dest);                               // surface crackle
}
function voice(freq, t, dur, dest) {
  const ctx = AUD.ctx, o = ctx.createOscillator(), o2 = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain(), v = ctx.createOscillator(), vg = ctx.createGain();
  o.type = 'triangle'; o2.type = 'sine'; o.frequency.value = freq; o2.frequency.value = freq * 2; f.type = 'lowpass'; f.frequency.value = 1800;
  v.frequency.value = 5; vg.gain.value = freq * 0.015; v.connect(vg); vg.connect(o.frequency);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + 0.15); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(f); o2.connect(f); f.connect(g); g.connect(dest); o.start(t); o2.start(t); v.start(t); o.stop(t + dur); o2.stop(t + dur); v.stop(t + dur);
}
function playSong(on) { AUD.want.song = on ? 1 : 0; AUD.step = 0; if (AUD.ctx) AUD.nextNote = AUD.ctx.currentTime + 0.1; audioApplyAmbience(); }
