/**
 * playbook-page.ts — Renders playbook and workshop markdown content.
 *
 * Reads ?path= query param (e.g. ?path=playbooks/getting-started/index.md)
 * and uses article-renderer to parse and display the markdown.
 *
 * Also resolves relative markdown links (e.g. ./forming-your-core-team.md)
 * into playbook.html?path= links so navigation within a playbook works.
 */

import { renderArticle } from "./article-renderer";
import { getPlaybook, type PlaybookMeta } from "./playbook-metadata";

// ---------------------------------------------------------------------------
// Pretty names for sections
// ---------------------------------------------------------------------------

const SECTION_NAMES: Record<string, string> = {
  "getting-started": "Getting Started",
  hackathons: "Hackathons",
  "speaker-series": "Speaker Series",
  "innovation-labs": "Innovation Labs",
  "research-groups": "Research Groups",
  "build-a-chatbot": "Build a Chatbot",
  "prompt-engineering-lab": "Prompt Engineering Lab",
  "rag-from-scratch": "RAG from Scratch",
  "build-an-agent": "Build an Agent",
  "deploy-your-first-ai-app": "Deploy Your First AI App",
  "deep-learning-from-scratch": "Deep Learning from Scratch",
};

// ---------------------------------------------------------------------------
// Action-header renderer — injected at the top of a playbook's index.md page
// ---------------------------------------------------------------------------

function renderActionHeader(meta: PlaybookMeta, slug: string): string {
  const stats = meta.stats
    .map(
      (s) => `
        <div class="pb-header__stat">
          <span class="pb-header__stat-value">${s.value}</span>
          <span class="pb-header__stat-label">${s.label}</span>
        </div>
      `,
    )
    .join("");

  const actions = meta.actions
    .map(
      (a) => `
        <a class="pb-header__action" href="./playbook.html?path=playbooks/${slug}/${a.file}">
          <span class="pb-header__action-label">${a.label}</span>
          <span class="pb-header__action-sub">${a.sub}</span>
          <span class="pb-header__action-arrow" aria-hidden="true">&rarr;</span>
        </a>
      `,
    )
    .join("");

  return `
    <section class="pb-header" style="--pb-accent: ${meta.accent};">
      <div class="pb-header__accent-bar"></div>
      <div class="pb-header__top">
        <span class="pb-header__emoji" aria-hidden="true">${meta.emoji}</span>
        <div class="pb-header__titles">
          <span class="pb-header__kicker">Playbook</span>
          <h1 class="pb-header__title">${meta.title}</h1>
          <p class="pb-header__tagline">${meta.tagline}</p>
        </div>
      </div>
      <div class="pb-header__stats">${stats}</div>
      <div class="pb-header__actions-label">Jump to a stage:</div>
      <div class="pb-header__actions">${actions}</div>
    </section>
  `;
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

async function init(): Promise<void> {
  const params = new URLSearchParams(window.location.search);
  const contentPath = params.get("path");

  if (!contentPath) {
    showError("No content path specified. Use ?path=playbooks/getting-started/index.md");
    return;
  }

  // Determine type and section from path
  const parts = contentPath.split("/");
  const type = parts[0]; // "playbooks" or "workshops"
  const section = parts[1]; // e.g. "getting-started"
  const file = parts[parts.length - 1]; // e.g. "index.md"

  const sectionName = SECTION_NAMES[section] || section;
  const typeName = type === "workshops" ? "Workshops" : "Playbooks";

  // Update breadcrumb
  const breadcrumbSection = document.getElementById("breadcrumb-section");
  if (breadcrumbSection) {
    if (file !== "index.md" && file !== "workshop.md") {
      // Show section as a link, then current file
      const indexPath = type === "workshops"
        ? `${type}/${section}/workshop.md`
        : `${type}/${section}/index.md`;
      breadcrumbSection.innerHTML = `
        <a href="${type === 'workshops' ? './toolkit.html#workshops' : './playbooks.html'}">${typeName}</a>
        <span class="playbook-breadcrumb__sep">/</span>
        <a href="./playbook.html?path=${indexPath}">${sectionName}</a>
        <span class="playbook-breadcrumb__sep">/</span>
        <span>${formatFileName(file)}</span>
      `;
    } else {
      breadcrumbSection.innerHTML = `
        <a href="${type === 'workshops' ? './toolkit.html#workshops' : './playbooks.html'}">${typeName}</a>
        <span class="playbook-breadcrumb__sep">/</span>
        <span>${sectionName}</span>
      `;
    }
  }

  // Update page title
  document.title = `${sectionName} — ${typeName} — ALL Applied AI Network`;

  // Render content
  const contentEl = document.getElementById("playbook-content");
  if (!contentEl) return;

  // If we're on a playbook's index.md, inject the action header BEFORE the article
  // so users instantly see what the playbook does and the top actions available.
  const meta = type === "playbooks" && file === "index.md" ? getPlaybook(section) : undefined;
  if (meta) {
    const header = document.createElement("div");
    header.innerHTML = renderActionHeader(meta, section);
    contentEl.parentElement?.insertBefore(header.firstElementChild!, contentEl);
  }

  await renderArticle(contentPath, contentEl);

  // On an index page, the rendered markdown also contains an H1 — hide it since
  // the action header already shows the title prominently.
  if (meta) {
    const articleH1 = contentEl.querySelector("h1");
    if (articleH1) articleH1.style.display = "none";
  }

  // Rewrite relative .md links to playbook.html?path= links
  rewriteLinks(contentEl, contentPath);

  // Init reading progress
  initProgressBar();
}

// ---------------------------------------------------------------------------
// Link rewriting — turns relative .md hrefs into playbook.html?path= links
// ---------------------------------------------------------------------------

function rewriteLinks(container: HTMLElement, currentPath: string): void {
  const baseDir = currentPath.substring(0, currentPath.lastIndexOf("/") + 1);

  container.querySelectorAll<HTMLAnchorElement>("a[href]").forEach((link) => {
    const href = link.getAttribute("href");
    if (!href) return;

    // Only rewrite relative .md links
    if (href.endsWith(".md") && !href.startsWith("http") && !href.startsWith("//")) {
      let resolved: string;
      if (href.startsWith("./")) {
        resolved = baseDir + href.slice(2);
      } else if (href.startsWith("../")) {
        // Handle parent-relative paths
        const parts = baseDir.split("/").filter(Boolean);
        const hrefParts = href.split("/");
        let ups = 0;
        for (const p of hrefParts) {
          if (p === "..") ups++;
          else break;
        }
        const base = parts.slice(0, parts.length - ups).join("/");
        const rest = hrefParts.slice(ups).join("/");
        resolved = base ? `${base}/${rest}` : rest;
      } else {
        resolved = baseDir + href;
      }

      link.setAttribute("href", `./playbook.html?path=${resolved}`);
    }
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatFileName(file: string): string {
  return file
    .replace(/\.md$/, "")
    .replace(/^\d+-/, "") // strip leading number prefix
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

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

function showError(msg: string): void {
  const content = document.getElementById("playbook-content");
  if (content) {
    content.innerHTML = `
      <div class="callout callout--danger">
        <div class="callout__header">Error</div>
        <div class="callout__body"><p>${msg}</p></div>
      </div>
      <p><a href="./playbooks.html">Return to Playbooks</a></p>
    `;
  }
}

document.addEventListener("DOMContentLoaded", init);
