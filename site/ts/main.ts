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
// Chapter overlay (network API)
// ---------------------------------------------------------------------------

/** Dashboard origin serving the public chapter learning-tree endpoint. */
export const NETWORK_API_ORIGIN = "https://dashboard.all-ai-network.org";

/** Same shape chapter slugs are minted in — anything else never fetches. */
const CHAPTER_SLUG_RE = /^[a-z0-9][a-z0-9-]{0,79}$/i;

/** Overlay fetch budget — past this the plain base tree renders alone. */
const CHAPTER_FETCH_TIMEOUT_MS = 6000;

export interface ChapterContext {
  slug: string;
  name: string;
}

/** Node shape served by /api/public/learning-tree/{slug} (the v1 shape). */
export interface ChapterTreeNode {
  id: string;
  parent_ref: string | null;
  title: string;
  summary: string | null;
  /** Markdown article body — chapter-authored nodes only. */
  body: string | null;
  sort_order: number;
  tags: string[];
  source: "base" | "chapter";
  slug: string | null;
  /** Full DAG prerequisites (base nodes; chapter nodes use parent_ref). */
  prereqs?: string[];
  /** Free-form canvas pin (world coords); null = computed layout. */
  pos_x?: number | null;
  pos_y?: number | null;
  /** Explicit card color; null = inherit (see resolveNodeColor). */
  color?: string | null;
  difficulty?: string | null;
  estimated_minutes?: number | null;
  /** ABSOLUTE url — the API absolutizes base thumbnails. */
  thumbnail?: string | null;
  overridden?: boolean;
  parent_overridden?: boolean;
}

export interface ChapterTreePayload {
  chapter: ChapterContext;
  nodes: ChapterTreeNode[];
  edges: TreeEdge[];
}

/**
 * Validated ?chapter= slug from the current URL, or null. Composes with
 * every other param (?embed=1, ?highlight=...).
 */
export function chapterParam(): string | null {
  const raw = new URLSearchParams(window.location.search).get("chapter");
  if (!raw) return null;
  const slug = raw.trim();
  return CHAPTER_SLUG_RE.test(slug) ? slug : null;
}

/**
 * HTML-escape text before interpolating it into an innerHTML template
 * or an HTML attribute. Escapes quotes too (attribute-safe), unlike
 * the article-renderer's markdown-only variant.
 *
 * Base tree.json content is trusted (it's repo-reviewed), but the
 * chapter overlay routes chapter-officer-authored title/summary/tags —
 * which the dashboard only length-validates — through the same
 * innerHTML sinks. Without escaping, a node titled `<img onerror=…>`
 * is stored XSS on all-ai-network.org. The node card labels use D3
 * `.text()` (textContent — already safe); this is only for the
 * innerHTML paths (tooltip, panel, sidebar, article page).
 */
/**
 * Chapter overlay fields are officer-authored and arrive from the public
 * API. Title/summary/tags were already escaped at their sinks; difficulty,
 * color, id and thumbnail were not, and reached innerHTML and style/src
 * attributes raw (security audit 2026-08-18, findings 2).
 *
 * These constrain at the source rather than patching each sink, so a sink
 * added later cannot reintroduce the hole.
 */
const DIFFICULTY_VALUES = new Set([
  "beginner",
  "intermediate",
  "advanced",
  "expert",
]);

/** Only the known difficulty words survive; anything else becomes "". */
export function safeDifficulty(value: unknown): string {
  if (typeof value !== "string") return "";
  const v = value.trim().toLowerCase();
  return DIFFICULTY_VALUES.has(v) ? v : "";
}

/** A CSS colour that is safe to drop into a style attribute: hex, or a bare
 *  CSS colour keyword. Both are quote-, paren- and semicolon-free, so they
 *  cannot break out of `style="background:…"`. */
export function safeCssColor(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const v = value.trim();
  if (/^#[0-9a-f]{3,8}$/i.test(v)) return v;
  if (/^[a-z]{3,20}$/i.test(v)) return v;
  return undefined;
}

/** Node ids become data-node-id attributes, DOM ids and URL params. */
export function safeNodeId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const v = value.trim();
  return /^[A-Za-z0-9_-]{1,120}$/.test(v) ? v : null;
}

/** Thumbnails end up in an img src. Allow http(s) and simple relative
 *  paths; reject anything carrying a quote, angle bracket or scheme we
 *  don't recognise (javascript:, data:, …). */
export function safeThumbnail(value: unknown): string {
  if (typeof value !== "string") return "";
  const v = value.trim();
  if (!v || /["'<>\\\s]/.test(v)) return "";
  if (/^https?:\/\//i.test(v)) return v;
  if (/^[A-Za-z0-9._\/-]+$/.test(v)) return v;
  return "";
}

export function escapeHtml(value: string | null | undefined): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Fetch a chapter's merged learning tree from the network API. Returns
 * null on ANY failure — bad slug, HTTP error, ~6s timeout, malformed
 * payload — so callers can silently fall back to the plain tree.json
 * experience (the public tree must be unbreakable by chapter data).
 */
export async function loadChapterTree(
  slug: string
): Promise<ChapterTreePayload | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CHAPTER_FETCH_TIMEOUT_MS);
  try {
    const resp = await fetch(
      `${NETWORK_API_ORIGIN}/api/public/learning-tree/${encodeURIComponent(slug)}`,
      { signal: controller.signal }
    );
    if (!resp.ok) return null;
    const payload = (await resp.json()) as ChapterTreePayload;
    // Minimal shape check — an empty node set means the API itself
    // degraded (base fetch failed server-side), so local tree.json wins.
    if (
      !payload ||
      typeof payload.chapter?.name !== "string" ||
      !Array.isArray(payload.nodes) ||
      payload.nodes.length === 0 ||
      !Array.isArray(payload.edges)
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * TreeNode extended with the chapter-overlay passthrough fields the
 * renderer and article page key on. Base tree.json nodes never carry
 * `source`, so `source === "chapter"` safely identifies overlay nodes.
 */
export interface ChapterOverlayNode extends TreeNode {
  source: "base" | "chapter";
  body: string | null;
  /** Chapter-authored node with a non-empty body → article.html target. */
  hasArticle: boolean;
  pos_x: number | null;
  pos_y: number | null;
}

/**
 * Adapt the API payload into the TreeJson node shape the viz consumes.
 * unlocks are derived from the edge to-lists (the payload doesn't carry
 * them); prerequisites come from prereqs (base) / parent_ref (chapter)
 * so resolveNodeColor's inheritance walk works unchanged.
 */
export function adaptChapterTree(
  payload: ChapterTreePayload
): ChapterOverlayNode[] {
  const unlocksByFrom = new Map<string, string[]>();
  for (const e of payload.edges) {
    const arr = unlocksByFrom.get(e.from) || [];
    arr.push(e.to);
    unlocksByFrom.set(e.from, arr);
  }

  return payload.nodes
    // A node whose id isn't slug-shaped is dropped rather than repaired:
    // ids are identity here (data-node-id, DOM ids, ?id= links), so a
    // mangled one would silently point somewhere else.
    .filter(
      (n) =>
        n && safeNodeId(n.id) !== null && typeof n.title === "string",
    )
    .map((n): ChapterOverlayNode => {
      const body = typeof n.body === "string" ? n.body : null;
      return {
        id: safeNodeId(n.id) as string,
        title: n.title,
        description: n.summary ?? "",
        color: safeCssColor(n.color),
        difficulty: safeDifficulty(n.difficulty),
        estimated_minutes: n.estimated_minutes ?? 0,
        thumbnail: safeThumbnail(n.thumbnail),
        tags: Array.isArray(n.tags) ? n.tags : [],
        prerequisites:
          n.source === "base"
            ? n.prereqs && n.prereqs.length > 0
              ? n.prereqs
              : n.parent_ref
                ? [n.parent_ref]
                : []
            : n.parent_ref
              ? [n.parent_ref]
              : [],
        unlocks: unlocksByFrom.get(n.id) ?? [],
        content_path: "",
        contributors: [],
        resources: [],
        source: n.source === "base" ? "base" : "chapter",
        body,
        hasArticle:
          n.source === "chapter" && body !== null && body.trim().length > 0,
        pos_x: typeof n.pos_x === "number" ? n.pos_x : null,
        pos_y: typeof n.pos_y === "number" ? n.pos_y : null,
      };
    });
}

// ---------------------------------------------------------------------------
// URL helpers
// ---------------------------------------------------------------------------

export function articleUrl(nodeId: string, chapter?: string | null): string {
  const url = `article.html?id=${encodeURIComponent(nodeId)}`;
  return chapter ? `${url}&chapter=${encodeURIComponent(chapter)}` : url;
}

/**
 * Article link for a node, or null when there's nothing to link — a
 * chapter-authored node without a body has no article page. Base nodes
 * keep their canonical link, with the chapter param passed through so
 * back-navigation keeps the overlay context.
 */
export function nodeArticleUrl(
  node: TreeNode,
  chapter?: string | null
): string | null {
  const overlay = node as Partial<ChapterOverlayNode>;
  if (overlay.source === "chapter") {
    return overlay.hasArticle ? articleUrl(node.id, chapter) : null;
  }
  return articleUrl(node.id, chapter);
}

/** Thumbnail src — absolute URLs (chapter payloads) pass through untouched. */
export function thumbnailSrc(thumbnail: string): string {
  return /^https?:\/\//i.test(thumbnail) ? thumbnail : `./${thumbnail}`;
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
