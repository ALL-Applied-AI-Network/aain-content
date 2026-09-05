/** chapter.ts — Start a Chapter: the page mark + particles in the hero, reveals, and the shared effects. */
import { mountFx } from "./fx";
import { mountSequencer } from "./sequence";

function initHero(): void {
  const hero3d = document.getElementById("hero-3d");
  if (hero3d) import("./hero-mark").then((m) => m.initHeroMark(hero3d));
  const canvas = document.getElementById("hero-particles") as HTMLCanvasElement | null;
  if (canvas && !matchMedia("(prefers-reduced-motion: reduce)").matches) import("./hero-particles").then((m) => m.initHeroParticles(canvas));
}

function initReveal(): void {
  const els = document.querySelectorAll<HTMLElement>(".rv, .rv-group");
  if (!els.length) return;
  if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) { els.forEach((el) => el.classList.add("in")); return; }
  document.documentElement.classList.add("js-rv");
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
  els.forEach((el) => io.observe(el));
}

function initKit(): void {
  const root = document.getElementById("kit-seq"); if (!root) return;
  const tabs = Array.from(root.querySelectorAll<HTMLElement>(".kit__tab")); const panes = Array.from(root.querySelectorAll<HTMLElement>(".kit__pane"));
  mountSequencer({ root, tabs, panes, interval: 3600 });
}

document.addEventListener("DOMContentLoaded", () => { initHero(); initReveal(); initKit(); mountFx(); });
