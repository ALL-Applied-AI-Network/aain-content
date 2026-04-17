/**
 * playbooks-page.ts — Renders the Playbooks landing grid.
 *
 * Reads from playbook-metadata.ts and builds 5 interactive cards with
 * tagline, stat pills, and 3 action buttons each.
 */

import { PLAYBOOKS, type PlaybookMeta } from "./playbook-metadata";

function renderCard(p: PlaybookMeta): string {
  const stats = p.stats
    .map(
      (s) => `
        <div class="pb-card__stat">
          <span class="pb-card__stat-value">${s.value}</span>
          <span class="pb-card__stat-label">${s.label}</span>
        </div>
      `,
    )
    .join("");

  const actions = p.actions
    .map(
      (a) => `
        <a class="pb-card__action" href="./playbook.html?path=playbooks/${p.slug}/index.md${a.anchor}">
          <span class="pb-card__action-label">${a.label}</span>
          <span class="pb-card__action-sub">${a.sub}</span>
        </a>
      `,
    )
    .join("");

  return `
    <article class="pb-card" style="--pb-accent: ${p.accent};">
      <div class="pb-card__accent-bar"></div>
      <div class="pb-card__header">
        <span class="pb-card__emoji" aria-hidden="true">${p.emoji}</span>
        <h2 class="pb-card__title">${p.title}</h2>
      </div>
      <p class="pb-card__tagline">${p.tagline}</p>
      <div class="pb-card__stats">${stats}</div>
      <div class="pb-card__actions-label">Jump straight to:</div>
      <div class="pb-card__actions">${actions}</div>
      <a class="pb-card__open" href="./playbook.html?path=playbooks/${p.slug}/index.md">
        Read the full playbook <span aria-hidden="true">&rarr;</span>
      </a>
    </article>
  `;
}

function init(): void {
  const grid = document.getElementById("pb-grid");
  if (!grid) return;
  grid.innerHTML = PLAYBOOKS.map(renderCard).join("");
}

init();
