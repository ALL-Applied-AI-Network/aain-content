/**
 * home.ts — the landing page as one story.
 * Mounts the hero mark (untouched), the film that plays when it is on screen, the pipeline tabs, the reveals,
 * the counters, and the effects (page aurora, the flood, the rail, tilt).
 */
import { mountFx } from "./fx";

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

/** The film plays, muted, whenever most of it is on screen; the pill turns the sound on. */
function initFilm(): void {
  const video = document.getElementById("film-video") as HTMLVideoElement | null;
  const sound = document.querySelector<HTMLButtonElement>("[data-sound]");
  if (!video) return;
  video.muted = true;
  const play = () => { video.play().catch(() => { video.controls = true; }); };
  if ("IntersectionObserver" in window && !REDUCED) {
    new IntersectionObserver(([e]) => { if (e.isIntersecting) play(); else video.pause(); }, { threshold: 0.5 }).observe(video);
  } else { video.controls = true; }
  video.addEventListener("click", () => { if (video.paused) play(); else video.pause(); });
  if (sound) sound.addEventListener("click", () => {
    video.muted = !video.muted;
    if (!video.muted) { if (video.currentTime < 2) video.currentTime = 0; play(); }
    sound.textContent = video.muted ? "Turn sound on" : "Sound on";
    sound.classList.toggle("is-on", !video.muted);
    sound.setAttribute("aria-pressed", String(!video.muted));
  });
}

/** The pipeline: one step open at a time, its detail and its call to action below. */
function initPipeline(): void {
  const steps = Array.from(document.querySelectorAll<HTMLButtonElement>(".pipe__step"));
  const details = Array.from(document.querySelectorAll<HTMLElement>("[data-detail]"));
  const ctas = Array.from(document.querySelectorAll<HTMLElement>("[data-detail-cta]"));
  if (!steps.length) return;
  const panel = document.getElementById("pipe-detail"); const grid = steps[0].parentElement;
  const open = (i: number) => {
    steps.forEach((s, j) => { s.classList.toggle("is-open", j === i); s.setAttribute("aria-selected", String(j === i)); });
    details.forEach((d) => { d.hidden = d.dataset.detail !== String(i); });
    ctas.forEach((c) => { c.hidden = c.dataset.detailCta !== String(i); });
    // on a phone the cards stack, so the panel moves to sit under the open card
    if (panel && grid) { if (innerWidth < 760) steps[i].insertAdjacentElement("afterend", panel); else if (panel.previousElementSibling !== grid) grid.insertAdjacentElement("afterend", panel); }
  };
  window.addEventListener("resize", () => { const cur = steps.findIndex((s) => s.classList.contains("is-open")); if (cur >= 0) open(cur); });
  steps.forEach((s, i) => {
    s.addEventListener("click", () => open(i));
    s.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") { const n = (i + 1) % steps.length; open(n); steps[n].focus(); }
      if (e.key === "ArrowLeft") { const n = (i + steps.length - 1) % steps.length; open(n); steps[n].focus(); }
    });
  });
  open(0);
}

document.addEventListener("DOMContentLoaded", () => {
  initHeroMark();
  initReveal();
  initCounters();
  initFilm();
  initPipeline();
  mountFx();
});
