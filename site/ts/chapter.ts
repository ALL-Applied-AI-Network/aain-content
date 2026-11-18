/** chapter.ts — Start a Chapter: the chapter assembling in the hero, the proof counting up, the
 *  year map that opens each playbook beside it, the film, the kit, and reveals. */
import { mountFx } from "./fx";
import { getPlaybook, type PlaybookMeta } from "./playbook-metadata";
import { mountSequencer } from "./sequence";
import { mountWeeksFilm } from "./weeks-film";
import { MAP_ROWS, esc, playbookHref, renderYearMap } from "./year-map";

const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;

function initHero(): void {
  const canvas = document.getElementById("hero-particles") as HTMLCanvasElement | null;
  if (canvas && !REDUCED) import("./hero-particles").then((m) => m.initHeroParticles(canvas));
  initLiveChapter();
}

/* ── The tilt: the picture leans toward the pointer, anywhere over the hero ── */

const REST = { rx: 4, ry: -8 };

function initTilt(fit: HTMLElement, stage: HTMLElement): void {
  const hero = fit.closest<HTMLElement>(".sac-hero");
  const site = stage.querySelector<HTMLElement>(".sl__site");
  if (!hero || REDUCED || !matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  let target = { ...REST }, cur = { ...REST }, raf = 0;
  const paint = () => {
    cur.rx += (target.rx - cur.rx) * 0.09;
    cur.ry += (target.ry - cur.ry) * 0.09;
    fit.style.setProperty("--rx", `${cur.rx.toFixed(2)}deg`);
    fit.style.setProperty("--ry", `${cur.ry.toFixed(2)}deg`);
    raf = Math.abs(target.rx - cur.rx) + Math.abs(target.ry - cur.ry) > 0.02 ? requestAnimationFrame(paint) : 0;
  };
  const go = () => { if (!raf) raf = requestAnimationFrame(paint); };
  hero.addEventListener("pointermove", (e) => {
    if (innerWidth <= 900) return;
    const r = fit.getBoundingClientRect(), h = hero.getBoundingClientRect();
    // -1 to 1 from the picture's centre, measured against the hero's size, so the
    // whole hero is the range and every direction leans.
    // Each side is measured to its own edge, so the picture (right of centre) leans as
    // far right as it does left.
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const dx = e.clientX - cx, dy = e.clientY - cy;
    const x = Math.max(-1, Math.min(1, dx / Math.max(1, dx < 0 ? cx - h.left : h.right - cx)));
    const y = Math.max(-1, Math.min(1, dy / Math.max(1, dy < 0 ? cy - h.top : h.bottom - cy)));
    target = { rx: -y * 12, ry: x * 18 };
    if (site) {
      const sr = site.getBoundingClientRect();
      site.style.setProperty("--gx", `${(((e.clientX - sr.left) / sr.width) * 100).toFixed(1)}%`);
      site.style.setProperty("--gy", `${(((e.clientY - sr.top) / sr.height) * 100).toFixed(1)}%`);
    }
    go();
  }, { passive: true });
  hero.addEventListener("pointerleave", () => { target = { ...REST }; go(); });
}

/* ── The hero's picture: a chapter, assembling itself ─────────────────────
   Thirty minutes of setup told in about five seconds: the address types out,
   the site fills, the roster arrives, the first event gets its QR, a sponsor is
   invited, and the clock says Live. Type a school and it builds that one. */

const STAGE_W = 540;
const STEPS: Array<[string, number]> = [["s1", 0], ["s2", 1150], ["s3", 1700], ["s4", 2650], ["s5", 3600], ["s6", 4550]];

/** "MSOE" → msoe, "Purdue University" → purdueuniversity, a long name → its initials. */
function slugOf(school: string): string {
  const words = school.toLowerCase().replace(/&/g, " ").split(/[^a-z0-9]+/).filter((w) => w && !["the", "and", "at"].includes(w));
  const joined = words.join("");
  if (!joined) return "yourschool";
  return joined.length <= 20 ? joined : words.map((w) => w[0]).join("");
}

function initLiveChapter(): void {
  const stage = document.getElementById("sl");
  const fit = stage?.parentElement;
  if (!stage || !fit) return;
  const input = document.getElementById("sl-school") as HTMLInputElement | null;
  const url = stage.querySelector<HTMLElement>("[data-sl-url]");
  const clock = stage.querySelector<HTMLElement>("[data-sl-clock]");
  const names = stage.querySelectorAll<HTMLElement>("[data-sl-name], [data-sl-title]");

  initTilt(fit, stage);

  // Drawn at a fixed size, scaled to the column, so nothing inside reflows.
  const size = () => fit.style.setProperty("--s", String(Math.min(1.1, fit.clientWidth / STAGE_W)));
  size();
  new ResizeObserver(size).observe(fit);

  let timers: number[] = [];
  let raf = 0;
  const clear = () => { timers.forEach((t) => clearTimeout(t)); timers = []; cancelAnimationFrame(raf); };
  const school = () => (input?.value.trim() || "Your School");

  const play = () => {
    clear();
    const name = `${school()} AI Club`;
    names.forEach((n) => { n.textContent = name; });
    stage.classList.toggle("is-long", name.length > 24);
    const address = `${slugOf(input?.value.trim() ?? "")}.all-ai-network.org`;
    if (REDUCED) {
      STEPS.forEach(([c]) => stage.classList.add(c));
      if (url) url.textContent = address;
      if (clock) clock.textContent = "30:00";
      return;
    }
    stage.classList.remove(...STEPS.map(([c]) => c));
    void stage.offsetWidth; // restart the transitions from the empty state
    if (url) url.textContent = "";
    STEPS.forEach(([c, at]) => timers.push(window.setTimeout(() => stage.classList.add(c), at)));
    // the address types itself
    const typeFrom = 250, typeFor = 850;
    [...address].forEach((_, i) => timers.push(window.setTimeout(() => { if (url) url.textContent = address.slice(0, i + 1); }, typeFrom + (typeFor * i) / address.length)));
    // thirty minutes, on a clock that runs to the moment it goes live
    const end = STEPS[STEPS.length - 1][1], t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / end);
      const secs = Math.round(p * 30 * 60);
      if (clock) clock.textContent = `${String(Math.floor(secs / 60)).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}`;
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  };

  // It plays when it first comes into view, and again for each school typed.
  let started = false;
  const io = new IntersectionObserver((entries) => {
    if (!started && entries.some((e) => e.isIntersecting)) { started = true; io.disconnect(); play(); }
  }, { threshold: 0.35 });
  io.observe(stage);
  let wait = 0;
  input?.addEventListener("input", () => {
    clearTimeout(wait);
    // the name follows each keystroke; the rebuild waits for a pause in typing
    names.forEach((n) => { n.textContent = `${school()} AI Club`; });
    wait = window.setTimeout(() => { started = true; play(); }, 550);
  });
}

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

/** The founding chapter's numbers count up once, when they come into view. */
function initCounters(): void {
  const els = document.querySelectorAll<HTMLElement>("[data-count]");
  if (!els.length || !("IntersectionObserver" in window) || REDUCED) return;
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const el = e.target as HTMLElement;
      io.unobserve(el);
      const target = parseFloat(el.dataset.count || "0");
      const suf = el.dataset.suffix ?? "";
      const t0 = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / 1200), k = 1 - Math.pow(1 - p, 3);
        el.textContent = `${Math.round(target * k)}${suf}`;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  }, { threshold: 0.6 });
  els.forEach((el) => io.observe(el));
}

function initKit(): void {
  const root = document.getElementById("kit-seq"); if (!root) return;
  const tabs = Array.from(root.querySelectorAll<HTMLElement>(".kit__tab")); const panes = Array.from(root.querySelectorAll<HTMLElement>(".kit__pane"));
  mountSequencer({ root, tabs, panes, interval: 3600 });
}

/* ── The playbooks: the year map, and the open playbook beside it ──────────── */

const PLAY = `<svg viewBox="0 0 16 16" width="11" height="11" aria-hidden="true"><path d="M5 3.5v9l7-4.5z" fill="currentColor"/></svg>`;

function pane(p: PlaybookMeta, tabsId: string): string {
  const chapters = p.actions
    .map((a) => `<a class="yx__ch" href="${playbookHref(p.slug, a.anchor)}">${esc(a.label)}</a>`)
    .join("");
  const film = p.film ? `<span class="yx__film">${PLAY}${esc(p.film.runtime)} film</span>` : "";
  return `
    <article class="yx__pane" id="${tabsId}-${p.slug}" role="tabpanel" aria-labelledby="${tabsId}-tab-${p.slug}" style="--c:${p.accent}" hidden>
      <a class="yx__photo" href="${playbookHref(p.slug)}" tabindex="-1" aria-hidden="true">
        ${p.photo ? `<img src="${p.photo}" alt="" loading="lazy" decoding="async" />` : ""}
        <span class="yx__track">${esc(p.track)}</span>
      </a>
      <div class="yx__words">
        <p class="yx__name"><span class="yx__icon" aria-hidden="true">${p.icon}</span>${esc(p.title)}<span class="yx__meta">${p.minutes} min read${film}</span></p>
        <h3 class="yx__t">${esc(p.headline ?? p.tagline)}</h3>
        <p class="yx__sub">${esc(p.tagline)}</p>
        <div class="yx__chs"><span>Inside</span>${chapters}</div>
        <a class="btn btn--primary yx__go" href="${playbookHref(p.slug)}">Read the ${esc(p.title)} Playbook &rarr;</a>
      </div>
    </article>`;
}

function initExplorer(): void {
  const root = document.getElementById("yx");
  if (!root) return;
  const id = "yx";
  const books = MAP_ROWS.map((r) => getPlaybook(r.slug)).filter((p): p is PlaybookMeta => Boolean(p));
  root.innerHTML = `
    <div class="yx__map pbm__frame">${renderYearMap({ tabsId: id })}</div>
    <div class="yx__panes">${books.map((p) => pane(p, id)).join("")}</div>`;
  const tabs = Array.from(root.querySelectorAll<HTMLElement>(".pbm__row"));
  const panes = Array.from(root.querySelectorAll<HTMLElement>(".yx__pane"));
  // A deep link to a playbook (#yx-hackathons) opens it.
  const hash = location.hash.replace(/^#/, "");
  const start = Math.max(0, panes.findIndex((p) => p.id === hash));
  const seq = mountSequencer({ root, tabs, panes, interval: 5200, minWidth: 1000, viewTargets: [root] });
  if (start) { seq.stop(); seq.open(start); }
  // When the panel sits under the map (narrow screens), a tap brings it into view.
  tabs.forEach((t, i) => t.addEventListener("click", () => {
    if (innerWidth >= 1100) return;
    const r = panes[i].getBoundingClientRect();
    if (r.top > innerHeight * 0.6 || r.bottom < 80) panes[i].scrollIntoView({ behavior: REDUCED ? "auto" : "smooth", block: "start" });
  }));
}

document.addEventListener("DOMContentLoaded", () => {
  initHero();
  initExplorer();
  initReveal();
  initCounters();
  initKit();
  mountWeeksFilm();
  mountFx();
});
