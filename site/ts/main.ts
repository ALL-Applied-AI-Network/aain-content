/**
 * main.ts — Shared utilities, types, and data loading for the ALL Applied AI
 * Network site.
 */

// ---------------------------------------------------------------------------
// Types (mirrors tree.json)
// ---------------------------------------------------------------------------

export interface TreeContributor {
  name: string;
  role: string;
  url?: string;
  github?: string;
  affiliation?: string;
}

export interface TreeResource {
  title: string;
  url: string;
  type: string;
  note?: string;
  contributor?: string;
}

export interface TreeNode {
  id: string;
  title: string;
  description: string;
  /** Optional explicit color ("#rrggbb") — see resolveNodeColor for inheritance. */
  color?: string;
  difficulty: string;
  estimated_minutes: number;
  thumbnail: string;
  tags: string[];
  prerequisites: string[];
  unlocks: string[];
  content_path: string;
  notebook_path?: string;
  author?: string;
  contributors: TreeContributor[];
  resources: TreeResource[];
  last_updated?: string;
}

export interface TreeEdge {
  from: string;
  to: string;
}

export interface TreeSeries {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  nodes: string[];
}

export interface TreeStats {
  total_nodes: number;
  total_edges: number;
  total_series: number;
  by_difficulty: Record<string, number>;
}

export interface TreeJson {
  version: string;
  generated_at: string;
  nodes: TreeNode[];
  edges: TreeEdge[];
  series: TreeSeries[];
  stats: TreeStats;
}

// ---------------------------------------------------------------------------
// Color helpers
// ---------------------------------------------------------------------------

/** Fallback for nodes whose ancestor chain carries no explicit color. */
export const DEFAULT_NODE_COLOR = "#3dadcf";

/** Frozen preset swatches (the six former layer colors). */
export const PALETTE: string[] = [
  "#e0a83a",      // warm gold
  "#3dadcf",      // teal
  "#9b6dd7",      // purple
  "#d946ef",      // magenta
  "#e85d5d",      // red
  "#f5a623",      // amber
];

// Memoized resolutions, keyed per node map so stale trees never leak colors.
const colorCaches = new WeakMap<Map<string, TreeNode>, Map<string, string>>();

/**
 * Effective color of a node: its explicit `color` if set, otherwise the
 * effective color of its nearest ancestor (walking the first-prerequisite
 * chain), otherwise DEFAULT_NODE_COLOR. Cycle-guarded and memoized.
 */
export function resolveNodeColor(
  nodeId: string,
  nodesById: Map<string, TreeNode>
): string {
  let cache = colorCaches.get(nodesById);
  if (!cache) {
    cache = new Map();
    colorCaches.set(nodesById, cache);
  }

  // Walk up the first-prerequisite chain until an explicit color, a cached
  // resolution, a cycle, or a missing node ends the search.
  const chain: string[] = [];
  const visited = new Set<string>();
  let resolved = DEFAULT_NODE_COLOR;
  let currentId: string | undefined = nodeId;

  while (currentId !== undefined && !visited.has(currentId)) {
    const cached = cache.get(currentId);
    if (cached) {
      resolved = cached;
      break;
    }
    visited.add(currentId);

    const node = nodesById.get(currentId);
    if (!node) break;
    chain.push(currentId);

    if (node.color) {
      resolved = node.color;
      break;
    }
    currentId = node.prerequisites[0];
  }

  // Every node on the walked chain shares the same effective color.
  for (const id of chain) cache.set(id, resolved);
  return resolved;
}

export const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "#4ade80",
  intermediate: "#60a5fa",
  advanced: "#f59e0b",
  expert: "#ef4444",
};

// ---------------------------------------------------------------------------
// Data loading
// ---------------------------------------------------------------------------

let cachedTree: TreeJson | null = null;

export async function loadTreeData(): Promise<TreeJson> {
  if (cachedTree) return cachedTree;

  const resp = await fetch("./tree.json");
  if (!resp.ok) throw new Error(`Failed to load tree.json: ${resp.status}`);
  cachedTree = (await resp.json()) as TreeJson;
  return cachedTree;
}

export function getNodeById(tree: TreeJson, id: string): TreeNode | undefined {
  return tree.nodes.find((n) => n.id === id);
}

export function getSeriesForNode(
  tree: TreeJson,
  nodeId: string
): TreeSeries[] {
  return tree.series.filter((s) => s.nodes.includes(nodeId));
}

/**
 * For a given node in a series, returns the previous and next node IDs.
 */
export function getSeriesNav(
  series: TreeSeries,
  nodeId: string
): { prev: string | null; next: string | null } {
  const idx = series.nodes.indexOf(nodeId);
  return {
    prev: idx > 0 ? series.nodes[idx - 1] : null,
    next: idx < series.nodes.length - 1 ? series.nodes[idx + 1] : null,
  };
}

// ---------------------------------------------------------------------------
// URL helpers
// ---------------------------------------------------------------------------

export function articleUrl(nodeId: string): string {
  return `article.html?id=${encodeURIComponent(nodeId)}`;
}

export function treeUrl(options?: {
  series?: string;
  highlight?: string;
}): string {
  const params = new URLSearchParams();
  if (options?.series) params.set("series", options.series);
  if (options?.highlight) params.set("highlight", options.highlight);
  const qs = params.toString();
  return `tree.html${qs ? `?${qs}` : ""}`;
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

export function formatMinutes(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function totalEstimatedHours(nodes: TreeNode[]): number {
  const minutes = nodes.reduce((sum, n) => sum + n.estimated_minutes, 0);
  return Math.round(minutes / 60);
}

// ---------------------------------------------------------------------------
// DOM helpers
// ---------------------------------------------------------------------------

export function $(selector: string, parent: ParentNode = document): Element | null {
  return parent.querySelector(selector);
}

export function $$(selector: string, parent: ParentNode = document): Element[] {
  return Array.from(parent.querySelectorAll(selector));
}

export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs?: Record<string, string>,
  children?: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      el.setAttribute(k, v);
    }
  }
  if (children) {
    for (const child of children) {
      el.append(typeof child === "string" ? document.createTextNode(child) : child);
    }
  }
  return el;
}
