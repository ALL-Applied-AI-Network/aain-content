/**
 * tree-page.ts — Learning Content page initialization.
 * Handles sidebar, search, hover-to-highlight, click-to-zoom, collapse/expand,
 * mobile bottom sheet, and node detail panel.
 */

import {
  $,
  type TreeJson,
  type TreeNode,
  LAYER_COLORS,
  LAYER_NAMES,
  DIFFICULTY_COLORS,
  formatMinutes,
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

  viz = new TreeVisualization({
    container,
    onNodeClick: (node) => {
      if (tree) openNodePanel(node, tree);
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

  // --- Close panel on outside click ---
  container.addEventListener("click", (e) => {
    const target = e.target as Element;
    if (!target.closest(".tree-node")) {
      const panel = $(".node-panel");
      if (panel) panel.classList.remove("open");
    }
  });

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

  // Group nodes by layer
  const layers = new Map<number, TreeNode[]>();
  for (const node of tree.nodes) {
    if (q && !matchesQuery(node, q)) continue;
    const arr = layers.get(node.layer) || [];
    arr.push(node);
    layers.set(node.layer, arr);
  }

  const sortedLayers = Array.from(layers.entries()).sort(([a], [b]) => a - b);

  if (sortedLayers.length === 0) {
    container.innerHTML = `<div style="padding:2rem 1rem;text-align:center;color:var(--text-muted);font-size:0.8rem;">No lessons found${q ? ` for "${query}"` : ""}.</div>`;
    return;
  }

  // Build prerequisite path map for breadcrumbs
  const nodeMap = new Map<string, TreeNode>();
  for (const n of tree.nodes) nodeMap.set(n.id, n);

  let html = "";
  for (const [layer, nodes] of sortedLayers) {
    const color = LAYER_COLORS[layer] || "#6366f1";
    const name = LAYER_NAMES[layer] || `Layer ${layer}`;

    html += `
      <div class="sidebar__layer-group" data-layer="${layer}">
        <div class="sidebar__layer-header" data-layer="${layer}">
          <span class="material-icons-outlined sidebar__layer-chevron">expand_more</span>
          <span class="sidebar__layer-dot" style="background:${color}"></span>
          <span class="sidebar__layer-name">${name}</span>
          <span class="sidebar__layer-count">${nodes.length}</span>
        </div>
        <div class="sidebar__layer-items" data-layer="${layer}">
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
        <div class="sidebar__item" data-node-id="${node.id}">
          <div class="sidebar__item-row">
            <span class="sidebar__item-title">${node.title}</span>
            <span class="sidebar__item-badges">
              <span class="sidebar__item-diff" style="background:${diffColor}18;color:${diffColor}">${node.difficulty}</span>
              <span class="sidebar__item-time">${formatMinutes(node.estimated_minutes)}</span>
            </span>
          </div>
          ${unlocksText ? `<div class="sidebar__item-unlocks">unlocks &rarr; ${unlocksText}</div>` : ""}
          ${pathText ? `<div class="sidebar__item-path">${pathText}</div>` : ""}
        </div>
      `;
    }

    html += `</div></div>`;
  }

  container.innerHTML = html;

  // Set max-heights for collapsible animation
  requestAnimationFrame(() => {
    const allItemContainers = container.querySelectorAll(".sidebar__layer-items");
    allItemContainers.forEach((el) => {
      (el as HTMLElement).style.maxHeight = el.scrollHeight + "px";
    });
  });

  // Wire up layer header click to toggle collapse
  const headers = container.querySelectorAll(".sidebar__layer-header");
  headers.forEach((header) => {
    header.addEventListener("click", () => {
      const layer = header.getAttribute("data-layer");
      const items = container.querySelector(`.sidebar__layer-items[data-layer="${layer}"]`) as HTMLElement | null;
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
      openNodePanel(node, tree);

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
      <span class="material-icons-outlined sidebar__search-icon">search</span>
      <input type="text" id="bottom-sheet-search" class="sidebar__search-input" placeholder="Search lessons..." autocomplete="off" spellcheck="false" value="${query}" />
    </div>
  `;

  // Group nodes by layer
  const layers = new Map<number, TreeNode[]>();
  for (const node of tree.nodes) {
    if (q && !matchesQuery(node, q)) continue;
    const arr = layers.get(node.layer) || [];
    arr.push(node);
    layers.set(node.layer, arr);
  }

  const sortedLayers = Array.from(layers.entries()).sort(([a], [b]) => a - b);
  const nodeMap = new Map<string, TreeNode>();
  for (const n of tree.nodes) nodeMap.set(n.id, n);

  if (sortedLayers.length === 0) {
    html += `<div style="padding:2rem 1rem;text-align:center;color:var(--text-muted);font-size:0.8rem;">No lessons found.</div>`;
  } else {
    for (const [layer, nodes] of sortedLayers) {
      const color = LAYER_COLORS[layer] || "#6366f1";
      const name = LAYER_NAMES[layer] || `Layer ${layer}`;

      html += `
        <div class="sidebar__layer-group">
          <div class="sidebar__layer-header">
            <span class="material-icons-outlined sidebar__layer-chevron">expand_more</span>
            <span class="sidebar__layer-dot" style="background:${color}"></span>
            <span class="sidebar__layer-name">${name}</span>
            <span class="sidebar__layer-count">${nodes.length}</span>
          </div>
          <div class="sidebar__layer-items" style="max-height:9999px">
      `;

      for (const node of nodes) {
        const diffColor = DIFFICULTY_COLORS[node.difficulty] || "#6366f1";
        const unlocksText = node.unlocks.length > 0
          ? node.unlocks.map((uid) => nodeMap.get(uid)?.title || uid).slice(0, 2).join(", ")
          : "";

        html += `
          <div class="sidebar__item" data-node-id="${node.id}">
            <div class="sidebar__item-row">
              <span class="sidebar__item-title">${node.title}</span>
              <span class="sidebar__item-badges">
                <span class="sidebar__item-diff" style="background:${diffColor}18;color:${diffColor}">${node.difficulty}</span>
                <span class="sidebar__item-time">${formatMinutes(node.estimated_minutes)}</span>
              </span>
            </div>
            ${unlocksText ? `<div class="sidebar__item-unlocks">unlocks &rarr; ${unlocksText}</div>` : ""}
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
      openNodePanel(node, tree!);
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

  // Get unique layers
  const layerSet = new Set<number>();
  for (const node of tree.nodes) layerSet.add(node.layer);
  const layers = Array.from(layerSet).sort((a, b) => a - b);

  let html = "";
  for (const layer of layers) {
    const color = LAYER_COLORS[layer] || "#6366f1";
    html += `<div class="sidebar-strip__dot" data-layer="${layer}" style="background:${color}" title="${LAYER_NAMES[layer] || 'Layer ' + layer}"></div>`;
  }
  container.innerHTML = html;

  // Clicking a dot expands sidebar and scrolls to that layer
  const dots = container.querySelectorAll(".sidebar-strip__dot");
  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      expandSidebar();
      const layer = dot.getAttribute("data-layer");
      if (layer) {
        const target = document.querySelector(`.sidebar__layer-header[data-layer="${layer}"]`);
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
}

function expandSidebar(): void {
  const sidebar = document.getElementById("sidebar");
  const strip = document.getElementById("sidebar-strip");
  if (!sidebar || !strip) return;

  sidebarCollapsed = false;
  sidebar.classList.remove("collapsed");
  strip.classList.remove("visible");
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
