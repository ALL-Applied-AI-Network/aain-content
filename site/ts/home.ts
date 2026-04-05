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
  const hero3d = document.getElementById("hero-3d");
  if (hero3d) {
    import("./hero-scene").then((m) => m.initHeroScene(hero3d));
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
      <span class="material-icons-outlined" style="color:var(--gradient-cyan)">account_tree</span>
      <div>
        <strong>Learning Tree</strong>
        <span>${learningCount} lessons &middot; ~${totalHours} hours</span>
      </div>
      <a href="./tree.html" class="repo-content-row__link">Explore &rarr;</a>
    </div>
    <div class="repo-content-row">
      <span class="material-icons-outlined" style="color:var(--gradient-pink)">menu_book</span>
      <div>
        <strong>Playbooks</strong>
        <span>${playbooks.length} operational guides for hub leaders</span>
      </div>
    </div>
    <div class="repo-content-row">
      <span class="material-icons-outlined" style="color:var(--gradient-purple)">build_circle</span>
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

  const hubCards = hubs.map(h => `
    <div class="contributor-card contributor-card--org">
      <div class="contributor-card__avatar contributor-card__avatar--org">
        <span class="material-icons-outlined">${h.icon}</span>
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
