/** page.ts — reveals, counters and the shared effects for any page that is not the home page. */
import { mountFx } from "./fx";
const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
function initReveal(): void {
  const els = document.querySelectorAll<HTMLElement>(".rv, .rv-group");
  if (!els.length) return;
  if (!("IntersectionObserver" in window) || REDUCED) { els.forEach((el) => el.classList.add("in")); return; }
  document.documentElement.classList.add("js-rv");
  const io = new IntersectionObserver((entries) => { for (const e of entries) if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
  els.forEach((el) => io.observe(el));
}
function initCounters(): void {
  const els = document.querySelectorAll<HTMLElement>("[data-count]");
  if (!els.length || !("IntersectionObserver" in window)) return;
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue; const el = e.target as HTMLElement; io.unobserve(el);
      const target = parseFloat(el.dataset.count || "0"); const m = (el.textContent || "").match(/^([^\d]*)(\d[\d,\.]*)(.*)$/); const pre = m ? m[1] : "", suf = m ? m[3] : "";
      const t0 = performance.now(); const tick = (now: number) => { const p = Math.min(1, (now - t0) / 1100), k = 1 - Math.pow(1 - p, 3); el.textContent = pre + Math.round(target * k).toLocaleString() + suf; if (p < 1) requestAnimationFrame(tick); }; requestAnimationFrame(tick);
    }
  }, { threshold: 0.6 });
  els.forEach((el) => io.observe(el));
}
/** A timeline fills from the top as it scrolls in; each milestone lights as the fill line passes it. */
function mountTimeline(): void {
  document.querySelectorAll<HTMLElement>(".timeline").forEach((tl) => {
    const items = Array.from(tl.querySelectorAll<HTMLElement>("li"));
    if (REDUCED) { tl.style.setProperty("--fill", "100%"); items.forEach((li) => li.classList.add("is-lit")); return; }
    const update = () => {
      const r = tl.getBoundingClientRect(); const line = innerHeight * 0.72;
      tl.style.setProperty("--fill", (Math.max(0, Math.min(1, (line - r.top) / r.height)) * 100).toFixed(1) + "%");
      items.forEach((li) => li.classList.toggle("is-lit", li.getBoundingClientRect().top + 12 < line));
    };
    window.addEventListener("scroll", update, { passive: true }); window.addEventListener("resize", update); update();
  });
}

document.addEventListener("DOMContentLoaded", () => { initReveal(); initCounters(); mountTimeline(); mountFx(); });
