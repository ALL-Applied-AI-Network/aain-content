/**
 * home.ts — the landing page.
 * Mounts the hero mark (untouched), the section effects, scroll reveals, the stat counters and the film dialog.
 * The page no longer depends on tree.json or manifest.json; it is a marketing page, not a content index.
 */
import { mountFx } from "./fx";

function initHeroMark(): void {
  const hero3d = document.getElementById("hero-3d");
  if (hero3d) import("./hero-mark").then((m) => m.initHeroMark(hero3d));
}

/** Scroll reveals: html.js-rv gates the hidden state so no-JS (and crawlers) see everything. */
function initReveal(): void {
  const els = document.querySelectorAll<HTMLElement>(".rv, .rv-group");
  if (!els.length) return;
  if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) {
    els.forEach((el) => el.classList.add("in"));
    return;
  }
  document.documentElement.classList.add("js-rv");
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
  els.forEach((el) => io.observe(el));
}

/** Count-up for any element with data-count="244" (prefix/suffix kept from its text). */
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

/** The 70-second film, in a <dialog>; the video only loads when opened. */
function initFilm(): void {
  const dlg = document.getElementById("film") as HTMLDialogElement | null;
  const video = dlg?.querySelector("video") as HTMLVideoElement | null;
  if (!dlg || !video) return;
  const open = () => {
    if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
    if (!video.getAttribute("src")) video.setAttribute("src", video.dataset.src || "");
    video.play().catch(() => {});
  };
  const close = () => { video.pause(); if (dlg.open) dlg.close(); };
  document.querySelectorAll("[data-film-open]").forEach((b) => b.addEventListener("click", (e) => { e.preventDefault(); open(); }));
  dlg.querySelector("[data-film-close]")?.addEventListener("click", close);
  dlg.addEventListener("click", (e) => { if (e.target === dlg) close(); });
  dlg.addEventListener("close", () => video.pause());
  video.addEventListener("ended", close);
}

/** The formula spine highlights the step whose card is nearest the middle of the viewport. */
function initSpine(): void {
  const steps = document.querySelectorAll<HTMLElement>(".formula__step");
  const marks = document.querySelectorAll<HTMLElement>(".formula__spine span");
  if (!steps.length || steps.length !== marks.length || !("IntersectionObserver" in window)) return;
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const i = Array.from(steps).indexOf(e.target as HTMLElement);
      marks.forEach((m, j) => m.classList.toggle("is-on", j <= i));
    }
  }, { threshold: 0.6 });
  steps.forEach((s) => io.observe(s));
}

/** The Students lane lists the chapters that exist today, from the same public endpoint the Chapters page uses. */
async function initChapters(): Promise<void> {
  const host = document.getElementById("chapters-strip"); if (!host) return;
  try {
    const res = await fetch("https://dashboard.all-ai-network.org/api/public/network-stats", { headers: { Accept: "application/json" } });
    if (!res.ok) return;
    const data = (await res.json()) as { chapters?: { name?: string; university?: string; members_count?: number; events_90d?: number }[] };
    const all = (data.chapters || []).filter((c) => c && (c.university || c.name));
    if (!all.length) return;
    // the front door shows chapters with people in them, one per university, biggest first
    const seen = new Set<string>();
    const looksReal = (c: { name?: string; university?: string }) => { const n = (c.university || c.name || "").trim(); return n.length >= 4 && /[A-Z]/.test(n); };
    const real = all.filter((c) => looksReal(c) && ((c.members_count ?? 0) >= 10 || (c.events_90d ?? 0) >= 2))
      .sort((a, b) => (b.members_count ?? 0) - (a.members_count ?? 0))
      .filter((c) => { const k = (c.university || c.name || "").trim().toLowerCase(); if (!k || seen.has(k)) return false; seen.add(k); return true; });
    if (!real.length) return;
    const chip = (t: string, cls = "") => { const s = document.createElement("span"); s.textContent = t; if (cls) s.className = cls; return s; };
    host.replaceChildren(chip(`${all.length} chapter${all.length === 1 ? "" : "s"} on the network`, "is-count"), ...real.slice(0, 6).map((c) => chip(c.university || c.name || "")));
  } catch { /* the lane reads fine without it */ }
}

document.addEventListener("DOMContentLoaded", () => {
  initChapters();
  initHeroMark();
  initReveal();
  initCounters();
  initFilm();
  initSpine();
  mountFx();
});
