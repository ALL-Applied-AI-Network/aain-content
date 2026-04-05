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
  layer: number;
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
  by_layer: Record<string, number>;
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
// Layer helpers
// ---------------------------------------------------------------------------

export const LAYER_COLORS: Record<number, string> = {
  0: "#e0a83a",      // warm gold — welcoming entry
  1: "#3dadcf",      // teal — building skills
  2: "#9b6dd7",      // purple — applied complexity
  3: "#d946ef",      // magenta — advanced
  4: "#e85d5d",      // red — expert
  5: "#f5a623",      // amber — mastery
};

export const LAYER_NAMES: Record<number, string> = {
  0: "Foundations",
  1: "Fundamentals",
  2: "Intermediate",
  3: "Advanced",
  4: "Expert",
  5: "Mastery",
};

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
  layer?: number;
  highlight?: string;
}): string {
  const params = new URLSearchParams();
  if (options?.series) params.set("series", options.series);
  if (options?.layer !== undefined) params.set("layer", String(options.layer));
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
