// =================================================================== ZOOM: THE WORLD AT A PIXEL SIZE OF ITS OWN, UNDER A HUD THAT KEEPS ITS OWN
// The HUD is 320x180, scaled up to the window by a whole number (view.scale). The world is drawn into a layer of
// its own, scaled by a whole number of its own (ZOOM.ws): bigger pixels to come in close, smaller ones to see more
// of the city. + and - step it; at the wheel the camera pulls out by itself and comes back when he gets out, and
// each keeps the step it was last left at. A step eases over a third of a second, the only time a world pixel is
// not a whole number of screen pixels. The HUD layer is clear where the world shows through; a remap drawn on it
// (a panel, the pause) darkens the world under it as well (REMAP_DOWN).
const UW = 320, UH = 180;
const ZMIN = 0.6, ZMAX = 2;                                   // how many times the city the normal view shows, across
const UIB = new Uint8Array(UW * UH), WFB = fb;
const ZOOM = { foot: 1, drive: 1.5, ws: 0, from: 0, t: 1, sc: 1, dx: 0, dy: 0, k: 1, ux: 0, uy: 0, last: 0, ease: 0.35 };
// the whole-number world scales this window allows, from the widest view to the closest
function zoomRange() { const s = view.scale; return [Math.max(1, Math.ceil(s / ZMAX)), Math.max(1, Math.floor(s / ZMIN))]; }
function zoomWant() {
  const [a, b] = zoomRange(), z = GAME.mode === 'title' ? 1 : PLAYER.car ? ZOOM.drive : ZOOM.foot;
  return clamp(Math.round(view.scale / z), a, b);
}
// + (d = 1) comes in a step, - (d = -1) pulls out; what it lands on is remembered for walking or for driving
function zoomStep(d) {
  const [a, b] = zoomRange(), ws = clamp((ZOOM.ws || zoomWant()) + d, a, b), z = view.scale / ws;
  if (PLAYER.car) ZOOM.drive = z; else ZOOM.foot = z;
}
function zoomSnap() { ZOOM.ws = 0; ZOOM.t = 1; zoomFrame(); }         // no easing: a new window size, a test
// once a frame, before anything is drawn: the scale shown, the world view it needs, where it lands on the HUD
function zoomFrame() {
  const now = performance.now(), dt = Math.min(0.1, (now - ZOOM.last) / 1000); ZOOM.last = now;
  const want = zoomWant();
  if (!ZOOM.ws) ZOOM.ws = ZOOM.from = ZOOM.sc = want;
  if (want !== ZOOM.ws) { ZOOM.from = ZOOM.sc; ZOOM.ws = want; ZOOM.t = 0; }
  if (ZOOM.t < 1) ZOOM.t = Math.min(1, ZOOM.t + dt / ZOOM.ease);
  const sc = ZOOM.sc = ZOOM.t < 1 ? lerp(ZOOM.from, ZOOM.ws, smooth(ZOOM.t)) : ZOOM.ws, s = view.scale;
  VW = Math.min(WMAX_W, Math.ceil(UW * s / sc)); VH = Math.min(WMAX_H, Math.ceil(UH * s / sc));
  ZOOM.dx = (UW * s - VW * sc) / 2; ZOOM.dy = (UH * s - VH * sc) / 2;             // screen pixels from the HUD's corner
  if (ZOOM.t >= 1) { ZOOM.dx = Math.round(ZOOM.dx); ZOOM.dy = Math.round(ZOOM.dy); }
  ZOOM.k = sc / s; ZOOM.ux = ZOOM.dx / s; ZOOM.uy = ZOOM.dy / s;
}
// world layer pixels <-> HUD pixels (the mouse is in HUD pixels)
function toHud(wx, wy) { return [ZOOM.ux + wx * ZOOM.k, ZOOM.uy + wy * ZOOM.k]; }
function fromHud(ux, uy) { return [(ux - ZOOM.ux) / ZOOM.k, (uy - ZOOM.uy) / ZOOM.k]; }
function hudAt(x, y, z, cx, cy) { return [Math.round(ZOOM.ux + (isoX(x, y) - cx) * ZOOM.k), Math.round(ZOOM.uy + (isoY(x, y, z) - cy) * ZOOM.k)]; }
// ------------------------------------------------------------------ the two layers
function worldLayer() { REMAP_DOWN = null; fb = WFB; W = VW; H = VH; }
function hudLayer() { fb = UIB; W = UW; H = UH; UIB.fill(T); REMAP_DOWN = remapDown; }
// a remap on the HUD reaches the world pixels whose centres it covers
function remapDown(x, y, w, h, map, k) {
  const x0 = Math.ceil((x - ZOOM.ux) / ZOOM.k - 0.5), x1 = Math.ceil((x + w - ZOOM.ux) / ZOOM.k - 0.5);
  const y0 = Math.ceil((y - ZOOM.uy) / ZOOM.k - 0.5), y1 = Math.ceil((y + h - ZOOM.uy) / ZOOM.k - 0.5);
  worldLayer();
  if (k >= 1) remapRect(x0, y0, x1 - x0, y1 - y0, map); else ditherRect(x0, y0, x1 - x0, y1 - y0, map, k);
  fb = UIB; W = UW; H = UH; REMAP_DOWN = remapDown;
}
// ------------------------------------------------------------------ onto the screen: the world, clipped to the HUD's box, then the HUD
const WOFF = document.createElement('canvas'); WOFF.width = WMAX_W; WOFF.height = WMAX_H;
const WCTX = WOFF.getContext('2d'), WIMG = WCTX.createImageData(WMAX_W, WMAX_H), WPX = new Uint32Array(WIMG.data.buffer);
const UOFF = document.createElement('canvas'); UOFF.width = UW; UOFF.height = UH;
const UCTX = UOFF.getContext('2d'), UIMG = UCTX.createImageData(UW, UH), UPX = new Uint32Array(UIMG.data.buffer);
function present() {
  for (let y = 0; y < VH; y++) for (let i = y * VW, e = i + VW, o = y * WMAX_W; i < e; i++, o++) WPX[o] = PAL32[WFB[i]];
  WCTX.putImageData(WIMG, 0, 0, 0, 0, VW, VH);
  for (let i = 0; i < UW * UH; i++) { const c = UIB[i]; UPX[i] = c === T ? 0 : PAL32[c]; }
  UCTX.putImageData(UIMG, 0, 0);
  const s = view.scale, bx = view.ox, by = view.oy, bw = UW * s, bh = UH * s;
  sctx.fillStyle = '#000'; sctx.fillRect(0, 0, screen.width, screen.height); sctx.imageSmoothingEnabled = false;
  sctx.save(); sctx.beginPath(); sctx.rect(bx, by, bw, bh); sctx.clip();
  sctx.drawImage(WOFF, 0, 0, VW, VH, bx + ZOOM.dx, by + ZOOM.dy, VW * ZOOM.sc, VH * ZOOM.sc);
  sctx.restore();
  sctx.drawImage(UOFF, 0, 0, UW, UH, bx, by, bw, bh);
}
