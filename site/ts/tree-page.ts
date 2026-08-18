/**
 * tree-page.ts — Learning Content page initialization.
 * Handles sidebar, search, hover-to-highlight, click-to-zoom, collapse/expand,
 * mobile bottom sheet, and node detail panel.
 */

import {
  $,
  type ChapterContext,
  type TreeJson,
  type TreeNode,
  DIFFICULTY_COLORS,
  adaptChapterTree,
  chapterParam,
  escapeHtml,
  formatMinutes,
  loadChapterTree,
  loadTreeData,
} from "./main";
import { TreeVisualization, openNodePanel } from "./tree-visualization";

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let tree: TreeJson | null = null;
let viz: TreeVisualization | null = null;
let sidebarCollapsed = false;
let activeItemId: string | null = null;
let searchDebounce: ReturnType<typeof setTimeout>;
/** Non-null while a ?chapter= overlay is active — threads through panels/links. */
let chapterCtx: ChapterContext | null = null;

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

async function init(): Promise<void> {
  const container = document.getElementById("tree-container");
  const loading = document.getElementById("tree-loading");
  if (!container) return;

  // Detect platform for keyboard shortcut label
  const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
  const kbdEl = document.getElementById("search-kbd");
  if (kbdEl && !isMac) {
    kbdEl.textContent = "Ctrl+K";
  }

  // --- Chapter overlay (?chapter=slug, composes with ?embed=1) ---
  // Load tree.json and the chapter payload in parallel; on success the
  // node set is REPLACED with the adapted merged tree (series stays from
  // tree.json — it only references base ids, which are unchanged). ANY
  // overlay failure falls back silently to the plain base tree.
  const chapterSlug = chapterParam();
  let overlayTree: TreeJson | null = null;
  if (chapterSlug) {
    const [base, payload] = await Promise.all([
      loadTreeData().catch(() => null),
      loadChapterTree(chapterSlug),
    ]);
    if (base && payload) {
      overlayTree = {
        ...base,
        nodes: adaptChapterTree(payload),
        edges: payload.edges,
      };
      chapterCtx = { slug: chapterSlug, name: payload.chapter.name };
    } else if (!payload) {
      console.warn(
        `Chapter tree unavailable for "${chapterSlug}" — showing base tree.`
      );
    }
  }

  viz = new TreeVisualization({
    container,
    tree: overlayTree ?? undefined,
    chapter: chapterCtx,
    onNodeClick: (node) => {
      if (tree) openNodePanel(node, tree, chapterCtx);
    },
  });

  try {
    await viz.init();
  } catch (e) {
    console.error("Failed to initialize tree:", e);
    if (loading) loading.textContent = "Failed to load skill tree.";
    return;
  }

  if (loading) loading.remove();

  tree = viz.getTree();
  if (!tree) return;

  // Build sidebar content
  renderSidebar(tree, "");

  // Build mobile bottom sheet content
  renderBottomSheet(tree, "");

  // Build collapsed strip dots
  renderStripDots(tree);

  // --- Sidebar collapse/expand ---
  setupSidebarToggle();

  // --- Search ---
  setupSearch();

  // --- Keyboard shortcut: Cmd+K / Ctrl+K ---
  setupKeyboardShortcuts();

  // --- Mobile FAB + bottom sheet ---
  setupMobile();

  // --- Close panel on Escape ---
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const panel = $(".node-panel");
      if (panel) panel.classList.remove("open");

      // Also close bottom sheet
      closeBottomSheet();
    }
  });

  // --- Close panel on outside click/tap ---
  function handleContainerDismiss(e: Event) {
    const target = (e as TouchEvent).changedTouches
      ? document.elementFromPoint(
          (e as TouchEvent).changedTouches[0].clientX,
          (e as TouchEvent).changedTouches[0].clientY
        )
      : e.target as Element;
    if (target && !target.closest(".tree-node") && !target.closest(".node-panel")) {
      const panel = $(".node-panel");
      if (panel) panel.classList.remove("open");
    }
  }
  container.addEventListener("click", handleContainerDismiss);

  // --- Mouse-follow ambient glow ---
  const glow = document.getElementById("tree-glow");
  if (glow) {
    let ticking = false;
    container.addEventListener("mousemove", (e) => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const rect = container.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width * 100).toFixed(1);
        const y = ((e.clientY - rect.top) / rect.height * 100).toFixed(1);
        glow.style.setProperty("--mouse-x", x + "%");
        glow.style.setProperty("--mouse-y", y + "%");
        ticking = false;
      });
    });
  }

  // --- URL params ---
  const params = new URLSearchParams(window.location.search);
  const highlightParam = params.get("highlight");
  if (highlightParam) {
    viz.highlightNode(highlightParam);
    setActiveItem(highlightParam);
  }
}

// ---------------------------------------------------------------------------
// Sidebar Rendering
// ---------------------------------------------------------------------------

function renderSidebar(tree: TreeJson, query: string): void {
  const container = document.getElementById("sidebar-sections");
  if (!container) return;

  const q = query.toLowerCase().trim();

  // Group nodes by difficulty (per-node key — search can only shrink
  // groups, never reshuffle membership)
  const filtered = tree.nodes.filter((node) => !q || matchesQuery(node, q));
  const groups = groupByDifficulty(filtered);

  if (groups.length === 0) {
    container.innerHTML = `<div style="padding:2rem 1rem;text-align:center;color:var(--text-muted);font-size:0.8rem;">No lessons found${q ? ` for "${query}"` : ""}.</div>`;
    return;
  }

  // Build prerequisite path map for breadcrumbs
  const nodeMap = new Map<string, TreeNode>();
  for (const n of tree.nodes) nodeMap.set(n.id, n);

  let html = "";
  for (const { key, label, color, nodes } of groups) {
    html += `
      <div class="sidebar__branch-group" data-branch="${key}">
        <div class="sidebar__branch-header" data-branch="${key}">
          <svg class="sidebar__branch-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg>
          <span class="sidebar__branch-dot" style="background:${color}"></span>
          <span class="sidebar__branch-name">${label}</span>
          <span class="sidebar__branch-count">${nodes.length}</span>
        </div>
        <div class="sidebar__branch-items" data-branch="${key}">
    `;

    for (const node of nodes) {
      const diffColor = DIFFICULTY_COLORS[node.difficulty] || "#6366f1";
      const unlocksText = node.unlocks.length > 0
        ? node.unlocks
            .map((uid) => nodeMap.get(uid)?.title || uid)
            .slice(0, 2)
            .join(", ")
        : "";
      const pathText = buildPrereqPath(node, nodeMap);

      html += `
        <div class="sidebar__item" data-node-id="${escapeHtml(node.id)}">
          <div class="sidebar__item-row">
            <span class="sidebar__item-title">${escapeHtml(node.title)}</span>
            <span class="sidebar__item-badges">
              ${node.difficulty ? `<span class="sidebar__item-diff" style="background:${diffColor}18;color:${diffColor}">${escapeHtml(node.difficulty)}</span>` : ""}
              ${node.estimated_minutes ? `<span class="sidebar__item-time">${formatMinutes(node.estimated_minutes)}</span>` : ""}
            </span>
          </div>
          ${unlocksText ? `<div class="sidebar__item-unlocks">unlocks &rarr; ${escapeHtml(unlocksText)}</div>` : ""}
          ${pathText ? `<div class="sidebar__item-path">${escapeHtml(pathText)}</div>` : ""}
        </div>
      `;
    }

    html += `</div></div>`;
  }

  container.innerHTML = html;

  // Set max-heights for collapsible animation
  requestAnimationFrame(() => {
    const allItemContainers = container.querySelectorAll(".sidebar__branch-items");
    allItemContainers.forEach((el) => {
      (el as HTMLElement).style.maxHeight = el.scrollHeight + "px";
    });
  });

  // Wire up branch header click to toggle collapse
  const headers = container.querySelectorAll(".sidebar__branch-header");
  headers.forEach((header) => {
    header.addEventListener("click", () => {
      const branch = header.getAttribute("data-branch");
      const items = container.querySelector(`.sidebar__branch-items[data-branch="${branch}"]`) as HTMLElement | null;
      if (!items) return;

      const isCollapsed = header.classList.contains("collapsed");
      if (isCollapsed) {
        header.classList.remove("collapsed");
        items.classList.remove("collapsed");
        items.style.maxHeight = items.scrollHeight + "px";
      } else {
        header.classList.add("collapsed");
        items.style.maxHeight = items.scrollHeight + "px";
        // Force reflow
        items.offsetHeight;
        items.classList.add("collapsed");
      }
    });
  });

  // Wire up item hover and click
  const items = container.querySelectorAll(".sidebar__item");
  items.forEach((item) => {
    const nodeId = item.getAttribute("data-node-id");
    if (!nodeId) return;

    item.addEventListener("mouseenter", () => {
      viz?.highlightNodeVisual(nodeId, true);
    });

    item.addEventListener("mouseleave", () => {
      viz?.highlightNodeVisual(nodeId, false);
    });

    item.addEventListener("click", () => {
      if (!nodeId || !tree) return;
      const node = tree.nodes.find((n) => n.id === nodeId);
      if (!node) return;

      // Zoom tree to this node
      viz?.flyToNode(nodeId);

      // Open the detail panel
      openNodePanel(node, tree, chapterCtx);

      // Update active state
      setActiveItem(nodeId);

      // On mobile, close bottom sheet
      closeBottomSheet();
    });
  });
}

// ---------------------------------------------------------------------------
// Bottom Sheet (Mobile) Rendering
// ---------------------------------------------------------------------------

function renderBottomSheet(tree: TreeJson, query: string): void {
  const container = document.getElementById("bottom-sheet-content");
  if (!container) return;

  const q = query.toLowerCase().trim();

  // Search bar in bottom sheet
  let html = `
    <div class="sidebar__search" style="position:sticky;top:0;z-index:5;background:var(--bg-secondary);border-bottom:1px solid var(--border-subtle);margin:0 -0.75rem;padding:0.75rem;">
      <svg class="sidebar__search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>
      <input type="text" id="bottom-sheet-search" class="sidebar__search-input" placeholder="Search lessons..." autocomplete="off" spellcheck="false" value="${query}" />
    </div>
  `;

  // Group nodes by difficulty (same grouping as the desktop sidebar)
  const filtered = tree.nodes.filter((node) => !q || matchesQuery(node, q));
  const groups = groupByDifficulty(filtered);
  const nodeMap = new Map<string, TreeNode>();
  for (const n of tree.nodes) nodeMap.set(n.id, n);

  if (groups.length === 0) {
    html += `<div style="padding:2rem 1rem;text-align:center;color:var(--text-muted);font-size:0.8rem;">No lessons found.</div>`;
  } else {
    for (const { label, color, nodes } of groups) {
      html += `
        <div class="sidebar__branch-group">
          <div class="sidebar__branch-header">
            <svg class="sidebar__branch-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg>
            <span class="sidebar__branch-dot" style="background:${color}"></span>
            <span class="sidebar__branch-name">${label}</span>
            <span class="sidebar__branch-count">${nodes.length}</span>
          </div>
          <div class="sidebar__branch-items" style="max-height:9999px">
      `;

      for (const node of nodes) {
        const diffColor = DIFFICULTY_COLORS[node.difficulty] || "#6366f1";
        const unlocksText = node.unlocks.length > 0
          ? node.unlocks.map((uid) => nodeMap.get(uid)?.title || uid).slice(0, 2).join(", ")
          : "";

        html += `
          <div class="sidebar__item" data-node-id="${escapeHtml(node.id)}">
            <div class="sidebar__item-row">
              <span class="sidebar__item-title">${escapeHtml(node.title)}</span>
              <span class="sidebar__item-badges">
                ${node.difficulty ? `<span class="sidebar__item-diff" style="background:${diffColor}18;color:${diffColor}">${escapeHtml(node.difficulty)}</span>` : ""}
                ${node.estimated_minutes ? `<span class="sidebar__item-time">${formatMinutes(node.estimated_minutes)}</span>` : ""}
              </span>
            </div>
            ${unlocksText ? `<div class="sidebar__item-unlocks">unlocks &rarr; ${escapeHtml(unlocksText)}</div>` : ""}
          </div>
        `;
      }

      html += `</div></div>`;
    }
  }

  container.innerHTML = html;

  // Wire up bottom sheet search
  const bsSearch = document.getElementById("bottom-sheet-search") as HTMLInputElement | null;
  if (bsSearch) {
    bsSearch.addEventListener("input", () => {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => {
        if (tree) renderBottomSheet(tree, bsSearch.value);
      }, 150);
    });
  }

  // Wire up bottom sheet items
  const items = container.querySelectorAll(".sidebar__item");
  items.forEach((item) => {
    const nodeId = item.getAttribute("data-node-id");
    if (!nodeId || !tree) return;

    item.addEventListener("click", () => {
      const node = tree!.nodes.find((n) => n.id === nodeId);
      if (!node) return;
      viz?.flyToNode(nodeId);
      openNodePanel(node, tree!, chapterCtx);
      setActiveItem(nodeId);
      closeBottomSheet();
    });
  });
}

// ---------------------------------------------------------------------------
// Collapsed strip dots
// ---------------------------------------------------------------------------

function renderStripDots(tree: TreeJson): void {
  const container = document.getElementById("sidebar-strip-dots");
  if (!container) return;

  // One dot per difficulty group, in the same order as the sidebar
  const groups = groupByDifficulty(tree.nodes);

  let html = "";
  for (const { key, label, color } of groups) {
    html += `<div class="sidebar-strip__dot" data-branch="${key}" style="background:${color}" title="${label}"></div>`;
  }
  container.innerHTML = html;

  // Clicking a dot expands sidebar and scrolls to that group
  const dots = container.querySelectorAll(".sidebar-strip__dot");
  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      expandSidebar();
      const branch = dot.getAttribute("data-branch");
      if (branch) {
        const target = document.querySelector(`.sidebar__branch-header[data-branch="${branch}"]`);
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    });
  });
}

// ---------------------------------------------------------------------------
// Sidebar Toggle
// ---------------------------------------------------------------------------

function setupSidebarToggle(): void {
  const collapseBtn = document.getElementById("sidebar-collapse");
  const expandBtn = document.getElementById("sidebar-expand");

  if (collapseBtn) {
    collapseBtn.addEventListener("click", collapseSidebar);
  }
  if (expandBtn) {
    expandBtn.addEventListener("click", expandSidebar);
  }
}

function collapseSidebar(): void {
  const sidebar = document.getElementById("sidebar");
  const strip = document.getElementById("sidebar-strip");
  if (!sidebar || !strip) return;

  sidebarCollapsed = true;
  sidebar.classList.add("collapsed");
  strip.classList.add("visible");

  // Re-fit tree after sidebar animation completes
  setTimeout(() => viz?.fitView(), 350);
}

function expandSidebar(): void {
  const sidebar = document.getElementById("sidebar");
  const strip = document.getElementById("sidebar-strip");
  if (!sidebar || !strip) return;

  sidebarCollapsed = false;
  sidebar.classList.remove("collapsed");
  strip.classList.remove("visible");

  // Re-fit tree after sidebar animation completes
  setTimeout(() => viz?.fitView(), 350);
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

function setupSearch(): void {
  const input = document.getElementById("sidebar-search") as HTMLInputElement | null;
  if (!input || !tree) return;

  input.addEventListener("input", () => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      if (tree) renderSidebar(tree, input.value);
    }, 150);
  });
}

// ---------------------------------------------------------------------------
// Keyboard Shortcuts
// ---------------------------------------------------------------------------

function setupKeyboardShortcuts(): void {
  document.addEventListener("keydown", (e) => {
    // Cmd+K or Ctrl+K to focus search
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();

      // If sidebar is collapsed, expand it first
      if (sidebarCollapsed) {
        expandSidebar();
      }

      const input = document.getElementById("sidebar-search") as HTMLInputElement | null;
      if (input) {
        input.focus();
        input.select();
      }
    }
  });
}

// ---------------------------------------------------------------------------
// Mobile Bottom Sheet
// ---------------------------------------------------------------------------

function setupMobile(): void {
  const fab = document.getElementById("mobile-fab");
  const overlay = document.getElementById("bottom-sheet-overlay");

  if (fab) {
    fab.addEventListener("click", openBottomSheet);
  }
  if (overlay) {
    overlay.addEventListener("click", closeBottomSheet);
  }
}

function openBottomSheet(): void {
  const sheet = document.getElementById("bottom-sheet");
  const overlay = document.getElementById("bottom-sheet-overlay");
  if (!sheet || !overlay) return;

  overlay.classList.add("visible");
  // Trigger reflow for transition
  sheet.offsetHeight;
  sheet.classList.add("open");
}

function closeBottomSheet(): void {
  const sheet = document.getElementById("bottom-sheet");
  const overlay = document.getElementById("bottom-sheet-overlay");
  if (!sheet || !overlay) return;

  sheet.classList.remove("open");
  overlay.classList.remove("visible");
}

// ---------------------------------------------------------------------------
// Active Item Management
// ---------------------------------------------------------------------------

function setActiveItem(nodeId: string): void {
  // Clear previous
  const prev = document.querySelectorAll(".sidebar__item.active");
  prev.forEach((el) => el.classList.remove("active"));

  activeItemId = nodeId;

  // Set new
  const items = document.querySelectorAll(`.sidebar__item[data-node-id="${nodeId}"]`);
  items.forEach((el) => el.classList.add("active"));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Sidebar/bottom-sheet/strip grouping: by DIFFICULTY, the one semantic
 * taxonomy left after the layer bands were retired. Grouping by tree
 * structure is a dead end here — the validator requires a fully
 * connected graph, so "walk to the root" puts all 34 lessons in one
 * group; difficulty gives learners a meaningful "where do I start"
 * split (and matches the home-page stats and article meta).
 */
interface SidebarGroup {
  /** Stable difficulty key — doubles as the data-branch DOM handle. */
  key: string;
  label: string;
  color: string;
  nodes: TreeNode[];
}

const DIFFICULTY_ORDER = ["beginner", "intermediate", "advanced", "expert"];

/**
 * Groups `filtered` nodes by difficulty in learning-ramp order
 * (unknown difficulties sink to the end, labeled as-is). Per-node
 * grouping keys mean search can only shrink groups, never reshuffle
 * membership.
 */
function groupByDifficulty(filtered: TreeNode[]): SidebarGroup[] {
  const groups = new Map<string, TreeNode[]>();
  for (const node of filtered) {
    const key = (node.difficulty || "other").toLowerCase();
    const arr = groups.get(key) || [];
    arr.push(node);
    groups.set(key, arr);
  }

  return Array.from(groups.entries())
    .map(([key, nodes]) => ({
      key,
      label: key.charAt(0).toUpperCase() + key.slice(1),
      color: DIFFICULTY_COLORS[key] || "#6366f1",
      nodes,
    }))
    .sort((a, b) => {
      const ai = DIFFICULTY_ORDER.indexOf(a.key);
      const bi = DIFFICULTY_ORDER.indexOf(b.key);
      return (
        (ai === -1 ? DIFFICULTY_ORDER.length : ai) -
          (bi === -1 ? DIFFICULTY_ORDER.length : bi) ||
        a.key.localeCompare(b.key)
      );
    });
}

function matchesQuery(node: TreeNode, q: string): boolean {
  return (
    node.title.toLowerCase().includes(q) ||
    node.description.toLowerCase().includes(q) ||
    node.tags.some((t) => t.toLowerCase().includes(q))
  );
}

function buildPrereqPath(node: TreeNode, nodeMap: Map<string, TreeNode>): string {
  if (node.prerequisites.length === 0) return "";

  const parts: string[] = [];
  let current = node;
  const visited = new Set<string>();

  // Walk back through prerequisites (first prereq only for a clean path)
  while (current.prerequisites.length > 0 && parts.length < 3) {
    const prereqId = current.prerequisites[0];
    if (visited.has(prereqId)) break;
    visited.add(prereqId);

    const prereq = nodeMap.get(prereqId);
    if (!prereq) break;

    parts.unshift(prereq.title);
    current = prereq;
  }

  if (parts.length === 0) return "";
  return parts.join(" \u2192 ") + " \u2192 This";
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

document.addEventListener("DOMContentLoaded", init);
