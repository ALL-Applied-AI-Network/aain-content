/**
 * impact-page.ts — US map + live stats from the network-api.
 *
 * Data flows from a public, no-PII endpoint hosted on dashboard.all-ai-
 * network.org so this static GitHub-Pages site never holds Supabase keys.
 * Falls back to a tiny local snapshot if the endpoint is unreachable.
 */

import * as d3 from "d3";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";

// ---------------------------------------------------------------------------
// Types — stable contract with /api/public/network-stats.
// ---------------------------------------------------------------------------

interface NetworkChapter {
  id: string;
  slug: string;
  name: string;
  university: string;
  city: string | null;
  state: string | null;
  stateName: string | null;
  stateId: string | null;
  founded: string | null;
  url: string | null;
  members_count: number;
  events_90d: number;
  tools: string[];
  status: "active";
}

interface NetworkPartnership {
  name: string;
  type: string;
  status: "active" | "in_conversation" | string;
  description: string | null;
  started_at: string | null;
}

interface NetworkStats {
  stats: {
    chapters_active: number;
    members_total: number;
    members_visible: number;
    events_90d: number;
    states_active: number;
    tools_in_use: string[];
    updated_at: string;
  };
  chapters: NetworkChapter[];
  partnerships: NetworkPartnership[];
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const STATS_ENDPOINT =
  "https://dashboard.all-ai-network.org/api/public/network-stats";

// Last-resort offline snapshot. Refreshed manually when we update the site.
// Real data is fetched at runtime; this only renders if the network-api is
// down or the user is fully offline.
const FALLBACK: NetworkStats = {
  stats: {
    chapters_active: 1,
    members_total: 517,
    members_visible: 2,
    events_90d: 1,
    states_active: 1,
    tools_in_use: [],
    updated_at: new Date().toISOString(),
  },
  chapters: [
    {
      id: "msoe",
      slug: "msoe-ai-club",
      name: "MSOE AI Club",
      university: "Milwaukee School of Engineering",
      city: "Milwaukee",
      state: "WI",
      stateName: "Wisconsin",
      stateId: "55",
      founded: "2023",
      url: "https://msoe-maic.com",
      members_count: 517,
      events_90d: 1,
      tools: ["Claude Code", "Cursor", "PyTorch", "Python", "OpenAI API"],
      status: "active",
    },
  ],
  partnerships: [],
};

// State FIPS → approximate centroid (lon, lat). Used to place chapter pins
// when we don't have a city-specific coordinate.
const STATE_CENTROIDS: Record<string, [number, number]> = {
  "01": [-86.9, 32.8], "02": [-153.5, 64.2], "04": [-111.1, 34.0],
  "05": [-91.8, 34.8], "06": [-119.4, 36.8], "08": [-105.5, 39.0],
  "09": [-72.8, 41.6], "10": [-75.5, 39.0], "11": [-77.0, 38.9],
  "12": [-81.5, 27.6], "13": [-83.5, 32.2], "15": [-155.5, 19.9],
  "16": [-114.5, 44.2], "17": [-89.4, 40.6], "18": [-86.1, 40.3],
  "19": [-93.1, 42.0], "20": [-98.5, 38.5], "21": [-84.3, 37.8],
  "22": [-91.9, 31.2], "23": [-69.4, 45.3], "24": [-76.6, 39.0],
  "25": [-71.5, 42.2], "26": [-84.5, 44.3], "27": [-94.7, 46.7],
  "28": [-89.3, 32.3], "29": [-91.8, 38.6], "30": [-110.3, 46.8],
  "31": [-99.7, 41.5], "32": [-116.4, 38.8], "33": [-71.6, 43.7],
  "34": [-74.4, 40.1], "35": [-106.2, 34.5], "36": [-74.9, 43.0],
  "37": [-79.0, 35.6], "38": [-100.5, 47.5], "39": [-82.7, 40.3],
  "40": [-97.5, 35.5], "41": [-120.5, 43.9], "42": [-77.7, 40.6],
  "44": [-71.5, 41.7], "45": [-80.9, 33.9], "46": [-100.2, 44.4],
  "47": [-86.7, 35.7], "48": [-99.0, 31.5], "49": [-111.7, 39.3],
  "50": [-72.7, 44.1], "51": [-78.2, 37.5], "53": [-120.5, 47.4],
  "54": [-80.6, 38.6], "55": [-89.6, 44.4], "56": [-107.3, 42.8],
};

// City-specific override coordinates by chapter slug. Add when a state has
// multiple chapters and the centroid isn't precise enough. Manually
// maintained — small list, updates infrequently.
const CITY_COORDS: Record<string, [number, number]> = {
  "msoe-ai-club": [-87.9, 43.04],
};

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------

async function init(): Promise<void> {
  // Topology is heavy and stable — load it from local public/ alongside live
  // stats from the API. If the API errors, we still render with FALLBACK.
  const [statsResult, topoResult] = await Promise.allSettled([
    loadStats(),
    fetch("./public/us-states-10m.json").then((r) => r.json()) as Promise<Topology>,
  ]);

  const stats: NetworkStats =
    statsResult.status === "fulfilled" ? statsResult.value : FALLBACK;
  if (statsResult.status === "rejected") {
    console.warn("[impact] live stats fetch failed, using fallback:", statsResult.reason);
  }
  if (topoResult.status === "rejected") {
    console.error("[impact] topology fetch failed:", topoResult.reason);
    showMapError();
    renderStatsStrip(stats);
    renderChapterCards(stats.chapters);
    renderToolStrip(stats);
    renderPartnerships(stats.partnerships);
    return;
  }

  renderMap(topoResult.value, stats.chapters);
  renderStatsStrip(stats);
  renderChapterCards(stats.chapters);
  renderToolStrip(stats);
  renderPartnerships(stats.partnerships);
}

async function loadStats(): Promise<NetworkStats> {
  const res = await fetch(STATS_ENDPOINT, {
    headers: { Accept: "application/json" },
    cache: "default",
  });
  if (!res.ok) throw new Error(`Stats endpoint returned ${res.status}`);
  return (await res.json()) as NetworkStats;
}

// ---------------------------------------------------------------------------
// Stats strip — top-of-page top-line numbers
// ---------------------------------------------------------------------------

function renderStatsStrip(stats: NetworkStats): void {
  const el = document.getElementById("impact-stats-strip");
  if (!el) return;
  const items = [
    { label: "Active chapters", value: stats.stats.chapters_active },
    { label: "Members reached", value: stats.stats.members_total.toLocaleString() },
    { label: "States", value: stats.stats.states_active },
    {
      label: "Active partners",
      value: stats.partnerships.filter((p) => p.status === "active").length,
    },
  ];
  el.innerHTML = items
    .map(
      (i) => `
        <div class="impact-stats__item">
          <div class="impact-stats__value">${i.value}</div>
          <div class="impact-stats__label">${i.label}</div>
        </div>
      `,
    )
    .join("");
}

// ---------------------------------------------------------------------------
// Map
// ---------------------------------------------------------------------------

function showMapError(): void {
  const container = document.getElementById("us-map");
  if (!container) return;
  container.innerHTML = `
    <div class="impact-map__error">
      Map data couldn't load right now. Try refreshing.
    </div>
  `;
}

function renderMap(topo: Topology, chapters: NetworkChapter[]): void {
  const container = document.getElementById("us-map");
  if (!container) return;
  container.innerHTML = "";

  const stateActive = new Set<string>();
  for (const c of chapters) if (c.stateId) stateActive.add(c.stateId);

  const width = 975;
  const height = 610;
  const svg = d3
    .select(container)
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

  const defs = svg.append("defs");
  const glow = defs.append("filter").attr("id", "glow-active");
  glow.append("feGaussianBlur").attr("stdDeviation", "3").attr("result", "blur");
  glow
    .append("feMerge")
    .selectAll("feMergeNode")
    .data(["blur", "SourceGraphic"])
    .join("feMergeNode")
    .attr("in", (d) => d);

  const projection = d3.geoAlbersUsa().scale(1300).translate([width / 2, height / 2]);
  const path = d3.geoPath(projection);
  const statesGeo = feature(topo, topo.objects.states as GeometryCollection);

  const tooltip = createTooltip();

  svg
    .append("g")
    .selectAll("path")
    .data((statesGeo as { features: Array<{ id?: string | number }> }).features)
    .join("path")
    .attr("d", path as unknown as string)
    .attr("class", (d) => {
      const id = d.id?.toString().padStart(2, "0");
      return id && stateActive.has(id) ? "state state--active" : "state";
    })
    .on("mouseenter", function (event: MouseEvent, d) {
      const id = d.id?.toString().padStart(2, "0");
      const matched = chapters.filter((c) => c.stateId === id);
      if (matched.length > 0) showTooltip(tooltip, event, matched);
    })
    .on("mousemove", (event: MouseEvent) => moveTooltip(tooltip, event))
    .on("mouseleave", () => hideTooltip(tooltip));

  const markerGroup = svg.append("g").attr("class", "hub-markers");
  const stateMarkerCount = new Map<string, number>();

  for (const ch of chapters) {
    const cityCoord = CITY_COORDS[ch.slug];
    const centroid = ch.stateId ? STATE_CENTROIDS[ch.stateId] : undefined;
    const coord = cityCoord || centroid;
    if (!coord) continue;
    const projected = projection(coord);
    if (!projected) continue;
    let [x, y] = projected;

    if (!cityCoord && centroid && ch.stateId) {
      const count = stateMarkerCount.get(ch.stateId) || 0;
      if (count > 0) {
        const angle = count * 2.1 + 0.5;
        x += Math.cos(angle) * 12;
        y += Math.sin(angle) * 12;
      }
      stateMarkerCount.set(ch.stateId, count + 1);
    }

    const color = "#818cf8";
    const g = markerGroup.append("g").attr("class", "hub-marker");
    g.append("circle")
      .attr("cx", x)
      .attr("cy", y)
      .attr("r", 8)
      .attr("fill", "none")
      .attr("stroke", color)
      .attr("stroke-width", 1.5)
      .attr("class", "hub-marker__pulse");
    g.append("circle")
      .attr("cx", x)
      .attr("cy", y)
      .attr("r", 4)
      .attr("fill", color)
      .attr("class", "hub-marker__dot")
      .attr("filter", "url(#glow-active)");
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

function showTooltip(
  el: HTMLElement,
  event: MouseEvent,
  chapters: NetworkChapter[],
): void {
  const html = chapters
    .map(
      (c) => `
        <div class="impact-tooltip__row">
          <div class="impact-tooltip__name">${escapeHtml(c.name)}</div>
          <div class="impact-tooltip__sub">${escapeHtml(c.university)}${c.city ? ` &middot; ${escapeHtml(c.city)}` : ""}</div>
          <div class="impact-tooltip__meta">${c.members_count.toLocaleString()} members${c.founded ? ` &middot; founded ${c.founded}` : ""}</div>
        </div>
      `,
    )
    .join("");
  el.innerHTML = html;
  el.classList.add("impact-tooltip--visible");
  moveTooltip(el, event);
}

function moveTooltip(el: HTMLElement, event: MouseEvent): void {
  el.style.left = `${event.clientX + 14}px`;
  el.style.top = `${event.clientY + 14}px`;
}

function hideTooltip(el: HTMLElement): void {
  el.classList.remove("impact-tooltip--visible");
}

// ---------------------------------------------------------------------------
// Chapter cards (below the map)
// ---------------------------------------------------------------------------

function renderChapterCards(chapters: NetworkChapter[]): void {
  const el = document.getElementById("impact-chapters");
  if (!el) return;
  if (chapters.length === 0) {
    el.innerHTML = `<p class="impact-chapters__empty">No chapters live yet.</p>`;
    return;
  }
  el.innerHTML = chapters
    .map(
      (c) => `
        <article class="impact-chapter-card">
          <header class="impact-chapter-card__head">
            <div>
              <h3 class="impact-chapter-card__name">${escapeHtml(c.name)}</h3>
              <p class="impact-chapter-card__sub">${escapeHtml(c.university)}${c.city && c.state ? ` &middot; ${escapeHtml(c.city)}, ${escapeHtml(c.state)}` : ""}</p>
            </div>
            <span class="impact-chapter-card__pill">Active</span>
          </header>
          <dl class="impact-chapter-card__stats">
            <div>
              <dt>Members</dt>
              <dd>${c.members_count.toLocaleString()}</dd>
            </div>
            <div>
              <dt>Events / 90d</dt>
              <dd>${c.events_90d}</dd>
            </div>
            ${c.founded ? `<div><dt>Founded</dt><dd>${escapeHtml(c.founded)}</dd></div>` : ""}
          </dl>
          ${
            c.tools.length > 0
              ? `<div class="impact-chapter-card__tools">
                  ${c.tools.map((t) => `<span class="impact-tool-chip">${escapeHtml(t)}</span>`).join("")}
                </div>`
              : ""
          }
          ${
            c.url
              ? `<a class="impact-chapter-card__link" href="${escapeAttr(c.url)}" target="_blank" rel="noopener">Visit hub site &rarr;</a>`
              : ""
          }
        </article>
      `,
    )
    .join("");
}

// ---------------------------------------------------------------------------
// Tools strip
// ---------------------------------------------------------------------------

function renderToolStrip(stats: NetworkStats): void {
  const el = document.getElementById("impact-tools");
  if (!el) return;
  const tools = stats.stats.tools_in_use;
  if (tools.length === 0) {
    el.innerHTML = "";
    return;
  }
  el.innerHTML = `
    <div class="impact-tools__header">
      <span class="impact-tools__label">Tools chapter members use today</span>
    </div>
    <div class="impact-tools__chips">
      ${tools.map((t) => `<span class="impact-tool-chip impact-tool-chip--strong">${escapeHtml(t)}</span>`).join("")}
    </div>
  `;
}

// ---------------------------------------------------------------------------
// Partnerships
// ---------------------------------------------------------------------------

function renderPartnerships(parts: NetworkPartnership[]): void {
  const el = document.getElementById("impact-partnerships");
  if (!el) return;
  // Only public-facing active partnerships on the impact page.
  // In-conversation partners (e.g. Anthropic during outreach) live on
  // dedicated /partners/<name> pages.
  const active = parts.filter((p) => p.status === "active");
  if (active.length === 0) {
    el.innerHTML = "";
    return;
  }
  el.innerHTML = active
    .map(
      (p) => `
        <article class="impact-partner-card">
          <div class="impact-partner-card__head">
            <h3 class="impact-partner-card__name">${escapeHtml(p.name)}</h3>
            <span class="impact-partner-card__type">${escapeHtml(formatPartnerType(p.type))}</span>
          </div>
          ${p.description ? `<p class="impact-partner-card__desc">${escapeHtml(p.description)}</p>` : ""}
        </article>
      `,
    )
    .join("");
}

function formatPartnerType(t: string): string {
  const map: Record<string, string> = {
    compute: "Compute",
    credits: "Credits",
    tooling: "Tooling",
    talent_pipeline: "Talent pipeline",
    mentorship: "Mentorship",
    other: "Partner",
  };
  return map[t] ?? "Partner";
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(s: string): string {
  return escapeHtml(s);
}

init().catch((err) => {
  console.error("[impact] init failed:", err);
});
