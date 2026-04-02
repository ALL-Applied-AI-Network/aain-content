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
      "id",
      "open",
      "style",
    ],
  });

  container.innerHTML = clean;

  // Initialize tabs interactivity
  initTabs(container);

  // Initialize Mermaid if any diagrams present
  initMermaid(container);

  // Apply syntax highlighting
  initHighlighting(container);
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
