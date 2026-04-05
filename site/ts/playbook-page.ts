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
        <a href="./toolkit.html#${type}">${typeName}</a>
        <span class="playbook-breadcrumb__sep">/</span>
        <a href="./playbook.html?path=${indexPath}">${sectionName}</a>
        <span class="playbook-breadcrumb__sep">/</span>
        <span>${formatFileName(file)}</span>
      `;
    } else {
      breadcrumbSection.innerHTML = `
        <a href="./toolkit.html#${type}">${typeName}</a>
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

  await renderArticle(contentPath, contentEl);

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
      <p><a href="./toolkit.html">Return to Hub Toolkit</a></p>
    `;
  }
}

document.addEventListener("DOMContentLoaded", init);
