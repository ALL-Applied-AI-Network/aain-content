/**
 * tree-visualization.ts — D3-based interactive skill tree renderer.
 *
 * True root-system / pine-tree DAG layout:
 *  - Single root at top, branches only go downward
 *  - Node Y position = longest path from root (depth)
 *  - Deterministic, identical every load
 *  - Wide rectangular cards with thumbnail + title
 *  - Smooth bezier edge routing
 */

import * as d3 from "d3";
import {
  type TreeJson,
  type TreeNode,
  type TreeEdge,
  LAYER_COLORS,
  LAYER_NAMES,
  DIFFICULTY_COLORS,
  articleUrl,
  formatMinutes,
  loadTreeData,
  $,
} from "./main";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CARD_W = 240;              // card width
const CARD_H = 120;              // card height
const CARD_R = 10;               // border radius
const CARD_THUMB = 100;          // thumbnail size (square, left side)
const CARD_BORDER = 2;           // border thickness
const EDGE_WIDTH = 2;            // path thickness
const EDGE_GLOW_WIDTH = 8;       // glow behind paths

// Layout spacing
const DEPTH_GAP_Y = 170;         // vertical gap between depth levels
const NODE_GAP_X = 280;          // horizontal gap between nodes at same depth

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
    return { ...node, x: Math.round(p.x), y: Math.round(p.y), depth: depthMap.get(node.id) ?? 0 };
  });
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

export interface TreeVizOptions {
  container: HTMLElement;
  onNodeClick?: (node: TreeNode) => void;
  embedded?: boolean;
}

export class TreeVisualization {
  private svg!: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private g!: d3.Selection<SVGGElement, unknown, null, undefined>;
  private zoom!: d3.ZoomBehavior<SVGSVGElement, unknown>;
  private nodes: LayoutNode[] = [];
  private edges: TreeEdge[] = [];
  private tree: TreeJson | null = null;
  private tooltip: HTMLElement | null = null;
  private opts: TreeVizOptions;

  private activeLayer: number | null = null;
  private activeSeries: string | null = null;
  private activeDifficulty: string | null = null;

  // Cached element references for O(1) hover/filter lookups
  private nodeElements = new Map<string, SVGGElement>();
  private edgeElements: { el: SVGPathElement; from: string; to: string }[] = [];
  private edgeGlowElements: { el: SVGPathElement; from: string; to: string }[] = [];

  constructor(opts: TreeVizOptions) {
    this.opts = opts;
  }

  async init(): Promise<void> {
    this.tree = await loadTreeData();
    this.edges = this.tree.edges;
    this.nodes = computeLayout(this.tree.nodes, this.tree.edges);

    this.createSvg();
    this.createTooltip();
    this.render();
    this.fitView();
  }

  getTree(): TreeJson | null {
    return this.tree;
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

    // Single lightweight hover glow filter (only applied to hovered node)
    const hoverGlow = defs
      .append("filter")
      .attr("id", "node-hover-glow")
      .attr("x", "-15%")
      .attr("y", "-15%")
      .attr("width", "130%")
      .attr("height", "130%");
    hoverGlow
      .append("feDropShadow")
      .attr("dx", "0")
      .attr("dy", "0")
      .attr("stdDeviation", "6")
      .attr("flood-color", "#ffffff")
      .attr("flood-opacity", "0.12");

    this.g = this.svg.append("g").attr("class", "tree-root");

    this.zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.15, 3])
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

      const fromColor = LAYER_COLORS[from.layer] || "#6b7280";

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
        .attr("stroke-opacity", "0.18")
        .attr("fill", "none")
        .attr("stroke-width", String(EDGE_WIDTH))
        .attr("stroke-linecap", "round")
        .attr("data-from", edge.from)
        .attr("data-to", edge.to)
        .attr("data-layer", String(from.layer));

      this.edgeElements.push({ el: pathEl.node()!, from: edge.from, to: edge.to });
    }

    // --- Nodes (wide rectangular cards) ---
    const nodeGroup = this.g.append("g").attr("class", "nodes");
    this.nodeElements.clear();

    for (const node of this.nodes) {
      const color = LAYER_COLORS[node.layer] || "#6b7280";
      const root = isRootNode(node);
      const clipId = `clip-${node.id.replace(/[^a-zA-Z0-9]/g, "-")}`;

      // Clip path for thumbnail
      const thumbPad = (CARD_H - CARD_THUMB) / 2;
      defs
        .append("clipPath")
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
        .attr("data-layer", String(node.layer))
        .attr("transform", `translate(${node.x}, ${node.y})`)
        .style("cursor", "pointer");

      // Cache element reference for O(1) lookups
      this.nodeElements.set(node.id, g.node()!);

      // Card background
      g.append("rect")
        .attr("class", "tree-node__card")
        .attr("x", -CARD_W / 2)
        .attr("y", -CARD_H / 2)
        .attr("width", CARD_W)
        .attr("height", CARD_H)
        .attr("rx", CARD_R)
        .attr("ry", CARD_R)
        .attr("fill", "#12121e")
        .attr("stroke", color)
        .attr("stroke-width", String(root ? CARD_BORDER + 1 : CARD_BORDER))
        .attr("stroke-opacity", root ? "0.65" : "0.25")
;

      // Thumbnail (left side)
      if (node.thumbnail) {
        g.append("image")
          .attr("class", "tree-node__thumb")
          .attr("href", `./${node.thumbnail}`)
          .attr("x", -CARD_W / 2 + thumbPad)
          .attr("y", -CARD_H / 2 + thumbPad)
          .attr("width", CARD_THUMB)
          .attr("height", CARD_THUMB)
          .attr("clip-path", `url(#${clipId})`)
          .attr("preserveAspectRatio", "xMidYMid slice")
          .attr("opacity", "0.9");
      } else {
        g.append("rect")
          .attr("x", -CARD_W / 2 + thumbPad)
          .attr("y", -CARD_H / 2 + thumbPad)
          .attr("width", CARD_THUMB)
          .attr("height", CARD_THUMB)
          .attr("rx", 6)
          .attr("ry", 6)
          .attr("fill", color)
          .attr("opacity", "0.08");
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
          .attr("font-size", "11.5px")
          .attr("font-weight", root ? "700" : "600")
          .attr("fill", "#c8ccd4")
          .attr("font-family", "var(--font-display)")
          .text(line);
      }

      // Time estimate
      g.append("text")
        .attr("class", "node-time")
        .attr("x", titleX)
        .attr("y", textStartY + displayLines.length * lineHeight + 4)
        .attr("text-anchor", "start")
        .attr("dominant-baseline", "central")
        .attr("font-size", "9.5px")
        .attr("font-weight", "500")
        .attr("fill", "rgba(148, 163, 184, 0.4)")
        .attr("font-family", "var(--font-mono)")
        .text(formatMinutes(node.estimated_minutes));

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

      // Events
      g.on("mouseenter", (event: MouseEvent) => {
        this.onNodeHover(node, true);
        this.showTooltip(node, event);
      })
        .on("mousemove", (event: MouseEvent) => {
          this.moveTooltip(event);
        })
        .on("mouseleave", () => {
          this.onNodeHover(node, false);
          this.hideTooltip();
        })
        .on("click", () => {
          if (this.opts.onNodeClick) {
            this.opts.onNodeClick(node);
          }
        });
    }

    this.applyFilters();
  }

  // --- Tooltip ---

  private showTooltip(node: TreeNode, event: MouseEvent): void {
    if (!this.tooltip) return;
    const color = LAYER_COLORS[node.layer] || "#6b7280";
    const diffColor = DIFFICULTY_COLORS[node.difficulty] || "#6b7280";

    this.tooltip.innerHTML = `
      <div class="node-tooltip__header">
        <span class="node-tooltip__accent" style="background:${color}"></span>
        <span class="node-tooltip__layer">${LAYER_NAMES[node.layer] || ""}</span>
        <span class="node-tooltip__time">${formatMinutes(node.estimated_minutes)}</span>
      </div>
      <div class="node-tooltip__title">${node.title}</div>
      <div class="node-tooltip__desc">${node.description}</div>
      <div class="node-tooltip__footer">
        <span class="node-tooltip__diff" style="color:${diffColor}">${node.difficulty}</span>
        <span class="node-tooltip__click-hint">Click to view →</span>
      </div>
    `;

    this.tooltip.classList.add("visible");
    this.moveTooltip(event);
  }

  private moveTooltip(event: MouseEvent): void {
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

  private onNodeHover(node: LayoutNode, entering: boolean): void {
    const nodeId = node.id;

    if (!entering) {
      // Reset all edges via cached references
      for (const e of this.edgeElements) {
        e.el.setAttribute("stroke-opacity", "0.18");
        e.el.setAttribute("stroke-width", String(EDGE_WIDTH));
      }
      // Reset all nodes via cached references
      for (const [id, el] of this.nodeElements) {
        const group = d3.select(el);
        const isRoot = group.classed("tree-node--root");
        group.classed("tree-node--connected", false);
        group.select(".tree-node__card")
          .attr("filter", null)
          .attr("stroke-opacity", isRoot ? "0.65" : "0.25")
          .attr("fill", "#12121e");
        group.select(".tree-node__thumb").attr("opacity", "0.9");
        group.selectAll(".node-title").attr("fill", "#c8ccd4");
      }
      return;
    }

    // Find connected nodes from cached edge list
    const connectedNodeIds = new Set<string>([nodeId]);
    for (const e of this.edgeElements) {
      if (e.from === nodeId || e.to === nodeId) {
        connectedNodeIds.add(e.from);
        connectedNodeIds.add(e.to);
      }
    }

    // Update edges
    for (const e of this.edgeElements) {
      if (e.from === nodeId || e.to === nodeId) {
        e.el.setAttribute("stroke-opacity", "0.8");
        e.el.setAttribute("stroke-width", "3");
      } else {
        e.el.setAttribute("stroke-opacity", "0.04");
        e.el.setAttribute("stroke-width", "1.5");
      }
    }

    // Update nodes
    for (const [id, el] of this.nodeElements) {
      const group = d3.select(el);
      if (id === nodeId) {
        group.select(".tree-node__card")
          .attr("filter", "url(#node-hover-glow)")
          .attr("stroke-opacity", "0.9");
        group.select(".tree-node__thumb").attr("opacity", "1");
        group.selectAll(".node-title").attr("fill", "#ffffff");
      } else if (connectedNodeIds.has(id)) {
        group.classed("tree-node--connected", true);
        group.select(".tree-node__thumb").attr("opacity", "1");
        group.select(".tree-node__card").attr("stroke-opacity", "0.55");
      } else {
        group.select(".tree-node__thumb").attr("opacity", "0.2");
        group.select(".tree-node__card").attr("stroke-opacity", "0.08").attr("fill", "#0e0e18");
        group.selectAll(".node-title").attr("fill", "rgba(200,204,212,0.15)");
      }
    }
  }

  // --- Filtering ---

  setLayerFilter(layer: number | null): void {
    this.activeLayer = layer;
    this.applyFilters();
  }

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
      if (this.activeLayer !== null && node.layer !== this.activeLayer)
        pass = false;
      if (seriesNodeIds && !seriesNodeIds.has(node.id)) pass = false;
      if (this.activeDifficulty && node.difficulty !== this.activeDifficulty)
        pass = false;
      if (pass) passIds.add(node.id);
    }

    const hasFilter =
      this.activeLayer !== null ||
      this.activeSeries !== null ||
      this.activeDifficulty !== null;

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

    minX -= 30;
    maxX += 30;
    minY -= 15;
    maxY += 15;

    const treeW = maxX - minX;
    const treeH = maxY - minY;
    const padding = 20;

    const scale = Math.max(
      0.15,
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

  flyToNode(nodeId: string): void {
    const node = this.nodes.find((n) => n.id === nodeId);
    if (!node) return;
    const w = this.opts.container.clientWidth;
    const h = this.opts.container.clientHeight;
    const scale = 1.1;
    const tx = w / 2 - node.x * scale;
    const ty = h / 2 - node.y * scale;
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

export function openNodePanel(node: TreeNode, tree: TreeJson): void {
  const panel = $(".node-panel") as HTMLElement | null;
  if (!panel) return;

  const color = LAYER_COLORS[node.layer] || "#6b7280";
  const diffColor = DIFFICULTY_COLORS[node.difficulty] || "#6b7280";

  const prereqLinks = node.prerequisites
    .map((pid) => {
      const pn = tree.nodes.find((n) => n.id === pid);
      return pn
        ? `<li><a href="${articleUrl(pid)}" style="color:${LAYER_COLORS[pn.layer] || color}">${pn.title}</a></li>`
        : `<li>${pid}</li>`;
    })
    .join("");

  const unlockLinks = node.unlocks
    .map((uid) => {
      const un = tree.nodes.find((n) => n.id === uid);
      return un
        ? `<li><a href="${articleUrl(uid)}" style="color:${LAYER_COLORS[un.layer] || color}">${un.title}</a></li>`
        : `<li>${uid}</li>`;
    })
    .join("");

  const tagsHtml = node.tags
    .map(
      (t) =>
        `<span style="display:inline-block;padding:2px 8px;border-radius:4px;background:rgba(255,255,255,0.06);color:#94a3b8;font-size:0.7rem;margin:2px 4px 2px 0">${t}</span>`
    )
    .join("");

  const thumbHtml = node.thumbnail
    ? `<div class="node-panel__thumb"><img src="./${node.thumbnail}" alt="${node.title}" /></div>`
    : "";

  panel.style.setProperty("--panel-accent", color);

  panel.innerHTML = `
    <button class="node-panel__close" aria-label="Close">&times;</button>
    ${thumbHtml}
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
      <span class="node-panel__layer" style="background:${color}"></span>
      <span style="font-size:0.7rem;font-weight:600;color:${color}">${LAYER_NAMES[node.layer] || "Layer " + node.layer}</span>
      <span class="badge badge--${node.difficulty}" style="font-size:0.65rem;padding:2px 8px;border-radius:999px;background:${diffColor}22;color:${diffColor};border:1px solid ${diffColor}44">${node.difficulty}</span>
    </div>
    <h2 class="node-panel__title" style="color:#fff;margin:8px 0 6px">${node.title}</h2>
    <p class="node-panel__desc" style="color:#94a3b8;font-size:0.85rem;line-height:1.5;margin-bottom:12px">${node.description}</p>
    <div class="node-panel__meta-grid">
      <div class="node-panel__meta-item">
        <div class="node-panel__meta-label">Layer</div>
        <div class="node-panel__meta-value" style="color:${color}">${node.layer} - ${LAYER_NAMES[node.layer] || ""}</div>
      </div>
      <div class="node-panel__meta-item">
        <div class="node-panel__meta-label">Time</div>
        <div class="node-panel__meta-value">${formatMinutes(node.estimated_minutes)}</div>
      </div>
      <div class="node-panel__meta-item">
        <div class="node-panel__meta-label">Difficulty</div>
        <div class="node-panel__meta-value" style="color:${diffColor}">${node.difficulty}</div>
      </div>
    </div>
    ${tagsHtml ? `<div style="margin:8px 0">${tagsHtml}</div>` : ""}
    ${prereqLinks ? `<p class="node-panel__links-title" style="color:#94a3b8;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.05em;margin:12px 0 4px">Prerequisites</p><ul class="node-panel__link-list">${prereqLinks}</ul>` : ""}
    ${unlockLinks ? `<p class="node-panel__links-title" style="color:#94a3b8;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.05em;margin:12px 0 4px">Unlocks</p><ul class="node-panel__link-list">${unlockLinks}</ul>` : ""}
    <a href="${articleUrl(node.id)}" class="node-panel__cta" style="background:linear-gradient(135deg,${color},${LAYER_COLORS[Math.min(node.layer + 1, 5)] || color})">Read Article <span style="font-size:1.1em">&rarr;</span></a>
  `;

  panel.classList.add("open");

  panel.querySelector(".node-panel__close")?.addEventListener("click", () => {
    panel.classList.remove("open");
  });

  const escHandler = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      panel.classList.remove("open");
      document.removeEventListener("keydown", escHandler);
    }
  };
  document.addEventListener("keydown", escHandler);

  const outsideHandler = (e: MouseEvent) => {
    if (!panel.contains(e.target as Node)) {
      panel.classList.remove("open");
      document.removeEventListener("click", outsideHandler);
    }
  };
  setTimeout(() => document.addEventListener("click", outsideHandler), 100);
}
