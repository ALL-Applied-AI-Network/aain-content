/**
 * home.ts — the landing page as one story.
 * Mounts the hero mark (untouched), the pipeline tabs, the reveals, the counters, and the effects (the deck, the rail, tilt).
 */
import { mountFx } from "./fx";
import { storiesByDate, fmtDate } from "./stories";
import { mountSequencer } from "./sequence";

const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;

function initHeroMark(): void {
  const hero3d = document.getElementById("hero-3d");
  if (hero3d) import("./hero-mark").then((m) => m.initHeroMark(hero3d));
}

/** Reveals: html.js-rv gates the hidden state so no-JS (and crawlers) see everything. */
function initReveal(): void {
  const els = document.querySelectorAll<HTMLElement>(".rv, .rv-group");
  if (!els.length) return;
  if (!("IntersectionObserver" in window) || REDUCED) { els.forEach((el) => el.classList.add("in")); return; }
  document.documentElement.classList.add("js-rv");
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
  els.forEach((el) => io.observe(el));
}

/** Count-up for any element with data-count (prefix/suffix kept from its text). */
function initCounters(): void {
  const els = document.querySelectorAll<HTMLElement>("[data-count]");
  if (!els.length || !("IntersectionObserver" in window)) return;
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const el = e.target as HTMLElement; io.unobserve(el);
      const target = parseFloat(el.dataset.count || "0"); const text = el.textContent || "";
      const m = text.match(/^([^\d]*)(\d[\d,\.]*)(.*)$/); const pre = m ? m[1] : "", suf = m ? m[3] : "";
      const t0 = performance.now(), dur = 1100;
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / dur), k = 1 - Math.pow(1 - p, 3);
        el.textContent = pre + Math.round(target * k).toLocaleString() + suf;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  }, { threshold: 0.6 });
  els.forEach((el) => io.observe(el));
}

/** The pipeline: one step open at a time, sequencing until someone clicks. Shared sequencer; the only extra
 *  is that on a phone the detail panel moves to sit under the open card. */
function initPipeline(): void {
  const steps = Array.from(document.querySelectorAll<HTMLButtonElement>(".pipe__step"));
  if (!steps.length) return;
  const panes = Array.from(document.querySelectorAll<HTMLElement>("[data-detail]"));
  const panel = document.getElementById("pipe-detail"); const grid = steps[0].parentElement as HTMLElement | null;
  if (!grid) return;
  const place = (i?: number) => {
    if (!panel) return;
    const k = i ?? Math.max(0, steps.findIndex((s) => s.classList.contains("is-open")));
    if (innerWidth < 760) { if (panel.previousElementSibling !== steps[k]) steps[k].insertAdjacentElement("afterend", panel); }
    else if (panel.previousElementSibling !== grid) grid.insertAdjacentElement("afterend", panel);
  };
  mountSequencer({ root: grid, tabs: steps, panes, interval: 3600, hoverZones: panel ? [panel] : [], viewTargets: panel ? [grid, panel] : [grid], onOpen: place });
  window.addEventListener("resize", () => place(), { passive: true });
}

/** The photo strip under the hero is the stories feed: every tile is a real piece of coverage, and links to it. */
function initStories(): void {
  const track = document.querySelector<HTMLElement>(".photo-ticker__track"); const ticker = track?.parentElement;
  const stories = storiesByDate(); if (!track || !ticker || stories.length < 4) return;
  const tile = (s: typeof stories[number]) => `<a class="photo-ticker__item" href="${s.url}" target="_blank" rel="noopener"><img src="${s.image}" alt="" loading="lazy"${s.pos ? ` style="object-position:${s.pos}"` : ""} /><span class="photo-ticker__cap"><b>${s.outlet} &middot; ${fmtDate(s.date)}${s.kind === "video" ? " &middot; video" : ""}</b><span>${s.title}</span></span></a>`;
  track.innerHTML = stories.map(tile).join("") + stories.map(tile).join("");
  ticker.classList.add("photo-ticker--stories");
}

/** The closer's sheet: grey until you reach it, then it lights up; a click spins it and throws sparks. */
function initSheet(): void {
  const sheet = document.querySelector<HTMLElement>(".close-band__sheet"); if (!sheet) return;
  const light = () => sheet.classList.add("is-lit");
  if ("IntersectionObserver" in window && !REDUCED) new IntersectionObserver(([e]) => { if (e.isIntersecting) setTimeout(light, 400); }, { threshold: 0.6 }).observe(sheet); else light();
  const colors = ["#22d3ee", "#ec4899", "#a855f7", "#f4f4f6", "#67e8f9"];
  sheet.addEventListener("click", () => {
    light(); if (REDUCED) return;
    sheet.classList.remove("is-spin"); void sheet.offsetWidth; sheet.classList.add("is-spin");
    for (let i = 0; i < 36; i++) {
      const sp = document.createElement("span"); sp.className = "spark" + (i % 3 === 0 ? " spark--gem" : "");
      const a = Math.random() * Math.PI * 2, r = 70 + Math.random() * 130;
      sp.style.setProperty("--dx", `${(Math.cos(a) * r).toFixed(1)}px`); sp.style.setProperty("--dy", `${(Math.sin(a) * r - 30).toFixed(1)}px`); sp.style.setProperty("--c", colors[i % colors.length]);
      sp.style.animationDuration = `${Math.round(650 + Math.random() * 550)}ms`; sp.style.animationDelay = `${Math.round(Math.random() * 80)}ms`;
      sheet.appendChild(sp); sp.addEventListener("animationend", () => sp.remove());
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initSheet();
  initStories();
  initHeroMark();
  initReveal();
  initCounters();
  initPipeline();
  mountFx();
});
