/**
 * playbook-figures.ts — a playbook's pictures, drawn from its own markdown.
 *
 * The file stays a plain, readable playbook anywhere it's opened: lists, tables and
 * paragraphs that open in bold. In this reader each of those becomes the picture it
 * describes, in the look of the audience kits: stops on a line, photo cards, big
 * numbers, a bar cut in proportion.
 *
 *   :::steps[title]     a numbered list            -> stops on one line, in order
 *   :::stories[title]   a photo (+ logos) per item -> photo cards
 *   :::cards[title]     a bold opener per item     -> a grid of cards
 *   :::numbers          a bold figure per item     -> big numbers
 *   :::split[title]     "**40%** label" per item   -> one bar, cut in proportion
 *   a table on a time axis                         -> a timeline
 *   paragraphs in a row that open in bold          -> rule cards
 *   an image on its own line                       -> a wide photo, its alt the caption
 *   ## Start here's three keys                     -> a three-step band
 *
 * Everything here reads the sanitized DOM the markdown rendered to and rebuilds it
 * with DOM methods, so no markdown text is ever parsed as HTML.
 */

import type { PlaybookMeta } from "./playbook-metadata";

/* ── Colour along the kits' line: blue, violet, pink ─────────────────────── */

const STOPS = [
  [78, 170, 241],
  [168, 85, 247],
  [214, 76, 184],
];

/** The colour at position i of n along the line. */
export function tone(i: number, n: number): string {
  const t = n <= 1 ? 0 : i / (n - 1);
  const seg = Math.min(STOPS.length - 2, Math.floor(t * (STOPS.length - 1)));
  const f = t * (STOPS.length - 1) - seg;
  const [a, b] = [STOPS[seg], STOPS[seg + 1]];
  const c = a.map((v, k) => Math.round(v + (b[k] - v) * f));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

/* ── Small DOM helpers ─────────────────────────────────────────────────── */

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

const meaningful = (n: Node): boolean => !(n.nodeType === Node.TEXT_NODE && !(n.textContent ?? "").trim());

/**
 * An item's bold opener and what follows it. "**First meeting (30–45 min).** Learn…"
 * gives the title "First meeting", the tag "30–45 min" and the rest as nodes. A list
 * item that holds paragraphs (a loose list) is read through its first paragraph.
 */
interface Lead {
  title: string;
  tag: string;
  rest: DocumentFragment;
  images: HTMLImageElement[];
}

function readLead(item: HTMLElement): Lead {
  const box = item.cloneNode(true) as HTMLElement;
  // A loose list wraps each item in <p>; read the paragraphs as one run.
  const host: HTMLElement = box.children.length === 1 && box.firstElementChild?.tagName === "P" ? (box.firstElementChild as HTMLElement) : box;
  const images = Array.from(host.querySelectorAll("img"));
  images.forEach((img) => img.remove());
  const first = Array.from(host.childNodes).find(meaningful);
  let title = "";
  if (first instanceof HTMLElement && first.tagName === "STRONG") {
    title = (first.textContent ?? "").trim();
    first.remove();
  }
  // Drop the punctuation that joined the opener to its sentence.
  title = title.replace(/[.:]\s*$/, "");
  const restFirst = Array.from(host.childNodes).find(meaningful);
  if (restFirst?.nodeType === Node.TEXT_NODE) {
    let t = (restFirst.textContent ?? "").replace(/^\s*[.:]?\s*/, "");
    // "**The mentor** holds weekly office hours" reads as a card titled "The mentor"
    // that says "Holds weekly office hours".
    t = t.charAt(0).toUpperCase() + t.slice(1);
    restFirst.textContent = t;
  }
  let tag = "";
  const m = title.match(/^(.*?)\s*\(([^()]+)\)$/);
  if (m) {
    title = m[1];
    tag = m[2];
  }
  const rest = document.createDocumentFragment();
  Array.from(host.childNodes).forEach((n) => rest.appendChild(n));
  return { title, tag, rest, images };
}

function itemsOf(block: Element): HTMLLIElement[] {
  const list = block.querySelector(":scope > ol, :scope > ul");
  return list ? (Array.from(list.children).filter((c) => c.tagName === "LI") as HTMLLIElement[]) : [];
}

function caption(block: HTMLElement, fig: HTMLElement): void {
  const title = block.getAttribute("data-title");
  if (title) fig.appendChild(el("figcaption", "pbf__cap", title));
}

function tagChip(text: string): HTMLElement {
  return el("span", "pbf-tag", text);
}

function body(rest: DocumentFragment): HTMLElement | null {
  if (!Array.from(rest.childNodes).some(meaningful)) return null;
  const p = el("p");
  p.appendChild(rest);
  return p;
}

/* ── :::steps ──────────────────────────────────────────────────────────── */

function drawSteps(block: HTMLElement): HTMLElement {
  const items = itemsOf(block);
  const fig = el("figure", "pbf pbf--steps pbf--wide");
  fig.style.setProperty("--n", String(items.length));
  caption(block, fig);
  const ol = el("ol", "pbf-steps");
  items.forEach((li, i) => {
    const { title, tag, rest } = readLead(li);
    const stop = el("li", "pbf-step");
    stop.style.setProperty("--c", tone(i, items.length));
    stop.appendChild(el("span", "pbf-step__n", String(i + 1))).setAttribute("aria-hidden", "true");
    const words = el("div", "pbf-step__words");
    const t = el("strong", "pbf-step__t", title);
    words.appendChild(t);
    if (tag) words.appendChild(tagChip(tag));
    const p = body(rest);
    if (p) words.appendChild(p);
    stop.appendChild(words);
    ol.appendChild(stop);
  });
  fig.appendChild(ol);
  return fig;
}

/* ── :::stories ────────────────────────────────────────────────────────── */

const WHEN = /^(.*?),\s*((?:Spring|Summer|Fall|Autumn|Winter)\s+\d{4}|\d{4})$/;

function drawStories(block: HTMLElement): HTMLElement {
  const items = itemsOf(block);
  const fig = el("figure", "pbf pbf--stories pbf--wide");
  caption(block, fig);
  const ul = el("ul", "pbf-stories");
  items.forEach((li, i) => {
    const { title, tag, rest, images } = readLead(li);
    const [photo, ...logos] = images;
    const card = el("li", "pbf-story");
    card.style.setProperty("--c", tone(i, items.length));
    const ph = el("div", "pbf-story__ph");
    if (photo) {
      photo.loading = "lazy";
      photo.decoding = "async";
      ph.appendChild(photo);
    }
    const who = el("div", "pbf-story__who");
    const named = title.match(WHEN);
    const name = named ? named[1] : title;
    const when = named ? named[2] : tag;
    if (logos.length) {
      logos.forEach((logo, k) => {
        logo.className = "pbf-story__logo";
        // A stacked mark (taller than it is wide-ish) needs more height to read.
        const fit = () => { if (logo.naturalWidth && logo.naturalWidth / logo.naturalHeight < 1.4) logo.classList.add("is-tall"); };
        if (logo.complete) fit();
        else logo.addEventListener("load", fit, { once: true });
        if (k) who.appendChild(el("span", "pbf-story__plus", "+"));
        who.appendChild(logo);
      });
    } else {
      who.appendChild(el("strong", "pbf-story__name", name));
    }
    ph.appendChild(who);
    card.appendChild(ph);
    const words = el("div", "pbf-story__words");
    const head = el("div", "pbf-story__head");
    // With logos on the photo the name still reads here, for anyone not seeing them.
    head.appendChild(el("strong", "pbf-story__t", name));
    if (when) head.appendChild(tagChip(when));
    words.appendChild(head);
    const p = body(rest);
    if (p) words.appendChild(p);
    card.appendChild(words);
    ul.appendChild(card);
  });
  fig.appendChild(ul);
  return fig;
}

/* ── :::cards ──────────────────────────────────────────────────────────── */

function drawCards(block: HTMLElement): HTMLElement {
  const items = itemsOf(block);
  const fig = el("figure", "pbf pbf--cards");
  caption(block, fig);
  const ul = el("ul", "pbf-cards");
  items.forEach((li, i) => {
    const { title, tag, rest } = readLead(li);
    const card = el("li", "pbf-card");
    card.style.setProperty("--c", tone(i, items.length));
    const head = el("div", "pbf-card__head");
    head.appendChild(el("strong", "pbf-card__t", title));
    if (tag) head.appendChild(tagChip(tag));
    card.appendChild(head);
    const p = body(rest);
    if (p) card.appendChild(p);
    ul.appendChild(card);
  });
  fig.appendChild(ul);
  return fig;
}

/* ── :::numbers ────────────────────────────────────────────────────────── */

function drawNumbers(block: HTMLElement): HTMLElement {
  const items = itemsOf(block);
  const fig = el("figure", "pbf pbf--numbers");
  caption(block, fig);
  const ul = el("ul", "pbf-nums");
  items.forEach((li, i) => {
    const { title, tag, rest } = readLead(li);
    const n = el("li", "pbf-num");
    n.style.setProperty("--c", tone(i, items.length));
    n.appendChild(el("span", "pbf-num__v", tag ? `${title} (${tag})` : title));
    const p = body(rest);
    if (p) n.appendChild(p);
    ul.appendChild(n);
  });
  fig.appendChild(ul);
  return fig;
}

/* ── :::split ──────────────────────────────────────────────────────────── */

function drawSplit(block: HTMLElement): HTMLElement {
  const items = itemsOf(block);
  const fig = el("figure", "pbf pbf--split");
  caption(block, fig);
  const bar = el("ul", "pbf-split");
  items.forEach((li, i) => {
    const { title, rest } = readLead(li);
    const share = parseFloat(title.replace(/[^\d.]/g, "")) || 1;
    const seg = el("li", "pbf-split__seg");
    seg.style.setProperty("--c", tone(i, items.length));
    seg.style.flexGrow = String(share);
    seg.appendChild(el("span", "pbf-split__v", title));
    const label = el("span", "pbf-split__l");
    label.appendChild(rest);
    seg.appendChild(label);
    bar.appendChild(seg);
  });
  fig.appendChild(bar);
  return fig;
}

/* ── A table on a time axis -> a timeline ──────────────────────────────── */

function whenLabel(head: string, cell: string): string {
  const c = cell.trim();
  if (/^weeks?$/i.test(head) && /^\d/.test(c)) {
    const [n, rest] = [c.match(/^[\d–+-]+/)?.[0] ?? c, c.replace(/^[\d–+-]+\s*/, "")];
    const plural = /[–+-]/.test(n);
    return `${plural ? "Weeks" : "Week"} ${n}${rest ? ` ${rest.replace(/^\((.*)\)$/, "· $1")}` : ""}`;
  }
  if (/^weeks out$/i.test(head)) {
    const m = c.match(/^[-−](\d+)$/);
    if (m) return `${m[1]} week${m[1] === "1" ? "" : "s"} out`;
  }
  return c;
}

function drawTimeline(table: HTMLTableElement): HTMLElement {
  const head = table.querySelector("thead th")?.textContent?.trim() ?? "";
  const rows = Array.from(table.querySelectorAll("tbody tr"));
  const fig = el("figure", "pbf pbf--timeline pbf--wide");
  fig.style.setProperty("--n", String(rows.length));
  const texts = rows.map((r) => r.querySelector("td:nth-child(2)")?.textContent?.trim() ?? "");
  const avg = texts.reduce((s, t) => s + t.length, 0) / Math.max(1, texts.length);
  // Long rows, or many of them, read better down the page than across it.
  if (rows.length > 6 || avg > 110) fig.classList.add("pbf--down");
  const ol = el("ol", "pbf-tl");
  rows.forEach((r, i) => {
    const cells = r.querySelectorAll("td");
    const stop = el("li", "pbf-tl__stop");
    stop.style.setProperty("--c", tone(i, rows.length));
    stop.appendChild(el("span", "pbf-tl__dot")).setAttribute("aria-hidden", "true");
    stop.appendChild(el("strong", "pbf-tl__when", whenLabel(head, cells[0]?.textContent ?? "")));
    const p = el("p");
    Array.from(cells[1]?.childNodes ?? []).forEach((n) => p.appendChild(n.cloneNode(true)));
    stop.appendChild(p);
    ol.appendChild(stop);
  });
  fig.appendChild(ol);
  return fig;
}

/* ── Paragraphs that open in bold -> rule cards ────────────────────────── */

function isRule(p: Element): p is HTMLParagraphElement {
  if (p.tagName !== "P" || p.classList.contains("pbr-lead") || p.classList.contains("pbr-lede")) return false;
  const first = Array.from(p.childNodes).find(meaningful);
  if (!(first instanceof HTMLElement) || first.tagName !== "STRONG") return false;
  if (/^In the dashboard/i.test(first.textContent ?? "")) return false;
  // Something has to follow the bold, or it's a heading-like line, not a rule.
  return (p.textContent ?? "").trim().length > (first.textContent ?? "").trim().length + 2;
}

function drawRules(root: HTMLElement): void {
  const kids = Array.from(root.children);
  let run: HTMLParagraphElement[] = [];
  const flush = () => {
    if (!run.length) return;
    const grid = el("div", `pbf-rules${run.length === 1 ? " is-one" : ""}`);
    run[0].before(grid);
    run.forEach((p, i) => {
      const { title, rest } = readLead(p);
      const card = el("div", "pbf-rule");
      card.style.setProperty("--c", tone(i, Math.max(2, run.length)));
      card.appendChild(el("strong", "pbf-rule__t", title));
      const b = body(rest);
      if (b) card.appendChild(b);
      grid.appendChild(card);
      p.remove();
    });
    run = [];
  };
  kids.forEach((k) => {
    if (isRule(k)) run.push(k);
    else flush();
  });
  flush();
}

/* ── An image on its own line -> a wide photo ──────────────────────────── */

function drawPhotos(root: HTMLElement): void {
  root.querySelectorAll<HTMLParagraphElement>(":scope > p").forEach((p) => {
    const nodes = Array.from(p.childNodes).filter(meaningful);
    if (nodes.length !== 1 || !(nodes[0] instanceof HTMLImageElement)) return;
    const img = nodes[0];
    const fig = el("figure", "pbf pbf-photo pbf--wide");
    img.loading = "lazy";
    img.decoding = "async";
    fig.appendChild(img);
    if (img.alt) fig.appendChild(el("figcaption", "pbf-photo__cap", img.alt));
    p.replaceWith(fig);
  });
}

/* ── ## Start here -> a three-step band ────────────────────────────────── */

function drawStartHere(root: HTMLElement, meta: PlaybookMeta): void {
  const h2 = root.querySelector<HTMLElement>("h2#start-here");
  const list = h2?.nextElementSibling;
  if (!h2 || list?.tagName !== "OL") return;
  const keys = Array.from(list.children) as HTMLElement[];
  // Each key is its chapter's point when there's one of each; then the band is also
  // the way into the chapters, and the header's own doors step aside.
  const paired = meta.actions.length === keys.length;
  const band = el("section", "pbf-help pbf--wide");
  band.setAttribute("aria-labelledby", "start-here");
  const lead = el("div", "pbf-help__t");
  lead.appendChild(el("span", "", "Start Here"));
  lead.appendChild(el("small", "", "If you read nothing else"));
  band.appendChild(lead);
  const ol = el("ol", "pbf-help__steps");
  keys.forEach((k, i) => {
    const step = el("li", "pbf-help__step");
    step.style.setProperty("--c", tone(i, keys.length));
    const a = paired ? meta.actions[i] : null;
    step.appendChild(el("span", "pbf-help__k", a ? `Chapter ${String(i + 1).padStart(2, "0")}` : `Key ${i + 1}`));
    if (a) {
      const link = el("a", "pbf-help__go", a.label);
      link.href = a.anchor;
      step.appendChild(link);
    }
    const p = el("p");
    Array.from(k.childNodes).forEach((n) => p.appendChild(n.cloneNode(true)));
    step.appendChild(p);
    ol.appendChild(step);
  });
  band.appendChild(ol);
  list.replaceWith(band);
  h2.classList.add("pbf-sr");
  if (paired) document.querySelector(".pb-header")?.classList.add("pbf-doors-in-band");
}

/* ── Entry ─────────────────────────────────────────────────────────────── */

const DRAW: Record<string, (b: HTMLElement) => HTMLElement> = {
  steps: drawSteps,
  stories: drawStories,
  cards: drawCards,
  numbers: drawNumbers,
  split: drawSplit,
};

export function drawFigures(root: HTMLElement, meta: PlaybookMeta): void {
  // The site's own files load from here (and from a dev server).
  root.querySelectorAll<HTMLImageElement>("img[src^='https://all-ai-network.org/']").forEach((img) => {
    img.src = img.getAttribute("src")!.replace(/^https:\/\/all-ai-network\.org\//, "./");
  });
  root.querySelectorAll<HTMLElement>("div.pbf").forEach((block) => {
    const kind = Array.from(block.classList).find((c) => c.startsWith("pbf--"))?.slice(5) ?? "";
    const draw = DRAW[kind];
    if (draw && itemsOf(block).length) block.replaceWith(draw(block));
  });
  root.querySelectorAll<HTMLTableElement>("table.pbr-axis").forEach((t) => {
    if (t.closest(".pbr-dash")) return;
    t.replaceWith(drawTimeline(t));
  });
  drawStartHere(root, meta);
  drawPhotos(root);
  drawRules(root);
}
