/**
 * impact-page.ts — Interactive US map showing ALL Applied AI Network chapters.
 *
 * Uses D3 + TopoJSON to render a choropleth-style map with hover states,
 * pulsing hub markers, and a filterable chapter directory.
 */

import * as d3 from "d3";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Hub {
  id: string;
  name: string;
  university: string;
  state: string;
  stateId: string;
  city: string;
  status: "active" | "launching";
  members: number;
  founded: string;
  description: string;
  highlights: string[];
  url: string | null;
}

interface HubData {
  stats: {
    total_hubs: number;
    total_members: number;
    states_active: number;
    universities: number;
  };
  hubs: Hub[];
}

// ---------------------------------------------------------------------------
// State FIPS → approximate centroid coordinates (lon, lat)
// Used to place hub markers on the map
// ---------------------------------------------------------------------------

const STATE_CENTROIDS: Record<string, [number, number]> = {
  "01": [-86.9, 32.8],   // Alabama
  "02": [-153.5, 64.2],  // Alaska
  "04": [-111.1, 34.0],  // Arizona
  "05": [-91.8, 34.8],   // Arkansas
  "06": [-119.4, 36.8],  // California
  "08": [-105.5, 39.0],  // Colorado
  "09": [-72.8, 41.6],   // Connecticut
  "10": [-75.5, 39.0],   // Delaware
  "11": [-77.0, 38.9],   // DC
  "12": [-81.5, 27.6],   // Florida
  "13": [-83.5, 32.2],   // Georgia
  "15": [-155.5, 19.9],  // Hawaii
  "16": [-114.5, 44.2],  // Idaho
  "17": [-89.4, 40.6],   // Illinois
  "18": [-86.1, 40.3],   // Indiana
  "19": [-93.1, 42.0],   // Iowa
  "20": [-98.5, 38.5],   // Kansas
  "21": [-84.3, 37.8],   // Kentucky
  "22": [-91.9, 31.2],   // Louisiana
  "23": [-69.4, 45.3],   // Maine
  "24": [-76.6, 39.0],   // Maryland
  "25": [-71.5, 42.2],   // Massachusetts
  "26": [-84.5, 44.3],   // Michigan
  "27": [-94.7, 46.7],   // Minnesota
  "28": [-89.3, 32.3],   // Mississippi
  "29": [-91.8, 38.6],   // Missouri
  "30": [-110.3, 46.8],  // Montana
  "31": [-99.7, 41.5],   // Nebraska
  "32": [-116.4, 38.8],  // Nevada
  "33": [-71.6, 43.7],   // New Hampshire
  "34": [-74.4, 40.1],   // New Jersey
  "35": [-106.2, 34.5],  // New Mexico
  "36": [-74.9, 43.0],   // New York
  "37": [-79.0, 35.6],   // North Carolina
  "38": [-100.5, 47.5],  // North Dakota
  "39": [-82.6, 40.4],   // Ohio
  "40": [-97.5, 35.0],   // Oklahoma
  "41": [-120.5, 43.8],  // Oregon
  "42": [-77.2, 41.2],   // Pennsylvania
  "44": [-71.5, 41.7],   // Rhode Island
  "45": [-81.1, 34.0],   // South Carolina
  "46": [-100.0, 43.9],  // South Dakota
  "47": [-86.6, 35.5],   // Tennessee
  "48": [-99.9, 31.9],   // Texas
  "49": [-111.5, 39.3],  // Utah
  "50": [-72.6, 44.0],   // Vermont
  "51": [-79.5, 37.8],   // Virginia
  "53": [-120.7, 47.7],  // Washington
  "54": [-80.5, 38.6],   // West Virginia
  "55": [-88.7, 43.8],   // Wisconsin
  "56": [-107.3, 43.0],  // Wyoming
};

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

async function init(): Promise<void> {
  // Load data in parallel
  const [hubData, topoData] = await Promise.all([
    fetch("./public/hub-data.json").then((r) => r.json()) as Promise<HubData>,
    fetch("./public/us-states-10m.json").then((r) => r.json()) as Promise<Topology>,
  ]);

  renderStats(hubData);
  renderMap(topoData, hubData);
  renderDirectory(hubData);
  initFilters(hubData);
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

function renderStats(data: HubData): void {
  const grid = document.getElementById("stats-grid");
  if (!grid) return;

  const stats = [
    { value: data.stats.total_hubs, label: "Chapters" },
    { value: data.stats.total_members, label: "Members" },
    { value: data.stats.states_active, label: "States" },
    { value: data.stats.universities, label: "Universities" },
  ];

  grid.innerHTML = stats
    .map(
      (s) => `
    <div class="impact-stat">
      <div class="impact-stat__value">${s.value}</div>
      <div class="impact-stat__label">${s.label}</div>
    </div>
  `
    )
    .join("");

  // Animate count-up
  grid.querySelectorAll<HTMLElement>(".impact-stat__value").forEach((el, i) => {
    const target = stats[i].value;
    animateCount(el, target, 1200);
  });
}

function animateCount(el: HTMLElement, target: number, duration: number): void {
  const start = performance.now();
  const update = (now: number) => {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(eased * target).toString();
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

// ---------------------------------------------------------------------------
// Map
// ---------------------------------------------------------------------------

function renderMap(topo: Topology, hubData: HubData): void {
  const container = document.getElementById("us-map");
  if (!container) return;

  container.innerHTML = "";

  // Build lookup: stateId → status
  const stateStatus = new Map<string, "active" | "launching">();
  const stateHubs = new Map<string, Hub[]>();

  for (const hub of hubData.hubs) {
    // Use the priority: active > launching
    const current = stateStatus.get(hub.stateId);
    if (!current || (hub.status === "active" && current === "launching")) {
      stateStatus.set(hub.stateId, hub.status);
    }
    if (!stateHubs.has(hub.stateId)) stateHubs.set(hub.stateId, []);
    stateHubs.get(hub.stateId)!.push(hub);
  }

  const width = 975;
  const height = 610;

  const svg = d3
    .select(container)
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

  // Add glow filter
  const defs = svg.append("defs");

  const glowActive = defs.append("filter").attr("id", "glow-active");
  glowActive
    .append("feGaussianBlur")
    .attr("stdDeviation", "3")
    .attr("result", "blur");
  glowActive
    .append("feMerge")
    .selectAll("feMergeNode")
    .data(["blur", "SourceGraphic"])
    .join("feMergeNode")
    .attr("in", (d) => d);

  // Projection (Albers USA includes Alaska + Hawaii insets)
  const projection = d3.geoAlbersUsa().scale(1300).translate([width / 2, height / 2]);
  const path = d3.geoPath(projection);

  // Extract GeoJSON features
  const statesGeo = feature(
    topo,
    topo.objects.states as GeometryCollection
  );

  // Create tooltip
  const tooltip = createTooltip();

  // Render states
  svg
    .append("g")
    .selectAll("path")
    .data(statesGeo.features)
    .join("path")
    .attr("d", path as any)
    .attr("class", (d: any) => {
      const id = d.id?.toString().padStart(2, "0");
      const status = stateStatus.get(id);
      if (status === "active") return "state state--active";
      if (status === "launching") return "state state--launching";
      return "state";
    })
    .on("mouseenter", function (event: MouseEvent, d: any) {
      const id = d.id?.toString().padStart(2, "0");
      const hubs = stateHubs.get(id);
      if (hubs && hubs.length > 0) {
        showTooltip(tooltip, event, hubs);
      }
    })
    .on("mousemove", (event: MouseEvent) => {
      moveTooltip(tooltip, event);
    })
    .on("mouseleave", () => {
      hideTooltip(tooltip);
    })
    .on("click", (_event: MouseEvent, d: any) => {
      const id = d.id?.toString().padStart(2, "0");
      const hubs = stateHubs.get(id);
      if (hubs && hubs.length > 0) {
        // Scroll to directory and highlight
        const card = document.querySelector(`[data-hub="${hubs[0].id}"]`);
        if (card) {
          card.scrollIntoView({ behavior: "smooth", block: "center" });
          card.classList.add("hub-card--highlight");
          setTimeout(() => card.classList.remove("hub-card--highlight"), 2000);
        }
      }
    });

  // Render hub markers
  const markerGroup = svg.append("g").attr("class", "hub-markers");

  for (const hub of hubData.hubs) {
    const centroid = STATE_CENTROIDS[hub.stateId];
    if (!centroid) continue;

    const projected = projection(centroid);
    if (!projected) continue;

    const [x, y] = projected;
    const isActive = hub.status === "active";
    const color = isActive ? "#818cf8" : "#22d3ee";

    const g = markerGroup.append("g").attr("class", "hub-marker");

    // Pulse ring (only for active)
    if (isActive) {
      g.append("circle")
        .attr("cx", x)
        .attr("cy", y)
        .attr("r", 8)
        .attr("fill", "none")
        .attr("stroke", color)
        .attr("stroke-width", 1.5)
        .attr("class", "hub-marker__pulse");
    }

    // Dot
    g.append("circle")
      .attr("cx", x)
      .attr("cy", y)
      .attr("r", isActive ? 4 : 3)
      .attr("fill", color)
      .attr("class", "hub-marker__dot")
      .attr("filter", isActive ? "url(#glow-active)" : null);
  }
}

// ---------------------------------------------------------------------------
// Tooltip
// ---------------------------------------------------------------------------

function createTooltip(): HTMLElement {
  const el = document.createElement("div");
  el.className = "impact-tooltip";
  document.body.appendChild(el);
  return el;
}

function showTooltip(el: HTMLElement, event: MouseEvent, hubs: Hub[]): void {
  const hub = hubs[0]; // Primary hub for this state
  const statusColor = hub.status === "active" ? "#818cf8" : "#22d3ee";

  let html = `
    <div class="impact-tooltip__state">${hub.state}</div>
    <div class="impact-tooltip__name">${hub.name}</div>
    <div class="impact-tooltip__university">${hub.university}</div>
    <div class="impact-tooltip__meta">
      <span class="impact-tooltip__meta-item">
        <span class="impact-tooltip__meta-dot impact-tooltip__meta-dot--${hub.status}"></span>
        ${hub.status === "active" ? "Active" : "Launching"}
      </span>
      <span class="impact-tooltip__meta-item">${hub.members} members</span>
    </div>
  `;

  if (hubs.length > 1) {
    html += `<div style="margin-top:0.4rem;font-size:0.7rem;color:var(--text-muted)">+${hubs.length - 1} more chapter${hubs.length > 2 ? "s" : ""} in this state</div>`;
  }

  el.innerHTML = html;
  el.style.borderLeft = `3px solid ${statusColor}`;
  el.classList.add("impact-tooltip--visible");
  moveTooltip(el, event);
}

function moveTooltip(el: HTMLElement, event: MouseEvent): void {
  const x = event.clientX + 16;
  const y = event.clientY - 8;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
}

function hideTooltip(el: HTMLElement): void {
  el.classList.remove("impact-tooltip--visible");
}

// ---------------------------------------------------------------------------
// Directory
// ---------------------------------------------------------------------------

function renderDirectory(data: HubData, filter = "all"): void {
  const grid = document.getElementById("directory-grid");
  if (!grid) return;

  const filtered =
    filter === "all"
      ? data.hubs
      : data.hubs.filter((h) => h.status === filter);

  // Sort: active first, then by member count
  filtered.sort((a, b) => {
    if (a.status !== b.status) return a.status === "active" ? -1 : 1;
    return b.members - a.members;
  });

  grid.innerHTML = filtered
    .map(
      (hub) => `
    <div class="hub-card" data-hub="${hub.id}" data-status="${hub.status}">
      <div class="hub-card__header">
        <div class="hub-card__name">${hub.name}</div>
        <span class="hub-card__status hub-card__status--${hub.status}">
          ${hub.status === "active" ? "Active" : "Launching"}
        </span>
      </div>
      <div class="hub-card__university">${hub.university}</div>
      <div class="hub-card__location">${hub.city}, ${hub.state}</div>
      <div class="hub-card__desc">${hub.description}</div>
      <div class="hub-card__highlights">
        ${hub.highlights.map((h) => `<span class="hub-card__tag">${h}</span>`).join("")}
      </div>
      <div class="hub-card__meta">
        <span class="hub-card__meta-item">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          ${hub.members} members
        </span>
        <span class="hub-card__meta-item">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
          Founded ${hub.founded}
        </span>
      </div>
    </div>
  `
    )
    .join("");
}

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------

function initFilters(data: HubData): void {
  const container = document.getElementById("directory-filters");
  if (!container) return;

  container.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>(".impact-filter");
    if (!btn) return;

    // Update active state
    container
      .querySelectorAll(".impact-filter")
      .forEach((b) => b.classList.remove("impact-filter--active"));
    btn.classList.add("impact-filter--active");

    // Re-render
    const filter = btn.dataset.filter || "all";
    renderDirectory(data, filter);
  });
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

document.addEventListener("DOMContentLoaded", init);
