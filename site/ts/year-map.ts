/**
 * year-map.ts — the model every playbook teaches, drawn once: a semester of weeks
 * 0 to 15, the pulse as a row of events every two weeks, the depth as projects
 * that start at the week 5 kick-off, and the money under both. Each row is a
 * playbook. The weeks are the ones in Getting Started's week-by-week table.
 *
 * Used by the Playbooks library (each row a link) and Start a Chapter (each row a
 * tab that shows its playbook beside the map).
 */

import { getPlaybook } from "./playbook-metadata";

export const playbookHref = (slug: string, anchor = ""): string => `./playbook.html?path=playbooks/${slug}/index.md${anchor}`;

export const esc = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const WEEKS = 16; // weeks 0 to 15

type Mark =
  | { kind: "dot"; week: number; hollow?: boolean; title: string }
  | { kind: "bar"; week: number; span: number | "end"; text: string; title: string }
  | { kind: "block"; week: number; text: string; title: string }
  | { kind: "line"; text: string };

type MapRow = { slug: string; note: string; marks: Mark[] };

const PULSE_WEEKS = [1, 2, 3, 5, 6, 8, 10, 12, 14];

export const MAP_ROWS: MapRow[] = [
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
    marks: [{ kind: "bar", week: 5, span: 8, text: "4 to 8 weeks", title: "Weeks 5 to 12 at the most" }],
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

/**
 * The map. As links, each row opens its playbook. As tabs, each row is a button
 * that controls a panel `${tabsId}-${slug}` (the page draws the panels).
 */
export function renderYearMap(opts: { tabsId?: string } = {}): string {
  const axis = Array.from({ length: WEEKS }, (_, w) => `<span class="pbm__wk" style="--w:${w}">${w}</span>`).join("");
  const rows = MAP_ROWS.map((r, i) => {
    const p = getPlaybook(r.slug);
    if (!p) return "";
    const inner = `
        <span class="pbm__label"><b>${esc(p.title)}</b><small>${esc(r.note)}</small></span>
        ${r.marks.map(markHtml).join("")}
        <span class="pbm__go" aria-hidden="true">&rarr;</span>`;
    // Rows sit on explicit grid lines (3 onward), so the overlays can span them all.
    const style = `--c:${p.accent};grid-row:${i + 3}`;
    return opts.tabsId
      ? `<button type="button" class="pbm__row" role="tab" id="${opts.tabsId}-tab-${p.slug}" aria-controls="${opts.tabsId}-${p.slug}" aria-selected="false" style="${style}">${inner}</button>`
      : `<a class="pbm__row" href="${playbookHref(p.slug)}" style="${style}">${inner}</a>`;
  }).join("");
  return `
    <div class="pbm__chart"${opts.tabsId ? ` role="tablist" aria-label="The six playbooks, across a semester"` : ""}>
      <span class="pbm__three" aria-hidden="true"><span>These three decide the year</span></span>
      <span class="pbm__kick" aria-hidden="true"><span>Kick-off</span></span>
      <div class="pbm__axis" aria-hidden="true"><span class="pbm__axislabel">Week</span>${axis}</div>
      ${rows}
    </div>`;
}
