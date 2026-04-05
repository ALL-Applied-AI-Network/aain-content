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
// City-specific coordinates for states with multiple hubs
// ---------------------------------------------------------------------------

const CITY_COORDS: Record<string, [number, number]> = {
  // Wisconsin — 4 hubs
  "msoe":       [-87.9, 43.04],   // Milwaukee
  "uwm":        [-87.88, 43.08],  // Milwaukee (slightly offset)
  "uw-madison": [-89.4, 43.07],   // Madison
  "marquette":  [-87.92, 43.0],   // Milwaukee (offset south)
  // New York — 3 hubs
  "nyu":        [-74.0, 40.73],   // NYC
  "cornell":    [-76.47, 42.45],  // Ithaca
  "columbia":   [-73.96, 40.81],  // NYC (Morningside Heights)
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

  renderMap(topoData, hubData);
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
;

  // Render hub markers — use city-specific coordinates when available,
  // otherwise offset from state centroid to avoid overlap
  const markerGroup = svg.append("g").attr("class", "hub-markers");

  // Track how many markers per state so we can offset duplicates
  const stateMarkerCount = new Map<string, number>();

  for (const hub of hubData.hubs) {
    // Use city-specific coords if available, else offset from centroid
    const cityCoord = CITY_COORDS[hub.id];
    const centroid = STATE_CENTROIDS[hub.stateId];
    const coord = cityCoord || centroid;
    if (!coord) continue;

    const projected = projection(coord);
    if (!projected) continue;

    let [x, y] = projected;

    // If no city coord and state has multiple hubs, offset the marker
    if (!cityCoord && centroid) {
      const count = stateMarkerCount.get(hub.stateId) || 0;
      if (count > 0) {
        const angle = (count * 2.1) + 0.5;
        x += Math.cos(angle) * 12;
        y += Math.sin(angle) * 12;
      }
      stateMarkerCount.set(hub.stateId, count + 1);
    }

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
  const hasActive = hubs.some((h) => h.status === "active");
  const statusColor = hasActive ? "#818cf8" : "#22d3ee";
  const statusLabel = hasActive ? "Active" : "Expanding";

  const html = `
    <div class="impact-tooltip__state">${hub.state}</div>
    <div class="impact-tooltip__name">Chapter activity in this state</div>
    <div class="impact-tooltip__meta">
      <span class="impact-tooltip__meta-item">
        <span class="impact-tooltip__meta-dot impact-tooltip__meta-dot--${hasActive ? "active" : "launching"}"></span>
        ${statusLabel}
      </span>
    </div>
  `;

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
// Boot
// ---------------------------------------------------------------------------

document.addEventListener("DOMContentLoaded", init);
