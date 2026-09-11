/**
 * tree-visualization.ts — D3-based interactive skill tree renderer.
 *
 * True root-system / pine-tree DAG layout:
 *  - Single root at top, branches only go downward
 *  - Node Y position = longest path from root (depth)
 *  - Deterministic, identical every load
 *  - Wide rectangular cards with thumbnail + title
 *  - Smooth bezier edge routing
 *
 * With `bands` supplied, the same layout runs once per curriculum chapter
 * and the chapters stack as outlined bands (banded-layout.ts, shared with
 * the dashboard) — the picture a hub's iframe shows is the one /me/learn
 * shows.
 */

import * as d3 from "d3";
import {
  type TreeJson,
  type TreeNode,
  type TreeEdge,
  type ChapterContext,
  type ChapterOverlayNode,
  DIFFICULTY_COLORS,
  resolveNodeColor,
  nodeArticleUrl,
  formatMinutes,
  loadTreeData,
  thumbnailSrc,
  escapeHtml,
  $,
} from "./main";
import {
  type BandBox,
  type BandConnector,
  type BandInput,
  BAND_GAP_Y,
  BAND_LABEL_H,
  BAND_PAD,
  computeBandedLayout,
} from "./banded-layout";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CARD_W = 240;              // card width
const CARD_H = 120;              // card height
const CARD_R = 10;               // border radius
const CARD_THUMB = 100;          // thumbnail size (square, left side)
const CARD_BORDER = 2;           // border thickness
const CARD_FILL = "#14141f";     // flat card face (the dashboard's cards are flat too)
const EDGE_WIDTH = 2;            // path thickness

// Layout spacing
const DEPTH_GAP_Y = 255;         // vertical gap between depth levels
const NODE_GAP_X = 420;          // horizontal gap between nodes at same depth

// Bands (same numbers the dashboard canvas draws)
const BAND_R = 12;               // outline corner radius
const SPINE_X = -60;             // x the chapter spine runs along
const SPINE_ARROW = 6;           // arrowhead size, world px
const FRAME_PAD = 60;            // breathing room beside a framed band
// Above and below a framed band the pad reaches past the gap into the
// neighbours, so the previous band's bottom edge and the next band's label
// sit at the frame edges — the reader can see there is more either way.
const FRAME_PAD_Y = BAND_GAP_Y + BAND_LABEL_H + BAND_PAD;
const FRAME_MS = 350;            // frameBand fly duration

// ---------------------------------------------------------------------------
// Depth computation — longest path from root
// ---------------------------------------------------------------------------

function computeDepths(nodes: TreeNode[], edges: TreeEdge[]): Map<string, number> {
  const children = new Map<string, string[]>();
  const parentsList = new Map<string, string[]>();
  for (const n of nodes) {
    children.set(n.id, []);
    parentsList.set(n.id, []);
  }
  for (const e of edges) {
    children.get(e.from)?.push(e.to);
    parentsList.get(e.to)?.push(e.from);
  }

  // Longest path via topological order (Kahn's algorithm)
  const depth = new Map<string, number>();
  const inDegree = new Map<string, number>();
  for (const n of nodes) {
    depth.set(n.id, -1);
    inDegree.set(n.id, parentsList.get(n.id)?.length ?? 0);
  }

  // Roots = nodes with no incoming edges
  const queue: string[] = [];
  for (const n of nodes) {
    if ((inDegree.get(n.id) ?? 0) === 0) {
      depth.set(n.id, 0);
      queue.push(n.id);
    }
  }

  while (queue.length > 0) {
    const id = queue.shift()!;
    const d = depth.get(id)!;
    for (const child of children.get(id) ?? []) {
      depth.set(child, Math.max(depth.get(child)!, d + 1));
      const remaining = (inDegree.get(child) ?? 1) - 1;
      inDegree.set(child, remaining);
      if (remaining === 0) queue.push(child);
    }
  }

  return depth;
}

// ---------------------------------------------------------------------------
// Deterministic layout
// ---------------------------------------------------------------------------

interface LayoutNode extends TreeNode {
  x: number;
  y: number;
  depth: number;
  /** Owning band id — only set when the canvas was laid out in bands. */
  band?: string;
}

function isRootNode(node: TreeNode): boolean {
  return node.prerequisites.length === 0;
}

/**
 * Root-system layout: position by DAG depth, order by barycenter.
 */
function computeLayout(nodes: TreeNode[], edges: TreeEdge[]): LayoutNode[] {
  const depthMap = computeDepths(nodes, edges);

  // Build adjacency for barycenter
  const children = new Map<string, string[]>();
  const parents = new Map<string, string[]>();
  for (const n of nodes) {
    children.set(n.id, []);
    parents.set(n.id, []);
  }
  for (const e of edges) {
    children.get(e.from)?.push(e.to);
    parents.get(e.to)?.push(e.from);
  }

  // Group by depth
  const depthGroups = new Map<number, TreeNode[]>();
  for (const n of nodes) {
    const d = depthMap.get(n.id) ?? 0;
    const arr = depthGroups.get(d) || [];
    arr.push(n);
    depthGroups.set(d, arr);
  }
  const depthKeys = Array.from(depthGroups.keys()).sort((a, b) => a - b);

  // --- Barycenter ordering ---
  const order = new Map<string, number>();

  // Seed depth 0
  const depth0 = depthGroups.get(0) || [];
  depth0.forEach((n, i) => order.set(n.id, i));

  // Top-down pass
  for (let di = 1; di < depthKeys.length; di++) {
    const dk = depthKeys[di];
    const depthNodes = depthGroups.get(dk) || [];
    const barycenters: { node: TreeNode; bc: number }[] = [];

    for (const n of depthNodes) {
      const pars = parents.get(n.id) || [];
      if (pars.length === 0) {
        barycenters.push({ node: n, bc: 0 });
      } else {
        const avg = pars.reduce((sum, pid) => sum + (order.get(pid) ?? 0), 0) / pars.length;
        barycenters.push({ node: n, bc: avg });
      }
    }
    barycenters.sort((a, b) => a.bc - b.bc);
    barycenters.forEach((item, i) => order.set(item.node.id, i));
  }

  // Bottom-up refinement
  for (let di = depthKeys.length - 2; di >= 0; di--) {
    const dk = depthKeys[di];
    const depthNodes = depthGroups.get(dk) || [];
    const barycenters: { node: TreeNode; bc: number }[] = [];

    for (const n of depthNodes) {
      const kids = children.get(n.id) || [];
      if (kids.length === 0) {
        barycenters.push({ node: n, bc: order.get(n.id) ?? 0 });
      } else {
        const avg = kids.reduce((sum, cid) => sum + (order.get(cid) ?? 0), 0) / kids.length;
        barycenters.push({ node: n, bc: avg });
      }
    }
    barycenters.sort((a, b) => a.bc - b.bc);
    barycenters.forEach((item, i) => order.set(item.node.id, i));
  }

  // Final top-down pass
  for (let di = 1; di < depthKeys.length; di++) {
    const dk = depthKeys[di];
    const depthNodes = depthGroups.get(dk) || [];
    const barycenters: { node: TreeNode; bc: number }[] = [];

    for (const n of depthNodes) {
      const pars = parents.get(n.id) || [];
      if (pars.length === 0) {
        barycenters.push({ node: n, bc: order.get(n.id) ?? 0 });
      } else {
        const avg = pars.reduce((sum, pid) => sum + (order.get(pid) ?? 0), 0) / pars.length;
        barycenters.push({ node: n, bc: avg });
      }
    }
    barycenters.sort((a, b) => a.bc - b.bc);
    barycenters.forEach((item, i) => order.set(item.node.id, i));
  }

  // --- Coordinate assignment ---
  const pos = new Map<string, { x: number; y: number }>();

  for (const dk of depthKeys) {
    const depthNodes = depthGroups.get(dk) || [];
    const ordered = [...depthNodes].sort(
      (a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)
    );
    const count = ordered.length;
    const totalWidth = (count - 1) * NODE_GAP_X;
    const startX = -totalWidth / 2;

    for (const [i, node] of ordered.entries()) {
      pos.set(node.id, {
        x: startX + i * NODE_GAP_X,
        y: dk * DEPTH_GAP_Y,
      });
    }
  }

  // Center vertically
  let sumY = 0;
  for (const p of pos.values()) sumY += p.y;
  const cy = sumY / pos.size;
  for (const p of pos.values()) p.y -= cy;

  return nodes.map((node) => {
    const p = pos.get(node.id)!;
    // Free-form pins (chapter overlay) win over the computed slot — same
    // world-coordinate semantics as the dashboard editor's drag-to-pin.
    const px = (node as Partial<ChapterOverlayNode>).pos_x;
    const py = (node as Partial<ChapterOverlayNode>).pos_y;
    const pin =
      typeof px === "number" && Number.isFinite(px) &&
      typeof py === "number" && Number.isFinite(py)
        ? { x: px, y: py }
        : null;
    return {
      ...node,
      x: Math.round((pin ?? p).x),
      y: Math.round((pin ?? p).y),
      depth: depthMap.get(node.id) ?? 0,
    };
  });
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

export interface TreeVizOptions {
  container: HTMLElement;
  onNodeClick?: (node: TreeNode) => void;
  embedded?: boolean;
  /** Pre-built tree (chapter overlay); omitted = fetch ./tree.json. */
  tree?: TreeJson;
  /** Active chapter overlay context — labels chapter-authored cards. */
  chapter?: ChapterContext | null;
  /**
   * Curriculum bands in reading order. Present → every card is placed inside
   * its band and the band outlines, labels and spine are drawn; absent → the
   * single free-form DAG layout.
   */
  bands?: BandInput[];
}

export class TreeVisualization {
  private svg!: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private g!: d3.Selection<SVGGElement, unknown, null, undefined>;
  private zoom!: d3.ZoomBehavior<SVGSVGElement, unknown>;
  private nodes: LayoutNode[] = [];
  private edges: TreeEdge[] = [];
  private bands: BandBox[] = [];
  private connectors: BandConnector[] = [];
  private tree: TreeJson | null = null;
  private nodesById = new Map<string, TreeNode>();
  private tooltip: HTMLElement | null = null;
  private opts: TreeVizOptions;

  private activeSeries: string | null = null;
  private activeDifficulty: string | null = null;

  // Cached element references for O(1) hover/filter lookups
  private nodeElements = new Map<string, SVGGElement>();
  private bandElements = new Map<string, SVGGElement>();
  private edgeElements: { el: SVGPathElement; from: string; to: string }[] = [];

  // A fit requested while the container has no size yet (hub iframes are
  // often display:none until their tab opens); runs on the first real size.
  private pendingFit: (() => void) | null = null;
  private sizeObserver: ResizeObserver | null = null;

  constructor(opts: TreeVizOptions) {
    this.opts = opts;
  }

  /**
   * Run a fit now if the container has a size, else once it first gets one.
   * Fitting a 0×0 container produces a transform at the minimum scale pinned
   * to nothing, and nothing later corrects it. Last request wins.
   */
  private whenSized(fit: () => void): boolean {
    const c = this.opts.container;
    if (c.clientWidth > 0 && c.clientHeight > 0) {
      this.pendingFit = null;
      return true;
    }
    this.pendingFit = fit;
    if (!this.sizeObserver && typeof ResizeObserver !== "undefined") {
      this.sizeObserver = new ResizeObserver(() => {
        if (c.clientWidth <= 0 || c.clientHeight <= 0 || !this.pendingFit) return;
        const run = this.pendingFit;
        this.pendingFit = null;
        this.sizeObserver?.disconnect();
        this.sizeObserver = null;
        run();
      });
      this.sizeObserver.observe(c);
    }
    return false;
  }

  async init(): Promise<void> {
    this.tree = this.opts.tree ?? (await loadTreeData());
    this.nodesById = new Map(this.tree.nodes.map((n) => [n.id, n]));
    if (this.opts.bands?.length) {
      this.layoutBanded(this.tree, this.opts.bands);
    } else {
      this.edges = this.tree.edges;
      this.nodes = computeLayout(this.tree.nodes, this.tree.edges);
    }

    this.createSvg();
    this.createTooltip();
    this.render();
    this.fitView();
  }

  getTree(): TreeJson | null {
    return this.tree;
  }

  /** Band boxes in reading order (empty without `bands`). */
  getBands(): readonly BandBox[] {
    return this.bands;
  }

  zoomBy(factor: number): void {
    this.svg.call(this.zoom.scaleBy, factor);
  }

  /**
   * Bands on: computeBandedLayout runs this file's computeLayout inside each
   * band and stacks the bands. Pins are stripped before that pass so the
   * per-band layout is pure; chapter-authored pins are re-applied afterwards
   * with x kept and y clamped into the band — the dashboard's rule, so a hub's
   * iframe and /me/learn place the officer's card the same way. Base-node
   * position overrides are ignored under bands.
   */
  private layoutBanded(tree: TreeJson, bands: BandInput[]): void {
    const unpinned = (n: TreeNode): TreeNode =>
      ({ ...n, pos_x: null, pos_y: null }) as TreeNode;
    const laid = computeBandedLayout(tree.nodes, tree.edges, bands, (ids, edges) =>
      computeLayout(
        ids.map(({ id }) => unpinned(this.nodesById.get(id)!)),
        edges,
      ),
    );

    const boxById = new Map(laid.bands.map((b) => [b.id, b]));
    const placed = new Map(laid.nodes.map((p) => [p.id, p]));
    const depthMap = computeDepths(tree.nodes, tree.edges);

    this.nodes = [];
    for (const node of tree.nodes) {
      const p = placed.get(node.id);
      // Listed in no band → not drawn (banded-layout's contract).
      if (!p) continue;
      const box = boxById.get(p.band)!;
      let { x, y } = p;
      const overlay = node as Partial<ChapterOverlayNode>;
      const px = overlay.pos_x;
      const py = overlay.pos_y;
      if (
        overlay.source === "chapter" &&
        typeof px === "number" && Number.isFinite(px) &&
        typeof py === "number" && Number.isFinite(py)
      ) {
        const top = box.y + BAND_LABEL_H + BAND_PAD + CARD_H / 2;
        const bottom = box.y + box.h - BAND_PAD - CARD_H / 2;
        // A pin left of the band would sit on the spine, so x is only kept
        // from the band's inset edge rightwards; the outline grows to keep
        // enclosing the card rather than leaving it floating outside.
        x = Math.round(Math.max(px, box.x + BAND_PAD + CARD_W / 2));
        y = Math.round(Math.min(bottom, Math.max(top, py)));
        const right = x + CARD_W / 2 + BAND_PAD;
        if (right > box.x + box.w) box.w = right - box.x;
      }
      this.nodes.push({
        ...node,
        x: Math.round(x),
        y: Math.round(y),
        depth: depthMap.get(node.id) ?? 0,
        band: p.band,
      });
    }

    // Lesson edges stay inside their band; a cross-band prerequisite lives in
    // the lesson panel instead. The one drawn exception is a chapter-authored
    // lesson hung under a base card in another band — tree-page's grouping
    // files such a lesson beside its parent, so this only fires for bands
    // built some other way, but the rule belongs here with the layout.
    const bandOf = new Map(laid.nodes.map((p) => [p.id, p.band]));
    this.edges = tree.edges.filter((e) => {
      const a = bandOf.get(e.from);
      const b = bandOf.get(e.to);
      if (!a || !b) return false;
      if (a === b) return true;
      const child = this.nodesById.get(e.to) as Partial<ChapterOverlayNode> | undefined;
      return child?.source === "chapter" && child.prerequisites?.[0] === e.from;
    });

    this.bands = laid.bands;
    this.connectors = laid.connectors;
  }

  // --- SVG setup ---

  private createSvg(): void {
    const container = this.opts.container;

    this.svg = d3
      .select(container)
      .append("svg")
      .attr("width", "100%")
      .attr("height", "100%");

    const defs = this.svg.append("defs");

    this.g = this.svg.append("g").attr("class", "tree-root");

    this.zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 3])
      .on("zoom", (event) => {
        this.g.attr("transform", event.transform);
      });

    this.svg.call(this.zoom);
  }

  private createTooltip(): void {
    this.tooltip = document.createElement("div");
    this.tooltip.className = "node-tooltip";
    this.opts.container.appendChild(this.tooltip);
  }

  // --- Rendering ---

  private render(): void {
    this.g.selectAll("*").remove();

    const nodeMap = new Map<string, LayoutNode>();
    for (const n of this.nodes) nodeMap.set(n.id, n);
    const defs = this.svg.select("defs");
    // Generated defs are re-created per render; drop the previous set so a
    // second render never accumulates duplicate SVG ids.
    defs.selectAll("[data-tree-generated]").remove();

    // --- Bands (outline + eyebrow label) and the chapter spine, under
    // everything else so cards and edges always paint on top ---
    this.bandElements.clear();
    if (this.bands.length) {
      const bandGroup = this.g.append("g").attr("class", "bands");
      const minutesByBand = new Map<string, number>();
      for (const n of this.nodes) {
        if (!n.band) continue;
        minutesByBand.set(n.band, (minutesByBand.get(n.band) ?? 0) + (n.estimated_minutes || 0));
      }

      for (const [i, band] of this.bands.entries()) {
        const g = bandGroup
          .append("g")
          .attr("class", "tree-band")
          .attr("data-band", band.id);
        this.bandElements.set(band.id, g.node()!);

        const outline = g.append("rect")
          .attr("class", "tree-band__outline")
          .attr("x", band.x)
          .attr("y", band.y)
          .attr("width", band.w)
          .attr("height", band.h)
          .attr("rx", BAND_R)
          .attr("ry", BAND_R)
          .attr("fill", "none")
          .attr("stroke", band.color)
          .attr("stroke-opacity", "0.25")
          .attr("stroke-width", "1");

        // "01 START WITH AI · 4 lessons · about 35 min". A one-column band
        // is only 288 wide, narrower than that label, so the outline grows
        // to the label rather than the label losing its count — every band
        // reads the same three-part eyebrow. this.bands is mutated so the
        // spine, fitView and frameBand see the widened box.
        const number = String(i + 1).padStart(2, "0");
        const minutes = minutesByBand.get(band.id) ?? 0;
        const parts = [
          `${number} ${band.title.toUpperCase()}`,
          `${band.count} lesson${band.count === 1 ? "" : "s"}`,
          minutes ? `about ${formatMinutes(minutes)}` : "",
        ].filter(Boolean);
        const label = g.append("text")
          .attr("class", "tree-band__label")
          .attr("x", band.x + BAND_PAD)
          .attr("y", band.y + BAND_LABEL_H / 2)
          .attr("text-anchor", "start")
          .attr("dominant-baseline", "central")
          .attr("fill", band.color)
          .text(parts.join(" · "));
        const labelW = label.node()!.getComputedTextLength() + BAND_PAD * 2;
        if (labelW > band.w) {
          band.w = Math.ceil(labelW);
          outline.attr("width", band.w);
        }
      }

      // Spine: one hairline per chapter connector, label to label, routed
      // down the left of the bands at SPINE_X so it never crosses a card.
      const boxById = new Map(this.bands.map((b) => [b.id, b]));
      const spineGroup = this.g.append("g").attr("class", "band-spine");
      const markerIds = new Map<string, string>();
      for (const [i, c] of this.connectors.entries()) {
        const from = boxById.get(c.from);
        const to = boxById.get(c.to);
        if (!from || !to) continue;
        // One arrowhead per colour: a marker cannot inherit its path's stroke.
        let markerId = markerIds.get(from.color);
        if (!markerId) {
          markerId = `band-arrow-${markerIds.size}`;
          markerIds.set(from.color, markerId);
          defs.append("marker")
            .attr("data-tree-generated", "")
            .attr("id", markerId)
            .attr("viewBox", "0 0 10 10")
            .attr("refX", "10")
            .attr("refY", "5")
            .attr("markerWidth", String(SPINE_ARROW))
            .attr("markerHeight", String(SPINE_ARROW))
            .attr("markerUnits", "userSpaceOnUse")
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M0,0 L10,5 L0,10 Z")
            .attr("fill", from.color)
            .attr("fill-opacity", "0.5");
        }
        const y0 = from.y + BAND_LABEL_H / 2;
        const y1 = to.y + BAND_LABEL_H / 2;
        spineGroup.append("path")
          .attr("class", "band-spine__link")
          .attr("data-index", String(i))
          .attr("d", `M${from.x},${y0} L${SPINE_X},${y0} L${SPINE_X},${y1} L${to.x},${y1}`)
          .attr("fill", "none")
          .attr("stroke", from.color)
          .attr("stroke-opacity", "0.5")
          .attr("stroke-width", "1")
          .attr("stroke-linejoin", "round")
          .attr("marker-end", `url(#${markerId})`);
      }
    }

    // --- Edges (smooth bezier curves for organic tree feel) ---
    // Single path per edge (no duplicate glow paths — halves DOM count)
    const edgeGroup = this.g.append("g").attr("class", "edges");
    this.edgeElements = [];

    for (const edge of this.edges) {
      const from = nodeMap.get(edge.from);
      const to = nodeMap.get(edge.to);
      if (!from || !to) continue;

      const x1 = from.x;
      const y1 = from.y + CARD_H / 2;
      const x2 = to.x;
      const y2 = to.y - CARD_H / 2;

      const fromColor = resolveNodeColor(edge.from, this.nodesById);

      // Smooth cubic bezier — organic tree-branch feel
      const dy = y2 - y1;
      const cy1 = y1 + dy * 0.45;
      const cy2 = y2 - dy * 0.45;
      const pathD = Math.abs(x1 - x2) < 2
        ? `M${x1},${y1} L${x2},${y2}`
        : `M${x1},${y1} C${x1},${cy1} ${x2},${cy2} ${x2},${y2}`;

      const pathEl = edgeGroup
        .append("path")
        .attr("d", pathD)
        .attr("class", "tree-edge")
        .attr("stroke", fromColor)
        .attr("stroke-opacity", "0.32")
        .attr("fill", "none")
        .attr("stroke-width", String(EDGE_WIDTH))
        .attr("stroke-linecap", "round")
        .attr("data-from", edge.from)
        .attr("data-to", edge.to);

      this.edgeElements.push({ el: pathEl.node()!, from: edge.from, to: edge.to });
    }

    // --- Nodes (wide rectangular cards) ---
    const nodeGroup = this.g.append("g").attr("class", "nodes");
    this.nodeElements.clear();

    for (const node of this.nodes) {
      const color = resolveNodeColor(node.id, this.nodesById);
      const root = isRootNode(node);
      const clipId = `clip-${node.id.replace(/[^a-zA-Z0-9]/g, "-")}`;

      // Clip path for thumbnail
      const thumbPad = (CARD_H - CARD_THUMB) / 2;
      defs
        .append("clipPath")
        .attr("data-tree-generated", "")
        .attr("id", clipId)
        .append("rect")
        .attr("x", -CARD_W / 2 + thumbPad)
        .attr("y", -CARD_H / 2 + thumbPad)
        .attr("width", CARD_THUMB)
        .attr("height", CARD_THUMB)
        .attr("rx", 6)
        .attr("ry", 6);

      const g = nodeGroup
        .append("g")
        .attr("class", `tree-node${root ? " tree-node--root" : ""}`)
        .attr("data-id", node.id)
        .attr("transform", `translate(${node.x}, ${node.y})`)
        .style("cursor", "pointer");

      // Cache element reference for O(1) lookups
      this.nodeElements.set(node.id, g.node()!);

      // Card face
      g.append("rect")
        .attr("class", "tree-node__card")
        .attr("x", -CARD_W / 2)
        .attr("y", -CARD_H / 2)
        .attr("width", CARD_W)
        .attr("height", CARD_H)
        .attr("rx", CARD_R)
        .attr("ry", CARD_R)
        .attr("fill", CARD_FILL)
        .attr("stroke", color)
        .attr("stroke-width", String(root ? CARD_BORDER + 1 : CARD_BORDER))
        .attr("stroke-opacity", root ? "0.80" : "0.40");

      // Subtle top-edge highlight for all cards
      if (!root) {
        g.append("line")
          .attr("x1", -CARD_W / 2 + CARD_R)
          .attr("y1", -CARD_H / 2 + 1)
          .attr("x2", CARD_W / 2 - CARD_R)
          .attr("y2", -CARD_H / 2 + 1)
          .attr("stroke", color)
          .attr("stroke-opacity", "0.18")
          .attr("stroke-width", "1");
      }

      // Thumbnail (left side)
      if (node.thumbnail) {
        g.append("image")
          .attr("class", "tree-node__thumb")
          .attr("href", thumbnailSrc(node.thumbnail))
          .attr("x", -CARD_W / 2 + thumbPad)
          .attr("y", -CARD_H / 2 + thumbPad)
          .attr("width", CARD_THUMB)
          .attr("height", CARD_THUMB)
          .attr("clip-path", `url(#${clipId})`)
          .attr("preserveAspectRatio", "xMidYMid slice")
          .attr("opacity", "1");
      } else {
        g.append("rect")
          .attr("x", -CARD_W / 2 + thumbPad)
          .attr("y", -CARD_H / 2 + thumbPad)
          .attr("width", CARD_THUMB)
          .attr("height", CARD_THUMB)
          .attr("rx", 6)
          .attr("ry", 6)
          .attr("fill", color)
          .attr("opacity", "0.15");
      }

      // Title text (right side, word-wrapped)
      const titleX = -CARD_W / 2 + thumbPad + CARD_THUMB + 12;
      const titleMaxW = CARD_W - thumbPad - CARD_THUMB - 12 - thumbPad;

      const titleWords = node.title.split(" ");
      const lines: string[] = [];
      let currentLine = "";
      for (const word of titleWords) {
        const test = currentLine ? `${currentLine} ${word}` : word;
        if (test.length > Math.floor(titleMaxW / 6) && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = test;
        }
      }
      if (currentLine) lines.push(currentLine);

      const displayLines = lines.slice(0, 4);
      if (lines.length > 4) {
        displayLines[3] = displayLines[3].slice(0, -1) + "\u2026";
      }

      const lineHeight = 15;
      const totalTextH = displayLines.length * lineHeight;
      const textStartY = -totalTextH / 2 + lineHeight / 2 - 4;

      for (const [i, line] of displayLines.entries()) {
        g.append("text")
          .attr("class", "node-title")
          .attr("x", titleX)
          .attr("y", textStartY + i * lineHeight)
          .attr("text-anchor", "start")
          .attr("dominant-baseline", "central")
          .attr("font-size", "12.5px")
          .attr("font-weight", root ? "700" : "600")
          .attr("fill", "#e8eaf0")
          .attr("font-family", "var(--font-display)")
          .text(line);
      }

      // Time estimate (chapter-authored nodes may not carry one)
      if (node.estimated_minutes) {
        g.append("text")
          .attr("class", "node-time")
          .attr("x", titleX)
          .attr("y", textStartY + displayLines.length * lineHeight + 4)
          .attr("text-anchor", "start")
          .attr("dominant-baseline", "central")
          .attr("font-size", "9.5px")
          .attr("font-weight", "500")
          .attr("fill", "rgba(148, 163, 184, 0.65)")
          .attr("font-family", "var(--font-mono)")
          .text(formatMinutes(node.estimated_minutes));
      }

      // Chapter chip — label the exception, not the default: only
      // chapter-authored cards get the chapter's name; base cards stay
      // unmarked (mirrors the dashboard canvas call).
      if (
        this.opts.chapter &&
        (node as Partial<ChapterOverlayNode>).source === "chapter"
      ) {
        const name = this.opts.chapter.name;
        const chipText = name.length > 18 ? `${name.slice(0, 17)}…` : name;
        const chipW = chipText.length * 5 + 14;
        const chipH = 15;
        const chipX = CARD_W / 2 - chipW - 8;
        const chipY = -CARD_H / 2 + 7;
        g.append("rect")
          .attr("class", "tree-node__chip")
          .attr("x", chipX)
          .attr("y", chipY)
          .attr("width", chipW)
          .attr("height", chipH)
          .attr("rx", chipH / 2)
          .attr("ry", chipH / 2)
          .attr("fill", "rgba(255,255,255,0.06)")
          .attr("stroke", color)
          .attr("stroke-opacity", "0.35")
          .attr("stroke-width", "1");
        g.append("text")
          .attr("x", chipX + chipW / 2)
          .attr("y", chipY + chipH / 2)
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "central")
          .attr("font-size", "8px")
          .attr("font-weight", "600")
          .attr("fill", "#94a3b8")
          .attr("font-family", "var(--font-mono)")
          .text(chipText);
      }

      // Root indicator — accent bar on top
      if (root) {
        g.append("rect")
          .attr("x", -CARD_W / 2 + CARD_R)
          .attr("y", -CARD_H / 2 - 3)
          .attr("width", CARD_W - CARD_R * 2)
          .attr("height", 3)
          .attr("rx", 1.5)
          .attr("fill", color)
          .attr("opacity", "0.6");
      }

      // Hit area
      g.append("rect")
        .attr("x", -CARD_W / 2 - 4)
        .attr("y", -CARD_H / 2 - 4)
        .attr("width", CARD_W + 8)
        .attr("height", CARD_H + 8)
        .attr("fill", "transparent")
        .attr("class", "tree-node__hit");

      // Events — use pointer events for unified mouse + touch support
      g.on("pointerenter", (event: PointerEvent) => {
        // Only show hover effects for mouse (not touch)
        if (event.pointerType === "mouse") {
          this.onNodeHover(node, true);
          this.showTooltip(node, event);
        }
      })
        .on("pointermove", (event: PointerEvent) => {
          if (event.pointerType === "mouse") {
            this.moveTooltip(event);
          }
        })
        .on("pointerleave", (event: PointerEvent) => {
          if (event.pointerType === "mouse") {
            this.onNodeHover(node, false);
            this.hideTooltip();
          }
        })
        .on("pointerdown", (event: PointerEvent) => {
          // Record touch start position for tap detection
          if (event.pointerType === "touch") {
            (g.node() as any).__tapStart = { x: event.clientX, y: event.clientY, time: Date.now() };
          }
        })
        .on("pointerup", (event: PointerEvent) => {
          if (event.pointerType === "touch") {
            const start = (g.node() as any).__tapStart;
            if (start) {
              const dx = event.clientX - start.x;
              const dy = event.clientY - start.y;
              const dt = Date.now() - start.time;
              // Treat as tap if finger moved < 10px and held < 500ms
              if (Math.sqrt(dx * dx + dy * dy) < 10 && dt < 500) {
                event.stopPropagation();
                if (this.opts.onNodeClick) {
                  this.opts.onNodeClick(node);
                }
              }
            }
          }
        })
        .on("click", (event: MouseEvent) => {
          // Mouse click (desktop)
          if (this.opts.onNodeClick) {
            this.opts.onNodeClick(node);
          }
        });
    }

    this.applyFilters();
  }

  // --- Tooltip ---

  private showTooltip(node: TreeNode, event: MouseEvent | PointerEvent): void {
    if (!this.tooltip) return;
    const color = resolveNodeColor(node.id, this.nodesById);
    const diffColor = DIFFICULTY_COLORS[node.difficulty] || "#6b7280";

    this.tooltip.innerHTML = `
      <div class="node-tooltip__header">
        <span class="node-tooltip__accent" style="background:${color}"></span>
        ${node.difficulty ? `<span class="node-tooltip__difficulty">${escapeHtml(node.difficulty)}</span>` : ""}
        ${node.estimated_minutes ? `<span class="node-tooltip__time">${formatMinutes(node.estimated_minutes)}</span>` : ""}
      </div>
      <div class="node-tooltip__title">${escapeHtml(node.title)}</div>
      <div class="node-tooltip__desc">${escapeHtml(node.description)}</div>
      <div class="node-tooltip__footer">
        <span class="node-tooltip__diff" style="color:${diffColor}">${escapeHtml(node.difficulty || "")}</span>
        <span class="node-tooltip__click-hint">Click to view →</span>
      </div>
    `;

    this.tooltip.style.borderLeftColor = color;
    this.tooltip.classList.add("visible");
    this.moveTooltip(event);
  }

  private moveTooltip(event: MouseEvent | PointerEvent): void {
    if (!this.tooltip) return;
    const rect = this.opts.container.getBoundingClientRect();
    const x = event.clientX - rect.left + 16;
    const y = event.clientY - rect.top - 8;
    this.tooltip.style.left = `${x}px`;
    this.tooltip.style.top = `${y}px`;
  }

  private hideTooltip(): void {
    if (this.tooltip) this.tooltip.classList.remove("visible");
  }

  // --- Hover highlighting ---

  /**
   * Hover lifts the card (stroke and face, no shadow) and its edges;
   * nothing else changes. Every other card stays at full contrast — the
   * canvas never dims to point at something, the same rule the dashboard
   * canvas follows.
   */
  private onNodeHover(node: LayoutNode, entering: boolean): void {
    const nodeId = node.id;

    if (!entering) {
      for (const e of this.edgeElements) {
        if (e.from !== nodeId && e.to !== nodeId) continue;
        e.el.setAttribute("stroke-opacity", "0.32");
        e.el.setAttribute("stroke-width", String(EDGE_WIDTH));
      }
      const el = this.nodeElements.get(nodeId);
      if (!el) return;
      const group = d3.select(el);
      const isRoot = group.classed("tree-node--root");
      group.select(".tree-node__card")
        .attr("stroke-opacity", isRoot ? "0.80" : "0.40")
        .attr("fill", CARD_FILL);
      group.selectAll(".node-title").attr("fill", "#e8eaf0");
      return;
    }

    for (const e of this.edgeElements) {
      if (e.from !== nodeId && e.to !== nodeId) continue;
      e.el.setAttribute("stroke-opacity", "0.8");
      e.el.setAttribute("stroke-width", "3");
    }
    const el = this.nodeElements.get(nodeId);
    if (!el) return;
    const group = d3.select(el);
    group.select(".tree-node__card")
      .attr("stroke-opacity", "0.9")
      .attr("fill", "#1e1e2e");
    group.selectAll(".node-title").attr("fill", "#ffffff");
  }

  // --- Filtering ---

  setSeriesFilter(seriesId: string | null): void {
    this.activeSeries = seriesId;
    this.applyFilters();
  }

  setDifficultyFilter(diff: string | null): void {
    this.activeDifficulty = diff;
    this.applyFilters();
  }

  private applyFilters(): void {
    if (!this.tree) return;

    const seriesNodeIds = this.activeSeries
      ? new Set(
          this.tree.series
            .find((s) => s.id === this.activeSeries)
            ?.nodes || []
        )
      : null;

    const passIds = new Set<string>();
    for (const node of this.nodes) {
      let pass = true;
      if (seriesNodeIds && !seriesNodeIds.has(node.id)) pass = false;
      if (this.activeDifficulty && node.difficulty !== this.activeDifficulty)
        pass = false;
      if (pass) passIds.add(node.id);
    }

    const hasFilter =
      this.activeSeries !== null || this.activeDifficulty !== null;

    for (const [id, el] of this.nodeElements) {
      const sel = d3.select(el);
      if (!hasFilter) {
        sel.classed("tree-node--dimmed", false).classed("tree-node--highlight", false);
      } else if (passIds.has(id)) {
        sel.classed("tree-node--dimmed", false).classed("tree-node--highlight", true);
      } else {
        sel.classed("tree-node--dimmed", true).classed("tree-node--highlight", false);
      }
    }

    for (const e of this.edgeElements) {
      const sel = d3.select(e.el);
      if (!hasFilter) {
        sel.classed("tree-edge--dimmed", false).classed("tree-edge--highlight", false);
      } else if (passIds.has(e.from) && passIds.has(e.to)) {
        sel.classed("tree-edge--dimmed", false).classed("tree-edge--highlight", true);
      } else {
        sel.classed("tree-edge--dimmed", true).classed("tree-edge--highlight", false);
      }
    }
  }

  // --- View ---

  fitView(animate = true): void {
    if (!this.nodes.length) return;
    if (!this.whenSized(() => this.fitView(false))) return;

    const containerEl = this.opts.container;
    const w = containerEl.clientWidth;
    const h = containerEl.clientHeight;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    for (const n of this.nodes) {
      if (n.x - CARD_W / 2 < minX) minX = n.x - CARD_W / 2;
      if (n.y - CARD_H / 2 - 10 < minY) minY = n.y - CARD_H / 2 - 10;
      if (n.x + CARD_W / 2 > maxX) maxX = n.x + CARD_W / 2;
      if (n.y + CARD_H / 2 + 10 > maxY) maxY = n.y + CARD_H / 2 + 10;
    }

    // Band outlines extend past their cards, and the spine runs left of
    // every band; both belong inside the fitted picture.
    for (const b of this.bands) {
      if (b.x < minX) minX = b.x;
      if (b.y < minY) minY = b.y;
      if (b.x + b.w > maxX) maxX = b.x + b.w;
      if (b.y + b.h > maxY) maxY = b.y + b.h;
    }
    if (this.connectors.length && SPINE_X < minX) minX = SPINE_X;

    minX -= 30;
    maxX += 30;
    minY -= 15;
    maxY += 15;

    const treeW = maxX - minX;
    const treeH = maxY - minY;
    const padding = 20;

    // Seven stacked bands are ~5,500 world px tall; at the old 0.25 floor
    // "All chapters" showed half of them. 0.1 keeps every outline and label
    // in view — cards are thumbnails at that size, which an overview is.
    const scale = Math.max(
      0.1,
      Math.min((w - padding * 2) / treeW, (h - padding * 2) / treeH, 0.85)
    );

    // Center on bounding box center (tree is symmetric now)
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const tx = w / 2 - cx * scale;
    const ty = h / 2 - cy * scale;

    const transform = d3.zoomIdentity.translate(tx, ty).scale(scale);

    if (animate) {
      this.svg.transition().duration(750).call(this.zoom.transform, transform);
    } else {
      this.svg.call(this.zoom.transform, transform);
    }
  }

  /** Every band in view — the "All chapters" / Escape target. */
  fitAll(animate = true): void {
    this.fitView(animate);
  }

  /**
   * Fly until the band's outline plus label fills the canvas. Scale is
   * clamped to [0.35, 0.9]: a seven-lesson band laid out in a row is wider
   * than any canvas, and past 0.35 the cards stop being readable, so a wide
   * band is framed at its left edge rather than shrunk to a strip. Returns
   * false for an unknown band id.
   */
  frameBand(bandId: string, animate = true): boolean {
    const band = this.bands.find((b) => b.id === bandId);
    if (!band) return false;
    if (!this.whenSized(() => this.frameBand(bandId, false))) return true;

    const w = this.opts.container.clientWidth;
    const h = this.opts.container.clientHeight;
    const scale = Math.max(
      0.35,
      Math.min(w / (band.w + FRAME_PAD * 2), h / (band.h + FRAME_PAD_Y * 2), 0.9)
    );
    // Centre on the band unless it is wider than the view — then pin the
    // left edge so the label and first cards are what the reader sees.
    const fitsAcross = band.w * scale <= w - FRAME_PAD * 2 * scale;
    const cx = band.x + band.w / 2;
    const cy = band.y + band.h / 2;
    const tx = fitsAcross ? w / 2 - cx * scale : FRAME_PAD * scale - band.x * scale;
    // A band shorter than the view hangs from the top: centred on a phone
    // it leaves half a screen of nothing above its label, and the next
    // band peeking in below is the cue to keep going. Taller bands were
    // fit to the height already, so centring them is the same picture.
    const fitsDown = band.h * scale <= h - FRAME_PAD_Y * 2 * scale;
    const ty = fitsDown ? FRAME_PAD * scale - band.y * scale : h / 2 - cy * scale;
    const transform = d3.zoomIdentity.translate(tx, ty).scale(scale);

    if (animate) {
      this.svg
        .transition()
        .duration(FRAME_MS)
        .ease(d3.easeCubicInOut)
        .call(this.zoom.transform, transform);
    } else {
      this.svg.call(this.zoom.transform, transform);
    }
    return true;
  }

  /** Thicken a band's outline (sidebar row hover) without moving the view. */
  highlightBand(bandId: string, active: boolean): void {
    const el = this.bandElements.get(bandId);
    if (el) d3.select(el).classed("tree-band--hover", active);
  }

  highlightNode(nodeId: string): void {
    const node = this.nodes.find((n) => n.id === nodeId);
    if (!node) return;
    const w = this.opts.container.clientWidth;
    const h = this.opts.container.clientHeight;
    const scale = 1.2;
    const tx = w / 2 - node.x * scale;
    const ty = h / 2 - node.y * scale;
    this.svg.transition().duration(750).call(this.zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
  }

  /**
   * Centre a card in the canvas — or, given `window` (container px, top to
   * bottom), in that strip: a phone's panel is a bottom sheet over most of
   * the canvas, and a card centred under it leaves a different lesson
   * peeking out on top. The card is scaled to fit the strip, never below
   * 0.6 where the title stops being readable.
   */
  flyToNode(nodeId: string, window?: { top: number; bottom: number }): void {
    const node = this.nodes.find((n) => n.id === nodeId);
    if (!node) return;
    const w = this.opts.container.clientWidth;
    const h = this.opts.container.clientHeight;
    const top = window?.top ?? 0;
    const bottom = window?.bottom ?? h;
    const scale = Math.min(1.1, Math.max(0.6, (bottom - top - 24) / CARD_H));
    const tx = w / 2 - node.x * scale;
    const ty = (top + bottom) / 2 - node.y * scale;
    this.svg.transition().duration(800).ease(d3.easeCubicInOut).call(this.zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
  }

  highlightNodeVisual(nodeId: string, active: boolean): void {
    const node = this.nodes.find((n) => n.id === nodeId);
    if (!node) return;
    this.onNodeHover(node, active);
  }
}

// ---------------------------------------------------------------------------
// Node detail panel
// ---------------------------------------------------------------------------

const panelListeners = new WeakMap<HTMLElement, () => void>();

export function openNodePanel(
  node: TreeNode,
  tree: TreeJson,
  chapter?: ChapterContext | null
): void {
  const panel = $(".node-panel") as HTMLElement | null;
  if (!panel) return;
  // Retire the previous opening's handlers before the new click can reach them.
  panelListeners.get(panel)?.();

  const nodesById = new Map(tree.nodes.map((n) => [n.id, n]));
  const color = resolveNodeColor(node.id, nodesById);
  const diffColor = DIFFICULTY_COLORS[node.difficulty] || "#6b7280";

  // Bodyless chapter nodes have no article page — render plain text.
  const linkFor = (id: string): string => {
    const n = nodesById.get(id);
    // An unresolved reference is still officer-authored text. Both
    // branches below escape; this one did not, which made a dangling
    // prerequisite/unlock a stored-XSS sink.
    if (!n) return `<li>${escapeHtml(id)}</li>`;
    const href = nodeArticleUrl(n, chapter?.slug);
    return href
      ? `<li><a href="${href}" style="color:${resolveNodeColor(id, nodesById)}">${escapeHtml(n.title)}</a></li>`
      : `<li><span style="color:${resolveNodeColor(id, nodesById)}">${escapeHtml(n.title)}</span></li>`;
  };

  const prereqLinks = node.prerequisites.map(linkFor).join("");
  const unlockLinks = node.unlocks.map(linkFor).join("");

  // Chapter chip mirrors the card treatment: mark the exception only.
  const chapterChip =
    chapter && (node as Partial<ChapterOverlayNode>).source === "chapter"
      ? `<span style="font-size:0.65rem;padding:2px 8px;border-radius:999px;background:rgba(255,255,255,0.06);color:#94a3b8;border:1px solid rgba(255,255,255,0.12)">${escapeHtml(chapter.name)}</span>`
      : "";

  const ctaHref = nodeArticleUrl(node, chapter?.slug);

  const tagsHtml = node.tags
    .map(
      (t) =>
        `<span style="display:inline-block;padding:2px 8px;border-radius:4px;background:rgba(255,255,255,0.06);color:#94a3b8;font-size:0.7rem;margin:2px 4px 2px 0">${escapeHtml(t)}</span>`
    )
    .join("");

  const thumbHtml = node.thumbnail
    ? `<div class="node-panel__thumb"><img src="${escapeHtml(thumbnailSrc(node.thumbnail))}" alt="${escapeHtml(node.title)}" /></div>`
    : "";

  panel.style.setProperty("--panel-accent", color);

  panel.innerHTML = `
    <button class="node-panel__close" aria-label="Close">&times;</button>
    ${thumbHtml}
    ${node.difficulty || chapterChip ? `<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
      ${node.difficulty ? `<span class="badge badge--${escapeHtml(node.difficulty)}" style="font-size:0.65rem;padding:2px 8px;border-radius:999px;background:${diffColor}22;color:${diffColor};border:1px solid ${diffColor}44">${escapeHtml(node.difficulty)}</span>` : ""}
      ${chapterChip}
    </div>` : ""}
    <h2 class="node-panel__title" style="color:#fff;margin:8px 0 6px">${escapeHtml(node.title)}</h2>
    <p class="node-panel__desc" style="color:#94a3b8;font-size:0.85rem;line-height:1.5;margin-bottom:12px">${escapeHtml(node.description)}</p>
    <div class="node-panel__meta-grid">
      ${node.estimated_minutes ? `<div class="node-panel__meta-item">
        <div class="node-panel__meta-label">Time</div>
        <div class="node-panel__meta-value">${formatMinutes(node.estimated_minutes)}</div>
      </div>` : ""}
      ${node.difficulty ? `<div class="node-panel__meta-item">
        <div class="node-panel__meta-label">Difficulty</div>
        <div class="node-panel__meta-value" style="color:${diffColor}">${escapeHtml(node.difficulty)}</div>
      </div>` : ""}
    </div>
    ${tagsHtml ? `<div style="margin:8px 0">${tagsHtml}</div>` : ""}
    ${prereqLinks ? `<p class="node-panel__links-title" style="color:#94a3b8;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.05em;margin:12px 0 4px">Prerequisites</p><ul class="node-panel__link-list">${prereqLinks}</ul>` : ""}
    ${unlockLinks ? `<p class="node-panel__links-title" style="color:#94a3b8;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.05em;margin:12px 0 4px">Unlocks</p><ul class="node-panel__link-list">${unlockLinks}</ul>` : ""}
    ${ctaHref ? `<a href="${ctaHref}" class="node-panel__cta" style="background:${color}">Read Article <span style="font-size:1.1em">&rarr;</span></a>` : ""}
  `;

  panel.classList.add("open");

  const listeners = new AbortController();
  let outsideTimer: ReturnType<typeof setTimeout>;
  const cleanup = () => {
    clearTimeout(outsideTimer);
    listeners.abort();
    panelListeners.delete(panel);
  };
  const close = () => { panel.classList.remove("open"); cleanup(); };
  panelListeners.set(panel, cleanup);
  panel.querySelector(".node-panel__close")?.addEventListener("click", close, { signal: listeners.signal });

  const escHandler = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      close();
    }
  };
  document.addEventListener("keydown", escHandler, { signal: listeners.signal });

  const outsideHandler = (e: MouseEvent | TouchEvent) => {
    const target = (e as TouchEvent).changedTouches
      ? (e as TouchEvent).changedTouches[0]?.target as Node
      : (e as MouseEvent).target as Node;
    if (target && !panel.contains(target)) {
      close();
    }
  };
  outsideTimer = setTimeout(() => {
    document.addEventListener("click", outsideHandler, { signal: listeners.signal });
    document.addEventListener("touchend", outsideHandler, { signal: listeners.signal });
  }, 300);
}
