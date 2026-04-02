/**
 * tree-page.ts — Full-page skill tree initialization.
 * Handles toolbar filters, series select, and node detail panel.
 */

import { loadTreeData, $, $$ } from "./main";
import { TreeVisualization, openNodePanel } from "./tree-visualization";

async function init(): Promise<void> {
  const container = document.getElementById("tree-container");
  const loading = document.getElementById("tree-loading");
  if (!container) return;

  const viz = new TreeVisualization({
    container,
    onNodeClick: (node) => {
      const tree = viz.getTree();
      if (tree) openNodePanel(node, tree);
    },
  });

  try {
    await viz.init();
  } catch (e) {
    console.error("Failed to initialize tree:", e);
    if (loading) loading.textContent = "Failed to load skill tree.";
    return;
  }

  if (loading) loading.remove();

  const tree = viz.getTree();
  if (!tree) return;

  // --- Populate series select ---
  const seriesSelect = document.getElementById(
    "series-select"
  ) as HTMLSelectElement | null;
  if (seriesSelect) {
    for (const s of tree.series) {
      const opt = document.createElement("option");
      opt.value = s.id;
      opt.textContent = s.title;
      seriesSelect.appendChild(opt);
    }
    seriesSelect.addEventListener("change", () => {
      viz.setSeriesFilter(seriesSelect.value || null);
    });
  }

  // --- Layer filter buttons ---
  const layerBtns = $$(".filter-btn[data-layer]");
  let activeLayerBtn: Element | null = null;

  layerBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const val = btn.getAttribute("data-layer");
      if (activeLayerBtn) activeLayerBtn.classList.remove("active");

      if (val === "all" || activeLayerBtn === btn) {
        activeLayerBtn = null;
        viz.setLayerFilter(null);
      } else {
        activeLayerBtn = btn;
        btn.classList.add("active");
        viz.setLayerFilter(parseInt(val || "0"));
      }
    });
  });

  // --- Difficulty filter buttons ---
  const diffBtns = $$(".filter-btn[data-diff]");
  let activeDiffBtn: Element | null = null;

  diffBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const val = btn.getAttribute("data-diff");
      if (activeDiffBtn) activeDiffBtn.classList.remove("active");

      if (val === "all" || activeDiffBtn === btn) {
        activeDiffBtn = null;
        viz.setDifficultyFilter(null);
      } else {
        activeDiffBtn = btn;
        btn.classList.add("active");
        viz.setDifficultyFilter(val);
      }
    });
  });

  // --- Fit view button ---
  const fitBtn = document.getElementById("btn-fit");
  if (fitBtn) {
    fitBtn.addEventListener("click", () => {
      viz.fitView();
    });
  }

  // --- URL params ---
  const params = new URLSearchParams(window.location.search);

  const seriesParam = params.get("series");
  if (seriesParam && seriesSelect) {
    seriesSelect.value = seriesParam;
    viz.setSeriesFilter(seriesParam);
  }

  const layerParam = params.get("layer");
  if (layerParam !== null) {
    const layerNum = parseInt(layerParam);
    viz.setLayerFilter(layerNum);
    const btn = layerBtns.find(
      (b) => b.getAttribute("data-layer") === layerParam
    );
    if (btn) {
      btn.classList.add("active");
      activeLayerBtn = btn;
    }
  }

  const highlightParam = params.get("highlight");
  if (highlightParam) {
    viz.highlightNode(highlightParam);
  }

  // --- Close panel on Escape ---
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const panel = $(".node-panel");
      if (panel) panel.classList.remove("open");
    }
  });

  // --- Close panel on outside click ---
  container.addEventListener("click", (e) => {
    // Only if not clicking a node
    const target = e.target as Element;
    if (!target.closest(".tree-node")) {
      const panel = $(".node-panel");
      if (panel) panel.classList.remove("open");
    }
  });
}

document.addEventListener("DOMContentLoaded", init);
