/**
 * hero-mark.ts — the ALL mark, alive, on the home hero.
 *
 * The geometry is not a redraw. Every node, edge, glyph and outline point is
 * extracted from all-logo.png by image analysis: the art sits on an opaque
 * black plate, so edge pixels are premultiplied and give true sub-pixel
 * coverage; contours come off the 0.5-coverage iso-level, corners from
 * Douglas-Peucker, and every straight edge is refit by least squares. What
 * animates IS the logo.
 *
 * The logo's vocabulary is four shapes, not one: filled discs, hollow RINGS,
 * two GEARS and two TRIANGLES. An earlier pass drew all of them as discs,
 * which cost a five-edge triangular hub, a ring node sitting on the outline,
 * seven hollow centres and thirteen edges.
 *
 * The entrance carries the idea. The mark is two colour communities — cyan
 * left (hue 180-200), violet right (249-297), no overlap — joined by only
 * five of the thirty-eight edges, every one of which detours around the
 * word rather than through it. So: the word arrives first and holds the
 * frame alone, the silhouette grows out of the seam, each half fills in
 * separately, there is a beat where both halves are complete and unjoined,
 * and then the crossings stitch outward from the word. "ALL is what joins
 * the two halves" is told by the order, so it lands with no pointer at all.
 *
 * 2D canvas on purpose: no dependency, a few hundred draw calls a frame,
 * and it degrades to a still frame under prefers-reduced-motion.
 */

type Node = {
  x: number; y: number; r: number; c: string;
  shape?: string; hole?: number;
  z: number; phase: number; lobe: number; rw: number;
};
type Shape = { cx: number; cy: number; r: number; c: string; loops: [number, number][][] };
type Letter = {
  p: [number, number][];
  h?: [number, number][][];
  g: { a: [number, number]; b: [number, number]; s: [number, string][] };
};
type Graph = {
  w: number; h: number;
  nodes: Node[]; edges: [number, number][]; outline: [number, number][];
  shapes: Record<string, Shape>;
  word: { box: { x: number; y: number; w: number; h: number }; letters: Letter[] };
};

const G = {"w":449,"h":387,"nodes":[{"x":164.2,"y":27.6,"r":6.39,"c":"#00d2ea"},{"x":85.57,"y":71.02,"r":23.95,"c":"#48b4eb","shape":"gear_blue"},{"x":196.5,"y":70.7,"r":10.27,"c":"#4ef1f6"},{"x":419.7,"y":94.3,"r":4.49,"c":"#a769fc"},{"x":410.5,"y":103.1,"r":13.53,"c":"#623e97","hole":10.5},{"x":121.9,"y":116.6,"r":9.08,"c":"#00d2e2"},{"x":376.3,"y":144.1,"r":9.96,"c":"#9c62e7"},{"x":29.3,"y":145.2,"r":15.84,"c":"#02b1e8"},{"x":319.4,"y":174.2,"r":10.7,"c":"#c370ff","hole":7.5},{"x":427.4,"y":191.3,"r":7.15,"c":"#664ddb"},{"x":122.75,"y":205.5,"r":22.84,"c":"#77fcfe","shape":"tri_ring"},{"x":242.4,"y":235.8,"r":13.61,"c":"#e276fe","hole":10.5},{"x":385.1,"y":241.2,"r":16.95,"c":"#7258fc","hole":14.0},{"x":397.2,"y":252.2,"r":4.26,"c":"#3c2e88"},{"x":97.9,"y":256.2,"r":12.96,"c":"#61fbfc","hole":10.0},{"x":257.9,"y":292.7,"r":6.61,"c":"#bb6dfe"},{"x":326.9,"y":303.0,"r":15.91,"c":"#6d51dd"},{"x":175.4,"y":307.8,"r":10.05,"c":"#c169c5"},{"x":272.6,"y":359.5,"r":9.52,"c":"#8860fb","hole":6.5},{"x":329.35,"y":236.8,"r":16.2,"c":"#ab6efe","shape":"gear_purple"},{"x":267.25,"y":103.0,"r":18.93,"c":"#e6d1ff","shape":"tri_hub"},{"x":286.0,"y":30.0,"r":14.0,"c":"#a9e9f4","hole":10.5}],"edges":[[0,1],[0,2],[0,5],[0,21],[1,5],[1,7],[2,5],[2,20],[4,6],[4,9],[4,20],[4,21],[5,7],[5,10],[6,8],[6,9],[6,11],[6,20],[7,10],[7,14],[8,19],[9,12],[10,14],[11,12],[11,14],[11,17],[11,19],[12,16],[12,18],[12,19],[14,17],[15,16],[15,17],[15,18],[15,19],[16,18],[16,19],[20,21]],"outline":[[280,1],[286,1],[292,1],[298,3],[304,6],[310,12],[313,18],[314,24],[319,29],[325,33],[331,36],[337,40],[343,43],[349,47],[355,50],[361,54],[367,57],[373,61],[379,64],[385,68],[391,71],[397,75],[403,75],[409,74],[415,74],[421,75],[427,79],[432,83],[437,89],[439,95],[440,101],[440,107],[438,113],[435,119],[431,125],[432,131],[433,137],[435,143],[436,149],[437,155],[438,161],[439,167],[440,173],[443,179],[446,185],[447,191],[447,197],[444,203],[439,208],[433,211],[428,216],[423,222],[419,228],[417,234],[418,240],[418,246],[416,252],[414,258],[409,264],[403,269],[397,271],[391,273],[385,273],[379,276],[373,282],[367,288],[361,293],[356,299],[356,305],[355,311],[353,317],[349,323],[343,328],[337,331],[331,332],[325,332],[319,333],[314,339],[308,345],[302,351],[298,357],[297,363],[296,369],[292,375],[287,380],[281,383],[275,384],[269,384],[263,383],[257,379],[251,373],[249,367],[248,361],[248,355],[250,349],[253,343],[252,337],[251,331],[249,325],[248,319],[246,313],[242,311],[236,312],[230,313],[224,314],[218,316],[212,317],[206,318],[200,319],[194,322],[188,328],[182,330],[176,331],[170,330],[164,328],[158,324],[154,318],[151,312],[145,308],[139,304],[133,300],[127,297],[121,293],[115,289],[109,287],[103,289],[97,290],[91,289],[85,288],[79,285],[73,281],[68,275],[65,269],[63,263],[63,257],[63,251],[65,245],[66,239],[62,233],[59,227],[55,221],[51,215],[48,209],[44,203],[40,197],[37,191],[33,185],[30,179],[25,174],[19,172],[13,170],[7,164],[3,158],[1,152],[1,146],[1,140],[2,134],[6,128],[11,122],[17,119],[23,117],[29,115],[34,109],[38,103],[42,97],[46,91],[50,85],[49,79],[48,73],[48,67],[49,61],[52,55],[56,49],[61,43],[67,39],[73,38],[79,34],[85,33],[91,34],[97,36],[103,39],[109,36],[115,33],[121,31],[127,28],[133,25],[139,22],[145,20],[150,14],[156,9],[162,8],[168,8],[174,10],[180,11],[186,11],[192,11],[198,11],[204,11],[210,11],[216,11],[222,11],[228,11],[234,11],[240,11],[246,12],[252,12],[258,12],[264,11],[270,6],[276,3]],"word":{"box":{"x":157.576,"y":140.574,"w":102.262,"h":35.301},"letters":[{"p":[[0.10816,0.00083],[0.0,0.97218],[0.01378,0.99883],[0.09735,0.99883],[0.12122,0.75986],[0.20645,0.75986],[0.23225,1.0],[0.32899,1.0],[0.32899,0.9372],[0.22306,0.00083]],"g":{"a":[0.0292,0.2016],"b":[0.243,1.1199],"s":[[0.01,"#00a5e9"],[0.177,"#00a5e9"],[0.24,"#00a8ed"],[0.26,"#00adf0"],[0.281,"#00b3f1"],[0.323,"#00c4f4"],[0.365,"#00d7f6"],[0.385,"#00def7"],[0.427,"#00e8f9"],[0.49,"#00f2fb"],[0.552,"#00fdff"],[0.615,"#00fffd"],[0.635,"#04ffff"],[0.656,"#36fcff"],[0.677,"#5df9ff"],[0.698,"#7bf4ff"],[0.74,"#a8e8ff"],[0.781,"#cbd8ff"],[0.802,"#dacfff"],[0.823,"#e6c5ff"],[0.865,"#fab2ff"],[0.885,"#ffa8ff"],[0.948,"#ff8cff"],[0.969,"#ff86ff"],[0.99,"#ff84ff"]]},"h":[[[0.16116,0.31108],[0.18602,0.49825],[0.18062,0.55357],[0.13999,0.53132]]]},{"p":[[0.44385,0.00139],[0.43222,0.03995],[0.43222,0.97469],[0.45104,0.99878],[0.66392,0.99878],[0.66392,0.76468],[0.53076,0.76468],[0.53076,0.00139]],"g":{"a":[0.1503,0.6589],"b":[0.3781,1.5671],"s":[[0.01,"#00f5fc"],[0.031,"#00fbfe"],[0.052,"#00fdff"],[0.115,"#00fffd"],[0.135,"#00fffe"],[0.156,"#27fdff"],[0.177,"#59f9ff"],[0.198,"#79f4ff"],[0.24,"#a7e8ff"],[0.26,"#b9e1ff"],[0.302,"#d9d0ff"],[0.323,"#e5c6ff"],[0.365,"#fab2ff"],[0.385,"#ffa7ff"],[0.448,"#ff8cff"],[0.469,"#ff86ff"],[0.573,"#ff79ff"],[0.594,"#fe76ff"],[0.698,"#ea66ff"],[0.719,"#e364ff"],[0.76,"#c85fff"],[0.802,"#b459fe"],[0.823,"#b057fc"],[0.865,"#ae56f9"],[0.99,"#ad56f8"]]}},{"p":[[0.77687,0.0],[0.76844,0.03767],[0.76844,0.97554],[0.78455,0.99895],[0.99261,0.99895],[1.0,0.95471],[1.0,0.80288],[0.99254,0.76556],[0.86679,0.76556],[0.86679,0.03899],[0.85501,0.0]],"g":{"a":[0.2371,1.0947],"b":[0.454,2.0261],"s":[[0.01,"#ff84ff"],[0.115,"#fe76ff"],[0.219,"#eb66ff"],[0.24,"#e565ff"],[0.302,"#be5dff"],[0.323,"#b55afe"],[0.344,"#b058fc"],[0.406,"#ad56f8"],[0.99,"#ad56f8"]]}}]},"shapes":{"gear_blue":{"cx":85.57,"cy":71.02,"r":23.95,"c":"#48b4eb","loops":[[[84.49,47.99],[82.2,49.42],[80.25,51.31],[77.68,51.94],[74.96,51.77],[72.38,52.51],[70.28,54.23],[68.55,56.31],[67.84,58.91],[67.51,61.58],[65.36,63.17],[63.11,64.68],[61.95,67.09],[61.72,69.8],[62.18,72.47],[63.57,74.78],[65.68,76.5],[66.9,78.8],[66.35,81.46],[66.68,84.14],[67.6,86.68],[69.87,88.06],[72.48,88.82],[75.18,89.12],[77.61,90.14],[79.19,92.34],[81.35,93.94],[84.02,94.42],[86.73,94.22],[89.18,93.11],[91.04,91.14],[93.1,89.45],[95.78,89.81],[98.42,89.37],[100.63,87.8],[102.41,85.76],[103.24,83.2],[103.52,80.5],[105.59,78.85],[107.86,77.36],[109.14,75.0],[109.42,72.3],[109.04,69.62],[107.57,67.37],[105.62,65.48],[105.11,62.9],[105.69,60.24],[105.21,57.6],[103.62,55.42],[101.42,53.83],[98.86,52.99],[96.14,52.99],[93.79,51.75],[92.04,49.67],[89.83,48.12],[87.18,47.63]],[[82.62,59.12],[85.14,58.68],[87.69,58.89],[90.14,59.65],[92.33,60.97],[94.2,62.72],[95.78,64.73],[96.8,67.08],[97.29,69.59],[97.17,72.14],[96.41,74.58],[95.18,76.83],[93.46,78.72],[91.29,80.07],[88.91,81.0],[86.38,81.4],[83.82,81.33],[81.33,80.74],[79.13,79.45],[77.26,77.7],[75.73,75.65],[74.84,73.25],[74.55,70.71],[74.62,68.15],[75.14,65.64],[76.36,63.39],[78.13,61.55],[80.28,60.15]]]},"tri_hub":{"cx":267.25,"cy":103.0,"r":18.93,"c":"#e6d1ff","loops":[[[268.0,92.5],[251.5,103.0],[283.0,113.5]]]},"tri_ring":{"cx":122.75,"cy":205.5,"r":22.84,"c":"#77fcfe","loops":[[[136.0,188.5],[107.5,198.0],[138.0,222.5]],[[133.29,197.08],[135.15,214.69],[118.7,204.39]]]},"gear_purple":{"cx":329.35,"cy":236.8,"r":16.2,"c":"#ab6efe","loops":[[[328.62,221.22],[327.07,222.19],[325.75,223.47],[324.01,223.89],[322.17,223.78],[320.43,224.28],[319.01,225.44],[317.84,226.85],[317.36,228.61],[317.13,230.41],[315.68,231.49],[314.16,232.51],[313.37,234.14],[313.22,235.97],[313.53,237.78],[314.47,239.34],[315.9,240.51],[316.72,242.06],[316.35,243.86],[316.57,245.67],[317.19,247.39],[318.73,248.33],[320.5,248.84],[322.32,249.04],[323.97,249.73],[325.03,251.22],[326.5,252.3],[328.3,252.63],[330.13,252.49],[331.79,251.74],[333.05,250.41],[334.44,249.27],[336.26,249.51],[338.04,249.21],[339.54,248.15],[340.74,246.77],[341.3,245.04],[341.49,243.21],[342.89,242.1],[344.43,241.09],[345.29,239.49],[345.48,237.67],[345.23,235.85],[344.23,234.33],[342.91,233.05],[342.57,231.31],[342.96,229.51],[342.63,227.72],[341.56,226.25],[340.07,225.17],[338.34,224.6],[336.5,224.6],[334.91,223.77],[333.73,222.36],[332.23,221.31],[330.44,220.98]],[[327.35,228.75],[329.06,228.45],[330.78,228.6],[332.44,229.11],[333.92,230.0],[335.19,231.19],[336.26,232.55],[336.95,234.13],[337.28,235.83],[337.2,237.56],[336.68,239.21],[335.85,240.73],[334.69,242.01],[333.22,242.92],[331.61,243.55],[329.9,243.82],[328.17,243.77],[326.48,243.37],[324.99,242.5],[323.73,241.32],[322.69,239.93],[322.09,238.31],[321.9,236.59],[321.94,234.86],[322.3,233.16],[323.12,231.64],[324.32,230.39],[325.77,229.45]]]}}} as unknown as Graph;

export function initHeroMark(host: HTMLElement): () => void {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cv = document.createElement("canvas");
  cv.style.cssText = "display:block;width:100%;height:100%";
  host.appendChild(cv);
  const ctx = cv.getContext("2d");
  if (!ctx) return () => {};

  // ── depth, and the structure the animation is built on ────────────────
  const cxG = G.w / 2, cyG = G.h / 2, maxD = Math.hypot(cxG, cyG);
  const WCX = G.word.box.x + G.word.box.w / 2;
  const WCY = G.word.box.y + G.word.box.h / 2;

  function hueOf(hex: string): number {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    if (!d) return 0;
    const h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return (h * 60 + 360) % 360;
  }
  G.nodes.forEach((n, i) => {
    n.z = 0.35 + 0.65 * (Math.hypot(n.x - cxG, n.y - cyG) / maxD);
    n.phase = (i * 2.399) % (Math.PI * 2);
    n.lobe = hueOf(n.c) < 220 ? 0 : 1;
    n.rw = Math.hypot(n.x - WCX, n.y - WCY);
  });
  const order = G.nodes.map((_, i) => i).sort((a, b) => G.nodes[a].z - G.nodes[b].z);

  const isCross = G.edges.map(e => G.nodes[e[0]].lobe !== G.nodes[e[1]].lobe);
  const eLen = G.edges.map(e => Math.hypot(G.nodes[e[1]].x - G.nodes[e[0]].x,
                                           G.nodes[e[1]].y - G.nodes[e[0]].y));
  // Where the word projects onto each crossing edge — the stitch starts here.
  const stitchT = G.edges.map((e, i) => {
    const a = G.nodes[e[0]], b = G.nodes[e[1]];
    const vx = b.x - a.x, vy = b.y - a.y, L = vx * vx + vy * vy;
    return L ? Math.max(0, Math.min(1, ((WCX - a.x) * vx + (WCY - a.y) * vy) / L)) : 0;
  });
  const CROSS = G.edges.map((_, i) => i).filter(i => isCross[i]).sort((p, q) => {
    const off = (i: number) => {
      const e = G.edges[i], a = G.nodes[e[0]], b = G.nodes[e[1]];
      return Math.abs(a.y + (b.y - a.y) * stitchT[i] - WCY);
    };
    return off(p) - off(q);
  });

  // Distance from the word to every node, measured along the wiring rather
  // than through the air — the hover charge travels the real graph.
  const gdist = G.nodes.map(() => 1e9);
  CROSS.forEach(i => {
    const e = G.edges[i];
    gdist[e[0]] = Math.min(gdist[e[0]], eLen[i] * stitchT[i]);
    gdist[e[1]] = Math.min(gdist[e[1]], eLen[i] * (1 - stitchT[i]));
  });
  for (let k = 0; k < G.nodes.length; k++) {
    G.edges.forEach((e, i) => {
      if (gdist[e[0]] + eLen[i] < gdist[e[1]]) gdist[e[1]] = gdist[e[0]] + eLen[i];
      if (gdist[e[1]] + eLen[i] < gdist[e[0]]) gdist[e[0]] = gdist[e[1]] + eLen[i];
    });
  }
  const maxGD = Math.max.apply(null, gdist.filter(v => v < 1e8)) || 1;

  // The silhouette is drawn by two pens leaving the vertex nearest the word's
  // vertical axis, so the mark grows out of the word rather than round it.
  let seamTop = 0, seamBot = 0, bt = 1e9, bb = 1e9;
  G.outline.forEach((p, i) => {
    const d = Math.abs(p[0] - WCX);
    if (p[1] < WCY && d < bt) { bt = d; seamTop = i; }
    if (p[1] >= WCY && d < bb) { bb = d; seamBot = i; }
  });

  // Within a lobe, nodes nearest the seam arrive first: each half grows away
  // from the word.
  const lobeRank: Record<number, number> = {};
  [0, 1].forEach(L => {
    const ids = G.nodes.map((_, i) => i).filter(i => G.nodes[i].lobe === L)
      .sort((a, b) => G.nodes[a].rw - G.nodes[b].rw);
    ids.forEach((id, k) => { lobeRank[id] = k / Math.max(1, ids.length - 1); });
  });

  // ── layout ────────────────────────────────────────────────────────────
  let W = 0, H = 0, dpr = 1, scale = 1, ox = 0, oy = 0;
  function resize(): boolean {
    const r = cv.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return false;   // not laid out yet
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    const fit = Math.min(W * 0.86 / G.w, H * 0.80 / G.h);
    scale = fit; ox = W / 2 - (G.w / 2) * fit; oy = H / 2 - (G.h / 2) * fit;
    haloAt = -1;                                     // rebuild the cached glow
    return true;
  }
  const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => resize()) : null;
  ro?.observe(cv);

  // ── pointer ───────────────────────────────────────────────────────────
  let mx = 0, my = 0, tmx = 0, tmy = 0;
  let overWord = false, wasOver = false, hoverT = 0, floodAt = -1;
  const onMove = (e: PointerEvent) => {
    const r = cv.getBoundingClientRect();
    tmx = (e.clientX - r.left) / r.width - 0.5;
    tmy = (e.clientY - r.top) / r.height - 0.5;
    // Hit the WORD, not the whole canvas: hovering empty hero space should
    // not fire the reveal.
    const px = e.clientX - r.left, py = e.clientY - r.top;
    const wx = ox + WCX * scale, wy = oy + WCY * scale;
    const hit = Math.max(22, 62 * scale);
    overWord = Math.hypot(px - wx, py - wy) < hit;
  };
  const onLeave = () => { overWord = false; };
  // Touch has no hover: a tap anywhere on the mark plays the same sequence.
  const onDown = () => { overWord = true; setTimeout(() => { overWord = false; }, 1400); };
  if (!reduce) {
    addEventListener("pointermove", onMove, { passive: true });
    cv.addEventListener("pointerleave", onLeave);
    cv.addEventListener("pointerdown", onDown, { passive: true });
  }

  // ── the wordmark ──────────────────────────────────────────────────────
  const WORD_STEM = 10.07;                 // measured: the L's stem, logo units
  let haloC: HTMLCanvasElement | null = null, haloAt = -1, haloPad = 0;
  function traceWord(c: CanvasRenderingContext2D, L: Letter, x: number, y: number, w: number, h: number) {
    c.beginPath();
    const run = (pts: [number, number][]) => {
      for (let i = 0; i < pts.length; i++) {
        const X = x + pts[i][0] * w, Y = y + pts[i][1] * h;
        i ? c.lineTo(X, Y) : c.moveTo(X, Y);
      }
      c.closePath();
    };
    run(L.p); (L.h || []).forEach(run);     // evenodd punches the A's counter
  }
  function paintWord(c: CanvasRenderingContext2D, L: Letter, x: number, y: number, w: number, h: number) {
    const g = L.g;
    const gr = c.createLinearGradient(x + g.a[0] * w, y + g.a[1] * h, x + g.b[0] * w, y + g.b[1] * h);
    for (const [st, col] of g.s) gr.addColorStop(st, col);
    c.fillStyle = gr; c.fill("evenodd");
  }
  // The glow is rebuilt only on layout change, never per frame: a canvas
  // filter blur allocates a full-surface temporary. Three layers whose radii
  // scale with the letter's STEM, so the word glows by the same law the
  // nodes do rather than by a constant blur that reads as another material.
  function buildHalo() {
    const B = G.word.box, st = WORD_STEM * scale;
    const rad = [0.35 * st, 0.90 * st, 1.80 * st], al = [0.30, 0.18, 0.10];
    haloPad = Math.ceil(rad[2] * 3 + 4);
    const w = B.w * scale + haloPad * 2, h = B.h * scale + haloPad * 2;
    if (w < 4 || h < 4) return;
    haloC = document.createElement("canvas");
    haloC.width = Math.ceil(w * dpr); haloC.height = Math.ceil(h * dpr);
    const hc = haloC.getContext("2d");
    if (!hc) { haloC = null; return; }
    hc.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (let i = 0; i < 3; i++) {
      hc.save();
      hc.filter = "blur(" + rad[i].toFixed(2) + "px)";
      hc.globalAlpha = al[i];
      for (const L of G.word.letters) {
        traceWord(hc, L, haloPad, haloPad, B.w * scale, B.h * scale);
        paintWord(hc, L, haloPad, haloPad, B.w * scale, B.h * scale);
      }
      hc.restore();
    }
    haloAt = scale;
  }

  let raf = 0, t0 = performance.now(), running = true;
  let travStart = -1, nextTrav = 3600, travIdx = -1;
  const TRAV_MS = 1500;

  function pos(n: Node, time: number): [number, number] {
    const px = reduce ? 0 : mx * 22 * n.z, py = reduce ? 0 : my * 17 * n.z;
    const dx = reduce ? 0 : Math.sin(time * 0.00016 + n.phase) * 2.0 * n.z;
    const dy = reduce ? 0 : Math.cos(time * 0.00013 + n.phase * 1.3) * 1.8 * n.z;
    return [ox + n.x * scale + px + dx, oy + n.y * scale + py + dy];
  }

  function frame(now: number) {
    if (!running) return;
    if (W < 2 || H < 2) { if (!resize()) { raf = requestAnimationFrame(frame); return; } t0 = now; }
    const time = reduce ? 4000 : now - t0;
    mx += (tmx - mx) * 0.06; my += (tmy - my) * 0.06;

    const T = (a: number, b: number) => Math.max(0, Math.min(1, (time - a) / (b - a)));
    const B_WORD = [120, 520], B_SIL = [640, 1340],
          B_L0 = [1150, 1700], B_L1 = [1620, 2170], B_STITCH = [2300, 2600];
    const entrance = Math.min(1, time / 2600);
    const wob = reduce ? 0 : 1;

    // Hover is ADDITIVE. An earlier version dimmed the mark and restored it,
    // and what you noticed was the darkening, not the reveal. Here a charge
    // leaves the word and travels the wiring outward, lighting each edge as
    // it crosses and each node as it arrives. Nothing is taken away.
    if (overWord && !wasOver) floodAt = now;
    wasOver = overWord;
    hoverT += ((overWord ? 1 : 0) - hoverT) * 0.14;
    const _h = hoverT < 0.002 ? 0 : hoverT;
    const ease = reduce ? 0 : _h * _h * (3 - 2 * _h);
    const FLOOD_MS = 1150, CRESTW = 78;
    const flood = floodAt < 0 ? 0 : Math.max(0, Math.min(1, (now - floodAt) / FLOOD_MS));
    const front = flood * (maxGD + CRESTW);
    const crest = (d: number) => {
      const k = 1 - Math.abs(front - d) / CRESTW;
      return k > 0 ? k * k * (3 - 2 * k) : 0;
    };
    const hold = ease * 0.16;
    const boostNode = (i: number) => 1 + ease * 0.85 * crest(gdist[i]) + hold;
    const boostEdge = (i: number) => {
      const e = G.edges[i];
      return 1 + ease * 0.85 * crest(Math.min(gdist[e[0]], gdist[e[1]]) + eLen[i] * 0.5) + hold;
    };

    ctx!.clearRect(0, 0, W, H);

    // ── silhouette, drawn outward from the seam ─────────────────────────
    const O = G.outline, ON = O.length;
    const PX = (i: number) => ox + O[i][0] * scale + (reduce ? 0 : mx * 9);
    const PY = (i: number) => oy + O[i][1] * scale + (reduce ? 0 : my * 7);
    const g = reduce ? 1 : T(B_SIL[0], B_SIL[1]);
    const hazeOn = g >= 1;
    // Slightly stronger than the prototype: the hero scrim is lightest on
    // the right, which is exactly where this sits.
    ctx!.strokeStyle = "rgba(228,234,255," + (0.44 + 0.06 * wob * Math.sin(time * 0.0008)) + ")";
    ctx!.lineWidth = Math.max(1, 1.6 * scale); ctx!.lineJoin = "round";
    if (hazeOn) {
      ctx!.beginPath();
      for (let i = 0; i < ON; i++) { i ? ctx!.lineTo(PX(i), PY(i)) : ctx!.moveTo(PX(i), PY(i)); }
      ctx!.closePath(); ctx!.stroke();
    } else if (g > 0) {
      const fwd = (seamBot - seamTop + ON) % ON, bwd = ON - fwd;
      const nf = Math.floor(fwd * g), nb = Math.floor(bwd * g);
      ctx!.beginPath();
      ctx!.moveTo(PX(seamTop), PY(seamTop));
      for (let k = 1; k <= nf; k++) { const i = (seamTop + k) % ON; ctx!.lineTo(PX(i), PY(i)); }
      ctx!.moveTo(PX(seamTop), PY(seamTop));
      for (let k = 1; k <= nb; k++) { const i = (seamTop - k + ON) % ON; ctx!.lineTo(PX(i), PY(i)); }
      ctx!.stroke();
    }

    // ── the word, beneath the mark's own haze ───────────────────────────
    if (time > B_WORD[0]) {
      const la = G.word.letters.map((_, k) => reduce ? 1 : T(B_WORD[0] + k * 80, B_WORD[0] + k * 80 + 220));
      const appear = Math.max.apply(null, la);
      const B = G.word.box;
      // The word is the deepest element in the mark — every node computes
      // z >= 0.35 from its distance to the centre, and the word IS the
      // centre — so it is also the slowest, and it carries the same idle
      // drift, because at rest that drift is the only motion in the frame.
      const zAll = 0.30, WPH = 1.7;
      const pxOff = reduce ? 0 : mx * 22 * zAll, pyOff = reduce ? 0 : my * 17 * zAll;
      const dxOff = reduce ? 0 : Math.sin(time * 0.00016 + WPH) * 2.0 * zAll;
      const dyOff = reduce ? 0 : Math.cos(time * 0.00013 + WPH * 1.3) * 1.8 * zAll;
      const breathe = reduce ? 1 : 1 + 0.030 * Math.sin(time * 0.0012);
      const grow = breathe * (1 + 0.05 * ease);
      const ww = B.w * scale * grow, wh = B.h * scale * grow;
      const cx = ox + (B.x + B.w / 2) * scale + pxOff + dxOff;
      const cy = oy + (B.y + B.h / 2) * scale + pyOff + dyOff;
      const wx = cx - ww / 2, wy = cy - wh / 2;

      const bloom = ctx!.createRadialGradient(cx, cy, 0, cx, cy, ww * 0.78);
      bloom.addColorStop(0, "rgba(168,85,247," + (0.24 + 0.26 * ease) * appear + ")");
      bloom.addColorStop(0.5, "rgba(34,211,238," + (0.10 + 0.13 * ease) * appear + ")");
      bloom.addColorStop(1, "rgba(0,0,0,0)");
      ctx!.globalAlpha = 1; ctx!.fillStyle = bloom;
      ctx!.beginPath(); ctx!.arc(cx, cy, ww * 0.78, 0, 7); ctx!.fill();

      if (haloAt !== scale) buildHalo();
      if (haloC) {
        const gw = ww + 2 * haloPad * (ww / (B.w * scale)), gh = wh + 2 * haloPad * (wh / (B.h * scale));
        ctx!.globalAlpha = (0.85 + 0.55 * ease) * appear;
        ctx!.drawImage(haloC, cx - gw / 2, cy - gh / 2, gw, gh);
      }

      G.word.letters.forEach((L, k) => {
        ctx!.globalAlpha = la[k];
        traceWord(ctx!, L, wx, wy, ww, wh);
        paintWord(ctx!, L, wx, wy, ww, wh);
      });
      // The one shape with no contour was the word. Give it the silhouette's
      // stroke, on the silhouette's clock, at ~0.55x weight — full weight
      // reads as an outline, which is the sticker cue this removes.
      if (B.h * scale > 22) {
        ctx!.lineWidth = Math.max(0.8, 1.1 * scale); ctx!.lineJoin = "round";
        ctx!.strokeStyle = "rgba(228,234,255,1)";
        G.word.letters.forEach((L, k) => {
          ctx!.globalAlpha = (0.24 + 0.033 * wob * Math.sin(time * 0.0008)) * la[k];
          traceWord(ctx!, L, wx, wy, ww, wh); ctx!.stroke();
        });
      }
      ctx!.globalAlpha = 1;
    }

    // ── atmosphere, over the word and under the network ─────────────────
    // The word receives the mark's own haze the way anything deep inside it
    // would: aerial perspective in the scene's own hue, nothing invented.
    if (hazeOn) {
      ctx!.beginPath();
      for (let i = 0; i < ON; i++) { i ? ctx!.lineTo(PX(i), PY(i)) : ctx!.moveTo(PX(i), PY(i)); }
      ctx!.closePath();
      ctx!.save(); ctx!.clip();
      const gg = ctx!.createRadialGradient(ox + G.w * .5 * scale, oy + G.h * .5 * scale, 0,
                                           ox + G.w * .5 * scale, oy + G.h * .5 * scale, G.w * .62 * scale);
      gg.addColorStop(0, "rgba(130,100,235,0.16)"); gg.addColorStop(1, "rgba(0,0,0,0)");
      ctx!.fillStyle = gg; ctx!.fillRect(0, 0, W, H); ctx!.restore();
    }

    // ── edges ───────────────────────────────────────────────────────────
    ctx!.lineCap = "round";
    G.edges.forEach((e, i) => {
      const A = G.nodes[e[0]], Bn = G.nodes[e[1]];
      const cross = isCross[i];
      let local: number;
      if (reduce) local = 1;
      else if (cross) {
        const k = CROSS.indexOf(i);
        local = T(B_STITCH[0] + k * 46, B_STITCH[0] + k * 46 + 210);
      } else {
        const w = A.lobe ? B_L1 : B_L0;
        const rr = Math.max(lobeRank[e[0]] || 0, lobeRank[e[1]] || 0);
        const s0 = w[0] + 60 + rr * (w[1] - w[0]) * 0.5;
        local = T(s0, s0 + 250);
      }
      if (local <= 0) return;
      const [ax0, ay0] = pos(A, time), [bx0, by0] = pos(Bn, time);
      // Trim each end to the node's edge. Drawn centre-to-centre, a line runs
      // straight through every hollow ring, which the art never does.
      const L2 = Math.hypot(bx0 - ax0, by0 - ay0) || 1;
      const ux = (bx0 - ax0) / L2, uy = (by0 - ay0) / L2;
      const ra = A.r * scale * (A.shape ? 0.62 : 0.94), rb = Bn.r * scale * (Bn.shape ? 0.62 : 0.94);
      const ax = ax0 + ux * ra, ay = ay0 + uy * ra, bx = bx0 - ux * rb, by = by0 - uy * rb;
      const gr = ctx!.createLinearGradient(ax, ay, bx, by);
      gr.addColorStop(0, A.c); gr.addColorStop(1, Bn.c);
      const shimmer = reduce ? 0.5 : 0.42 + 0.16 * Math.sin(time * 0.0009 + i);
      // The crossings sit dimmer than the rest at rest: only five of the
      // thirty-eight edges join the halves, and drawing them at full weight
      // would overstate how strongly the mark is coupled. They settle there
      // over 700ms after arriving, so the beat still lands.
      let cw = 1;
      if (cross) {
        const k = CROSS.indexOf(i);
        cw = reduce ? 0.55 : 1 - 0.45 * T(B_STITCH[0] + k * 46 + 210, B_STITCH[0] + k * 46 + 910);
      }
      const lift = (travStart >= 0 && CROSS[travIdx] === i) ? 1.9 : 1;
      ctx!.globalAlpha = Math.min(1, shimmer * local * boostEdge(i) * cw * lift);
      ctx!.strokeStyle = gr;
      ctx!.lineWidth = Math.max(1, (cross ? 1.7 + 0.9 * (1 - (1 - cw) / 0.45) : 1.5) * scale);
      ctx!.beginPath();
      if (cross) {
        // Grows outward from the point nearest the word, both ways at once,
        // so the join visibly originates at ALL.
        const t = stitchT[i], px = ax + (bx - ax) * t, py = ay + (by - ay) * t;
        ctx!.moveTo(px, py); ctx!.lineTo(px + (ax - px) * local, py + (ay - py) * local);
        ctx!.moveTo(px, py); ctx!.lineTo(px + (bx - px) * local, py + (by - py) * local);
      } else {
        ctx!.moveTo(ax, ay); ctx!.lineTo(ax + (bx - ax) * local, ay + (by - ay) * local);
      }
      ctx!.stroke();
    });
    ctx!.globalAlpha = 1;

    // Arrival rings: the moment a stitch reaches the far side, the node it
    // reached acknowledges it. Alpha and radius only, never a colour change.
    if (!reduce) CROSS.forEach((i, k) => {
      const st = B_STITCH[0] + k * 46 + 210;
      const p = T(st, st + 420);
      if (p <= 0 || p >= 1) return;
      const e = G.edges[i];
      [e[0], e[1]].forEach(id => {
        const nd = G.nodes[id]; const [x, y] = pos(nd, time);
        ctx!.globalAlpha = 0.55 * (1 - p);
        ctx!.strokeStyle = nd.c; ctx!.lineWidth = Math.max(1, 1.2 * scale);
        ctx!.beginPath(); ctx!.arc(x, y, (nd.r + 3 + 10 * p) * scale, 0, 7); ctx!.stroke();
      });
    });
    ctx!.globalAlpha = 1;

    // ── traversal ───────────────────────────────────────────────────────
    // At rest, every few seconds ONE signal crosses from one half to the
    // other. It is the only moving thing, and it can only travel through the
    // seam, so the resting state keeps restating what the entrance said.
    if (!reduce && entrance >= 1 && CROSS.length) {
      if (travStart < 0 && time > nextTrav) { travStart = time; travIdx = (travIdx + 1) % CROSS.length; }
      if (travStart >= 0 && time - travStart > TRAV_MS) {
        travStart = -1; nextTrav = time + 3800 + Math.random() * 2600;
      }
    }
    if (travStart >= 0 && CROSS.length) {
      const e = G.edges[CROSS[travIdx]], A = G.nodes[e[0]], Bn = G.nodes[e[1]];
      const [ax, ay] = pos(A, time), [bx, by] = pos(Bn, time);
      const u = Math.max(0, Math.min(1, (time - travStart) / TRAV_MS));
      const x = ax + (bx - ax) * u, y = ay + (by - ay) * u;
      const rr = Math.max(1.6, 2.6 * scale), fade = Math.sin(Math.PI * u);
      const g2 = ctx!.createRadialGradient(x, y, 0, x, y, rr * 4);
      g2.addColorStop(0, "rgba(255,255,255," + 0.95 * fade + ")");
      g2.addColorStop(.35, u < 0.5 ? A.c : Bn.c);
      g2.addColorStop(1, "rgba(255,255,255,0)");
      ctx!.fillStyle = g2; ctx!.beginPath(); ctx!.arc(x, y, rr * 4, 0, 7); ctx!.fill();
    }

    // ── nodes ───────────────────────────────────────────────────────────
    for (const idx of order) {
      const nd = G.nodes[idx];
      const w = nd.lobe ? B_L1 : B_L0;
      const s0 = w[0] + (lobeRank[idx] || 0) * (w[1] - w[0]) * 0.62;
      const appear = reduce ? 1 : T(s0, s0 + 240);
      if (appear <= 0) continue;
      const [x, y] = pos(nd, time);
      const breathe = reduce ? 1 : 1 + 0.075 * Math.sin(time * 0.0012 + nd.phase);
      const pop = appear < 1 ? 1 + 0.5 * Math.sin(appear * Math.PI) * (1 - appear) : 1;
      const r = nd.r * scale * breathe * pop * appear;
      const bn = boostNode(idx);
      const gl = ctx!.createRadialGradient(x, y, 0, x, y, r * 4.2);
      gl.addColorStop(0, nd.c); gl.addColorStop(1, "rgba(0,0,0,0)");
      ctx!.globalAlpha = Math.min(0.75, 0.30 * appear * bn); ctx!.fillStyle = gl;
      ctx!.beginPath(); ctx!.arc(x, y, r * 4.2, 0, 7); ctx!.fill();

      ctx!.globalAlpha = Math.min(1, appear * bn);
      ctx!.fillStyle = nd.c;
      const sh = nd.shape ? G.shapes[nd.shape] : null;
      if (sh) {
        // Two GEARS and two TRIANGLES. Drawing them as circles is what
        // emptied the pocket around the word in the first place.
        const k = breathe * pop * appear;
        ctx!.beginPath();
        for (const loop of sh.loops) {
          for (let i = 0; i < loop.length; i++) {
            const X = x + (loop[i][0] - sh.cx) * scale * k, Y = y + (loop[i][1] - sh.cy) * scale * k;
            i ? ctx!.lineTo(X, Y) : ctx!.moveTo(X, Y);
          }
          ctx!.closePath();
        }
        ctx!.fill("evenodd");
        ctx!.globalAlpha = 0.9 * appear;
        ctx!.strokeStyle = "rgba(255,255,255,.75)"; ctx!.lineWidth = Math.max(.6, .9 * scale);
        ctx!.stroke();
      } else if (nd.hole) {
        // Most of the logo's nodes are HOLLOW RINGS.
        const rh = nd.hole * scale * breathe * pop * appear;
        ctx!.beginPath();
        ctx!.arc(x, y, r, 0, 7);
        ctx!.arc(x, y, Math.max(0.4, rh), 0, 7, true);
        ctx!.fill("evenodd");
        ctx!.globalAlpha = 0.9 * appear;
        ctx!.strokeStyle = "rgba(255,255,255,.75)"; ctx!.lineWidth = Math.max(.6, .9 * scale);
        ctx!.beginPath(); ctx!.arc(x, y, r, 0, 7); ctx!.stroke();
      } else {
        ctx!.beginPath(); ctx!.arc(x, y, r, 0, 7); ctx!.fill();
        ctx!.globalAlpha = 0.9 * appear;
        ctx!.strokeStyle = "rgba(255,255,255,.75)"; ctx!.lineWidth = Math.max(.6, .9 * scale);
        ctx!.beginPath(); ctx!.arc(x, y, r, 0, 7); ctx!.stroke();
      }
    }
    ctx!.globalAlpha = 1;

    if (reduce) return;                 // one frame is enough
    raf = requestAnimationFrame(frame);
  }

  // #hero-3d ships at opacity:0 and fades in on .loaded — the contract the
  // previous Three.js scene used. Without this the mark renders perfectly
  // into an invisible container.
  resize();
  host.classList.add("loaded");
  raf = requestAnimationFrame(frame);
  return () => {
    running = false; cancelAnimationFrame(raf);
    ro?.disconnect();
    removeEventListener("pointermove", onMove);
    cv.removeEventListener("pointerleave", onLeave);
    cv.removeEventListener("pointerdown", onDown);
    host.classList.remove("loaded"); cv.remove();
  };
}
