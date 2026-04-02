/**
 * article-page.ts — Article page initialization.
 * Reads ?id= param, loads tree data for metadata, renders the article.
 */

import {
  loadTreeData,
  getNodeById,
  getSeriesForNode,
  getSeriesNav,
  articleUrl,
  formatMinutes,
  LAYER_COLORS,
  LAYER_NAMES,
  DIFFICULTY_COLORS,
  type TreeJson,
  type TreeNode,
} from "./main";
import { renderArticle } from "./article-renderer";

async function init(): Promise<void> {
  const params = new URLSearchParams(window.location.search);
  const nodeId = params.get("id");

  if (!nodeId) {
    showError("No article ID specified. Use ?id=foundations/what-is-ai");
    return;
  }

  let tree: TreeJson;
  try {
    tree = await loadTreeData();
  } catch {
    showError("Failed to load curriculum data.");
    return;
  }

  const node = getNodeById(tree, nodeId);
  if (!node) {
    showError(`Article not found: "${nodeId}"`);
    return;
  }

  // Update page title
  document.title = `${node.title} — ALL Applied AI Network`;

  // Render breadcrumb
  const breadcrumbLayer = document.getElementById("breadcrumb-layer");
  const breadcrumb = document.getElementById("breadcrumb");
  if (breadcrumb && breadcrumbLayer) {
    const layerName = LAYER_NAMES[node.layer] || `Layer ${node.layer}`;
    const layerColor = LAYER_COLORS[node.layer] || "#6366f1";
    breadcrumb.innerHTML = `
      <a href="./">Home</a>
      <span class="breadcrumb__sep">/</span>
      <a href="./tree.html?layer=${node.layer}" style="color:${layerColor}">${layerName}</a>
      <span class="breadcrumb__sep">/</span>
      <span>${node.title}</span>
    `;
  }

  // Render sidebar
  renderSidebar(node, tree);

  // Render article content
  const contentEl = document.getElementById("article-content");
  if (contentEl) {
    await renderArticle(node.content_path, contentEl);

    // Generate table of contents from rendered headings
    generateTableOfContents(contentEl);
  }

  // Render prev/next navigation
  renderSeriesNav(node, tree);

  // Initialize reading progress bar
  initProgressBar();
}

function renderSidebar(node: TreeNode, tree: TreeJson): void {
  const sidebar = document.getElementById("article-sidebar");
  if (sidebar) sidebar.style.display = "";

  const color = LAYER_COLORS[node.layer] || "#6366f1";
  const diffColor = DIFFICULTY_COLORS[node.difficulty] || "#6366f1";

  // Meta
  const metaEl = document.getElementById("sidebar-meta");
  if (metaEl) {
    metaEl.innerHTML = `
      <div style="display:flex;gap:0.5rem;align-items:center;margin-bottom:0.75rem">
        <span style="width:10px;height:10px;border-radius:50%;background:${color};display:inline-block"></span>
        <span class="badge badge--${node.difficulty}">${node.difficulty}</span>
      </div>
      <div style="margin-bottom:0.5rem">
        <span class="article-sidebar__title">Layer</span>
        <div style="color:${color};font-weight:600;font-size:0.9rem">${node.layer} - ${LAYER_NAMES[node.layer] || ""}</div>
      </div>
      <div style="margin-bottom:0.5rem">
        <span class="article-sidebar__title">Estimated Time</span>
        <div style="font-weight:600;font-size:0.9rem">${formatMinutes(node.estimated_minutes)}</div>
      </div>
      ${node.author ? `<div style="margin-bottom:0.5rem"><span class="article-sidebar__title">Author</span><div style="font-size:0.85rem;color:var(--text-secondary)">${node.author}</div></div>` : ""}
      ${node.last_updated ? `<div><span class="article-sidebar__title">Updated</span><div style="font-size:0.85rem;color:var(--text-secondary)">${node.last_updated}</div></div>` : ""}
    `;
  }

  // Prerequisites
  const prereqsEl = document.getElementById("sidebar-prereqs");
  if (prereqsEl && node.prerequisites.length > 0) {
    const links = node.prerequisites
      .map((pid) => {
        const pn = getNodeById(tree, pid);
        const name = pn ? pn.title : pid;
        return `<li><a href="${articleUrl(pid)}">${name}</a></li>`;
      })
      .join("");

    prereqsEl.innerHTML = `
      <span class="article-sidebar__title">Prerequisites</span>
      <ul class="article-sidebar__list">${links}</ul>
    `;
  }

  // Unlocks
  const unlocksEl = document.getElementById("sidebar-unlocks");
  if (unlocksEl && node.unlocks.length > 0) {
    const links = node.unlocks
      .map((uid) => {
        const un = getNodeById(tree, uid);
        const name = un ? un.title : uid;
        return `<li><a href="${articleUrl(uid)}">${name}</a></li>`;
      })
      .join("");

    unlocksEl.innerHTML = `
      <span class="article-sidebar__title">Unlocks</span>
      <ul class="article-sidebar__list">${links}</ul>
    `;
  }

  // Tags
  const tagsEl = document.getElementById("sidebar-tags");
  if (tagsEl && node.tags.length > 0) {
    tagsEl.innerHTML = `
      <span class="article-sidebar__title">Tags</span>
      <div style="display:flex;flex-wrap:wrap;gap:0.3rem;margin-top:0.3rem">
        ${node.tags.map((t) => `<span class="node-tooltip__tag">${t}</span>`).join("")}
      </div>
    `;
  }
}

function renderSeriesNav(node: TreeNode, tree: TreeJson): void {
  const navEl = document.getElementById("article-nav");
  const prevEl = document.getElementById("nav-prev");
  const nextEl = document.getElementById("nav-next");
  if (!navEl || !prevEl || !nextEl) return;

  // Find the first series this node belongs to
  const series = getSeriesForNode(tree, node.id);
  if (series.length === 0) return;

  const primarySeries = series[0];
  const { prev, next } = getSeriesNav(primarySeries, node.id);

  if (!prev && !next) return;
  navEl.style.display = "";

  if (prev) {
    const pn = getNodeById(tree, prev);
    prevEl.innerHTML = `
      <span class="article-nav__label">Previous</span>
      <a class="article-nav__link" href="${articleUrl(prev)}">&larr; ${pn?.title || prev}</a>
    `;
  }

  if (next) {
    const nn = getNodeById(tree, next);
    nextEl.innerHTML = `
      <span class="article-nav__label">Next</span>
      <a class="article-nav__link" href="${articleUrl(next)}">${nn?.title || next} &rarr;</a>
    `;
  }
}

// ---------------------------------------------------------------------------
// Slugify helper — turns heading text into a URL-friendly ID
// ---------------------------------------------------------------------------

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// ---------------------------------------------------------------------------
// Table of Contents generation with scroll-spy
// ---------------------------------------------------------------------------

function generateTableOfContents(contentEl: HTMLElement): void {
  const headings = contentEl.querySelectorAll<HTMLElement>("h2, h3");
  if (headings.length === 0) return;

  const tocContainer = document.getElementById("sidebar-toc");
  if (!tocContainer) return;

  // Build ToC HTML
  const items: string[] = [];
  const headingEls: { el: HTMLElement; id: string }[] = [];

  headings.forEach((heading) => {
    const text = heading.textContent?.trim() || "";
    const id = slugify(text);

    // Deduplicate IDs
    let uniqueId = id;
    let counter = 1;
    while (document.getElementById(uniqueId)) {
      uniqueId = `${id}-${counter}`;
      counter++;
    }

    heading.id = uniqueId;
    headingEls.push({ el: heading, id: uniqueId });

    const level = heading.tagName.toLowerCase();
    items.push(
      `<li class="toc__item toc__item--${level}"><a href="#${uniqueId}">${text}</a></li>`
    );
  });

  tocContainer.innerHTML = `
    <div class="toc">
      <h3 class="toc__title">On this page</h3>
      <ul class="toc__list">${items.join("")}</ul>
    </div>
  `;
  tocContainer.style.display = "";

  // Scroll-spy with IntersectionObserver
  const tocLinks = tocContainer.querySelectorAll<HTMLAnchorElement>(".toc__item a");
  const linkMap = new Map<string, HTMLElement>();
  tocLinks.forEach((link) => {
    const href = link.getAttribute("href");
    if (href) linkMap.set(href.slice(1), link.parentElement!);
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Remove active from all
          tocContainer
            .querySelectorAll(".toc__item--active")
            .forEach((el) => el.classList.remove("toc__item--active"));

          // Activate the matching item
          const item = linkMap.get(entry.target.id);
          if (item) item.classList.add("toc__item--active");
        }
      });
    },
    {
      rootMargin: "-80px 0px -60% 0px",
      threshold: 0,
    }
  );

  headingEls.forEach(({ el }) => observer.observe(el));
}

// ---------------------------------------------------------------------------
// Reading progress bar
// ---------------------------------------------------------------------------

function initProgressBar(): void {
  const bar = document.getElementById("reading-progress");
  if (!bar) return;

  function updateProgress() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0;
    bar!.style.width = `${progress * 100}%`;
  }

  window.addEventListener("scroll", updateProgress, { passive: true });
  updateProgress();
}

// ---------------------------------------------------------------------------
// Error display
// ---------------------------------------------------------------------------

function showError(msg: string): void {
  const content = document.getElementById("article-content");
  if (content) {
    content.innerHTML = `
      <div class="callout callout--danger">
        <div class="callout__header">Error</div>
        <div class="callout__body"><p>${msg}</p></div>
      </div>
      <p><a href="./">Return to Home</a> or <a href="./tree.html">browse the Skill Tree</a>.</p>
    `;
  }
}

document.addEventListener("DOMContentLoaded", init);
