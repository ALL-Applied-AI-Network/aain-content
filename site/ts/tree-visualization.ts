/**
 * tree-visualization.ts — D3-based interactive skill tree renderer.
 *
 * Renders tree.json as a top-to-bottom DAG with:
 *  - Game-style skill tree nodes with SVG thumbnail images
 *  - Nodes colored by layer with glow effects
 *  - Edges as smooth Bezier curves with arrowheads
 *  - Hover tooltips, click-to-open panel
 *  - Zoom + pan
 *  - Series highlighting & filtering
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

const NODE_WIDTH = 190;
const NODE_HEIGHT = 220;
const THUMB_HEIGHT = 140; // height of the thumbnail area within the card
const NODE_PAD_X = 260;
const LAYER_Y_SPACING = 500;
const NODE_BORDER_RADIUS = 14;
const NODE_BG = "#0e0e24";
const NODE_BG_HOVER = "#1a1a3e";
const STAGGER_Y = 55; // vertical stagger within layers for organic feel

// ---------------------------------------------------------------------------
// Layout — assign (x, y) positions to each node via layered approach
// ---------------------------------------------------------------------------

interface LayoutNode extends TreeNode {
  x: number;
  y: number;
}

/**
 * Layered layout with barycenter heuristic to minimize edge crossings.
 * Nodes sharing prerequisites are positioned near each other.
 */
function computeLayout(nodes: TreeNode[], edges: TreeEdge[]): LayoutNode[] {
  // Group nodes by layer
  const layers = new Map<number, TreeNode[]>();
  for (const node of nodes) {
    const arr = layers.get(node.layer) || [];
    arr.push(node);
    layers.set(node.layer, arr);
  }

  // Sort layers by key
  const sortedLayers = Array.from(layers.entries()).sort(
    ([a], [b]) => a - b
  );

  // Build adjacency maps for barycenter computation
  const parentOf = new Map<string, string[]>(); // node -> its prerequisites (parents)
  const childOf = new Map<string, string[]>();  // node -> nodes it unlocks (children)
  for (const node of nodes) {
    parentOf.set(node.id, []);
    childOf.set(node.id, []);
  }
  for (const edge of edges) {
    parentOf.get(edge.to)?.push(edge.from);
    childOf.get(edge.from)?.push(edge.to);
  }

  // First pass: assign initial x positions per layer (centered)
  const positionMap = new Map<string, { x: number; y: number }>();

  for (const [layerIdx, [, layerNodes]] of sortedLayers.entries()) {
    // Initial sort: alphabetical for the first layer
    const sorted = [...layerNodes].sort((a, b) =>
      a.title.localeCompare(b.title)
    );
    const count = sorted.length;
    const totalWidth = count * (NODE_WIDTH + NODE_PAD_X) - NODE_PAD_X;
    const startX = -totalWidth / 2;

    for (const [i, node] of sorted.entries()) {
      positionMap.set(node.id, {
        x: startX + i * (NODE_WIDTH + NODE_PAD_X),
        y: layerIdx * LAYER_Y_SPACING,
      });
    }
  }

  // Barycenter passes: sweep down then up to reduce crossings
  for (let pass = 0; pass < 4; pass++) {
    // Down sweep: order each layer by barycenter of parents
    for (const [layerIdx, [, layerNodes]] of sortedLayers.entries()) {
      if (layerIdx === 0) continue; // skip root layer

      const barycenters: { node: TreeNode; bc: number }[] = [];
      for (const node of layerNodes) {
        const parents = parentOf.get(node.id) || [];
        if (parents.length > 0) {
          const avgX =
            parents.reduce((sum, pid) => {
              const pos = positionMap.get(pid);
              return sum + (pos ? pos.x + NODE_WIDTH / 2 : 0);
            }, 0) / parents.length;
          barycenters.push({ node, bc: avgX });
        } else {
          // Keep existing position as barycenter
          const pos = positionMap.get(node.id);
          barycenters.push({ node, bc: pos ? pos.x + NODE_WIDTH / 2 : 0 });
        }
      }

      // Sort by barycenter
      barycenters.sort((a, b) => a.bc - b.bc);

      // Re-assign x positions, centered
      const count = barycenters.length;
      const totalWidth = count * (NODE_WIDTH + NODE_PAD_X) - NODE_PAD_X;
      const startX = -totalWidth / 2;
      for (const [i, entry] of barycenters.entries()) {
        const pos = positionMap.get(entry.node.id)!;
        pos.x = startX + i * (NODE_WIDTH + NODE_PAD_X);
      }
    }

    // Up sweep: order each layer by barycenter of children
    for (let li = sortedLayers.length - 2; li >= 0; li--) {
      const [, layerNodes] = sortedLayers[li];

      const barycenters: { node: TreeNode; bc: number }[] = [];
      for (const node of layerNodes) {
        const children = childOf.get(node.id) || [];
        if (children.length > 0) {
          const avgX =
            children.reduce((sum, cid) => {
              const pos = positionMap.get(cid);
              return sum + (pos ? pos.x + NODE_WIDTH / 2 : 0);
            }, 0) / children.length;
          barycenters.push({ node, bc: avgX });
        } else {
          const pos = positionMap.get(node.id);
          barycenters.push({ node, bc: pos ? pos.x + NODE_WIDTH / 2 : 0 });
        }
      }

      barycenters.sort((a, b) => a.bc - b.bc);

      const count = barycenters.length;
      const totalWidth = count * (NODE_WIDTH + NODE_PAD_X) - NODE_PAD_X;
      const startX = -totalWidth / 2;
      for (const [i, entry] of barycenters.entries()) {
        const pos = positionMap.get(entry.node.id)!;
        pos.x = startX + i * (NODE_WIDTH + NODE_PAD_X);
      }
    }
  }

  // Build final layout nodes with Y-staggering for organic feel
  const layoutNodes: LayoutNode[] = [];
  for (const [, [, layerNodes]] of sortedLayers.entries()) {
    // Sort by assigned X so stagger alternation is consistent
    const sorted = [...layerNodes].sort((a, b) => {
      const pa = positionMap.get(a.id)!;
      const pb = positionMap.get(b.id)!;
      return pa.x - pb.x;
    });
    for (const [i, node] of sorted.entries()) {
      const pos = positionMap.get(node.id)!;
      // Alternate stagger: even nodes shift up, odd nodes shift down
      const stagger = (i % 2 === 0 ? -1 : 1) * STAGGER_Y;
      layoutNodes.push({ ...node, x: pos.x, y: pos.y + stagger });
    }
  }

  return layoutNodes;
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

  // Filter state
  private activeLayer: number | null = null;
  private activeSeries: string | null = null;
  private activeDifficulty: string | null = null;

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

    // Defs for arrowheads, glow filters, and clip paths
    const defs = this.svg.append("defs");

    // Per-layer arrowhead markers
    for (const [layer, color] of Object.entries(LAYER_COLORS)) {
      defs
        .append("marker")
        .attr("id", `arrowhead-${layer}`)
        .attr("viewBox", "0 0 10 7")
        .attr("refX", 10)
        .attr("refY", 3.5)
        .attr("markerWidth", 8)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("polygon")
        .attr("points", "0 0, 10 3.5, 0 7")
        .attr("fill", color)
        .attr("opacity", "0.4");
    }

    // Default arrowhead (for highlighted state)
    defs
      .append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "0 0 10 7")
      .attr("refX", 10)
      .attr("refY", 3.5)
      .attr("markerWidth", 8)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("polygon")
      .attr("points", "0 0, 10 3.5, 0 7")
      .attr("class", "tree-edge-arrow");

    // Per-layer glow filters
    for (const [layer, color] of Object.entries(LAYER_COLORS)) {
      const filter = defs
        .append("filter")
        .attr("id", `glow-${layer}`)
        .attr("x", "-50%")
        .attr("y", "-50%")
        .attr("width", "200%")
        .attr("height", "200%");
      filter
        .append("feGaussianBlur")
        .attr("stdDeviation", "6")
        .attr("result", "blur");
      filter
        .append("feFlood")
        .attr("flood-color", color)
        .attr("flood-opacity", "0.7");
      filter
        .append("feComposite")
        .attr("in2", "blur")
        .attr("operator", "in");
      const merge = filter.append("feMerge");
      merge.append("feMergeNode");
      merge.append("feMergeNode").attr("in", "SourceGraphic");
    }

    // Generic glow filter (fallback)
    const glowFilter = defs
      .append("filter")
      .attr("id", "glow")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");
    glowFilter
      .append("feGaussianBlur")
      .attr("stdDeviation", "6")
      .attr("result", "blur");
    const merge = glowFilter.append("feMerge");
    merge.append("feMergeNode").attr("in", "blur");
    merge.append("feMergeNode").attr("in", "SourceGraphic");

    // Thumbnail clip path (rounded top corners for thumbnail area)
    defs
      .append("clipPath")
      .attr("id", "thumb-clip")
      .append("rect")
      .attr("x", 2)
      .attr("y", 2)
      .attr("width", NODE_WIDTH - 4)
      .attr("height", THUMB_HEIGHT - 2)
      .attr("rx", NODE_BORDER_RADIUS - 2)
      .attr("ry", NODE_BORDER_RADIUS - 2);

    // Subtle dot grid pattern for game-map feel
    const gridPattern = defs
      .append("pattern")
      .attr("id", "grid-dots")
      .attr("width", 40)
      .attr("height", 40)
      .attr("patternUnits", "userSpaceOnUse");
    gridPattern
      .append("circle")
      .attr("cx", 20)
      .attr("cy", 20)
      .attr("r", 0.8)
      .attr("fill", "#ffffff")
      .attr("opacity", "0.04");

    // Background rect with dot pattern
    this.svg
      .append("rect")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("fill", "url(#grid-dots)")
      .style("pointer-events", "none");

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

    // Build lookup for source node layer per edge
    const nodeMap = new Map<string, LayoutNode>();
    for (const n of this.nodes) nodeMap.set(n.id, n);

    // Edges (rendered first, below nodes)
    const edgeGroup = this.g.append("g").attr("class", "edges");

    for (const edge of this.edges) {
      const from = nodeMap.get(edge.from);
      const to = nodeMap.get(edge.to);
      if (!from || !to) continue;

      const x1 = from.x + NODE_WIDTH / 2;
      const y1 = from.y + NODE_HEIGHT;
      const x2 = to.x + NODE_WIDTH / 2;
      const y2 = to.y;

      // Smooth cubic Bezier: control points offset for natural curves
      const dy = (y2 - y1) * 0.55;

      const color = LAYER_COLORS[from.layer] || "#6366f1";
      const pathD = `M${x1},${y1} C${x1},${y1 + dy} ${x2},${y2 - dy} ${x2},${y2}`;

      // Glow path (wider, more transparent — rendered behind the main path)
      edgeGroup
        .append("path")
        .attr("d", pathD)
        .attr("class", "tree-edge-glow")
        .attr("stroke", color)
        .attr("stroke-opacity", "0.08")
        .attr("fill", "none")
        .attr("stroke-width", "8")
        .attr("data-from", edge.from)
        .attr("data-to", edge.to);

      // Main visible path
      edgeGroup
        .append("path")
        .attr("d", pathD)
        .attr("class", "tree-edge")
        .attr("stroke", color)
        .attr("stroke-opacity", "0.3")
        .attr("fill", "none")
        .attr("stroke-width", "2")
        .attr("marker-end", `url(#arrowhead-${from.layer})`)
        .attr("data-from", edge.from)
        .attr("data-to", edge.to)
        .attr("data-layer", String(from.layer));
    }

    // Nodes
    const nodeGroup = this.g.append("g").attr("class", "nodes");

    for (const node of this.nodes) {
      const color = LAYER_COLORS[node.layer] || "#6366f1";
      const diffColor = DIFFICULTY_COLORS[node.difficulty] || "#6366f1";

      const g = nodeGroup
        .append("g")
        .attr("class", "tree-node")
        .attr("data-id", node.id)
        .attr("data-layer", String(node.layer))
        .attr("transform", `translate(${node.x}, ${node.y})`)
        .style("cursor", "pointer");

      // Outer glow ring (game-style highlight behind the card)
      g.append("rect")
        .attr("class", "tree-node__glow")
        .attr("x", -4)
        .attr("y", -4)
        .attr("width", NODE_WIDTH + 8)
        .attr("height", NODE_HEIGHT + 8)
        .attr("rx", NODE_BORDER_RADIUS + 4)
        .attr("ry", NODE_BORDER_RADIUS + 4)
        .attr("fill", "none")
        .attr("stroke", color)
        .attr("stroke-width", "1")
        .attr("stroke-opacity", "0.15")
        .attr("filter", `url(#glow-${node.layer})`);

      // Card background rect
      g.append("rect")
        .attr("class", "tree-node__bg")
        .attr("width", NODE_WIDTH)
        .attr("height", NODE_HEIGHT)
        .attr("rx", NODE_BORDER_RADIUS)
        .attr("ry", NODE_BORDER_RADIUS)
        .attr("fill", NODE_BG)
        .attr("stroke", color)
        .attr("stroke-width", "1.5")
        .attr("stroke-opacity", "0.6");

      // Thumbnail area background (slightly darker)
      g.append("rect")
        .attr("class", "tree-node__thumb-bg")
        .attr("x", 2)
        .attr("y", 2)
        .attr("width", NODE_WIDTH - 4)
        .attr("height", THUMB_HEIGHT - 2)
        .attr("rx", NODE_BORDER_RADIUS - 2)
        .attr("ry", NODE_BORDER_RADIUS - 2)
        .attr("fill", "#08081a");

      // SVG thumbnail image
      if (node.thumbnail) {
        g.append("image")
          .attr("class", "tree-node__thumb")
          .attr("href", `./${node.thumbnail}`)
          .attr("x", 2)
          .attr("y", 2)
          .attr("width", NODE_WIDTH - 4)
          .attr("height", THUMB_HEIGHT - 2)
          .attr("clip-path", "url(#thumb-clip)")
          .attr("preserveAspectRatio", "xMidYMid slice");
      }

      // Gradient separator line between thumbnail and title area
      g.append("line")
        .attr("x1", 12)
        .attr("y1", THUMB_HEIGHT)
        .attr("x2", NODE_WIDTH - 12)
        .attr("y2", THUMB_HEIGHT)
        .attr("stroke", color)
        .attr("stroke-opacity", "0.3")
        .attr("stroke-width", "1");

      // Title text (below thumbnail, centered)
      const titleText =
        node.title.length > 24
          ? node.title.slice(0, 22) + "\u2026"
          : node.title;

      g.append("text")
        .attr("class", "node-title")
        .attr("x", NODE_WIDTH / 2)
        .attr("y", THUMB_HEIGHT + 26)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("font-weight", "700")
        .attr("fill", "#e8e8f0")
        .text(titleText);

      // Difficulty + time subtitle (centered)
      g.append("text")
        .attr("class", "node-meta")
        .attr("x", NODE_WIDTH / 2)
        .attr("y", THUMB_HEIGHT + 44)
        .attr("text-anchor", "middle")
        .attr("font-size", "10px")
        .attr("fill", "#64748b")
        .text(
          `${node.difficulty} \u00B7 ${formatMinutes(node.estimated_minutes)}`
        );

      // Difficulty indicator dot
      g.append("circle")
        .attr("cx", 16)
        .attr("cy", THUMB_HEIGHT + 35)
        .attr("r", 3.5)
        .attr("fill", diffColor)
        .attr("opacity", 0.85);

      // Layer-colored accent line at the top of the card
      g.append("rect")
        .attr("x", 6)
        .attr("y", 1)
        .attr("width", NODE_WIDTH - 12)
        .attr("height", 2.5)
        .attr("rx", 1.25)
        .attr("fill", color)
        .attr("opacity", "0.7");

      // Layer-colored accent line at the bottom of the card
      g.append("rect")
        .attr("x", NODE_WIDTH * 0.25)
        .attr("y", NODE_HEIGHT - 3)
        .attr("width", NODE_WIDTH * 0.5)
        .attr("height", 2)
        .attr("rx", 1)
        .attr("fill", color)
        .attr("opacity", "0.3");

      // Event handlers
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
    const color = LAYER_COLORS[node.layer] || "#6366f1";

    this.tooltip.innerHTML = `
      <div class="node-tooltip__title" style="color:${color}">${node.title}</div>
      <div class="node-tooltip__desc">${node.description}</div>
      <div class="node-tooltip__meta">
        <span>Layer ${node.layer} - ${LAYER_NAMES[node.layer] || ""}</span>
        <span>${node.difficulty}</span>
        <span>${formatMinutes(node.estimated_minutes)}</span>
      </div>
      ${
        node.tags.length
          ? `<div class="node-tooltip__tags">${node.tags.map((t) => `<span class="node-tooltip__tag">${t}</span>`).join("")}</div>`
          : ""
      }
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

  // --- Edge hover highlighting ---

  private onNodeHover(node: LayoutNode, entering: boolean): void {
    if (!entering) {
      // Reset all edges
      this.g.selectAll<SVGPathElement, unknown>(".tree-edge")
        .attr("stroke-opacity", "0.3")
        .attr("stroke-width", "2")
        .attr("filter", null);
      this.g.selectAll<SVGPathElement, unknown>(".tree-edge-glow")
        .attr("stroke-opacity", "0.08")
        .attr("stroke-width", "8");
      // Reset all nodes: remove connected class, clear glow, restore fill
      this.g.selectAll<SVGGElement, unknown>(".tree-node")
        .classed("tree-node--connected", false)
        .select(".tree-node__bg")
        .attr("filter", null)
        .attr("fill", NODE_BG);
      return;
    }

    const nodeId = node.id;

    // Find all connected edge from/to IDs
    const connectedNodeIds = new Set<string>([nodeId]);
    this.g.selectAll<SVGPathElement, unknown>(".tree-edge").each(function () {
      const from = this.getAttribute("data-from") || "";
      const to = this.getAttribute("data-to") || "";
      if (from === nodeId || to === nodeId) {
        connectedNodeIds.add(from);
        connectedNodeIds.add(to);
      }
    });

    // Highlight connected edges, dim others
    this.g.selectAll<SVGPathElement, unknown>(".tree-edge").each(function () {
      const from = this.getAttribute("data-from") || "";
      const to = this.getAttribute("data-to") || "";
      const sel = d3.select(this);
      if (from === nodeId || to === nodeId) {
        sel
          .attr("stroke-opacity", "1")
          .attr("stroke-width", "3");
      } else {
        sel
          .attr("stroke-opacity", "0.04")
          .attr("stroke-width", "1.5");
      }
    });

    // Also brighten glow paths for connected edges
    this.g.selectAll<SVGPathElement, unknown>(".tree-edge-glow").each(function () {
      const from = this.getAttribute("data-from") || "";
      const to = this.getAttribute("data-to") || "";
      const sel = d3.select(this);
      if (from === nodeId || to === nodeId) {
        sel.attr("stroke-opacity", "0.25").attr("stroke-width", "12");
      } else {
        sel.attr("stroke-opacity", "0.02").attr("stroke-width", "6");
      }
    });

    // Brighten connected nodes
    this.g.selectAll<SVGGElement, unknown>(".tree-node").each(function () {
      const id = this.getAttribute("data-id") || "";
      if (connectedNodeIds.has(id) && id !== nodeId) {
        d3.select(this).classed("tree-node--connected", true);
      }
    });

    // Apply glow to hovered node
    const layerStr = String(node.layer);
    this.g.selectAll<SVGGElement, unknown>(".tree-node").each(function () {
      const id = this.getAttribute("data-id") || "";
      if (id === nodeId) {
        d3.select(this).select(".tree-node__bg")
          .attr("filter", `url(#glow-${layerStr})`)
          .attr("fill", NODE_BG_HOVER);
      }
    });
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

    // Determine which node IDs pass the filter
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

    // Apply classes
    this.g.selectAll<SVGGElement, unknown>(".tree-node").each(function () {
      const id = this.getAttribute("data-id") || "";
      if (!hasFilter) {
        d3.select(this)
          .classed("tree-node--dimmed", false)
          .classed("tree-node--highlight", false);
      } else if (passIds.has(id)) {
        d3.select(this)
          .classed("tree-node--dimmed", false)
          .classed("tree-node--highlight", true);
      } else {
        d3.select(this)
          .classed("tree-node--dimmed", true)
          .classed("tree-node--highlight", false);
      }
    });

    this.g.selectAll<SVGPathElement, unknown>(".tree-edge").each(function () {
      const from = this.getAttribute("data-from") || "";
      const to = this.getAttribute("data-to") || "";
      if (!hasFilter) {
        d3.select(this)
          .classed("tree-edge--dimmed", false)
          .classed("tree-edge--highlight", false);
      } else if (passIds.has(from) && passIds.has(to)) {
        d3.select(this)
          .classed("tree-edge--dimmed", false)
          .classed("tree-edge--highlight", true);
      } else {
        d3.select(this)
          .classed("tree-edge--dimmed", true)
          .classed("tree-edge--highlight", false);
      }
    });
  }

  // --- View ---

  fitView(animate = true): void {
    if (!this.nodes.length) return;

    const containerEl = this.opts.container;
    const w = containerEl.clientWidth;
    const h = containerEl.clientHeight;

    // Compute bounding box of all nodes
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const n of this.nodes) {
      if (n.x < minX) minX = n.x;
      if (n.y < minY) minY = n.y;
      if (n.x + NODE_WIDTH > maxX) maxX = n.x + NODE_WIDTH;
      if (n.y + NODE_HEIGHT > maxY) maxY = n.y + NODE_HEIGHT;
    }

    const treeW = maxX - minX;
    const treeH = maxY - minY;
    const padding = 60;

    // Clamp scale: min 0.2 so tree fits even at large sizes, max 0.85 so it feels like a map
    const scale = Math.max(
      0.2,
      Math.min(
        (w - padding * 2) / treeW,
        (h - padding * 2) / treeH,
        0.85
      )
    );

    // Center both horizontally and vertically
    const tx = (w - treeW * scale) / 2 - minX * scale;
    const ty = (h - treeH * scale) / 2 - minY * scale;

    const transform = d3.zoomIdentity.translate(tx, ty).scale(scale);

    if (animate) {
      this.svg
        .transition()
        .duration(750)
        .call(this.zoom.transform, transform);
    } else {
      this.svg.call(this.zoom.transform, transform);
    }
  }

  highlightNode(nodeId: string): void {
    const node = this.nodes.find((n) => n.id === nodeId);
    if (!node) return;

    const containerEl = this.opts.container;
    const w = containerEl.clientWidth;
    const h = containerEl.clientHeight;

    const scale = 1.2;
    const tx = w / 2 - (node.x + NODE_WIDTH / 2) * scale;
    const ty = h / 2 - (node.y + NODE_HEIGHT / 2) * scale;

    const transform = d3.zoomIdentity.translate(tx, ty).scale(scale);
    this.svg.transition().duration(750).call(this.zoom.transform, transform);
  }
}

// ---------------------------------------------------------------------------
// Node detail panel (for tree.html)
// ---------------------------------------------------------------------------

export function openNodePanel(node: TreeNode, tree: TreeJson): void {
  const panel = $(".node-panel") as HTMLElement | null;
  if (!panel) return;

  const color = LAYER_COLORS[node.layer] || "#6366f1";
  const diffColor = DIFFICULTY_COLORS[node.difficulty] || "#6366f1";

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

  // Thumbnail preview in panel
  const thumbHtml = node.thumbnail
    ? `<div class="node-panel__thumb"><img src="./${node.thumbnail}" alt="${node.title}" /></div>`
    : "";

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
    ${
      prereqLinks
        ? `<p class="node-panel__links-title" style="color:#94a3b8;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.05em;margin:12px 0 4px">Prerequisites</p><ul class="node-panel__link-list">${prereqLinks}</ul>`
        : ""
    }
    ${
      unlockLinks
        ? `<p class="node-panel__links-title" style="color:#94a3b8;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.05em;margin:12px 0 4px">Unlocks</p><ul class="node-panel__link-list">${unlockLinks}</ul>`
        : ""
    }
    <a href="${articleUrl(node.id)}" class="btn btn--primary" style="width:100%;justify-content:center;margin-top:12px;background:linear-gradient(135deg,${color},${LAYER_COLORS[Math.min(node.layer + 1, 5)] || color});border:none;color:#fff;font-weight:600;padding:10px 16px;border-radius:8px;text-decoration:none;display:flex;align-items:center;gap:6px">Read Article <span style="font-size:1.1em">&rarr;</span></a>
  `;

  panel.classList.add("open");

  // Close on button click
  panel.querySelector(".node-panel__close")?.addEventListener("click", () => {
    panel.classList.remove("open");
  });

  // Close on Escape
  const escHandler = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      panel.classList.remove("open");
      document.removeEventListener("keydown", escHandler);
    }
  };
  document.addEventListener("keydown", escHandler);

  // Close on click outside panel
  const outsideHandler = (e: MouseEvent) => {
    if (!panel.contains(e.target as Node)) {
      panel.classList.remove("open");
      document.removeEventListener("click", outsideHandler);
    }
  };
  // Delay to avoid closing immediately from the node click that opened it
  setTimeout(() => document.addEventListener("click", outsideHandler), 100);
}
