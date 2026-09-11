/** Shared with content/site/ts/banded-layout.ts. Keep the two copies identical.
 *
 * Banded layout: every lesson is drawn, grouped into horizontal bands in
 * curriculum order. Each band runs the caller's own DAG layout over its
 * lessons and the edges INSIDE it, then the bands are stacked, left-aligned,
 * with BAND_GAP_Y between them. Lesson-to-lesson edges never cross a band on
 * the canvas; the connectors between bands come from learningGraph(), the
 * same forward-only, nearest-earlier-chapter, at-most-one-incoming rule the
 * public forest drew — so the spine encodes exactly what docs/ui-consistency.md
 * states. Cross-band lesson prerequisites live in the lesson panel instead.
 *
 * The DAG layout is injected rather than imported: the dashboard's lives in
 * src/lib/tree-layout.ts and the public site's in tree-visualization.ts, and
 * this file has to compile unchanged in both repositories. */
import { learningGraph } from "./learning-graph";

export type BandInput = { id: string; title: string; color: string; nodeIds: string[] };
export type BandedNode = { id: string; x: number; y: number; band: string };
export type BandBox = { id: string; title: string; color: string; x: number; y: number; w: number; h: number; count: number };
export type BandConnector = { from: string; to: string };
export type BandedLayout = { nodes: BandedNode[]; bands: BandBox[]; connectors: BandConnector[] };
/** The injected per-band DAG layout. Positions are card CENTRES, like computeLayout's. */
export type BandLayoutFn = (nodes: { id: string }[], edges: { from: string; to: string }[]) => { id: string; x: number; y: number }[];

/** Card size both canvases draw (tree-layout.ts CARD_W/CARD_H, tree-visualization.ts CARD_W/CARD_H). */
export const BAND_CARD = { w: 240, h: 120 };
/** Width reserved left of every band. Zero: the label sits inside the band's top edge, not beside it. */
export const BAND_LABEL_W = 0;
/** Height reserved inside the band's top edge for its label and progress line. */
export const BAND_LABEL_H = 28;
/** Inset between a band's outline and its cards. */
export const BAND_PAD = 24;
/** Vertical gap between stacked bands. */
export const BAND_GAP_Y = 96;

/** Positions every node in its band and stacks the bands. Bands share a left
 * edge at x = BAND_LABEL_W; the first band's top edge is y = 0. Node x/y are
 * card centres. A band with no known nodes is skipped (learningGraph drops
 * empty chapters the same way), and a node listed in no band is not placed. */
export function computeBandedLayout(nodes: { id: string }[], edges: { from: string; to: string }[], bands: BandInput[], layoutFn: BandLayoutFn, card = BAND_CARD): BandedLayout {
  const unplaced = new Set(nodes.map(n => n.id));
  const out: BandedLayout = { nodes: [], bands: [], connectors: [] };
  const chapters: { id: string; title: string; nodes: string[] }[] = [];
  let top = 0;
  for (const band of bands) {
    // First band listing a node owns it, so every node is drawn exactly once.
    const ids = band.nodeIds.filter(id => unplaced.delete(id));
    if (ids.length === 0) continue;
    const inBand = new Set(ids);
    const positioned = layoutFn(ids.map(id => ({ id })), edges.filter(e => inBand.has(e.from) && inBand.has(e.to)));
    const at = new Map(positioned.map(p => [p.id, p]));
    const xs = ids.map(id => at.get(id)?.x ?? 0), ys = ids.map(id => at.get(id)?.y ?? 0);
    const minX = Math.min(...xs), minY = Math.min(...ys);
    // Shift so the top-left card sits at the band's inset corner.
    const dx = BAND_LABEL_W + BAND_PAD + card.w / 2 - minX;
    const dy = top + BAND_LABEL_H + BAND_PAD + card.h / 2 - minY;
    for (const id of ids) out.nodes.push({ id, x: (at.get(id)?.x ?? 0) + dx, y: (at.get(id)?.y ?? 0) + dy, band: band.id });
    const w = Math.max(...xs) - minX + card.w + 2 * BAND_PAD;
    const h = Math.max(...ys) - minY + card.h + 2 * BAND_PAD + BAND_LABEL_H;
    out.bands.push({ id: band.id, title: band.title, color: band.color, x: BAND_LABEL_W, y: top, w, h, count: ids.length });
    chapters.push({ id: band.id, title: band.title, nodes: ids });
    top += h + BAND_GAP_Y;
  }
  // The band spine IS the public forest's chapter graph; only the id prefix differs.
  const lessons = nodes.map(n => ({ id: n.id, title: n.id, prerequisites: edges.filter(e => e.to === n.id).map(e => e.from) }));
  out.connectors = learningGraph(chapters, lessons, "", 1120).edges.map(e => ({ from: e.from.slice("chapter:".length), to: e.to.slice("chapter:".length) }));
  return out;
}
