/** hired.ts — the home page's "Our members have been hired by" strip (Ben, 2026-10-26).
 *  Where each company comes from, so the list can be checked later:
 *    records  — a member's own LinkedIn experience on the dashboard (a job or an internship), 2026-10-26
 *    sponsors — on the sponsor site's logo strip (src/content/partnerLogos.ts in the portal)
 *    ben      — named by Ben, from what he knows of the founding chapter's alumni (OpenAI, Google,
 *               NVIDIA, SpaceX, NASA, Milwaukee Tool)
 *  Every logo is the company's own file under public/logos/hired/ (its website or its Wikimedia
 *  Commons file). Never draw, trace or generate one. SVGs are stripped of scripts before they go in.
 *  NASA and NVIDIA: Ben, 2026-10-26 ("we've had members get hired at NASA and NVIDIA"). Left off:
 *  the sponsor strip's museum and garden nonprofits, which never hired anyone. */
export type HiredLogo = {
  name: string;
  file: string;
  /** the file's own size (viewBox or pixels), for a box with no layout shift */
  w: number;
  h: number;
  /** "tile": an opaque square badge, drawn with rounded corners */
  kind?: "mark" | "tile";
  /** dark artwork with no on-dark version: shown in solid white */
  mono?: boolean;
  /** rendered height in px when the default (26 for a mark, 36 for a tile) reads wrong */
  size?: number;
  from: "records" | "sponsors" | "ben" | "records+sponsors";
};

const L = "./public/logos/hired/";

export const HIRED: HiredLogo[] = [
  // row one
  { name: "OpenAI", file: `${L}openai.svg`, w: 269.66, h: 72.52, size: 24, mono: true, from: "ben" },
  { name: "Google", file: `${L}google.svg`, w: 74, h: 24, size: 26, from: "ben" },
  { name: "NVIDIA", file: `${L}nvidia.svg`, w: 139, h: 26, size: 26, from: "ben" },
  { name: "Direct Supply", file: `${L}direct-supply-on-dark.svg`, w: 118, h: 29, size: 26, from: "records+sponsors" },
  { name: "SpaceX", file: `${L}spacex.svg`, w: 147, h: 19, size: 18, from: "ben" },
  { name: "NASA", file: `${L}nasa.svg`, w: 110, h: 92, size: 44, from: "ben" },
  { name: "Apple", file: `${L}apple.svg`, w: 842.32, h: 1000, size: 32, from: "records" },
  { name: "Milwaukee Tool", file: `${L}milwaukee-tool.svg`, w: 891, h: 401, size: 40, from: "ben" },
  { name: "IBM", file: `${L}ibm.svg`, w: 1075, h: 401, size: 24, mono: true, from: "sponsors" },
  { name: "Netflix", file: `${L}netflix.svg`, w: 1024, h: 277, size: 24, from: "sponsors" },
  { name: "Rockwell Automation", file: `${L}rockwell-automation.svg`, w: 1715, h: 396, size: 26, from: "sponsors" },
  { name: "Walmart", file: `${L}walmart.svg`, w: 1800, h: 338.66, size: 22, from: "records" },
  { name: "Target", file: `${L}target.svg`, w: 300, h: 418.12, size: 44, from: "records" },
  { name: "Johnson Controls", file: `${L}johnson-controls.svg`, w: 125, h: 76, size: 46, mono: true, from: "records" },
  { name: "Databricks", file: `${L}databricks.svg`, w: 132, h: 22, size: 24, from: "sponsors" },
  { name: "Brady", file: `${L}brady.png`, w: 312, h: 368, size: 44, from: "records+sponsors" },
  { name: "Honeywell", file: `${L}honeywell.svg`, w: 376, h: 82, size: 28, from: "records" },
  { name: "Juno", file: `${L}juno.svg`, w: 713, h: 181, size: 24, from: "records+sponsors" },
  // row two
  { name: "Baird", file: `${L}baird.svg`, w: 150, h: 138, kind: "tile", size: 42, from: "records" },
  { name: "Eaton", file: `${L}eaton.svg`, w: 91.9, h: 25.3, size: 24, mono: true, from: "records" },
  { name: "SC Johnson", file: `${L}sc-johnson.svg`, w: 146, h: 48, size: 34, mono: true, from: "records" },
  { name: "Milwaukee Bucks", file: `${L}milwaukee-bucks.svg`, w: 400, h: 400, size: 44, from: "records" },
  { name: "Generac", file: `${L}generac.svg`, w: 200, h: 44, size: 26, from: "records" },
  { name: "Leidos", file: `${L}leidos.svg`, w: 330.8, h: 78.3, size: 26, mono: true, from: "records" },
  { name: "Xorbix Technologies", file: `${L}xorbix.png`, w: 1530, h: 364, size: 26, from: "records+sponsors" },
  { name: "Cognex", file: `${L}cognex.svg`, w: 494.9, h: 60.8, size: 20, mono: true, from: "records" },
  { name: "Dematic", file: `${L}dematic.svg`, w: 192, h: 70, size: 30, from: "records" },
  { name: "Persistent Systems", file: `${L}persistent.svg`, w: 500, h: 117, size: 26, mono: true, from: "sponsors" },
  { name: "MGIC", file: `${L}mgic.svg`, w: 160, h: 50, size: 28, mono: true, from: "records" },
  { name: "Woodward", file: `${L}woodward.svg`, w: 260, h: 35, size: 22, from: "records" },
  { name: "Associated Bank", file: `${L}associated-bank.svg`, w: 300, h: 61, size: 24, mono: true, from: "sponsors" },
  { name: "Medical College of Wisconsin", file: `${L}mcw.svg`, w: 164, h: 164, kind: "tile", size: 42, from: "sponsors" },
  { name: "MKE Tech Hub Coalition", file: `${L}mke-tech-hub-on-dark.png`, w: 1280, h: 335, size: 26, from: "records+sponsors" },
  { name: "The Nilus Project", file: `${L}nilus-white.png`, w: 156, h: 322, size: 44, from: "records+sponsors" },
];

/** Fewer than this and the strip stays empty: a band built for two rows never shows one lonely logo. */
const MIN = 8;

/** Two rows that run opposite ways. Each row's belt carries two copies of the row (the second
 *  aria-hidden) and slides by one copy's width, so the loop has no seam. Under reduced motion the
 *  rows hold still (one copy) but stay rows you can swipe or scroll sideways: never a wrapped grid. */
export function mountHired(root: HTMLElement, still: boolean): void {
  if (HIRED.length < MIN) return;
  const half = Math.ceil(HIRED.length / 2);
  const rows = [HIRED.slice(0, half), HIRED.slice(half)];
  const item = (l: HiredLogo, copy: boolean): string => {
    const h = l.size ?? (l.kind === "tile" ? 36 : 26);
    const w = Math.round((l.w / l.h) * h);
    const cls = `hired__item${l.kind === "tile" ? " hired__item--tile" : ""}${l.mono ? " hired__item--mono" : ""}`;
    return `<li class="${cls}"><span class="hired__chip" title="${l.name}"><img src="${l.file}" alt="${copy ? "" : l.name}" width="${w}" height="${h}" style="height:${h}px" loading="lazy" decoding="async" /></span></li>`;
  };
  const track = (list: HiredLogo[], copy: boolean): string =>
    `<ul class="hired__track"${copy ? ' aria-hidden="true"' : ""}>${list.map((l) => item(l, copy)).join("")}</ul>`;
  root.innerHTML = rows
    .map((list, i) => `<div class="hired__row${i ? " hired__row--rev" : ""}" style="--dur:${list.length * 5}s"${still ? ` tabindex="0" aria-label="Companies, row ${i + 1} of 2 (scrolls sideways)"` : ""}><div class="hired__belt">${track(list, false)}${still ? "" : track(list, true)}</div></div>`)
    .join("");
  root.closest(".hired")?.classList.add(still ? "hired--still" : "hired--moving");
}
