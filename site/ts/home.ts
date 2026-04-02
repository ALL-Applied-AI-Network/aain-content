/**
 * home.ts — Landing page initialization.
 * Loads tree data, renders embedded skill tree, stats, and series cards.
 */

import {
  loadTreeData,
  totalEstimatedHours,
  articleUrl,
  formatMinutes,
  $,
  type TreeJson,
} from "./main";
import { TreeVisualization } from "./tree-visualization";

async function init(): Promise<void> {
  let tree: TreeJson;
  try {
    tree = await loadTreeData();
  } catch (e) {
    console.error("Failed to load tree data:", e);
    return;
  }

  // --- Stats ---
  const statNodes = $("#stat-nodes");
  const statHours = $("#stat-hours");

  if (statNodes) statNodes.textContent = String(tree.stats.total_nodes);
  if (statHours) statHours.textContent = `~${totalEstimatedHours(tree.nodes)}`;

  // --- Embedded Skill Tree in Hero ---
  const canvas = document.getElementById("tree-canvas");
  if (canvas) {
    const viz = new TreeVisualization({
      container: canvas,
      embedded: true,
      onNodeClick: (node) => {
        window.location.href = articleUrl(node.id);
      },
    });
    await viz.init();
  }

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

document.addEventListener("DOMContentLoaded", init);
