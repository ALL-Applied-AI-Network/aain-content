/**
 * article-renderer.ts — Fetches and renders markdown articles with custom
 * component support for the ALL Applied AI Network content format.
 *
 * Custom directives supported:
 *   :::callout[type]    -> styled callout boxes
 *   :::tabs             -> tabbed content
 *   :::build-challenge  -> highlighted challenge box
 *   :::definition[term] -> definition card
 *   :::details[title]   -> collapsible accordion
 *   :::diagram          -> Mermaid diagrams
 *   :::video[URL]       -> YouTube/Vimeo embed (iframe built post-sanitize)
 */

import { marked } from "marked";
import DOMPurify from "dompurify";

// ---------------------------------------------------------------------------
// Pre-process: transform custom ::: directives into HTML before marked parses
// ---------------------------------------------------------------------------

const CALLOUT_ICONS: Record<string, string> = {
  tip: "\u{1F4A1}",
  info: "\u2139\uFE0F",
  warning: "\u26A0\uFE0F",
  danger: "\u{1F6A8}",
};

const CALLOUT_TITLES: Record<string, string> = {
  tip: "Tip",
  info: "Info",
  warning: "Warning",
  danger: "Danger",
};

// ---------------------------------------------------------------------------
// Video embeds — :::video[URL] contract (YouTube + Vimeo only)
//
// KEEP IN SYNC: an identical parser lives in the hub-template repo. Both repos
// implement the :::video[URL] embed contract and MUST agree exactly on which
// URLs parse and what provider/id they yield.
//
// SECURITY: the id is validated against a strict charset here so it can later
// be interpolated safely into a FIXED embed origin. We never trust the raw URL
// and never emit a raw <iframe> from body content.
// ---------------------------------------------------------------------------

type VideoEmbed = { provider: "youtube" | "vimeo"; id: string };

const YOUTUBE_ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
const VIMEO_ID_RE = /^[0-9]{1,20}$/;

function parseVideoUrl(rawUrl: string): VideoEmbed | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  // Normalize to an absolute URL so the URL parser can split host/path/query.
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return null;
  }

  // Strip leading www./m. so host comparisons stay simple.
  const host = url.hostname.toLowerCase().replace(/^(www\.|m\.)/, "");
  const path = url.pathname;

  // YouTube: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID,
  //          m.youtube.com/*, youtube-nocookie.com/embed/ID
  if (host === "youtu.be") {
    const id = path.split("/")[1] || "";
    return YOUTUBE_ID_RE.test(id) ? { provider: "youtube", id } : null;
  }
  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    let id = "";
    if (path === "/watch") {
      id = url.searchParams.get("v") || "";
    } else {
      const m = path.match(/^\/(?:embed|v|shorts)\/([^/?#]+)/);
      if (m) id = m[1];
    }
    return YOUTUBE_ID_RE.test(id) ? { provider: "youtube", id } : null;
  }

  // Vimeo: vimeo.com/ID, player.vimeo.com/video/ID
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const m = path.match(/^(?:\/video)?\/(\d+)/);
    const id = m ? m[1] : "";
    return VIMEO_ID_RE.test(id) ? { provider: "vimeo", id } : null;
  }

  return null; // anything else = unsupported
}

function preprocessDirectives(md: string): string {
  const lines = md.split("\n");
  const output: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // :::callout[type]
    const calloutMatch = line.match(/^:::callout\[(\w+)\]\s*$/);
    if (calloutMatch) {
      const type = calloutMatch[1];
      const icon = CALLOUT_ICONS[type] || "";
      const body: string[] = [];
      i++;
      while (i < lines.length && lines[i].trim() !== ":::") {
        body.push(lines[i]);
        i++;
      }
      i++; // skip closing :::
      const title = CALLOUT_TITLES[type] || type;
      output.push(
        `<div class="callout callout--${type}">`,
        `<div class="callout__icon">${icon}</div>`,
        `<div class="callout__content">`,
        `<div class="callout__title">${title}</div>`,
        `<div class="callout__body">`,
        "",
        ...body,
        "",
        `</div></div></div>`,
        ""
      );
      continue;
    }

    // :::video[URL] — YouTube/Vimeo embed. Mirrors the calloutMatch shape:
    // URL in the bracket label, closed by :::. Emits ONLY a placeholder here;
    // the <iframe> is built post-sanitize in initVideoEmbeds (see SECURITY note)
    // so raw iframes in body content stay blocked by the sanitizer.
    const videoMatch = line.match(/^:::video\[(.+?)\]\s*$/);
    if (videoMatch) {
      const url = videoMatch[1];
      i++;
      // Consume until the closing ::: (body is ignored — URL lives in label).
      while (i < lines.length && lines[i].trim() !== ":::") {
        i++;
      }
      i++; // skip closing :::
      const parsed = parseVideoUrl(url);
      if (parsed) {
        // Placeholder only — validated provider/id, NO iframe at this stage.
        output.push(
          `<div class="video-embed" data-video-provider="${parsed.provider}" data-video-id="${parsed.id}"></div>`,
          ""
        );
      } else {
        // Unsupported/unparseable URL → inline notice, never an iframe.
        output.push(
          `<div class="callout callout--warning">`,
          `<div class="callout__icon">⚠️</div>`,
          `<div class="callout__content">`,
          `<div class="callout__title">Unsupported video</div>`,
          `<div class="callout__body">`,
          "",
          "Only YouTube and Vimeo videos are supported.",
          "",
          `</div></div></div>`,
          ""
        );
      }
      continue;
    }

    // :::definition[term]
    const defMatch = line.match(/^:::definition\[(.+?)\]\s*$/);
    if (defMatch) {
      const term = defMatch[1];
      const body: string[] = [];
      i++;
      while (i < lines.length && lines[i].trim() !== ":::") {
        body.push(lines[i]);
        i++;
      }
      i++;
      output.push(
        `<div class="definition">`,
        `<div class="definition__term">${term}</div>`,
        `<div class="definition__body">`,
        "",
        ...body,
        "",
        `</div></div>`,
        ""
      );
      continue;
    }

    // :::details[title]
    const detailsMatch = line.match(/^:::details\[(.+?)\]\s*$/);
    if (detailsMatch) {
      const title = detailsMatch[1];
      const body: string[] = [];
      i++;
      while (i < lines.length && lines[i].trim() !== ":::") {
        body.push(lines[i]);
        i++;
      }
      i++;
      output.push(
        `<details class="collapsible">`,
        `<summary class="collapsible__trigger">${title}</summary>`,
        `<div class="collapsible__content">`,
        "",
        ...body,
        "",
        `</div></details>`,
        ""
      );
      continue;
    }

    // :::build-challenge
    const challengeMatch = line.match(/^:::build-challenge\s*$/);
    if (challengeMatch) {
      const body: string[] = [];
      i++;
      while (i < lines.length && lines[i].trim() !== ":::") {
        body.push(lines[i]);
        i++;
      }
      i++;
      output.push(
        `<div class="build-challenge">`,
        `<div class="build-challenge__header">`,
        `<span class="build-challenge__icon">\u{1F528}</span>`,
        `<span class="build-challenge__title">Build Challenge</span>`,
        `</div>`,
        `<div class="build-challenge__content">`,
        "",
        ...body,
        "",
        `</div></div>`,
        ""
      );
      continue;
    }

    // :::diagram (contains ```mermaid ... ```)
    const diagramMatch = line.match(/^:::diagram\s*$/);
    if (diagramMatch) {
      const body: string[] = [];
      i++;
      while (i < lines.length && lines[i].trim() !== ":::") {
        body.push(lines[i]);
        i++;
      }
      i++;

      // Extract mermaid code from fenced block
      const mermaidContent = body
        .join("\n")
        .replace(/^```mermaid\s*\n?/, "")
        .replace(/\n?```\s*$/, "");

      output.push(
        `<div class="diagram">`,
        `<div class="mermaid">${escapeHtml(mermaidContent)}</div>`,
        `</div>`,
        ""
      );
      continue;
    }

    // :::tabs
    const tabsMatch = line.match(/^:::tabs\s*$/);
    if (tabsMatch) {
      const tabs: { label: string; body: string[] }[] = [];
      i++;
      let currentTab: { label: string; body: string[] } | null = null;

      while (i < lines.length && lines[i].trim() !== ":::") {
        const tabHeader = lines[i].match(/^##tab\s+(.+)$/);
        if (tabHeader) {
          if (currentTab) tabs.push(currentTab);
          currentTab = { label: tabHeader[1], body: [] };
        } else if (currentTab) {
          currentTab.body.push(lines[i]);
        }
        i++;
      }
      if (currentTab) tabs.push(currentTab);
      i++;

      if (tabs.length > 0) {
        const headerBtns = tabs
          .map(
            (t, idx) =>
              `<button class="tabs__tab${idx === 0 ? " tabs__tab--active" : ""}" data-tab="${idx}">${t.label}</button>`
          )
          .join("");
        const panels = tabs
          .map(
            (t, idx) =>
              `<div class="tabs__panel${idx === 0 ? " tabs__panel--active" : ""}" data-panel="${idx}">\n\n${t.body.join("\n")}\n\n</div>`
          )
          .join("\n");

        output.push(
          `<div class="tabs" data-tabs>`,
          `<div class="tabs__nav">${headerBtns}</div>`,
          panels,
          `</div>`,
          ""
        );
      }
      continue;
    }

    output.push(line);
    i++;
  }

  return output.join("\n");
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

/**
 * Fetch a markdown file and render it into an HTML container.
 */
export async function renderArticle(
  contentPath: string,
  container: HTMLElement
): Promise<void> {
  const resp = await fetch(`./${contentPath}`);
  if (!resp.ok) {
    container.innerHTML = `<div class="callout callout--danger"><div class="callout__header">Error</div><div class="callout__body"><p>Could not load article: ${contentPath} (${resp.status})</p></div></div>`;
    return;
  }

  const rawMd = await resp.text();
  await renderMarkdown(rawMd, container);
}

/**
 * Render a markdown string into an HTML container — the shared pipeline
 * behind repo articles (renderArticle) and chapter-authored node bodies
 * (article-page's ?chapter= overlay).
 */
export async function renderMarkdown(
  rawMd: string,
  container: HTMLElement
): Promise<void> {
  // Pre-process custom directives
  const processed = preprocessDirectives(rawMd);

  // Configure marked with custom renderer for code blocks
  const renderer = new marked.Renderer();
  renderer.code = function (codeOrToken: string | { text?: string; lang?: string }, langArg?: string) {
    // marked v12 passes (code, lang, escaped) as separate args
    let text: string;
    let lang: string;
    if (typeof codeOrToken === "string") {
      text = codeOrToken;
      lang = langArg || "";
    } else {
      text = codeOrToken?.text || "";
      lang = codeOrToken?.lang || "";
    }

    // Parse title from lang string: e.g. 'python title="main.py"'
    let language = lang;
    let title = "";
    const titleMatch = language.match(/^(\S+)\s+title="([^"]+)"/);
    if (titleMatch) {
      language = titleMatch[1];
      title = titleMatch[2];
    }

    const escapedCode = escapeHtml(text);
    const langAttr = language ? ` class="language-${language}"` : "";
    const titleAttr = title ? ` data-title="${escapeHtml(title)}"` : "";
    return `<pre${titleAttr}><code${langAttr}>${escapedCode}</code></pre>`;
  };

  marked.setOptions({
    gfm: true,
    breaks: false,
  });
  marked.use({ renderer });

  const rawHtml = await marked.parse(processed);

  // Sanitize — allow our custom classes and data attributes
  const clean = DOMPurify.sanitize(rawHtml, {
    ADD_TAGS: ["details", "summary", "button"],
    ADD_ATTR: [
      "class",
      "data-tab",
      "data-tabs",
      "data-panel",
      "data-title",
      "data-video-provider",
      "data-video-id",
      "id",
      "open",
      "style",
    ],
  });
  // NOTE: iframe is deliberately NOT in ADD_TAGS — video embeds are built
  // post-sanitize in initVideoEmbeds from the validated data-* placeholder.

  container.innerHTML = clean;

  // Initialize tabs interactivity
  initTabs(container);

  // Initialize Mermaid if any diagrams present
  initMermaid(container);

  // Apply syntax highlighting
  initHighlighting(container);

  // Build video embeds — same post-sanitize, data-attribute-driven approach as
  // Mermaid, so raw iframes in body content never survive the sanitizer. This
  // is the single injection point shared by renderArticle (repo articles) and
  // the ?chapter= overlay path (article-page.ts), so both get embeds.
  initVideoEmbeds(container);

  // Apply author-specified image widths from the src `#w=` fragment. Same
  // post-sanitize pass as the others, so it also covers both the repo-article
  // and ?chapter= overlay paths.
  initImageSizes(container);
}

// ---------------------------------------------------------------------------
// Post-render interactivity
// ---------------------------------------------------------------------------

function initTabs(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>("[data-tabs]").forEach((tabsEl) => {
    const btns = tabsEl.querySelectorAll<HTMLElement>(".tabs__tab");
    const panels = tabsEl.querySelectorAll<HTMLElement>(".tabs__panel");

    btns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = btn.getAttribute("data-tab");
        if (idx === null) return;

        // Deactivate all
        btns.forEach((b) => b.classList.remove("tabs__tab--active"));
        panels.forEach((p) => p.classList.remove("tabs__panel--active"));

        // Activate selected
        btn.classList.add("tabs__tab--active");
        const panel = tabsEl.querySelector<HTMLElement>(
          `[data-panel="${idx}"]`
        );
        if (panel) panel.classList.add("tabs__panel--active");
      });
    });
  });
}

async function initMermaid(root: HTMLElement): Promise<void> {
  const mermaidEls = root.querySelectorAll(".mermaid");
  if (mermaidEls.length === 0) return;

  // Dynamically load mermaid
  try {
    const mermaid = await import("mermaid");
    mermaid.default.initialize({
      startOnLoad: false,
      theme: "dark",
      themeVariables: {
        primaryColor: "#1a1a3e",
        primaryTextColor: "#e8e8f0",
        lineColor: "#a855f7",
        secondaryColor: "#12122a",
      },
    });

    // Mermaid needs unescaped content
    mermaidEls.forEach((el) => {
      const text = el.textContent || "";
      el.textContent = text;
    });

    await mermaid.default.run({ nodes: mermaidEls as NodeListOf<HTMLElement> });
  } catch (e) {
    console.warn("Mermaid failed to load:", e);
  }
}

/**
 * Build video <iframe> embeds AFTER sanitize — mirrors initMermaid. Each
 * placeholder (<div class="video-embed" data-video-provider data-video-id>)
 * carries only validated data; we re-validate here (defence in depth) and
 * construct the iframe against a FIXED embed origin, so a raw <iframe> can
 * never ride through the sanitizer via user body content.
 *
 * KEEP IN SYNC with the hub-template repo's equivalent injector.
 */
function initVideoEmbeds(root: HTMLElement): void {
  const EMBED_SRC: Record<string, (id: string) => string> = {
    youtube: (id) => `https://www.youtube-nocookie.com/embed/${id}`,
    vimeo: (id) => `https://player.vimeo.com/video/${id}`,
  };

  root
    .querySelectorAll<HTMLElement>(".video-embed[data-video-id]")
    .forEach((el) => {
      const provider = el.getAttribute("data-video-provider") || "";
      const id = el.getAttribute("data-video-id") || "";

      // Re-validate against the same rules the parser used before we build a
      // URL. Invalid → skip (leave placeholder empty), never emit an iframe.
      const valid =
        (provider === "youtube" && YOUTUBE_ID_RE.test(id)) ||
        (provider === "vimeo" && VIMEO_ID_RE.test(id));
      if (!valid || el.querySelector("iframe")) return;

      const frame = document.createElement("div");
      frame.className = "video-embed__frame";

      const iframe = document.createElement("iframe");
      iframe.src = EMBED_SRC[provider](id);
      iframe.loading = "lazy";
      iframe.title = "Embedded video";
      iframe.setAttribute(
        "allow",
        "accelerometer; encrypted-media; picture-in-picture"
      );
      iframe.setAttribute("allowfullscreen", "");
      iframe.setAttribute("frameborder", "0");

      frame.appendChild(iframe);
      el.appendChild(frame);
    });
}

/**
 * Apply author-specified image widths AFTER sanitize — mirrors initVideoEmbeds.
 * Width is encoded as a URL fragment on the image src: `URL#w=N` where N is a
 * width PERCENT in {25, 50, 75}. No fragment (or w=100/anything else) = full
 * width (the default, untouched). We read the token off the sanitized <img> and
 * set an inline style; the fragment is harmless in src (servers ignore it) so we
 * leave it in place. We only touch the `#w=` token and preserve any other
 * fragment content around it.
 *
 * KEEP IN SYNC with the hub-template repo's equivalent injector.
 */
function initImageSizes(root: HTMLElement): void {
  const ALLOWED = new Set(["25", "50", "75"]);

  root.querySelectorAll<HTMLImageElement>("img").forEach((img) => {
    // Read the raw attribute (keeps the fragment as authored). Look only inside
    // the fragment so a `w=` in the path/query can't be mistaken for the token.
    const src = img.getAttribute("src") || "";
    const hashIdx = src.indexOf("#");
    if (hashIdx === -1) return;

    // Fragment may hold more than one token (be safe): match `w=N` bounded by
    // `&` or the fragment edges, then validate N is exactly 25|50|75.
    const frag = src.slice(hashIdx + 1);
    const m = frag.match(/(?:^|&)w=(\d{1,3})(?:&|$)/);
    if (!m || !ALLOWED.has(m[1])) return; // absent/invalid → leave full width

    img.style.width = m[1] + "%";
    img.style.maxWidth = "100%";
    img.style.height = "auto";
  });
}

function initHighlighting(root: HTMLElement): void {
  const hljs = (window as any).hljs;

  root.querySelectorAll<HTMLElement>("pre code").forEach((codeEl) => {
    const pre = codeEl.parentElement;
    if (!pre) return;

    // Detect language from class (e.g. "language-python")
    const langClass = Array.from(codeEl.classList).find((c) =>
      c.startsWith("language-")
    );
    const lang = langClass ? langClass.replace("language-", "") : "";

    // Apply syntax highlighting
    if (hljs && lang) {
      codeEl.classList.add(langClass!);
      hljs.highlightElement(codeEl);
    } else if (hljs) {
      hljs.highlightElement(codeEl);
    }

    // Wrap pre in a container for positioning
    const wrapper = document.createElement("div");
    wrapper.className = "code-block";
    pre.parentNode?.insertBefore(wrapper, pre);
    wrapper.appendChild(pre);

    // Check for title attribute (set via marked renderer or data attribute)
    const title = pre.getAttribute("data-title");

    // Add header bar if there is a language or title
    if (lang || title) {
      const header = document.createElement("div");
      header.className = "code-block__header";

      if (title) {
        const titleSpan = document.createElement("span");
        titleSpan.className = "code-block__title";
        titleSpan.textContent = title;
        header.appendChild(titleSpan);
      }

      if (lang) {
        const badge = document.createElement("span");
        badge.className = "code-block__lang";
        badge.textContent = lang;
        header.appendChild(badge);
      }

      wrapper.insertBefore(header, pre);
    }

    // Add copy button
    const copyBtn = document.createElement("button");
    copyBtn.className = "code-block__copy";
    copyBtn.textContent = "Copy";
    copyBtn.setAttribute("type", "button");
    copyBtn.addEventListener("click", () => {
      const text = codeEl.textContent || "";
      navigator.clipboard.writeText(text).then(() => {
        copyBtn.textContent = "Copied!";
        setTimeout(() => {
          copyBtn.textContent = "Copy";
        }, 2000);
      });
    });
    wrapper.appendChild(copyBtn);
  });
}
