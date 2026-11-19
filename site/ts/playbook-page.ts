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
import { escapeHtml } from "./main";
import { PLAYBOOKS, getPlaybook, type PlaybookMeta } from "./playbook-metadata";
import { drawFigures, tone } from "./playbook-figures";
import { mountLoops, playInPlace } from "./film-loop";

// ---------------------------------------------------------------------------
// Pretty names for sections
// ---------------------------------------------------------------------------

const SECTION_NAMES: Record<string, string> = {
  "getting-started": "Getting Started",
  sponsorship: "Sponsorship",
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
// The header at the top of a playbook: what it is, how long, the film, three
// facts, and a door to each chapter.
// ---------------------------------------------------------------------------

const CLOCK = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="8" cy="8" r="6.2"/><path d="M8 4.6V8l2.3 1.5"/></svg>`;
const PLAY = `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3.5v9l7-4.5z" fill="currentColor"/></svg>`;

// The story header, in the look of the audience kits. It answers the two things a
// reader decides on before reading: what they'll walk away with, and why it's worth
// the time. The headline is the payoff; the panel under it is the proof; the band is
// the three keys, each the way into its chapter. The film waits beside the headline
// for anyone who would rather watch.
function renderStoryHeader(meta: PlaybookMeta): string {
  const f = meta.film;
  // A film with a loop shows a few silent seconds of itself on repeat until asked.
  const film = f
    ? `
      <figure class="pbh__film${f.loop ? " has-loop" : ""}">
        <div class="pbh__film-frame">
          <video class="pbh__film-video" playsinline ${f.loop ? `muted loop preload="metadata" data-loop` : `preload="none"`}
            poster="${f.loop ? (f.loopPoster ?? f.poster) : f.poster}" data-film="${f.src}" data-film-poster="${f.poster}"
            aria-label="${escapeHtml(f.title)}, ${f.runtime}${f.sound ? "" : ", silent"}">
            <source src="${f.loop ?? f.src}" type="video/mp4" />
          </video>
          <button type="button" class="pbh__film-play" data-pbh-play>
            <span class="pbh__film-btn" aria-hidden="true">${PLAY}</span>
            <span>${escapeHtml(f.cta ?? "Watch Instead")}<small>${f.runtime}${f.sound ? " &middot; sound on" : ""}</small></span>
          </button>
        </div>
        <figcaption><b>${escapeHtml(f.title)}</b>${escapeHtml(f.blurb)}${f.sound ? "" : " Silent, so it reads with the sound off."}</figcaption>
      </figure>`
    : "";
  const why = (meta.why ?? meta.stats)
    .map(
      (s) => `
        <div class="pbh__num${s.value.length > 5 ? " is-long" : ""}">
          <span class="pbh__num-v">${escapeHtml(s.value)}</span>
          <span class="pbh__num-l">${escapeHtml(s.label)}</span>
        </div>`,
    )
    .join("");
  const paired = meta.actions.length === meta.keys.length;
  const keys = meta.keys
    .map((k, i) => {
      const a = paired ? meta.actions[i] : null;
      return `
        <li class="pbf-help__step" style="--c:${tone(i, meta.keys.length)}">
          <span class="pbf-help__k">${a ? `Chapter ${String(i + 1).padStart(2, "0")}` : `Key ${i + 1}`}</span>
          ${a ? `<a class="pbf-help__go" href="${a.anchor}">${escapeHtml(a.label)}</a>` : ""}
          <p>${escapeHtml(k)}</p>
        </li>`;
    })
    .join("");
  return `
    <section class="pbh" style="--pb-accent: ${meta.accent};">
      <div class="pbh__top">
        <span class="pbh__name"><span class="pbh__icon" aria-hidden="true">${meta.icon}</span>${escapeHtml(meta.title)}<em>Playbook &middot; ${escapeHtml(meta.track)}</em></span>
        <span class="pbh__meta">${CLOCK}${meta.minutes} min read${meta.film ? ` &middot; ${meta.film.runtime} film` : ""}</span>
      </div>
      <div class="pbh__main${meta.film ? " has-film" : ""}">
        <div class="pbh__words">
          <h1 class="pbh__t">${escapeHtml(meta.headline ?? meta.title)}</h1>
          <p class="pbh__sub">${escapeHtml(meta.tagline)}</p>
        </div>
        ${film}
      </div>
      <div class="pbh__why">
        <span class="pbh__label">Why It's Worth Your Time</span>
        <div class="pbh__nums">${why}</div>
      </div>
      <section class="pbf-help pbh__band" id="start-here" aria-label="What you'll take away">
        <div class="pbf-help__t"><span>What You'll Take Away</span><small>If you read nothing else</small></div>
        <ol class="pbf-help__steps">${keys}</ol>
      </section>
    </section>
  `;
}

/** The story header's film plays where it is, with its own controls, once asked. */
function wireStoryHeader(root: ParentNode): void {
  const btn = root.querySelector<HTMLButtonElement>("[data-pbh-play]");
  const video = root.querySelector<HTMLVideoElement>(".pbh__film-video");
  if (!btn || !video) return;
  mountLoops(root);
  btn.addEventListener("click", () => {
    btn.closest(".pbh__film")?.classList.add("is-started");
    btn.remove();
    if ("loop" in video.dataset) {
      playInPlace(video, video.dataset.film!, video.dataset.filmPoster);
      return;
    }
    video.controls = true;
    video.focus();
    void video.play().catch(() => {});
  });
}

function renderActionHeader(meta: PlaybookMeta): string {
  if (meta.headline && meta.why) return renderStoryHeader(meta);
  const stats = meta.stats
    .map(
      (s) => `
        <div class="pb-header__stat">
          <span class="pb-header__stat-value">${escapeHtml(s.value)}</span>
          <span class="pb-header__stat-label">${escapeHtml(s.label)}</span>
        </div>
      `,
    )
    .join("");

  // Each door names the chapter it lands in, filled in by numberJumps() once the
  // markdown has rendered (a door can land on a section inside a chapter). The
  // space holds the line so nothing shifts when it fills.
  const actions = meta.actions
    .map(
      (a) => `
        <a class="pb-header__action" href="${a.anchor}">
          <span class="pb-header__action-num">&nbsp;</span>
          <span class="pb-header__action-label">${escapeHtml(a.label)}</span>
          <span class="pb-header__action-sub">${escapeHtml(a.sub)}</span>
          <span class="pb-header__action-arrow" aria-hidden="true">&rarr;</span>
        </a>
      `,
    )
    .join("");

  // The film, when this playbook has one. It sits directly under the title so a
  // reader who would rather watch is offered that before the text starts.
  const film = meta.film
    ? `
      <div class="pb-film">
        <video
          class="pb-film__video"
          controls
          preload="none"
          playsinline
          poster="${meta.film.poster}"
          aria-label="${escapeHtml(meta.film.title)}, ${meta.film.runtime}, silent"
        >
          <source src="${meta.film.src}" type="video/mp4" />
          <p>Your browser cannot play this video.
             <a href="${meta.film.src}">Download it instead</a>.</p>
        </video>
        <div class="pb-film__meta">
          <span class="pb-film__kicker">Watch instead</span>
          <p class="pb-film__blurb">${escapeHtml(meta.film.blurb)}</p>
          <p class="pb-film__note">${meta.film.runtime} &middot; silent, so it reads with the sound off &middot;
            <a href="${meta.film.src}" download>download</a></p>
        </div>
      </div>
    `
    : "";

  const filmMeta = meta.film ? `<span>${PLAY}Film ${meta.film.runtime}</span>` : "";

  return `
    <section class="pb-header" style="--pb-accent: ${meta.accent};">
      <div class="pb-header__accent-bar"></div>
      <div class="pb-header__top">
        <span class="pb-header__icon" aria-hidden="true">${meta.icon}</span>
        <div class="pb-header__titles">
          <span class="pb-header__kicker">Playbook &middot; ${escapeHtml(meta.track)}</span>
          <h1 class="pb-header__title">${escapeHtml(meta.title)}</h1>
          <p class="pb-header__tagline">${escapeHtml(meta.tagline)}</p>
          <div class="pb-header__meta"><span>${CLOCK}${meta.minutes} min read</span>${filmMeta}</div>
        </div>
      </div>
      ${film}
      <div class="pb-header__stats">${stats}</div>
      <div class="pb-header__actions-label">Jump to a chapter</div>
      <div class="pb-header__actions">${actions}</div>
    </section>
  `;
}

// ---------------------------------------------------------------------------
// The body: the markdown stays plain, and this gives its parts their jobs.
//   the first paragraph            -> the lede
//   ## Start here + its list       -> three numbered cards
//   ## Any other heading           -> a numbered chapter, its bold first line the lead
//   **In the dashboard:** ...      -> a box that names the tool for the job
//   a table with a time axis       -> the first column set as weeks or times
//   > a quoted template            -> a Copy button
// ---------------------------------------------------------------------------

const MONITOR = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></svg>`;

/**
 * A paragraph that is only a link to an .mp4 ("[Show me, 0:23](…/film/how/x.mp4)") becomes a
 * click-to-play clip: a silent walk through the clicks the box above it names. The poster is the
 * same path as a .jpg. Anywhere else (GitHub, a plain reader) it stays a link to the file.
 */
function showMeClip(p: HTMLParagraphElement): HTMLElement | null {
  const a = p.firstElementChild;
  if (!(a instanceof HTMLAnchorElement) || p.children.length !== 1 || p.textContent?.trim() !== a.textContent?.trim()) return null;
  const href = a.getAttribute("href") ?? "";
  if (!/\.mp4$/i.test(href)) return null;
  // The site is all-ai-network.org, so its own files load from here (and from a dev server).
  const src = href.replace(/^https:\/\/all-ai-network\.org\//, "./");
  const label = a.textContent?.trim() ?? "Show me";
  const runtime = label.match(/\d+:\d{2}/)?.[0] ?? "";
  const fig = document.createElement("figure");
  fig.className = "pbr-clip";
  const video = document.createElement("video");
  video.className = "pbr-clip__video";
  video.preload = "none";
  video.muted = true;
  video.playsInline = true;
  video.poster = src.replace(/\.mp4$/i, ".jpg");
  video.src = src;
  video.setAttribute("aria-label", `A silent clip of these steps in the dashboard${runtime ? `, ${runtime}` : ""}`);
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "pbr-clip__play";
  btn.innerHTML = `<span class="pbr-clip__btn" aria-hidden="true"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span>Show me${runtime ? `<small>${runtime}</small>` : ""}`;
  btn.setAttribute("aria-label", `Show me these steps in the dashboard${runtime ? `, a ${runtime} clip` : ""}`);
  btn.addEventListener("click", () => {
    fig.classList.add("is-started");
    btn.remove();
    video.controls = true;
    video.focus();
    void video.play().catch(() => {});
  });
  video.addEventListener("error", () => {
    if (fig.querySelector(".pbr-clip__failed")) return;
    const f = document.createElement("a");
    f.className = "pbr-clip__failed";
    f.href = href;
    f.target = "_blank";
    f.rel = "noopener";
    f.textContent = "The clip didn't load here. Open it in a new tab";
    fig.appendChild(f);
  });
  fig.append(video, btn);
  return fig;
}

function dressPlaybook(root: HTMLElement): void {
  root.classList.add("pbr");

  // The first paragraph is the header's line already (playbook-metadata keeps them equal).
  const lede = Array.from(root.children).find((el) => el.tagName === "P");
  if (lede && !lede.previousElementSibling?.matches("h2")) lede.classList.add("pbr-lede");

  root.querySelectorAll<HTMLElement>("h2").forEach((h2) => {
    if (h2.id === "start-here") {
      h2.classList.add("pbr-start");
      const list = h2.nextElementSibling;
      if (list?.tagName === "OL") list.classList.add("pbr-keys");
      return;
    }
    h2.classList.add("pbr-chapter");
    const first = h2.nextElementSibling;
    if (first?.tagName === "P" && first.children.length === 1 && first.firstElementChild?.tagName === "STRONG" && first.textContent?.trim() === first.firstElementChild.textContent?.trim()) {
      first.classList.add("pbr-lead");
    }
  });

  // "In the dashboard:" paragraphs, and a table that follows a bare label
  root.querySelectorAll<HTMLParagraphElement>("p").forEach((p) => {
    const label = p.firstElementChild;
    if (!label || label.tagName !== "STRONG" || !/^In the dashboard:?$/i.test(label.textContent?.trim() ?? "")) return;
    if (p.firstChild !== label) return;
    const box = document.createElement("div");
    box.className = "pbr-dash";
    box.innerHTML = `<div class="pbr-dash__head">${MONITOR}<span>In the dashboard</span></div>`;
    p.replaceWith(box);
    label.remove();
    // "In the dashboard: sign up..." reads as "Sign up..." under the box's own label.
    if (p.firstChild?.nodeType === Node.TEXT_NODE) {
      const rest = (p.firstChild.textContent ?? "").replace(/^\s+/, "");
      p.firstChild.textContent = rest.charAt(0).toUpperCase() + rest.slice(1);
    }
    const next = box.nextElementSibling;
    if (p.textContent?.trim()) box.appendChild(p);
    // A bare label owns the table or numbered steps under it
    if (!p.textContent?.trim() && (next?.tagName === "TABLE" || next?.tagName === "OL" || next?.tagName === "UL")) box.appendChild(next);
  });
  root.querySelectorAll<HTMLElement>("h3").forEach((h3) => {
    const next = h3.nextElementSibling;
    if (!/in the dashboard/i.test(h3.textContent ?? "") || next?.tagName !== "TABLE") return;
    const box = document.createElement("div");
    box.className = "pbr-dash";
    box.innerHTML = `<div class="pbr-dash__head">${MONITOR}<span>In the dashboard</span></div>`;
    next.replaceWith(box);
    box.appendChild(next);
  });
  // A "Show me" clip right after a box joins it, as a player (see showMeClip)
  root.querySelectorAll<HTMLElement>(".pbr-dash").forEach((box) => {
    const next = box.nextElementSibling;
    const clip = next instanceof HTMLParagraphElement ? showMeClip(next) : null;
    if (clip) { next!.remove(); box.appendChild(clip); }
  });

  // A table whose first column is a time axis (weeks, months, times of day)
  root.querySelectorAll<HTMLTableElement>("table").forEach((table) => {
    const head = table.querySelector("thead th")?.textContent?.trim() ?? "";
    const cells = Array.from(table.querySelectorAll("tbody tr td:first-child")).map((td) => td.textContent?.trim() ?? "");
    const short = cells.every((c) => c.length <= 16);
    if (short) table.classList.add("pbr-short1");
    if (/^(week|weeks out|when|month|time)$/i.test(head) && short) table.classList.add("pbr-axis");
  });

  // Templates get a Copy button
  root.querySelectorAll<HTMLElement>("blockquote").forEach((q) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pbr-copy";
    btn.textContent = "Copy";
    btn.addEventListener("click", async () => {
      const text = Array.from(q.querySelectorAll("p")).map((p) => p.textContent ?? "").join("\n\n").trim();
      try {
        await navigator.clipboard.writeText(text);
        btn.textContent = "Copied";
      } catch {
        btn.textContent = "Select and Copy";
      }
      window.setTimeout(() => (btn.textContent = "Copy"), 1800);
    });
    q.appendChild(btn);
  });
}

/** Label each "Jump to a chapter" door with the number of the chapter it lands in,
 *  the same number the chapter's own eyebrow shows. */
function numberJumps(root: HTMLElement): void {
  const chapters = Array.from(root.querySelectorAll<HTMLElement>("h2.pbr-chapter"));
  document.querySelectorAll<HTMLAnchorElement>(".pb-header__action").forEach((a) => {
    const num = a.querySelector(".pb-header__action-num");
    const id = decodeURIComponent((a.getAttribute("href") ?? "").replace(/^#/, ""));
    let el: Element | null = id ? root.querySelector(`[id="${CSS.escape(id)}"]`) : null;
    while (el && !(el.tagName === "H2" && el.classList.contains("pbr-chapter"))) el = el.previousElementSibling;
    const n = el ? chapters.indexOf(el as HTMLElement) + 1 : 0;
    if (num && n > 0) num.textContent = `Chapter ${String(n).padStart(2, "0")}`;
  });
}

/** Previous and next playbook, in the library's order. */
function renderNext(slug: string): string {
  const i = PLAYBOOKS.findIndex((p) => p.slug === slug);
  if (i === -1) return "";
  const prev = PLAYBOOKS[i - 1];
  const next = PLAYBOOKS[i + 1];
  const link = (p: PlaybookMeta, dir: "prev" | "next") => `
    <a class="pbr-next__link pbr-next__link--${dir}" style="--c:${p.accent}" href="./playbook.html?path=playbooks/${p.slug}/index.md">
      <span class="pbr-next__k">${dir === "prev" ? "&larr; Previous" : "Next &rarr;"}</span>
      <span class="pbr-next__t">${escapeHtml(p.title)}</span>
    </a>`;
  return `<nav class="pbr-next" aria-label="More playbooks">${prev ? link(prev, "prev") : ""}${next ? link(next, "next") : ""}</nav>`;
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

async function init(): Promise<void> {
  const params = new URLSearchParams(window.location.search);
  const contentPath = params.get("path");

  if (!contentPath) {
    showError("No content path specified. Use ?path=playbooks/speaker-series/index.md");
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
        <a href="${type === 'workshops' ? './start-a-chapter.html#workshops' : './playbooks.html'}">${typeName}</a>
        <span class="playbook-breadcrumb__sep">/</span>
        <a href="./playbook.html?path=${encodeURIComponent(indexPath)}">${escapeHtml(sectionName)}</a>
        <span class="playbook-breadcrumb__sep">/</span>
        <span>${escapeHtml(formatFileName(file))}</span>
      `;
    } else {
      breadcrumbSection.innerHTML = `
        <a href="${type === 'workshops' ? './start-a-chapter.html#workshops' : './playbooks.html'}">${typeName}</a>
        <span class="playbook-breadcrumb__sep">/</span>
        <span>${escapeHtml(sectionName)}</span>
      `;
    }
  }

  // Update page title
  document.title = `${sectionName} · ${typeName} · ALL Applied AI Network`;

  // Render content
  const contentEl = document.getElementById("playbook-content");
  if (!contentEl) return;

  // If we're on a playbook's index.md, inject the action header BEFORE the article
  // so users instantly see what the playbook does and the top actions available.
  const meta = type === "playbooks" && file === "index.md" ? getPlaybook(section) : undefined;
  if (meta) {
    const header = document.createElement("div");
    header.innerHTML = renderActionHeader(meta);
    const head = header.firstElementChild!;
    contentEl.parentElement?.insertBefore(head, contentEl);
    wireStoryHeader(head);
  }

  await renderArticle(contentPath, contentEl);

  // On an index page, the rendered markdown also contains an H1 — hide it since
  // the action header already shows the title prominently.
  if (meta) {
    const articleH1 = contentEl.querySelector("h1");
    if (articleH1) articleH1.style.display = "none";
  }

  // Auto-assign id attributes to H2/H3 headings so in-page anchor links work.
  // (marked v12 no longer does this by default.)
  addHeadingIds(contentEl);

  if (meta) {
    contentEl.style.setProperty("--pb-accent", meta.accent);
    dressPlaybook(contentEl);
    drawFigures(contentEl, meta);
    numberJumps(contentEl);
    const nav = document.getElementById("playbook-nav");
    if (nav) nav.innerHTML = renderNext(section);
  }

  // Rewrite relative .md links to playbook.html?path= links
  rewriteLinks(contentEl, contentPath);

  // Init reading progress
  initProgressBar();

  // If the URL has a #anchor, scroll to it now that markdown has rendered.
  if (window.location.hash) {
    const id = decodeURIComponent(window.location.hash.slice(1));
    const target = document.getElementById(id);
    if (target) {
      // Defer one frame so layout is stable, then smooth-scroll with nav offset.
      requestAnimationFrame(() => {
        const navHeight = 72;
        const top = target.getBoundingClientRect().top + window.scrollY - navHeight;
        window.scrollTo({ top, behavior: "smooth" });
      });
    }
  }
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

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/** Ids as rehype-slug gives them (the dashboard's reader uses the same), so a
 *  repeated heading is "-1", "-2" and every anchor lands in both places. */
function addHeadingIds(container: HTMLElement): void {
  const seen = new Map<string, number>();
  container.querySelectorAll<HTMLElement>("h1, h2, h3, h4").forEach((h) => {
    const base = slugify(h.textContent ?? "");
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    if (!h.id && h.textContent && h.tagName !== "H1") h.id = n ? `${base}-${n}` : base;
  });
}

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
