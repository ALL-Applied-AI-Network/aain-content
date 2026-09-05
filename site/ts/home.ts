/**
 * home.ts — the landing page as one story.
 * Mounts the hero mark (untouched), the pipeline tabs, the reveals, the counters, and the effects (the deck, the rail, tilt).
 */
import { mountFx } from "./fx";
import { storiesByDate, fmtDate } from "./stories";

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

/** The pipeline: one step open at a time, its detail and its call to action below.
 *  Once the section is on screen the steps sequence on their own (a bar fills on the open card); the first click or
 *  key press hands control to the reader. Hovering pauses it. Phones, where the cards stack, stay manual. */
function initPipeline(): void {
  const steps = Array.from(document.querySelectorAll<HTMLButtonElement>(".pipe__step"));
  const details = Array.from(document.querySelectorAll<HTMLElement>("[data-detail]"));
  const ctas = Array.from(document.querySelectorAll<HTMLElement>("[data-detail-cta]"));
  if (!steps.length) return;
  const panel = document.getElementById("pipe-detail"); const grid = steps[0].parentElement; const section = document.getElementById("how");
  const INTERVAL = 3600; // ~1.3s of entrance, then the cards hold before the next step
  let cur = 0, auto = !REDUCED && innerWidth >= 760 && "IntersectionObserver" in window, timer = 0, deadline = 0, remaining = INTERVAL;
  steps.forEach((s) => { const bar = document.createElement("span"); bar.className = "pipe__bar"; bar.setAttribute("aria-hidden", "true"); s.appendChild(bar); });
  document.documentElement.style.setProperty("--pipe-interval", INTERVAL + "ms");
  const open = (i: number) => {
    cur = i;
    steps.forEach((s, j) => { s.classList.toggle("is-open", j === i); s.setAttribute("aria-selected", String(j === i)); });
    details.forEach((d) => { d.hidden = d.dataset.detail !== String(i); });
    ctas.forEach((c) => { c.hidden = c.dataset.detailCta !== String(i); });
    // on a phone the cards stack, so the panel moves to sit under the open card
    if (panel && grid) { if (innerWidth < 760) { if (panel.previousElementSibling !== steps[i]) steps[i].insertAdjacentElement("afterend", panel); } else if (panel.previousElementSibling !== grid) grid.insertAdjacentElement("afterend", panel); }
  };
  const restartBar = () => { steps.forEach((s) => s.classList.remove("is-timing")); void steps[cur].offsetWidth; steps[cur].classList.add("is-timing"); };
  const arm = (ms: number) => { deadline = performance.now() + ms; timer = window.setTimeout(() => { timer = 0; open((cur + 1) % steps.length); restartBar(); arm(INTERVAL); }, ms); };
  const pause = () => { if (!timer) return; clearTimeout(timer); timer = 0; remaining = Math.max(400, deadline - performance.now()); grid?.classList.add("is-paused"); };
  const resume = () => { if (!auto || timer) return; grid?.classList.remove("is-paused"); if (!grid?.classList.contains("is-auto")) { grid?.classList.add("is-auto"); restartBar(); remaining = INTERVAL; } arm(remaining); };
  const stop = () => { auto = false; clearTimeout(timer); timer = 0; grid?.classList.remove("is-auto", "is-paused"); steps.forEach((s) => s.classList.remove("is-timing")); };
  if (auto && section && grid) {
    new IntersectionObserver(([e]) => { if (e.isIntersecting) resume(); else pause(); }, { threshold: 0.35 }).observe(section);
    grid.addEventListener("mouseenter", pause); grid.addEventListener("mouseleave", resume);
    panel?.addEventListener("mouseenter", pause); panel?.addEventListener("mouseleave", resume);
  }
  window.addEventListener("resize", () => { if (innerWidth < 760) stop(); open(cur); });
  steps.forEach((s, i) => {
    s.addEventListener("click", () => { stop(); open(i); });
    s.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") { stop(); const n = (i + 1) % steps.length; open(n); steps[n].focus(); }
      if (e.key === "ArrowLeft") { stop(); const n = (i + steps.length - 1) % steps.length; open(n); steps[n].focus(); }
    });
  });
  open(0);
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
