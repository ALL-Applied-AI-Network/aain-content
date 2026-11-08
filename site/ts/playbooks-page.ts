/**
 * playbooks-page.ts — Renders the Playbooks library: the year map and the cards.
 *
 * The map is the model every playbook teaches, drawn once: a semester of weeks
 * 0 to 15, the pulse as a row of events every two weeks, the depth as projects
 * that start at the week 5 kick-off, and the money under both. Each row is a
 * door to the playbook that runs it. The weeks are the ones in Getting Started's
 * week-by-week table.
 *
 * Everything else comes from playbook-metadata.ts.
 */

import { PLAYBOOKS, getPlaybook, type PlaybookMeta } from "./playbook-metadata";

const href = (slug: string, anchor = ""): string => `./playbook.html?path=playbooks/${slug}/index.md${anchor}`;

const esc = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/* ── The year map ───────────────────────────────────────────────────────── */

const WEEKS = 16; // weeks 0 to 15

type Mark =
  | { kind: "dot"; week: number; hollow?: boolean; title: string }
  | { kind: "bar"; week: number; span: number | "end"; text: string; title: string }
  | { kind: "block"; week: number; text: string; title: string }
  | { kind: "line"; text: string };

type MapRow = { slug: string; note: string; marks: Mark[] };

const PULSE_WEEKS = [1, 2, 3, 5, 6, 8, 10, 12, 14];

const ROWS: MapRow[] = [
  {
    slug: "getting-started",
    note: "The whole year",
    marks: [{ kind: "line", text: "The opening weeks, the rhythm, the handoff" }],
  },
  {
    slug: "speaker-series",
    note: "The pulse",
    marks: [
      { kind: "dot", week: 0, hollow: true, title: "Week 0: the org fair" },
      ...PULSE_WEEKS.map((w): Mark => ({ kind: "dot", week: w, title: w === 5 ? "Week 5: the kick-off" : `Week ${w}: an event` })),
      { kind: "dot", week: 4, hollow: true, title: "Week 4: another event, or a break" },
    ],
  },
  {
    slug: "innovation-labs",
    note: "The depth",
    marks: [{ kind: "bar", week: 5, span: 8, text: "8 weeks", title: "Weeks 5 to 12" }],
  },
  {
    slug: "research-groups",
    note: "The depth",
    marks: [{ kind: "bar", week: 5, span: "end", text: "About 6 months, into spring", title: "From week 5 into spring" }],
  },
  {
    slug: "hackathons",
    note: "The depth",
    marks: [{ kind: "block", week: 12, text: "48 hours", title: "One weekend" }],
  },
  {
    slug: "sponsorship",
    note: "The money",
    marks: [{ kind: "line", text: "What pays for both tracks" }],
  },
];

function markHtml(m: Mark): string {
  switch (m.kind) {
    case "dot":
      return `<span class="pbm__dot${m.hollow ? " is-hollow" : ""}" style="--w:${m.week}" title="${esc(m.title)}"></span>`;
    case "bar": {
      const span = m.span === "end" ? WEEKS - m.week : m.span;
      return `<span class="pbm__bar${m.span === "end" ? " is-open" : ""}" style="--w:${m.week};--span:${span}" title="${esc(m.title)}"><span>${esc(m.text)}</span></span>`;
    }
    case "block":
      return `<span class="pbm__block" style="--w:${m.week}" title="${esc(m.title)}"></span><span class="pbm__blocktext" style="--w:${m.week}">${esc(m.text)}</span>`;
    case "line":
      return `<span class="pbm__line"><span>${esc(m.text)}</span></span>`;
  }
}

function renderMap(): string {
  const axis = Array.from({ length: WEEKS }, (_, w) => `<span class="pbm__wk" style="--w:${w}">${w}</span>`).join("");
  const rows = ROWS.map((r, i) => {
    const p = getPlaybook(r.slug);
    if (!p) return "";
    // Rows sit on explicit grid lines (3 onward), so the overlays can span them all.
    return `
      <a class="pbm__row" href="${href(p.slug)}" style="--c:${p.accent};grid-row:${i + 3}">
        <span class="pbm__label"><b>${esc(p.title)}</b><small>${esc(r.note)}</small></span>
        ${r.marks.map(markHtml).join("")}
        <span class="pbm__go" aria-hidden="true">&rarr;</span>
      </a>`;
  }).join("");
  return `
    <div class="pbm__chart">
      <span class="pbm__three" aria-hidden="true"><span>These three decide the year</span></span>
      <span class="pbm__kick" aria-hidden="true"><span>Kick-off</span></span>
      <div class="pbm__axis" aria-hidden="true"><span class="pbm__axislabel">Week</span>${axis}</div>
      ${rows}
    </div>`;
}

/* ── The cards ──────────────────────────────────────────────────────────── */

function renderCard(p: PlaybookMeta): string {
  const facts = p.stats
    .map((s) => `<div class="pbc__fact"><dt>${esc(s.value)}</dt><dd>${esc(s.label)}</dd></div>`)
    .join("");
  const jumps = p.actions
    .map((a) => `<a class="pbc__jump" href="${href(p.slug, a.anchor)}">${esc(a.label)}</a>`)
    .join("");
  const film = p.film ? `<span class="pbc__film" title="${esc(p.film.title)}"><svg viewBox="0 0 16 16" width="11" height="11" aria-hidden="true"><path d="M5 3.5v9l7-4.5z" fill="currentColor"/></svg>Film ${esc(p.film.runtime)}</span>` : "";
  return `
    <article class="pbc" style="--pb-accent:${p.accent}">
      <div class="pbc__top">
        <span class="pbc__track">${esc(p.track)}</span>
        <span class="pbc__meta">${p.minutes} min read${film}</span>
      </div>
      <h3 class="pbc__title">
        <span class="pbc__icon" aria-hidden="true">${p.icon}</span>
        <a class="pbc__link" href="${href(p.slug)}">${esc(p.title)}</a>
      </h3>
      <p class="pbc__tagline">${esc(p.tagline)}</p>
      <dl class="pbc__facts">${facts}</dl>
      <div class="pbc__jumps" aria-label="Jump to a chapter of ${esc(p.title)}">${jumps}</div>
      <span class="pbc__open" aria-hidden="true">Read the Playbook &rarr;</span>
    </article>`;
}

function init(): void {
  const map = document.getElementById("pb-map");
  if (map) map.innerHTML = renderMap();
  const grid = document.getElementById("pb-grid");
  if (grid) grid.innerHTML = PLAYBOOKS.map(renderCard).join("");
}

init();
