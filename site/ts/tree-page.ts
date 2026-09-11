/**
 * tree-page.ts — Learning Content page initialization.
 * Handles sidebar, search, hover-to-highlight, click-to-zoom, collapse/expand,
 * mobile bottom sheet, and node detail panel.
 *
 * The sidebar, the bottom sheet, the strip dots and the canvas bands all come
 * from ONE grouping: learning/curriculum.json's chapters, plus a trailing
 * "{Chapter name} lessons" band for overlay nodes that hang off no base
 * lesson. Clicking a chapter frames its band; clicking a lesson flies to its
 * card and opens the panel.
 */

import curriculum from "../../learning/curriculum.json";
import {
  $,
  type ChapterContext,
  type ChapterOverlayNode,
  type TreeJson,
  type TreeNode,
  DIFFICULTY_COLORS,
  NETWORK_API_ORIGIN,
  adaptChapterTree,
  chapterParam,
  escapeHtml,
  formatMinutes,
  loadChapterTree,
  loadTreeData,
  safeCssColor,
} from "./main";
import type { BandInput } from "./banded-layout";
import { TreeVisualization, openNodePanel } from "./tree-visualization";

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let tree: TreeJson | null = null;
let viz: TreeVisualization | null = null;
let sidebarCollapsed = false;
let activeItemId: string | null = null;
/** The framed band — aria-current in the lists, expanded, outlined on the canvas. */
let activeBandId: string | null = null;
let sidebarQuery = "";
let sheetQuery = "";
let searchDebounce: ReturnType<typeof setTimeout>;
/** Non-null while a ?chapter= overlay is active — threads through panels/links. */
let chapterCtx: ChapterContext | null = null;
/** Bands in reading order, built once from the loaded tree. */
let bands: SidebarGroup[] = [];
let bandOfNode = new Map<string, string>();

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
  let baseTree: TreeJson | null = null;
  let overlayTree: TreeJson | null = null;
  let clubColor: string | undefined;
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
      // Hub primary colour → the club band, so it matches the hub the
      // tree is embedded in (null/invalid falls through to the default).
      clubColor = safeCssColor(payload.chapter.theme_primary);
    } else if (!payload) {
      console.warn(
        `Chapter tree unavailable for "${chapterSlug}" — showing base tree.`
      );
    }
  }

  try {
    baseTree = overlayTree ?? (await loadTreeData());
  } catch (e) {
    console.error("Failed to load tree:", e);
    if (loading) loading.textContent = "Failed to load skill tree.";
    return;
  }

  bands = buildBands(baseTree.nodes, chapterCtx, clubColor);
  bandOfNode = new Map(bands.flatMap((b) => b.nodes.map((n) => [n.id, b.id] as const)));

  viz = new TreeVisualization({
    container,
    tree: baseTree,
    chapter: chapterCtx,
    bands: bands.map((b): BandInput => ({
      id: b.id,
      title: b.title,
      color: b.color,
      nodeIds: b.nodes.map((n) => n.id),
    })),
    onNodeClick: (node) => selectNode(node.id, { fly: false }),
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

  // --- URL params: ?node (or the older ?highlight) restores a lesson,
  // ?topic a curriculum chapter; ?chapter is the overlay slug, read above.
  const params = new URLSearchParams(window.location.search);
  const nodeParam = params.get("node") ?? params.get("highlight");
  const topicParam = params.get("topic");
  const startNode = nodeParam && bandOfNode.has(nodeParam) ? nodeParam : null;
  const startBand =
    (startNode && bandOfNode.get(startNode)) ||
    (topicParam && bands.some((b) => b.id === topicParam) ? topicParam : null) ||
    bands[0]?.id ||
    null;

  // Lead with one human-sized chapter instead of the whole 34-card wall; the
  // other bands stay drawn above and below at the frame's edges.
  if (startBand) {
    activeBandId = startBand;
    viz.frameBand(startBand, false);
  }

  // Build sidebar content
  renderSidebar(tree, "");

  // Build mobile bottom sheet content
  renderBottomSheet(tree, "");

  // Build collapsed strip dots
  renderStripDots();

  // --- Sidebar collapse/expand ---
  setupSidebarToggle();

  // --- Search ---
  setupSearch();

  // --- Keyboard shortcut: Cmd+K / Ctrl+K ---
  setupKeyboardShortcuts();

  // --- Mobile FAB + bottom sheet ---
  setupMobile();

  // --- "All chapters" ---
  const allRow = document.getElementById("sidebar-all");
  if (allRow) activateOn(allRow, showAllBands);

  // --- Escape: close what is open; with nothing open, show every band ---
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const panel = $(".node-panel");
    const sheet = document.getElementById("bottom-sheet");
    const somethingOpen =
      panel?.classList.contains("open") || sheet?.classList.contains("open");
    if (panel) panel.classList.remove("open");
    closeBottomSheet();
    if (!somethingOpen) showAllBands();
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

  updateSaveLink();
  if (startNode) selectNode(startNode);
}

// ---------------------------------------------------------------------------
// Selection — one path for the sidebar, the sheet, the canvas and the URL
// ---------------------------------------------------------------------------

/** Frame a band: fly the canvas, mark the row current, expand its lessons. */
function selectBand(bandId: string, animate = true): void {
  if (!tree || !viz) return;
  activeBandId = bandId;
  viz.frameBand(bandId, animate);
  updateUrl();
  updateSaveLink();
  renderSidebar(tree, sidebarQuery);
  renderBottomSheet(tree, sheetQuery);
}

/** "All chapters" / Escape: every band in view, no row current. */
function showAllBands(): void {
  if (!tree || !viz) return;
  activeBandId = null;
  viz.fitAll();
  updateUrl();
  updateSaveLink();
  renderSidebar(tree, sidebarQuery);
  renderBottomSheet(tree, sheetQuery);
}

/**
 * Open a lesson: fly to its card (unless the click came from the card
 * itself), open the panel, mark the rows, write the URL. A lesson from a
 * band that is not current makes its band current so the lists follow.
 */
function selectNode(nodeId: string, opts: { fly?: boolean } = {}): void {
  if (!tree || !viz) return;
  const node = tree.nodes.find((n) => n.id === nodeId);
  if (!node) return;

  const bandId = bandOfNode.get(nodeId) ?? null;
  if (bandId && bandId !== activeBandId) {
    activeBandId = bandId;
    renderSidebar(tree, sidebarQuery);
    renderBottomSheet(tree, sheetQuery);
  }

  // The panel leads with the chapter's exercise goal where one exists —
  // the description is the article's blurb, the goal is what to do.
  const activity = (curriculum.activities as Record<string, { goal?: string } | undefined>)[nodeId];
  openNodePanel(
    activity?.goal ? { ...node, description: activity.goal } : node,
    tree,
    chapterCtx
  );
  const panel = $(".node-panel") as HTMLElement | null;
  if (panel) {
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", node.title);
    panel.scrollTop = 0;
  }

  // Opened before the fly so the phone strip above the panel is measurable.
  if (opts.fly !== false) viz.flyToNode(nodeId, uncoveredStrip(panel));

  setActiveItem(nodeId);
  updateUrl();
  updateSaveLink();
  closeBottomSheet();
}

/**
 * On a phone (tree.css's 768 breakpoint) the panel is a bottom sheet, so
 * the card should land in the canvas strip it leaves uncovered; on desktop
 * it is a side column and the card is centred as usual (undefined).
 * offsetHeight is the laid-out height, unaffected by the slide-in
 * transform that is still mid-flight when this runs.
 */
function uncoveredStrip(panel: HTMLElement | null): { top: number; bottom: number } | undefined {
  if (!panel || !window.matchMedia("(max-width: 768px)").matches) return undefined;
  const container = document.getElementById("tree-container");
  if (!container) return undefined;
  const strip = window.innerHeight - panel.offsetHeight - container.getBoundingClientRect().top;
  // Too short to show a card at all — fall back to the plain centre.
  if (strip < 80) return undefined;
  return { top: 0, bottom: strip };
}

/**
 * ?node= and ?topic= mirror the dashboard's /me/learn contract so a link
 * either way restores the same position. ?chapter= (overlay slug) and
 * ?embed= are left exactly as the host set them.
 */
function updateUrl(): void {
  const url = new URL(window.location.href);
  if (activeBandId && activeBandId !== CLUB_BAND_ID) url.searchParams.set("topic", activeBandId);
  else url.searchParams.delete("topic");
  if (activeItemId) url.searchParams.set("node", activeItemId);
  else url.searchParams.delete("node");
  url.searchParams.delete("highlight");
  history.replaceState(null, "", url);
}

/** Save Your Progress ↗ — hands the current position to the dashboard. */
function progressHref(): string {
  const url = new URL("/me/learn", NETWORK_API_ORIGIN);
  if (activeItemId) url.searchParams.set("node", activeItemId);
  // The club band is not a curriculum chapter; the dashboard derives it.
  if (activeBandId && activeBandId !== CLUB_BAND_ID) url.searchParams.set("chapter", activeBandId);
  return url.toString();
}

function updateSaveLink(): void {
  const href = progressHref();
  document.querySelectorAll<HTMLAnchorElement>(".sidebar__save").forEach((a) => {
    a.href = href;
  });
}

// ---------------------------------------------------------------------------
// Sidebar Rendering
// ---------------------------------------------------------------------------

function renderSidebar(tree: TreeJson, query: string): void {
  const container = document.getElementById("sidebar-sections");
  if (!container) return;

  sidebarQuery = query;
  const q = query.toLowerCase().trim();

  // Search only shrinks a chapter's lessons, never reshuffles membership;
  // while searching every chapter is open so hits are visible.
  const groups = filterGroups(q);

  document.getElementById("sidebar-all")?.classList.toggle("sidebar__all--active", !activeBandId);

  // A keyboard activation of a row re-renders this list, which would
  // destroy the focused row; remember it so focus can be handed back.
  const focusKey = focusKeyIn(container);

  if (groups.length === 0) {
    container.innerHTML = `<div style="padding:2rem 1rem;text-align:center;color:var(--text-muted);font-size:0.8rem;">No lessons found${q ? ` for "${escapeHtml(query)}"` : ""}.</div>`;
    return;
  }

  let html = "";
  for (const group of groups) {
    const { id, title, color, nodes } = group;
    const current = id === activeBandId;
    const collapsed = !q && !current;
    html += `
      <div class="sidebar__branch-group${current ? " sidebar__branch-group--active" : ""}" data-branch="${escapeHtml(id)}">
        <div class="sidebar__branch-header${collapsed ? " collapsed" : ""}" data-branch="${escapeHtml(id)}" role="button" tabindex="0"${current ? ' aria-current="true"' : ""}>
          <svg class="sidebar__branch-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg>
          <span class="sidebar__branch-number">${eyebrow(group)}</span>
          <span class="sidebar__branch-dot" style="background:${color}"></span>
          <span class="sidebar__branch-name">${escapeHtml(title)}</span>
          <span class="sidebar__branch-count">${nodes.length}</span>
        </div>
        <div class="sidebar__branch-items${collapsed ? " collapsed" : ""}" data-branch="${escapeHtml(id)}">
    `;

    // A lesson row is title, difficulty, minutes — a table of contents, not
    // a graph dump. Prerequisites and unlocks live in the lesson panel.
    for (const node of nodes) html += lessonRow(node);

    html += `</div></div>`;
  }

  container.innerHTML = html;
  restoreFocus(container, focusKey);

  // Set max-heights for collapsible animation
  requestAnimationFrame(() => {
    const allItemContainers = container.querySelectorAll(".sidebar__branch-items");
    allItemContainers.forEach((el) => {
      const itemContainer = el as HTMLElement;
      itemContainer.style.maxHeight = itemContainer.classList.contains("collapsed")
        ? "0px"
        : itemContainer.scrollHeight + "px";
    });
  });

  // Chapter rows: another chapter frames its band; the current chapter's
  // row toggles its lesson list without moving the canvas.
  const headers = container.querySelectorAll(".sidebar__branch-header");
  headers.forEach((header) => {
    const branch = header.getAttribute("data-branch");
    if (!branch) return;

    header.addEventListener("mouseenter", () => viz?.highlightBand(branch, true));
    header.addEventListener("mouseleave", () => viz?.highlightBand(branch, false));

    const activate = () => {
      const items = container.querySelector(`.sidebar__branch-items[data-branch="${branch}"]`) as HTMLElement | null;
      if (!items) return;

      if (branch !== activeBandId) {
        selectBand(branch);
        return;
      }

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
    };
    activateOn(header, activate);
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

    activateOn(item, () => selectNode(nodeId));
  });
}

/**
 * Click AND Enter/Space. The rows are divs with role="button", and a div
 * does not synthesise click from the keyboard the way a <button> does,
 * so every row needs both or it is a focusable control that does nothing.
 */
function activateOn(el: Element, fn: () => void): void {
  el.addEventListener("click", fn);
  el.addEventListener("keydown", (e) => {
    const key = (e as KeyboardEvent).key;
    if (key === "Enter" || key === " ") {
      e.preventDefault();
      fn();
    }
  });
}

/**
 * The focused row inside `container`, as a selector that finds its
 * replacement after the list is rebuilt with innerHTML. Only chapter
 * headers and lesson rows: the sheet's search input is rebuilt on every
 * keystroke and is left to its own devices.
 */
function focusKeyIn(container: HTMLElement): string | null {
  const el = document.activeElement;
  if (!(el instanceof HTMLElement) || !container.contains(el)) return null;
  if (el.classList.contains("sidebar__branch-header") && el.dataset.branch) {
    return `.sidebar__branch-header[data-branch="${el.dataset.branch}"]`;
  }
  if (el.classList.contains("sidebar__item") && el.dataset.nodeId) {
    return `.sidebar__item[data-node-id="${el.dataset.nodeId}"]`;
  }
  return null;
}

/** Hand focus back after a rebuild; otherwise it falls to <body> and the
 *  next Tab starts over from the top of the page. */
function restoreFocus(container: HTMLElement, key: string | null): void {
  if (!key) return;
  (container.querySelector(key) as HTMLElement | null)?.focus({ preventScroll: true });
}

// ---------------------------------------------------------------------------
// Bottom Sheet (Mobile) Rendering
// ---------------------------------------------------------------------------

function renderBottomSheet(tree: TreeJson, query: string): void {
  const container = document.getElementById("bottom-sheet-content");
  if (!container) return;

  sheetQuery = query;
  const q = query.toLowerCase().trim();
  const focusKey = focusKeyIn(container);

  // Search bar in bottom sheet
  let html = `
    <div class="sidebar__search" style="position:sticky;top:0;z-index:5;background:var(--bg-secondary);border-bottom:1px solid var(--border-subtle);margin:0 -0.75rem;padding:0.75rem;">
      <svg class="sidebar__search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>
      <input type="text" id="bottom-sheet-search" class="sidebar__search-input" placeholder="Search lessons..." autocomplete="off" spellcheck="false" value="${escapeHtml(query)}" />
    </div>
    <a class="sidebar__save" href="${escapeHtml(progressHref())}" rel="noopener">Save Your Progress &#8599;</a>
  `;

  // Same chapters as desktop.
  const groups = filterGroups(q);

  if (groups.length === 0) {
    html += `<div style="padding:2rem 1rem;text-align:center;color:var(--text-muted);font-size:0.8rem;">No lessons found.</div>`;
  } else {
    for (const group of groups) {
      const { id, title, color, nodes } = group;
      const current = id === activeBandId;
      const collapsed = !q && !current;
      html += `
        <div class="sidebar__branch-group${current ? " sidebar__branch-group--active" : ""}" data-branch="${escapeHtml(id)}">
          <div class="sidebar__branch-header${collapsed ? " collapsed" : ""}" data-branch="${escapeHtml(id)}" role="button" tabindex="0"${current ? ' aria-current="true"' : ""}>
            <svg class="sidebar__branch-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg>
            <span class="sidebar__branch-number">${eyebrow(group)}</span>
            <span class="sidebar__branch-dot" style="background:${color}"></span>
            <span class="sidebar__branch-name">${escapeHtml(title)}</span>
            <span class="sidebar__branch-count">${nodes.length}</span>
          </div>
          <div class="sidebar__branch-items${collapsed ? " collapsed" : ""}" data-branch="${escapeHtml(id)}" style="max-height:${collapsed ? "0" : "9999px"}">
      `;

      for (const node of nodes) html += lessonRow(node);

      html += `</div></div>`;
    }
  }

  container.innerHTML = html;
  restoreFocus(container, focusKey);

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

  // Chapter rows: a tap on another chapter frames it (the sheet stays open
  // so the lessons can be picked); the current chapter toggles its list.
  const headers = container.querySelectorAll(".sidebar__branch-header");
  headers.forEach((header) => {
    activateOn(header, () => {
      const key = header.getAttribute("data-branch");
      if (!key) return;
      const items = container.querySelector(
        `.sidebar__branch-items[data-branch="${key}"]`,
      ) as HTMLElement | null;
      if (key === activeBandId && items) {
        const collapsing = !header.classList.contains("collapsed");
        header.classList.toggle("collapsed", collapsing);
        items.classList.toggle("collapsed", collapsing);
        items.style.maxHeight = collapsing ? "0" : "9999px";
        return;
      }
      selectBand(key);
    });
  });

  const items = container.querySelectorAll(".sidebar__item");
  items.forEach((item) => {
    const nodeId = item.getAttribute("data-node-id");
    if (!nodeId) return;
    activateOn(item, () => selectNode(nodeId));
  });
}

// ---------------------------------------------------------------------------
// Collapsed strip dots
// ---------------------------------------------------------------------------

function renderStripDots(): void {
  const container = document.getElementById("sidebar-strip-dots");
  if (!container) return;

  // One dot per chapter, in the same order as the sidebar.
  let html = "";
  for (const { id, title, color } of bands) {
    html += `<div class="sidebar-strip__dot" data-branch="${escapeHtml(id)}" style="background:${color}" title="${escapeHtml(title)}"></div>`;
  }
  container.innerHTML = html;

  // Clicking a dot frames that chapter, expands the sidebar and scrolls its row into view
  const dots = container.querySelectorAll(".sidebar-strip__dot");
  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      const branch = dot.getAttribute("data-branch");
      if (!branch) return;
      expandSidebar();
      selectBand(branch);
      const target = document.querySelector(`#sidebar-sections .sidebar__branch-header[data-branch="${branch}"]`);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
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

/** The canvas changed width; keep whatever was framed framed. */
function refitAfterSidebar(): void {
  if (!viz) return;
  if (activeBandId) viz.frameBand(activeBandId);
  else viz.fitAll();
}

function collapseSidebar(): void {
  const sidebar = document.getElementById("sidebar");
  const strip = document.getElementById("sidebar-strip");
  if (!sidebar || !strip) return;

  sidebarCollapsed = true;
  sidebar.classList.add("collapsed");
  strip.classList.add("visible");

  // Re-fit tree after sidebar animation completes
  setTimeout(refitAfterSidebar, 350);
}

function expandSidebar(): void {
  const sidebar = document.getElementById("sidebar");
  const strip = document.getElementById("sidebar-strip");
  if (!sidebar || !strip) return;

  sidebarCollapsed = false;
  sidebar.classList.remove("collapsed");
  strip.classList.remove("visible");

  // Re-fit tree after sidebar animation completes
  setTimeout(refitAfterSidebar, 350);
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

/**
 * The sheet is a modal dialog (tree.html gives it role="dialog"), so it
 * gets the dialog's focus contract: closed, it is `inert` — it is only
 * translated off-screen, and its search box, save link and rows would
 * otherwise sit in the tab order behind the page; open, focus moves in,
 * Tab wraps inside it, and closing hands focus back to where it came
 * from.
 */
function setupMobile(): void {
  const fab = document.getElementById("mobile-fab");
  const overlay = document.getElementById("bottom-sheet-overlay");
  const sheet = document.getElementById("bottom-sheet");

  if (fab) {
    fab.addEventListener("click", openBottomSheet);
  }
  if (overlay) {
    overlay.addEventListener("click", closeBottomSheet);
  }
  if (sheet) {
    sheet.setAttribute("inert", "");
    sheet.addEventListener("keydown", (e) => {
      if (e.key !== "Tab") return;
      const nodes = Array.from(
        sheet.querySelectorAll<HTMLElement>(
          'a[href], input:not([disabled]), [role="button"][tabindex="0"]',
        ),
      );
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      // Focus on the sheet itself (where opening puts it) counts as
      // "before first", so Shift+Tab from there wraps to the end.
      if (e.shiftKey && (document.activeElement === first || document.activeElement === sheet)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
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
  sheet.removeAttribute("inert");
  document.getElementById("mobile-fab")?.setAttribute("aria-expanded", "true");
  // The sheet itself, not its search box: focusing an input would raise
  // the phone keyboard over the list the member just asked to see.
  sheet.focus({ preventScroll: true });
}

function closeBottomSheet(): void {
  const sheet = document.getElementById("bottom-sheet");
  const overlay = document.getElementById("bottom-sheet-overlay");
  if (!sheet || !overlay) return;

  const hadFocus = sheet.contains(document.activeElement);
  sheet.classList.remove("open");
  overlay.classList.remove("visible");
  sheet.setAttribute("inert", "");
  const fab = document.getElementById("mobile-fab");
  fab?.setAttribute("aria-expanded", "false");
  if (!hadFocus) return;
  // Back to the FAB — unless the close came from picking a lesson, when
  // the FAB is hidden behind the open panel and the panel is the place.
  const panel = $(".node-panel") as HTMLElement | null;
  if (panel?.classList.contains("open")) {
    panel.tabIndex = -1;
    panel.focus({ preventScroll: true });
  } else {
    fab?.focus({ preventScroll: true });
  }
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
 * One group per curriculum chapter, in reading order, plus a trailing band
 * for lessons no chapter lists. Difficulty stays a badge on each lesson; the
 * navigation hierarchy is the curriculum.
 */
interface SidebarGroup {
  /** Curriculum chapter id (or CLUB_BAND_ID) — doubles as the data-branch DOM handle. */
  id: string;
  /** Position in reading order, for the "01" eyebrow. */
  index: number;
  title: string;
  color: string;
  nodes: TreeNode[];
}

/**
 * Band colours by chapter index — the same palette learningGraph() draws
 * with, so the canvas, the side list and the dashboard share one legend.
 * That palette is a private const in learning-graph.ts, which must stay
 * byte-identical to the dashboard's copy, so it is repeated here (as the
 * dashboard's curriculum-bands.ts repeats it).
 */
const BAND_PALETTE = ["#4f8fea", "#22d3ee", "#a855f7", "#ec4899", "#818cf8", "#38bdf8", "#c084fc"];

/** Id of the trailing chapter-lessons band; the colon keeps it out of the
 *  curriculum's short-slug id space. Same id the dashboard uses. */
const CLUB_BAND_ID = "club:lessons";

/** Colour for the club band when the payload carries no hub primary —
 *  the fallback the dashboard's chapter logo draws with. */
const CLUB_COLOR_FALLBACK = "#22d3ee";

/**
 * Assigns every node to exactly one band, mirroring the dashboard's
 * bandsFor(): a base lesson goes to the chapter that lists it; a
 * chapter-authored lesson goes to the band of its nearest base ancestor
 * (walking the parent chain — adaptChapterTree puts parent_ref first in
 * prerequisites); anything still detached goes to the trailing club band.
 * Empty bands are dropped, so a base-only tree shows just the curriculum.
 */
function buildBands(
  nodes: TreeNode[],
  chapter: ChapterContext | null,
  clubColor?: string,
): SidebarGroup[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const listed = new Map<string, string>();
  for (const c of curriculum.chapters) {
    for (const id of c.nodes) if (!listed.has(id)) listed.set(id, c.id);
  }

  const bandOf = new Map<string, string>();
  const resolve = (n: TreeNode): string => {
    const cached = bandOf.get(n.id);
    if (cached) return cached;
    let band = CLUB_BAND_ID;
    // A cycle or dangling reference ends the walk at the club band.
    const seen = new Set<string>();
    let cursor: TreeNode | undefined = n;
    while (cursor && !seen.has(cursor.id)) {
      seen.add(cursor.id);
      const isChapterNode = (cursor as Partial<ChapterOverlayNode>).source === "chapter";
      const chapterId = isChapterNode ? undefined : listed.get(cursor.id);
      if (chapterId) {
        band = chapterId;
        break;
      }
      const parent: string | undefined = cursor.prerequisites[0];
      cursor = parent ? byId.get(parent) : undefined;
    }
    bandOf.set(n.id, band);
    return band;
  };

  const members = new Map<string, TreeNode[]>(curriculum.chapters.map((c) => [c.id, []]));
  members.set(CLUB_BAND_ID, []);
  // Base lessons first in curriculum order, then the rest as they arrived,
  // so a band's first layout row reads as authored.
  const ordered = [
    ...curriculum.chapters.flatMap((c) => c.nodes.map((id) => byId.get(id)).filter((n): n is TreeNode => !!n)),
    ...nodes,
  ];
  const placed = new Set<string>();
  for (const n of ordered) {
    if (placed.has(n.id)) continue;
    placed.add(n.id);
    members.get(resolve(n))!.push(n);
  }

  const groups: SidebarGroup[] = curriculum.chapters.map((c, i) => ({
    id: c.id,
    index: i,
    title: c.title,
    color: BAND_PALETTE[i % BAND_PALETTE.length],
    nodes: members.get(c.id)!,
  }));
  groups.push({
    id: CLUB_BAND_ID,
    index: groups.length,
    title: `${chapter?.name.trim() || "More"} lessons`,
    color: clubColor ?? CLUB_COLOR_FALLBACK,
    nodes: members.get(CLUB_BAND_ID)!,
  });
  return groups.filter((g) => g.nodes.length > 0);
}

/** "01", "02", … — the band's reading-order number. */
function eyebrow(group: SidebarGroup): string {
  return String(group.index + 1).padStart(2, "0");
}

/** The bands with only the lessons matching `q` (all of them when empty). */
function filterGroups(q: string): SidebarGroup[] {
  if (!q) return bands;
  return bands
    .map((g) => ({ ...g, nodes: g.nodes.filter((node) => matchesQuery(node, q)) }))
    .filter((g) => g.nodes.length > 0);
}

function matchesQuery(node: TreeNode, q: string): boolean {
  return (
    node.title.toLowerCase().includes(q) ||
    node.description.toLowerCase().includes(q) ||
    node.tags.some((t) => t.toLowerCase().includes(q))
  );
}

/** One lesson row, shared by the sidebar and the bottom sheet. A div
 *  made a button (activateOn wires Enter/Space) so the keyboard can open
 *  a lesson from the list, not only the mouse. */
function lessonRow(node: TreeNode): string {
  const diffColor = DIFFICULTY_COLORS[node.difficulty] || "#6366f1";
  return `
    <div class="sidebar__item${node.id === activeItemId ? " active" : ""}" data-node-id="${escapeHtml(node.id)}" role="button" tabindex="0"${node.id === activeItemId ? ' aria-current="true"' : ""}>
      <div class="sidebar__item-row">
        <span class="sidebar__item-title">${escapeHtml(node.title)}</span>
        <span class="sidebar__item-badges">
          ${node.difficulty ? `<span class="sidebar__item-diff" style="background:${diffColor}18;color:${diffColor}">${escapeHtml(node.difficulty)}</span>` : ""}
          ${node.estimated_minutes ? `<span class="sidebar__item-time">${formatMinutes(node.estimated_minutes)}</span>` : ""}
        </span>
      </div>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

document.addEventListener("DOMContentLoaded", init);
