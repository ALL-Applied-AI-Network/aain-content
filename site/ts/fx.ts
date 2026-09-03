/**
 * fx.ts — the site's visual effects. All opt-in via data attributes, all off for prefers-reduced-motion.
 *
 *   <canvas data-aurora>             a slow WebGL flow field in the brand palette (one fixed canvas can back the whole page)
 *   <img data-liquid src="…">        the image is re-drawn through a displacement shader that answers the cursor
 *   <article data-tilt>              a restrained 3D tilt + glare on hover
 *   <canvas data-flood>              résumé sheets that fall and pile up as the section scrolls in, driving a counter
 *   <nav data-rail> + [data-rail=…]  a scroll rail down the left edge whose line fills as you read
 */

const REDUCED = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const TOUCH = typeof matchMedia === "function" && matchMedia("(hover: none)").matches;

/* ────────────────────────────── shared GL helpers ────────────────────────────── */
const VERT = `attribute vec2 p; varying vec2 v; void main(){ v = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }`;
const NOISE = `
vec3 mod289(vec3 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
vec2 mod289(vec2 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
vec3 permute(vec3 x){ return mod289(((x*34.0)+1.0)*x); }
float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy)); vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz; x12.xy -= i1; i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0); m = m*m; m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0; vec3 h = abs(x) - 0.5; vec3 ox = floor(x + 0.5); vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g; g.x = a0.x * x0.x + h.x * x0.y; g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
float fbm(vec2 p){ float s = 0.0, a = 0.5; for(int i = 0; i < 4; i++){ s += a * snoise(p); p = p * 2.03 + 17.1; a *= 0.5; } return s; }`;

function makeProgram(gl: WebGLRenderingContext, frag: string): WebGLProgram | null {
  const compile = (type: number, src: string) => {
    const sh = gl.createShader(type)!; gl.shaderSource(sh, src); gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) { console.warn("fx shader:", gl.getShaderInfoLog(sh)); return null; }
    return sh;
  };
  const vs = compile(gl.VERTEX_SHADER, VERT), fs = compile(gl.FRAGMENT_SHADER, frag);
  if (!vs || !fs) return null;
  const prog = gl.createProgram()!; gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { console.warn("fx link:", gl.getProgramInfoLog(prog)); return null; }
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  return prog;
}

/** Runs `draw(t)` only while `el` is on screen and the tab is visible. `always` skips the visibility gate (fixed canvases). */
function loopWhileVisible(el: Element, draw: (t: number) => void, fps = 30, always = false) {
  let on = false, raf = 0, last = 0; const step = 1000 / fps;
  const tick = (now: number) => { if (!on) return; if (now - last >= step) { last = now; draw(now / 1000); } raf = requestAnimationFrame(tick); };
  const start = () => { if (on) return; on = true; raf = requestAnimationFrame(tick); };
  const stop = () => { on = false; cancelAnimationFrame(raf); };
  if (!always && "IntersectionObserver" in window) new IntersectionObserver(es => es.forEach(e => (e.isIntersecting ? start() : stop())), { rootMargin: "80px" }).observe(el);
  else start();
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
}

function fitCanvas(c: HTMLCanvasElement, maxDpr = 1.5) {
  const dpr = Math.min(maxDpr, window.devicePixelRatio || 1);
  const w = Math.max(1, Math.round(c.clientWidth * dpr)), h = Math.max(1, Math.round(c.clientHeight * dpr));
  if (c.width !== w || c.height !== h) { c.width = w; c.height = h; return true; }
  return false;
}

/* ────────────────────────────── 1 · aurora ────────────────────────────── */
const AURORA_FRAG = `precision mediump float; varying vec2 v; uniform float t; uniform vec2 res; uniform vec2 mouse; uniform float strength; uniform float scroll;
${NOISE}
void main(){
  vec2 uv = v; uv.x *= res.x / res.y; uv.y += scroll;
  vec2 drift = vec2(t * 0.025, -t * 0.018) + (mouse - 0.5) * 0.12;
  float n1 = fbm(uv * 0.9 + drift);
  float n2 = fbm(uv * 1.7 - drift * 1.4 + 3.7);
  float band = smoothstep(-0.55, 0.65, n1) * smoothstep(-0.6, 0.5, n2);
  vec3 cyan = vec3(0.133, 0.827, 0.933), magenta = vec3(0.925, 0.282, 0.600), violet = vec3(0.659, 0.333, 0.969), blue = vec3(0.231, 0.510, 0.965);
  float k = 0.5 + 0.5 * snoise(uv * 0.6 + drift * 0.7);
  vec3 col = mix(mix(blue, cyan, k), mix(violet, magenta, k), smoothstep(0.2, 0.8, n2 * 0.5 + 0.5));
  gl_FragColor = vec4(col * band * strength, 1.0);
}`;

export function mountAurora(root: ParentNode = document) {
  root.querySelectorAll<HTMLCanvasElement>("canvas[data-aurora]").forEach(c => {
    const strength = parseFloat(c.dataset.aurora || "") || 0.55;
    const fixed = c.hasAttribute("data-fixed");
    if (REDUCED) { c.style.background = "radial-gradient(60% 60% at 50% 40%, rgba(34,211,238,.14), rgba(168,85,247,.08) 45%, transparent 75%)"; return; }
    const gl = c.getContext("webgl", { alpha: false, antialias: false, powerPreference: "low-power" }); if (!gl) return;
    const prog = makeProgram(gl, AURORA_FRAG); if (!prog) return; gl.useProgram(prog);
    const uT = gl.getUniformLocation(prog, "t"), uR = gl.getUniformLocation(prog, "res"), uM = gl.getUniformLocation(prog, "mouse"), uS = gl.getUniformLocation(prog, "strength"), uSc = gl.getUniformLocation(prog, "scroll");
    let mx = 0.5, my = 0.5, tx = 0.5, ty = 0.5;
    if (!TOUCH) window.addEventListener("pointermove", e => { tx = e.clientX / innerWidth; ty = 1 - e.clientY / innerHeight; }, { passive: true });
    loopWhileVisible(c, t => {
      if (fitCanvas(c, fixed ? 0.75 : 1)) gl.viewport(0, 0, c.width, c.height);
      mx += (tx - mx) * 0.04; my += (ty - my) * 0.04;
      const sc = fixed ? (window.scrollY / Math.max(1, innerHeight)) * 0.35 : 0;
      gl.uniform1f(uT, t); gl.uniform2f(uR, c.width, c.height); gl.uniform2f(uM, mx, my); gl.uniform1f(uS, strength); gl.uniform1f(uSc, sc);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }, fixed ? 20 : 24, fixed);
  });
}

/* ────────────────────────────── 2 · liquid image ────────────────────────────── */
const LIQUID_FRAG = `precision mediump float; varying vec2 v; uniform sampler2D img; uniform float t; uniform float amt; uniform vec2 mouse; uniform vec2 res;
${NOISE}
void main(){
  vec2 uv = vec2(v.x, 1.0 - v.y);
  vec2 d = uv - mouse; float near = exp(-dot(d, d) * 9.0);
  float n = fbm(uv * 3.0 + t * 0.12);
  vec2 warp = vec2(snoise(uv * 4.0 + t * 0.2), snoise(uv * 4.0 - t * 0.17 + 9.0)) * (0.006 + 0.028 * near) * amt + n * 0.004 * amt;
  vec3 col = texture2D(img, uv + warp).rgb;
  col += vec3(0.133, 0.827, 0.933) * near * 0.08 * amt;
  gl_FragColor = vec4(col, 1.0);
}`;

export function mountLiquid(root: ParentNode = document) {
  if (REDUCED || TOUCH) return;
  root.querySelectorAll<HTMLImageElement>("img[data-liquid]").forEach(img => {
    const setup = () => {
      const c = document.createElement("canvas"); c.className = "fx-liquid"; c.setAttribute("aria-hidden", "true");
      img.insertAdjacentElement("afterend", c); img.classList.add("fx-liquid-src");
      const gl = c.getContext("webgl", { alpha: false, antialias: false }); if (!gl) { c.remove(); img.classList.remove("fx-liquid-src"); return; }
      const prog = makeProgram(gl, LIQUID_FRAG); if (!prog) { c.remove(); img.classList.remove("fx-liquid-src"); return; }
      gl.useProgram(prog);
      const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
      const uT = gl.getUniformLocation(prog, "t"), uA = gl.getUniformLocation(prog, "amt"), uM = gl.getUniformLocation(prog, "mouse"), uR = gl.getUniformLocation(prog, "res");
      let amt = 0, target = 0.35, mx = 0.5, my = 0.5, tx = 0.5, ty = 0.5;
      const host = c.parentElement || c;
      host.addEventListener("pointermove", e => { const r = c.getBoundingClientRect(); tx = (e.clientX - r.left) / r.width; ty = (e.clientY - r.top) / r.height; target = 1; }, { passive: true });
      host.addEventListener("pointerleave", () => { target = 0.35; });
      loopWhileVisible(c, t => {
        if (fitCanvas(c, 1.5)) gl.viewport(0, 0, c.width, c.height);
        amt += (target - amt) * 0.06; mx += (tx - mx) * 0.08; my += (ty - my) * 0.08;
        gl.uniform1f(uT, t); gl.uniform1f(uA, amt); gl.uniform2f(uM, mx, my); gl.uniform2f(uR, c.width, c.height);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }, 30);
    };
    if (img.complete && img.naturalWidth) setup(); else img.addEventListener("load", setup, { once: true });
  });
}

/* ────────────────────────────── 3 · tilt ────────────────────────────── */
export function mountTilt(root: ParentNode = document) {
  if (REDUCED || TOUCH) return;
  root.querySelectorAll<HTMLElement>("[data-tilt]").forEach(el => {
    const max = parseFloat(el.dataset.tilt || "") || 6;
    let raf = 0, rx = 0, ry = 0, gx = 50, gy = 50, on = false;
    const paint = () => { raf = 0; el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(0)`; el.style.setProperty("--gx", gx + "%"); el.style.setProperty("--gy", gy + "%"); };
    el.addEventListener("pointerenter", () => { on = true; el.classList.add("is-tilting"); });
    el.addEventListener("pointermove", e => {
      if (!on) return; const r = el.getBoundingClientRect(); const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      ry = (px - 0.5) * max * 2; rx = (0.5 - py) * max * 2; gx = px * 100; gy = py * 100; if (!raf) raf = requestAnimationFrame(paint);
    }, { passive: true });
    el.addEventListener("pointerleave", () => { on = false; rx = ry = 0; gx = gy = 50; el.classList.remove("is-tilting"); if (!raf) raf = requestAnimationFrame(paint); });
  });
}

/* ────────────────────────────── 4 · the flood ──────────────────────────────
   Résumé sheets fall into the frame as the section scrolls into view, flutter, and pile up. One sheet — yours — lands
   last, in front, lit cyan. The pile drives a counter: data-flood-from="116" data-flood-to="244" on any [data-flood-count]. */
interface Sheet { x: number; w: number; h: number; sprite: number; delay: number; spin: number; sway: number; restY: number; restRot: number; phase: number; }
const ease = (p: number) => 1 - Math.pow(1 - Math.max(0, Math.min(1, p)), 3);
const rngOf = (seed: number) => () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };

export function mountFlood(root: ParentNode = document) {
  root.querySelectorAll<HTMLCanvasElement>("canvas[data-flood]").forEach(c => {
    const srcs = (c.dataset.flood || "").split(",").map(s => s.trim()).filter(Boolean); if (!srcs.length) return;
    const counter = (c.closest("section") || document).querySelector<HTMLElement>("[data-flood-count]");
    const from = counter ? parseFloat(counter.dataset.floodFrom || "0") : 0, to = counter ? parseFloat(counter.dataset.floodTo || "0") : 0;
    const imgs = srcs.map(s => { const i = new Image(); i.src = s; return i; });
    const ctx = c.getContext("2d"); if (!ctx) return;
    const N = 64, rng = rngOf(11);
    let sheets: Sheet[] = [], W = 0, H = 0, dpr = 1;
    const layout = () => {
      dpr = Math.min(1.5, window.devicePixelRatio || 1); W = c.clientWidth; H = c.clientHeight; c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
      const r = rngOf(11); sheets = [];
      for (let i = 0; i < N; i++) {
        const w = W * (0.10 + r() * 0.09), h = w * 1.3;
        sheets.push({ x: W * (0.04 + r() * 0.92), w, h, sprite: i % imgs.length, delay: i < 9 ? -0.5 : (i / N) * 0.62, spin: (r() - 0.5) * 2.2, sway: 10 + r() * 26, restY: H - h * (0.45 + r() * 0.25) - Math.pow(r(), 2.2) * H * 0.38, restRot: (r() - 0.5) * 0.5, phase: r() * Math.PI * 2 });
      }
      // the last sheet is yours: front, left-of-centre, upright
      const me = sheets[N - 1]; me.x = W * 0.30; me.w = W * 0.19; me.h = me.w * 1.3; me.restY = H - me.h * 1.02; me.restRot = -0.08; me.delay = 0.70; me.sway = 8;
    };
    layout(); void rng;
    let progress = 0, target = 0, t0 = performance.now();
    const onScroll = () => {
      const r = c.getBoundingClientRect(); const vh = innerHeight;
      // 0 when the frame's top reaches the bottom of the viewport, 1 when its bottom is ~40% up the screen
      target = Math.max(0, Math.min(1, (vh - r.top) / (r.height + vh * 0.22)));
    };
    window.addEventListener("scroll", onScroll, { passive: true }); window.addEventListener("resize", () => { layout(); onScroll(); progress = target; }); onScroll();
    if (REDUCED) { progress = target = 1; }
    const draw = (now: number) => {
      progress += (target - progress) * (REDUCED ? 1 : 0.10);
      const t = (now - t0) / 1000;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      let landed = 0;
      sheets.forEach((s, i) => {
        const img = imgs[s.sprite]; if (!img.complete || !img.naturalWidth) return;
        const p = ease((progress - s.delay) / 0.30); if (p >= 1) landed++;
        const falling = p > 0 && p < 1;
        const y = -s.h + (s.restY + s.h) * p;
        const sway = falling ? Math.sin(t * 2.2 + s.phase) * s.sway * (1 - p) : 0;
        const rot = falling ? s.restRot + Math.sin(t * 1.7 + s.phase) * 0.35 * (1 - p) + s.spin * (1 - p) : s.restRot;
        const me = i === sheets.length - 1;
        if (p <= 0) return;
        ctx.save(); ctx.translate(s.x + sway, y); ctx.rotate(rot);
        ctx.globalAlpha = me ? 1 : 0.55 + 0.45 * p;
        if (me) { ctx.shadowColor = "rgba(34,211,238,.85)"; ctx.shadowBlur = 40 * p; }
        else { ctx.shadowColor = "rgba(0,0,0,.55)"; ctx.shadowBlur = 18; ctx.shadowOffsetY = 8; }
        ctx.drawImage(img, -s.w / 2, -s.h / 2, s.w, s.h);
        if (me) { ctx.globalCompositeOperation = "source-atop"; ctx.fillStyle = `rgba(34,211,238,${0.75 * p})`; ctx.fillRect(-s.w / 2, -s.h / 2, s.w, s.h); ctx.globalCompositeOperation = "source-over"; }
        else { ctx.globalCompositeOperation = "source-atop"; ctx.fillStyle = `rgba(${i % 2 ? "236,72,153" : "59,130,246"},${0.18 + 0.22 * (i / sheets.length)})`; ctx.fillRect(-s.w / 2, -s.h / 2, s.w, s.h); ctx.globalCompositeOperation = "source-over"; }
        ctx.restore();
      });
      if (counter && to > from) { const v = Math.round(from + (to - from) * Math.min(1, Math.max(0, landed - 9) / (sheets.length - 10))); if (counter.textContent !== String(v)) counter.textContent = String(v); }
    };
    loopWhileVisible(c, () => draw(performance.now()), 45);
    if (REDUCED) requestAnimationFrame(() => draw(performance.now()));
  });
}

/* ────────────────────────────── 5 · the rail ──────────────────────────────
   <nav data-rail> gets one node per [data-rail="Label"] section; the line fills with scroll, the node nearest the
   viewport centre lights, a click scrolls there. Desktop only (CSS hides it below 1100px). */
export function mountRail() {
  const rail = document.querySelector<HTMLElement>("nav[data-rail]"); if (!rail) return;
  const secs = Array.from(document.querySelectorAll<HTMLElement>("[data-rail]")).filter(s => s !== rail);
  if (secs.length < 2) return;
  rail.innerHTML = `<div class="rail__track"><div class="rail__fill"></div></div>` + secs.map((s, i) => `<button class="rail__node" type="button" data-i="${i}"><span class="rail__dot"></span><span class="rail__lbl">${s.dataset.rail}</span></button>`).join("");
  const fill = rail.querySelector<HTMLElement>(".rail__fill")!, nodes = Array.from(rail.querySelectorAll<HTMLElement>(".rail__node"));
  nodes.forEach((n, i) => n.addEventListener("click", () => secs[i].scrollIntoView({ behavior: REDUCED ? "auto" : "smooth", block: "start" })));
  const place = () => {
    const docH = document.documentElement.scrollHeight - innerHeight; const y = window.scrollY;
    const tops = secs.map(s => s.getBoundingClientRect().top + y);
    const first = tops[0], last = tops[tops.length - 1];
    const pos = (v: number) => Math.max(0, Math.min(1, (v - first) / Math.max(1, last - first)));
    nodes.forEach((n, i) => { n.style.top = (pos(tops[i]) * 100) + "%"; });
    const probe = y + innerHeight * 0.45; fill.style.height = (pos(probe) * 100) + "%";
    let cur = 0; tops.forEach((t, i) => { if (probe >= t - 8) cur = i; });
    nodes.forEach((n, i) => n.classList.toggle("is-on", i <= cur)); nodes.forEach((n, i) => n.classList.toggle("is-cur", i === cur));
    rail.classList.toggle("is-hidden", y < innerHeight * 0.5 || y > docH - 40);
  };
  let raf = 0; const onScroll = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; place(); }); };
  window.addEventListener("scroll", onScroll, { passive: true }); window.addEventListener("resize", onScroll); place();
}

/** One call from a page's entry script. */
export function mountFx(root: ParentNode = document) { mountAurora(root); mountLiquid(root); mountTilt(root); mountFlood(root); mountRail(); }
