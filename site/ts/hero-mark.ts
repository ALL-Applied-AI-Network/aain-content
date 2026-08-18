/**
 * hero-mark.ts — the ALL mark, alive, on the home hero.
 *
 * Replaces the Three.js node-graph scene. The geometry is not a redraw:
 * nodes, edges and the silhouette were extracted from all-logo.png by
 * image analysis (saturated blobs eroded to cores for solid nodes, small
 * enclosed holes for ring nodes, ink-continuity sampling for edges,
 * boundary tracing for the outline), so what animates IS the logo.
 *
 * 2D canvas on purpose. The previous scene pulled in three.js for a hero
 * whose job is one headline and one button; this is a few hundred draw
 * calls a frame, no dependency, and it degrades to a still frame under
 * prefers-reduced-motion.
 */

type Node = { x: number; y: number; r: number; c: string; z: number; phase: number };
type Graph = { w: number; h: number; nodes: Node[]; edges: [number, number][]; outline: [number, number][] };

const G = {"w":449,"h":387,"nodes":[{"x":164.2,"y":27.6,"r":6.39,"c":"#00d2ea"},{"x":85.8,"y":70.2,"r":14.85,"c":"#01a7d8"},{"x":196.5,"y":70.7,"r":10.27,"c":"#4ef1f6"},{"x":419.7,"y":94.3,"r":4.49,"c":"#a769fc"},{"x":410.5,"y":103.1,"r":13.53,"c":"#623e97"},{"x":121.9,"y":116.6,"r":9.08,"c":"#00d2e2"},{"x":376.3,"y":144.1,"r":9.96,"c":"#9c62e7"},{"x":29.3,"y":145.2,"r":15.84,"c":"#02b1e8"},{"x":319.4,"y":174.2,"r":10.7,"c":"#c370ff"},{"x":427.4,"y":191.3,"r":7.15,"c":"#664ddb"},{"x":124.4,"y":197.7,"r":4.87,"c":"#61fbfc"},{"x":338.2,"y":229.4,"r":4.26,"c":"#5e3b90"},{"x":322.4,"y":234.4,"r":4.49,"c":"#aa6afe"},{"x":331.6,"y":234.5,"r":8.85,"c":"#9c67fc"},{"x":242.4,"y":235.8,"r":13.61,"c":"#e276fe"},{"x":325.8,"y":240.6,"r":4.26,"c":"#a168fd"},{"x":385.1,"y":241.2,"r":16.95,"c":"#7258fc"},{"x":331.0,"y":243.6,"r":4.69,"c":"#a469fe"},{"x":397.2,"y":252.2,"r":4.26,"c":"#3c2e88"},{"x":97.9,"y":256.2,"r":12.96,"c":"#61fbfc"},{"x":257.9,"y":292.7,"r":6.61,"c":"#bb6dfe"},{"x":326.9,"y":303.0,"r":15.91,"c":"#6d51dd"},{"x":175.4,"y":307.8,"r":10.05,"c":"#c169c5"},{"x":272.6,"y":359.5,"r":9.52,"c":"#8860fb"}],"edges":[[0,1],[0,2],[0,5],[1,5],[2,5],[4,6],[4,9],[5,7],[5,10],[6,9],[6,14],[7,19],[8,13],[9,16],[12,14],[13,14],[13,16],[13,20],[13,21],[15,20],[17,21],[20,21],[20,22],[20,23],[21,23]],"outline":[[280,1],[286,1],[292,1],[298,3],[304,6],[310,12],[313,18],[314,24],[319,29],[325,33],[331,36],[337,40],[343,43],[349,47],[355,50],[361,54],[367,57],[373,61],[379,64],[385,68],[391,71],[397,75],[403,75],[409,74],[415,74],[421,75],[427,79],[432,83],[437,89],[439,95],[440,101],[440,107],[438,113],[435,119],[431,125],[432,131],[433,137],[435,143],[436,149],[437,155],[438,161],[439,167],[440,173],[443,179],[446,185],[447,191],[447,197],[444,203],[439,208],[433,211],[428,216],[423,222],[419,228],[417,234],[418,240],[418,246],[416,252],[414,258],[409,264],[403,269],[397,271],[391,273],[385,273],[379,276],[373,282],[367,288],[361,293],[356,299],[356,305],[355,311],[353,317],[349,323],[343,328],[337,331],[331,332],[325,332],[319,333],[314,339],[308,345],[302,351],[298,357],[297,363],[296,369],[292,375],[287,380],[281,383],[275,384],[269,384],[263,383],[257,379],[251,373],[249,367],[248,361],[248,355],[250,349],[253,343],[252,337],[251,331],[249,325],[248,319],[246,313],[242,311],[236,312],[230,313],[224,314],[218,316],[212,317],[206,318],[200,319],[194,322],[188,328],[182,330],[176,331],[170,330],[164,328],[158,324],[154,318],[151,312],[145,308],[139,304],[133,300],[127,297],[121,293],[115,289],[109,287],[103,289],[97,290],[91,289],[85,288],[79,285],[73,281],[68,275],[65,269],[63,263],[63,257],[63,251],[65,245],[66,239],[62,233],[59,227],[55,221],[51,215],[48,209],[44,203],[40,197],[37,191],[33,185],[30,179],[25,174],[19,172],[13,170],[7,164],[3,158],[1,152],[1,146],[1,140],[2,134],[6,128],[11,122],[17,119],[23,117],[29,115],[34,109],[38,103],[42,97],[46,91],[50,85],[49,79],[48,73],[48,67],[49,61],[52,55],[56,49],[61,43],[67,39],[73,38],[79,34],[85,33],[91,34],[97,36],[103,39],[109,36],[115,33],[121,31],[127,28],[133,25],[139,22],[145,20],[150,14],[156,9],[162,8],[168,8],[174,10],[180,11],[186,11],[192,11],[198,11],[204,11],[210,11],[216,11],[222,11],[228,11],[234,11],[240,11],[246,12],[252,12],[258,12],[264,11],[270,6],[276,3]]} as unknown as Graph;

export function initHeroMark(host: HTMLElement): () => void {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cv = document.createElement("canvas");
  cv.style.cssText = "display:block;width:100%;height:100%";
  host.appendChild(cv);
  const ctx = cv.getContext("2d");
  if (!ctx) return () => {};

  const cxG = G.w / 2, cyG = G.h / 2, maxD = Math.hypot(cxG, cyG);
  G.nodes.forEach((n, i) => {
    n.z = 0.35 + 0.65 * (Math.hypot(n.x - cxG, n.y - cyG) / maxD);
    n.phase = (i * 2.399) % (Math.PI * 2);
  });
  const order = G.nodes.map((_, i) => i).sort((a, b) => G.nodes[a].z - G.nodes[b].z);

  let W = 0, H = 0, scale = 1, ox = 0, oy = 0;
  function resize(): boolean {
    const r = cv.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return false;   // not laid out yet
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    const fit = Math.min(W * 0.86 / G.w, H * 0.80 / G.h);
    scale = fit; ox = W / 2 - (G.w / 2) * fit; oy = H / 2 - (G.h / 2) * fit;
    return true;
  }
  const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => resize()) : null;
  ro?.observe(cv);

  let mx = 0, my = 0, tmx = 0, tmy = 0;
  const onMove = (e: PointerEvent) => {
    const r = cv.getBoundingClientRect();
    tmx = (e.clientX - r.left) / r.width - 0.5;
    tmy = (e.clientY - r.top) / r.height - 0.5;
  };
  if (!reduce) addEventListener("pointermove", onMove, { passive: true });

  const pulses: { a: number; b: number; t: number; sp: number }[] = [];
  let nextPulse = 0, raf = 0, t0 = performance.now(), running = true;

  function pos(n: Node, time: number): [number, number] {
    const px = reduce ? 0 : mx * 22 * n.z, py = reduce ? 0 : my * 17 * n.z;
    const dx = reduce ? 0 : Math.sin(time * 0.00016 + n.phase) * 2.0 * n.z;
    const dy = reduce ? 0 : Math.cos(time * 0.00013 + n.phase * 1.3) * 1.8 * n.z;
    return [ox + n.x * scale + px + dx, oy + n.y * scale + py + dy];
  }

  function frame(now: number) {
    if (!running) return;
    if (W < 2 || H < 2) { if (!resize()) { raf = requestAnimationFrame(frame); return; } t0 = now; }
    const time = now - t0;
    const entrance = reduce ? 1 : Math.min(1, time / 2600);
    mx += (tmx - mx) * 0.06; my += (tmy - my) * 0.06;
    ctx!.clearRect(0, 0, W, H);

    // Silhouette — the cue that makes this read as OUR mark, not a mesh.
    const O = G.outline, n = O.length;
    const drawn = Math.max(0, Math.min(1, entrance / 0.65));
    const upto = Math.max(2, Math.floor(n * drawn));
    const sx = reduce ? 0 : mx * 9, sy = reduce ? 0 : my * 7;
    ctx!.beginPath();
    for (let i = 0; i < upto; i++) {
      const X = ox + O[i][0] * scale + sx, Y = oy + O[i][1] * scale + sy;
      i ? ctx!.lineTo(X, Y) : ctx!.moveTo(X, Y);
    }
    if (drawn >= 1) ctx!.closePath();
    // Slightly stronger than the prototype: the hero scrim is lightest on
    // the right, which is exactly where this sits.
    ctx!.strokeStyle = "rgba(228,234,255," + (0.44 + 0.06 * Math.sin(time * 0.0008)) + ")";
    ctx!.lineWidth = Math.max(1, 1.6 * scale); ctx!.lineJoin = "round"; ctx!.stroke();
    if (drawn >= 1) {
      ctx!.save(); ctx!.clip();
      const gg = ctx!.createRadialGradient(ox + G.w * .5 * scale, oy + G.h * .5 * scale, 0,
                                           ox + G.w * .5 * scale, oy + G.h * .5 * scale, G.w * .62 * scale);
      gg.addColorStop(0, "rgba(130,100,235,0.16)"); gg.addColorStop(1, "rgba(0,0,0,0)");
      ctx!.fillStyle = gg; ctx!.fillRect(0, 0, W, H); ctx!.restore();
    }

    ctx!.lineCap = "round";
    G.edges.forEach((e, i) => {
      const A = G.nodes[e[0]], B = G.nodes[e[1]];
      const local = Math.max(0, Math.min(1, (entrance - 0.30 - i / G.edges.length * 0.40) / 0.34));
      if (local <= 0) return;
      const [ax, ay] = pos(A, time), [bx, by] = pos(B, time);
      const gr = ctx!.createLinearGradient(ax, ay, bx, by);
      gr.addColorStop(0, A.c); gr.addColorStop(1, B.c);
      ctx!.globalAlpha = (reduce ? 0.5 : 0.42 + 0.16 * Math.sin(time * 0.0009 + i)) * local;
      ctx!.strokeStyle = gr; ctx!.lineWidth = Math.max(1, 1.5 * scale);
      ctx!.beginPath(); ctx!.moveTo(ax, ay);
      ctx!.lineTo(ax + (bx - ax) * local, ay + (by - ay) * local); ctx!.stroke();
    });
    ctx!.globalAlpha = 1;

    if (!reduce && entrance > 0.9) {
      if (now > nextPulse) {
        const e = G.edges[(Math.random() * G.edges.length) | 0];
        pulses.push({ a: e[0], b: e[1], t: 0, sp: 0.45 + Math.random() * 0.5 });
        nextPulse = now + 420 + Math.random() * 900;
      }
      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i]; p.t += p.sp / 60;
        if (p.t >= 1) { pulses.splice(i, 1); continue; }
        const A = G.nodes[p.a], B = G.nodes[p.b];
        const [ax, ay] = pos(A, time), [bx, by] = pos(B, time);
        const x = ax + (bx - ax) * p.t, y = ay + (by - ay) * p.t;
        const fade = Math.sin(Math.PI * p.t), rr = Math.max(1.6, 2.6 * scale);
        const g2 = ctx!.createRadialGradient(x, y, 0, x, y, rr * 4);
        g2.addColorStop(0, "rgba(255,255,255," + 0.95 * fade + ")");
        g2.addColorStop(.35, B.c); g2.addColorStop(1, "rgba(255,255,255,0)");
        ctx!.fillStyle = g2; ctx!.beginPath(); ctx!.arc(x, y, rr * 4, 0, 7); ctx!.fill();
      }
    }

    for (const idx of order) {
      const nd = G.nodes[idx];
      const appear = Math.max(0, Math.min(1, (entrance - 0.42 - (nd.z - 0.35) * 0.30) / 0.34));
      if (appear <= 0) continue;
      const [x, y] = pos(nd, time);
      const breathe = reduce ? 1 : 1 + 0.075 * Math.sin(time * 0.0012 + nd.phase);
      const pop = appear < 1 ? 1 + 0.5 * Math.sin(appear * Math.PI) * (1 - appear) : 1;
      const r = nd.r * scale * breathe * pop * appear;
      const g = ctx!.createRadialGradient(x, y, 0, x, y, r * 4.2);
      g.addColorStop(0, nd.c); g.addColorStop(1, "rgba(0,0,0,0)");
      ctx!.globalAlpha = 0.30 * appear; ctx!.fillStyle = g;
      ctx!.beginPath(); ctx!.arc(x, y, r * 4.2, 0, 7); ctx!.fill();
      ctx!.globalAlpha = appear; ctx!.fillStyle = nd.c;
      ctx!.beginPath(); ctx!.arc(x, y, r, 0, 7); ctx!.fill();
      ctx!.globalAlpha = 0.9 * appear;
      ctx!.strokeStyle = "rgba(255,255,255,.75)"; ctx!.lineWidth = Math.max(.6, .9 * scale);
      ctx!.beginPath(); ctx!.arc(x, y, r, 0, 7); ctx!.stroke();
    }
    ctx!.globalAlpha = 1;

    if (reduce) return;                 // one frame is enough
    raf = requestAnimationFrame(frame);
  }

  resize();
  raf = requestAnimationFrame(frame);
  return () => {
    running = false; cancelAnimationFrame(raf);
    ro?.disconnect(); removeEventListener("pointermove", onMove);
    cv.remove();
  };
}
