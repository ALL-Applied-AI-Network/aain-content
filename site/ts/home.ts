/**
 * home.ts — Landing page initialization.
 * Loads tree data + manifest, renders 3D hero scene, stats,
 * content library, contributors, and series cards.
 */

import {
  loadTreeData,
  totalEstimatedHours,
  formatMinutes,
  $,
  type TreeJson,
  type TreeContributor,
} from "./main";

// ---------------------------------------------------------------------------
// Manifest types (mirrors manifest.json)
// ---------------------------------------------------------------------------

interface ManifestEntry {
  type: "learning" | "playbook" | "workshop" | "template";
  id?: string;
  title: string;
  description?: string;
  path: string;
  thumbnail?: string;
}

interface ManifestJson {
  version: string;
  generated_at: string;
  content: ManifestEntry[];
}

async function loadManifest(): Promise<ManifestJson | null> {
  try {
    const resp = await fetch("./manifest.json");
    if (!resp.ok) return null;
    return (await resp.json()) as ManifestJson;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

async function init(): Promise<void> {
  let tree: TreeJson;
  try {
    tree = await loadTreeData();
  } catch (e) {
    console.error("Failed to load tree data:", e);
    return;
  }

  const manifest = await loadManifest();

  // --- Stats ---
  const statNodes = $("#stat-nodes");
  const statHours = $("#stat-hours");

  if (statNodes) statNodes.textContent = String(tree.stats.total_nodes);
  if (statHours) statHours.textContent = `~${totalEstimatedHours(tree.nodes)}`;

  // --- 3D Hero Scene (Three.js — dynamically imported) ---
  // Switch between hero scene variants:
  //   "hero-scene-b" = desk/GPU workstation
  //   "hero-scene-node-graph" = interactive skill tree node graph
  const hero3d = document.getElementById("hero-3d");
  if (hero3d) {
    import("./hero-scene-node-graph").then((m) => m.initHeroScene(hero3d));
  }

  // --- Content Library ---
  renderContentLibrary(tree, manifest);

  // --- Contributors ---
  renderContributors(tree);

  // --- Series Cards (hidden section unless series exist) ---
  const grid = document.getElementById("series-grid");
  const seriesSection = document.getElementById("series-section");
  if (grid && seriesSection) {
    if (tree.series.length > 0) {
      seriesSection.style.display = "";
      for (const series of tree.series) {
        const seriesNodes = series.nodes
          .map((id) => tree.nodes.find((n) => n.id === id))
          .filter(Boolean);
        const totalMins = seriesNodes.reduce(
          (s, n) => s + (n?.estimated_minutes || 0),
          0
        );

        const card = document.createElement("a");
        card.href = `tree.html?series=${encodeURIComponent(series.id)}`;
        card.className = "series-card";
        card.innerHTML = `
          <h3 class="series-card__title">${series.title}</h3>
          <p class="series-card__desc">${series.description}</p>
          <div class="series-card__meta">
            <span>${series.nodes.length} lessons</span>
            <span>${formatMinutes(totalMins)}</span>
            <span class="badge badge--${series.difficulty.split("-")[0]}">${series.difficulty}</span>
          </div>
        `;
        grid.appendChild(card);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Content Library
// ---------------------------------------------------------------------------

function renderContentLibrary(tree: TreeJson, manifest: ManifestJson | null): void {
  const grid = document.getElementById("content-library-grid");
  if (!grid) return;

  // Count content by type
  const learningCount = tree.stats.total_nodes;
  const totalHours = totalEstimatedHours(tree.nodes);

  const playbooks = manifest?.content.filter((e) => e.type === "playbook") || [];
  const workshops = manifest?.content.filter((e) => e.type === "workshop") || [];

  // Learning Tree card
  const layerCounts = tree.stats.by_layer;
  const layerLabels: Record<string, string> = {
    "0": "Foundations",
    "1": "Fundamentals",
    "2": "Applied AI",
    "3": "Advanced",
    "4": "Expert",
    "5": "Mastery",
  };
  const layerItems = Object.entries(layerCounts)
    .filter(([, count]) => count > 0)
    .map(([layer, count]) => `<li>${layerLabels[layer] || `Layer ${layer}`}: ${count} lessons</li>`)
    .join("");

  // Render compact content items inside the repo card
  grid.innerHTML = `
    <div class="repo-content-row">
      <svg class="repo-content-row__icon" viewBox="0 0 24 24" width="22" height="22" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <polygon points="12,3 20,7 12,11 4,7" fill="#22d3ee" opacity="0.88"/>
        <polygon points="4,7 12,11 12,14 4,10" fill="#22d3ee" opacity="0.55"/>
        <polygon points="12,11 20,7 20,10 12,14" fill="#22d3ee" opacity="0.35"/>
        <line x1="12" y1="14" x2="7" y2="18" stroke="#22d3ee" stroke-width="1" opacity="0.35"/>
        <line x1="12" y1="14" x2="17" y2="18" stroke="#22d3ee" stroke-width="1" opacity="0.35"/>
        <line x1="12" y1="14" x2="12" y2="20" stroke="#22d3ee" stroke-width="1" opacity="0.4"/>
        <circle cx="7" cy="18.5" r="1.8" fill="#22d3ee" opacity="0.45"/>
        <circle cx="17" cy="18.5" r="1.8" fill="#22d3ee" opacity="0.45"/>
        <circle cx="12" cy="20.5" r="1.5" fill="#22d3ee" opacity="0.35"/>
      </svg>
      <div>
        <strong>Learning Tree</strong>
        <span>${learningCount} lessons &middot; ~${totalHours} hours</span>
      </div>
      <a href="./tree.html" class="repo-content-row__link">Explore &rarr;</a>
    </div>
    <div class="repo-content-row">
      <svg class="repo-content-row__icon" viewBox="0 0 24 24" width="22" height="22" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <polygon points="12,3 20,7 12,11 4,7" fill="#ec4899" opacity="0.85"/>
        <polygon points="4,7 12,11 12,20 4,16" fill="#ec4899" opacity="0.55"/>
        <polygon points="12,11 20,7 20,16 12,20" fill="#ec4899" opacity="0.35"/>
        <line x1="7" y1="10" x2="10" y2="12" stroke="#f9a8d4" stroke-width="0.8" opacity="0.5" stroke-linecap="round"/>
        <line x1="7" y1="12.5" x2="10" y2="14.5" stroke="#f9a8d4" stroke-width="0.8" opacity="0.4" stroke-linecap="round"/>
        <line x1="7" y1="15" x2="9" y2="16.5" stroke="#f9a8d4" stroke-width="0.8" opacity="0.3" stroke-linecap="round"/>
      </svg>
      <div>
        <strong>Playbooks</strong>
        <span>${playbooks.length} operational guides for hub leaders</span>
      </div>
    </div>
    <div class="repo-content-row">
      <svg class="repo-content-row__icon" viewBox="0 0 24 24" width="22" height="22" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <polygon points="12,3 20,7 12,11 4,7" fill="#a855f7" opacity="0.88"/>
        <polygon points="4,7 12,11 12,17 4,13" fill="#a855f7" opacity="0.55"/>
        <polygon points="12,11 20,7 20,13 12,17" fill="#a855f7" opacity="0.35"/>
        <line x1="7" y1="9" x2="9.5" y2="10.5" stroke="#e9d5ff" stroke-width="0.9" opacity="0.5" stroke-linecap="round"/>
        <line x1="7" y1="11" x2="9.5" y2="12.5" stroke="#e9d5ff" stroke-width="0.9" opacity="0.4" stroke-linecap="round"/>
        <circle cx="12" cy="20" r="2" fill="#a855f7" opacity="0.3"/>
        <line x1="12" y1="17" x2="12" y2="20" stroke="#a855f7" stroke-width="1" opacity="0.35"/>
      </svg>
      <div>
        <strong>Workshops</strong>
        <span>${workshops.length} hands-on labs with code &amp; slides</span>
      </div>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// Contributors
// ---------------------------------------------------------------------------

function renderContributors(tree: TreeJson): void {
  const grid = document.getElementById("contributors-grid");
  if (!grid) return;

  // Always lead with ALL Applied AI Network
  const allOrg: TreeContributor = {
    name: "ALL Applied AI Network",
    role: "author",
    github: "ALL-Applied-AI-Network",
  };

  // Collect unique authors + count their contributions
  const seen = new Set<string>(["ALL Applied AI Network"]);
  const individualMap = new Map<string, { contributor: TreeContributor; count: number }>();

  for (const node of tree.nodes) {
    if (node.contributors) {
      for (const c of node.contributors) {
        if (c.name === "ALL Applied AI Network") continue;
        if (individualMap.has(c.name)) {
          individualMap.get(c.name)!.count++;
        } else {
          seen.add(c.name);
          individualMap.set(c.name, { contributor: c, count: 1 });
        }
      }
    }
    // Also check the top-level author field
    if (node.author && node.author !== "ALL Applied AI Network") {
      if (individualMap.has(node.author)) {
        individualMap.get(node.author)!.count++;
      } else if (!seen.has(node.author)) {
        seen.add(node.author);
        individualMap.set(node.author, {
          contributor: { name: node.author, role: "author" },
          count: 1,
        });
      }
    }
  }

  // Sort individuals by contribution count (most first)
  const individuals = Array.from(individualMap.values())
    .sort((a, b) => b.count - a.count);

  const roleColors: Record<string, string> = {
    author: "var(--gradient-blue)",
    curator: "var(--gradient-purple)",
    reviewer: "var(--gradient-cyan)",
    editor: "var(--gradient-pink)",
  };

  const roleLabels: Record<string, string> = {
    author: "Author",
    curator: "Curator",
    reviewer: "Reviewer",
    editor: "Editor",
  };

  // Hub organizations — scrolling ticker
  const hubs = [
    { name: "ALL Applied AI Network", detail: "Parent organization", icon: "groups" },
    { name: "MSOE", detail: "Milwaukee, WI \u00b7 500+ members", icon: "school" },
    { name: "UW-Madison", detail: "Madison, WI \u00b7 200+ members", icon: "school" },
    { name: "UW-Milwaukee", detail: "Milwaukee, WI \u00b7 30 members", icon: "school" },
    { name: "Marquette University", detail: "Milwaukee, WI \u00b7 Est. March 2026", icon: "school" },
    { name: "Rose-Hulman", detail: "Terre Haute, IN \u00b7 Est. Sept 2025", icon: "school" },
  ];

  const hubIconSvgs: Record<string, string> = {
    groups: `<svg viewBox="0 0 20 20" width="18" height="18" xmlns="http://www.w3.org/2000/svg"><circle cx="7" cy="7" r="2.5" fill="currentColor" opacity="0.7"/><circle cx="13" cy="7" r="2.5" fill="currentColor" opacity="0.7"/><ellipse cx="7" cy="14" rx="3.5" ry="2.5" fill="currentColor" opacity="0.4"/><ellipse cx="13" cy="14" rx="3.5" ry="2.5" fill="currentColor" opacity="0.4"/></svg>`,
    school: `<svg viewBox="0 0 20 20" width="18" height="18" xmlns="http://www.w3.org/2000/svg"><polygon points="10,3 18,8 10,13 2,8" fill="currentColor" opacity="0.7"/><polygon points="2,8 10,13 10,15 2,10" fill="currentColor" opacity="0.4"/><polygon points="10,13 18,8 18,10 10,15" fill="currentColor" opacity="0.3"/></svg>`,
  };

  const hubCards = hubs.map(h => `
    <div class="contributor-card contributor-card--org">
      <div class="contributor-card__avatar contributor-card__avatar--org">
        ${hubIconSvgs[h.icon] || hubIconSvgs.school}
      </div>
      <div class="contributor-card__info">
        <span class="contributor-card__name">${h.name}</span>
        <span class="contributor-card__role">${h.detail}</span>
      </div>
    </div>
  `).join("");

  // Duplicate for seamless loop
  const hubTicker = `
    <div class="contributors-ticker">
      <div class="contributors-ticker__track">
        ${hubCards}${hubCards}
      </div>
    </div>
  `;

  // Individual contributor cards
  const individualCards = individuals.map(({ contributor: c, count }) => {
    const initials = c.name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
    const bg = roleColors[c.role] || "var(--text-secondary)";

    return `
      <div class="contributor-card">
        <div class="contributor-card__avatar" style="background:${bg}">${initials}</div>
        <div class="contributor-card__info">
          <span class="contributor-card__name">${c.name}</span>
          <span class="contributor-card__role">${count} contribution${count !== 1 ? "s" : ""}</span>
        </div>
      </div>
    `;
  });

  // Combine hubs + individuals into one ticker
  const allCards = hubCards + individualCards.join("");

  const ticker = `
    <div class="contributors-ticker">
      <div class="contributors-ticker__track">
        ${allCards}${allCards}
      </div>
    </div>
  `;

  grid.innerHTML = ticker;
}

document.addEventListener("DOMContentLoaded", init);
