/**
 * article-page.ts — Article page initialization.
 * Reads ?id= param, loads tree data for metadata, renders the article.
 */

import {
  loadTreeData,
  loadChapterTree,
  adaptChapterTree,
  chapterParam,
  getNodeById,
  getSeriesForNode,
  getSeriesNav,
  articleUrl,
  nodeArticleUrl,
  escapeHtml,
  formatMinutes,
  resolveNodeColor,
  type ChapterOverlayNode,
  type TreeJson,
  type TreeNode,
  type TreeContributor,
  type TreeResource,
} from "./main";
import { renderArticle, renderMarkdown } from "./article-renderer";
import curriculum from "../../learning/curriculum.json";

function addPractice(node: TreeNode, content: HTMLElement) {
  const activity = (curriculum.activities as Record<string, { goal: string; needs: string; steps: string[]; check: string }>)[node.id];
  if (!activity || content.querySelector('[role="alert"]')) return;
  const reference = document.createElement("details");
  reference.className = "lesson-reference";
  const summary = document.createElement("summary");
  summary.textContent = "Background and worked examples";
  reference.append(summary);
  while (content.firstChild) reference.append(content.firstChild);
  const heading = document.createElement("h1"); heading.textContent = node.title;
  const practice = document.createElement("section"); practice.className = "lesson-practice";
  const inline = (s: string) => escapeHtml(s).replace(/`([^`]+)`/g, '<code>$1</code>');
  practice.innerHTML = `<h2>${escapeHtml(activity.goal)}</h2><p><strong>Before you start:</strong> ${inline(activity.needs)}</p><h3>Try it</h3><ol>${activity.steps.map(s => `<li>${inline(s)}</li>`).join("")}</ol><div class="lesson-practice__check"><h3>Check your result</h3><p>${inline(activity.check)}</p></div><button type="button" id="practice-done">I completed the exercise</button><small id="practice-status">Self-reported practice, saved on this device. For account progress, use <a href="https://dashboard.all-ai-network.org/me/learn">My Learning</a>.</small>`;
  content.append(heading, practice, reference);
  const key = `all-practice:${chapterSlug ?? "base"}:${node.id}`;
  const button = practice.querySelector<HTMLButtonElement>("button")!;
  let done = false;
  try { done = localStorage.getItem(key) === "done"; } catch { /* storage may be disabled */ }
  const paint = () => { button.textContent = done ? "Completed · Undo" : "I completed the exercise"; button.setAttribute("aria-pressed", String(done)); };
  paint();
  button.onclick = () => {
    done = !done;
    try { if (done) localStorage.setItem(key,"done"); else localStorage.removeItem(key); paint(); }
    catch { done = !done; practice.querySelector("small")!.textContent = "Your browser couldn't save progress. Use My Learning to save it to your account."; }
  };
}

/** Active ?chapter= slug — carried through every tree/article link. */
let chapterSlug: string | null = null;

/** tree.html link that keeps the chapter overlay context (plus extras). */
function treeUrlWithChapter(extra?: Record<string, string>): string {
  const params = new URLSearchParams(extra);
  if (chapterSlug) params.set("chapter", chapterSlug);
  const qs = params.toString();
  return `./tree.html${qs ? `?${qs}` : ""}`;
}

async function init(): Promise<void> {
  const params = new URLSearchParams(window.location.search);
  const nodeId = params.get("id");
  chapterSlug = chapterParam();

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
    // Not a base node — with a chapter overlay active, the id may be a
    // chapter-authored node from the network API.
    if (chapterSlug && (await renderChapterArticle(chapterSlug, nodeId))) {
      return;
    }
    showError(`Article not found: "${nodeId}"`);
    return;
  }

  // Update page title
  document.title = `${node.title} — ALL Applied AI Network`;

  // Render breadcrumb
  const breadcrumb = document.getElementById("breadcrumb");
  if (breadcrumb) {
    breadcrumb.innerHTML = `
      <a href="./">Home</a>
      <span class="breadcrumb__sep">/</span>
      <a href="${treeUrlWithChapter()}">Learning Tree</a>
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
    addPractice(node, contentEl);

    // Render curated resources section after article content
    if (node.resources && node.resources.length > 0) {
      renderResources(node.resources, contentEl);
    }

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

  const nodesById = new Map(tree.nodes.map((n) => [n.id, n]));
  const color = resolveNodeColor(node.id, nodesById);

  // View in tree button
  const actionsEl = document.getElementById("sidebar-actions");
  if (actionsEl) {
    actionsEl.innerHTML = `
      <a href="${treeUrlWithChapter({ node: node.id })}" class="sidebar-action-btn">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <circle cx="8" cy="3" r="2" stroke="currentColor" stroke-width="1.5" fill="none"/>
          <circle cx="4" cy="12" r="2" stroke="currentColor" stroke-width="1.5" fill="none"/>
          <circle cx="12" cy="12" r="2" stroke="currentColor" stroke-width="1.5" fill="none"/>
          <line x1="8" y1="5" x2="4" y2="10" stroke="currentColor" stroke-width="1.2"/>
          <line x1="8" y1="5" x2="12" y2="10" stroke="currentColor" stroke-width="1.2"/>
        </svg>
        View in learning tree
      </a>
    `;
  }

  // Meta
  const metaEl = document.getElementById("sidebar-meta");
  if (metaEl) {
    metaEl.innerHTML = `
      <div style="display:flex;gap:0.5rem;align-items:center;margin-bottom:0.75rem">
        <span style="width:10px;height:10px;border-radius:50%;background:${color};display:inline-block"></span>
        <span class="badge badge--${escapeHtml(node.difficulty)}">${escapeHtml(node.difficulty)}</span>
      </div>
      <div style="margin-bottom:0.5rem">
        <span class="article-sidebar__title">Estimated Time</span>
        <div style="font-weight:600;font-size:0.9rem">${formatMinutes(node.estimated_minutes)}</div>
      </div>
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
        return `<li><a href="${articleUrl(pid, chapterSlug)}">${name}</a></li>`;
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
        return `<li><a href="${articleUrl(uid, chapterSlug)}">${name}</a></li>`;
      })
      .join("");

    unlocksEl.innerHTML = `
      <span class="article-sidebar__title">Unlocks</span>
      <ul class="article-sidebar__list">${links}</ul>
    `;
  }

  // Contributors
  const contribEl = document.getElementById("sidebar-contributors");
  const contributors = node.contributors && node.contributors.length > 0
    ? node.contributors
    : node.author
      ? [{ name: node.author, role: "author" }]
      : [];

  if (contribEl && contributors.length > 0) {
    contribEl.innerHTML = `
      <span class="article-sidebar__title">Contributors</span>
      <div class="contributor-cards">
        ${contributors.map((c: TreeContributor) => {
          const initials = c.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
          const roleColors: Record<string, string> = {
            author: "var(--palette-0)",
            curator: "var(--palette-2)",
            reviewer: "var(--palette-1)",
            editor: "var(--palette-3)",
          };
          const roleColor = roleColors[c.role] || "var(--text-secondary)";
          return `
            <div class="contributor-card">
              <div class="contributor-card__avatar" style="background:${roleColor}">${initials}</div>
              <div class="contributor-card__info">
                <div class="contributor-card__name">${c.url ? `<a href="${c.url}" target="_blank" rel="noopener">${c.name}</a>` : c.name}</div>
                <div class="contributor-card__meta">
                  <span class="contributor-card__role" style="color:${roleColor}">${c.role}</span>
                  ${c.affiliation ? `<span class="contributor-card__affil">${c.affiliation}</span>` : ""}
                </div>
                ${c.github ? `<a href="https://github.com/${c.github}" class="contributor-card__gh" target="_blank" rel="noopener">@${c.github}</a>` : ""}
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;
    contribEl.style.display = "";
  }

  // Tags
  const tagsEl = document.getElementById("sidebar-tags");
  if (tagsEl && node.tags.length > 0) {
    tagsEl.innerHTML = `
      <span class="article-sidebar__title">Tags</span>
      <div style="display:flex;flex-wrap:wrap;gap:0.3rem;margin-top:0.3rem">
        ${node.tags.map((t) => `<span class="node-tooltip__tag">${escapeHtml(t)}</span>`).join("")}
      </div>
    `;
  }
}

function renderResources(resources: TreeResource[], contentEl: HTMLElement): void {
  const typeIcons: Record<string, string> = {
    article: "\uD83D\uDCDD",
    video: "\u25B6\uFE0F",
    course: "\uD83C\uDF93",
    tool: "\uD83D\uDD27",
    paper: "\uD83D\uDCDC",
    repo: "\uD83D\uDCBB",
  };

  const section = document.createElement("section");
  section.className = "resources-section";
  section.innerHTML = `
    <h2 class="resources-section__title">Curated Resources</h2>
    <p class="resources-section__desc">Further reading and reference.</p>
    <div class="resources-grid">
      ${resources.map((r) => `
        <a href="${r.url}" class="resource-card" target="_blank" rel="noopener">
          <div class="resource-card__header">
            <span class="resource-card__icon">${typeIcons[r.type] || "\uD83D\uDD17"}</span>
            <span class="resource-card__type">${r.type}</span>
          </div>
          <div class="resource-card__title">${r.title}</div>
          ${r.note ? `<div class="resource-card__note">${r.note}</div>` : ""}
          ${r.contributor ? `<div class="resource-card__curator">Curated by ${r.contributor}</div>` : ""}
        </a>
      `).join("")}
    </div>
  `;
  contentEl.appendChild(section);
}

function renderSeriesNav(node: TreeNode, tree: TreeJson): void {
  const navEl = document.getElementById("article-nav");
  const prevEl = document.getElementById("nav-prev");
  const nextEl = document.getElementById("nav-next");
  if (!navEl || !prevEl || !nextEl) return;

  // The reader follows the same chapter order shown by the curriculum browser.
  const sequence = curriculum.chapters.find(c => c.nodes.includes(node.id))?.nodes
    ?? getSeriesForNode(tree, node.id)[0]?.nodes ?? [];
  const index = sequence.indexOf(node.id);
  if (index < 0) return;
  const prev = sequence[index-1];
  const next = sequence[index+1];

  if (!prev && !next) return;
  navEl.style.display = "";

  if (prev) {
    const pn = getNodeById(tree, prev);
    prevEl.innerHTML = `
      <span class="article-nav__label">Previous</span>
      <a class="article-nav__link" href="${articleUrl(prev, chapterSlug)}">&larr; ${escapeHtml(pn?.title || prev)}</a>
    `;
  }

  if (next) {
    const nn = getNodeById(tree, next);
    nextEl.innerHTML = `
      <span class="article-nav__label">Next</span>
      <a class="article-nav__link" href="${articleUrl(next, chapterSlug)}">${escapeHtml(nn?.title || next)} &rarr;</a>
    `;
  }
}

// ---------------------------------------------------------------------------
// Chapter-authored articles (?chapter=slug + non-base id)
// ---------------------------------------------------------------------------

/**
 * Render a chapter-authored node's article from the network API payload.
 * Returns false on any miss (fetch failure, unknown id, base-source id)
 * so init() falls through to the existing not-found handling.
 */
async function renderChapterArticle(
  slug: string,
  nodeId: string
): Promise<boolean> {
  const payload = await loadChapterTree(slug);
  if (!payload) return false;

  const nodes = adaptChapterTree(payload);
  const node = nodes.find((n) => n.id === nodeId && n.source === "chapter");
  if (!node) return false;

  document.title = `${node.title} — ${payload.chapter.name}`;

  const breadcrumb = document.getElementById("breadcrumb");
  if (breadcrumb) {
    breadcrumb.innerHTML = `
      <a href="./">Home</a>
      <span class="breadcrumb__sep">/</span>
      <a href="${treeUrlWithChapter()}">Learning Tree</a>
      <span class="breadcrumb__sep">/</span>
      <span>${escapeHtml(node.title)}</span>
    `;
  }

  // Contributors/resources/series stay hidden — chapter nodes don't
  // carry them (their sidebar sections simply never render).
  renderChapterSidebar(node, nodes, slug);

  const contentEl = document.getElementById("article-content");
  if (contentEl) {
    // Repo articles open with their own H1; chapter bodies usually
    // don't — prepend the node title unless the markdown already has one.
    const body = node.body ?? "";
    const md = /^\s*#\s/.test(body) ? body : `# ${node.title}\n\n${body}`;
    await renderMarkdown(md, contentEl);
    generateTableOfContents(contentEl);
  }

  initProgressBar();
  return true;
}

function renderChapterSidebar(
  node: ChapterOverlayNode,
  nodes: ChapterOverlayNode[],
  slug: string
): void {
  const sidebar = document.getElementById("article-sidebar");
  if (sidebar) sidebar.style.display = "";

  const nodesById = new Map<string, TreeNode>(nodes.map((n) => [n.id, n]));
  const color = resolveNodeColor(node.id, nodesById);

  // View in tree button — back to the chapter's merged tree
  const actionsEl = document.getElementById("sidebar-actions");
  if (actionsEl) {
    actionsEl.innerHTML = `
      <a href="${treeUrlWithChapter({ node: node.id })}" class="sidebar-action-btn">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <circle cx="8" cy="3" r="2" stroke="currentColor" stroke-width="1.5" fill="none"/>
          <circle cx="4" cy="12" r="2" stroke="currentColor" stroke-width="1.5" fill="none"/>
          <circle cx="12" cy="12" r="2" stroke="currentColor" stroke-width="1.5" fill="none"/>
          <line x1="8" y1="5" x2="4" y2="10" stroke="currentColor" stroke-width="1.2"/>
          <line x1="8" y1="5" x2="12" y2="10" stroke="currentColor" stroke-width="1.2"/>
        </svg>
        View in learning tree
      </a>
    `;
  }

  // Meta — difficulty/time only when the chapter authored them
  const metaEl = document.getElementById("sidebar-meta");
  if (metaEl) {
    metaEl.innerHTML = `
      <div style="display:flex;gap:0.5rem;align-items:center;margin-bottom:0.75rem">
        <span style="width:10px;height:10px;border-radius:50%;background:${color};display:inline-block"></span>
        ${node.difficulty ? `<span class="badge badge--${escapeHtml(node.difficulty)}">${escapeHtml(node.difficulty)}</span>` : ""}
      </div>
      ${node.estimated_minutes ? `<div style="margin-bottom:0.5rem"><span class="article-sidebar__title">Estimated Time</span><div style="font-weight:600;font-size:0.9rem">${formatMinutes(node.estimated_minutes)}</div></div>` : ""}
    `;
  }

  // Prereq/unlock links carry the chapter param; bodyless chapter
  // targets render as plain text (they have no article page).
  const linkFor = (id: string): string => {
    const n = nodesById.get(id);
    // An unresolved reference is still officer-authored text. Both
    // branches below escape; this one did not, which made a dangling
    // prerequisite/unlock a stored-XSS sink.
    if (!n) return `<li>${escapeHtml(id)}</li>`;
    const href = nodeArticleUrl(n, slug);
    return href
      ? `<li><a href="${href}">${escapeHtml(n.title)}</a></li>`
      : `<li>${escapeHtml(n.title)}</li>`;
  };

  const prereqsEl = document.getElementById("sidebar-prereqs");
  if (prereqsEl && node.prerequisites.length > 0) {
    prereqsEl.innerHTML = `
      <span class="article-sidebar__title">Prerequisites</span>
      <ul class="article-sidebar__list">${node.prerequisites.map(linkFor).join("")}</ul>
    `;
  }

  const unlocksEl = document.getElementById("sidebar-unlocks");
  if (unlocksEl && node.unlocks.length > 0) {
    unlocksEl.innerHTML = `
      <span class="article-sidebar__title">Unlocks</span>
      <ul class="article-sidebar__list">${node.unlocks.map(linkFor).join("")}</ul>
    `;
  }

  // Tags
  const tagsEl = document.getElementById("sidebar-tags");
  if (tagsEl && node.tags.length > 0) {
    tagsEl.innerHTML = `
      <span class="article-sidebar__title">Tags</span>
      <div style="display:flex;flex-wrap:wrap;gap:0.3rem;margin-top:0.3rem">
        ${node.tags.map((t) => `<span class="node-tooltip__tag">${escapeHtml(t)}</span>`).join("")}
      </div>
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
    // escapeHtml is essential, not cosmetic: `text` comes from
    // heading.textContent, which DECODES the entities DOMPurify left
    // behind as inert text. Interpolating it raw re-parsed markup the
    // sanitizer had already neutralised (security audit 2026-08-18,
    // finding 1).
    items.push(
      `<li class="toc__item toc__item--${level}"><a href="#${uniqueId}">${escapeHtml(text)}</a></li>`
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
    link.addEventListener("click", () => {
      const target = href ? document.getElementById(href.slice(1)) : null;
      let parent = target?.parentElement;
      while (parent) { if (parent instanceof HTMLDetailsElement) parent.open = true; parent = parent.parentElement; }
    });
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
    // msg carries the raw ?id= on the not-found path, so it is
    // attacker-controlled (security audit 2026-08-18, finding 5).
    content.innerHTML = `
      <div class="callout callout--danger">
        <div class="callout__header">Error</div>
        <div class="callout__body"><p>${escapeHtml(msg)}</p></div>
      </div>
      <p><a href="./">Return to Home</a> or <a href="./tree.html">browse Learning Content</a>.</p>
    `;
  }
}

document.addEventListener("DOMContentLoaded", init);
