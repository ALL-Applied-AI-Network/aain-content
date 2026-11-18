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

import { PLAYBOOKS, type PlaybookMeta } from "./playbook-metadata";
import { esc, playbookHref as href, renderYearMap as renderMap } from "./year-map";

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
