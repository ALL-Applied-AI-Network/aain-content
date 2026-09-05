/** sequence.ts — one thing open at a time, advancing on its own until someone touches it.
 *  Drives the home pipeline, Start a Chapter's kit and The Network's stories.
 *
 *  Two rules learned the hard way:
 *   · The clock is a rAF loop over a single `running()` predicate, so there is no paused state to get stuck in.
 *   · Hover is read from real pointer movement, never from mouseenter: a pane that grows under a still cursor
 *     fires mouseenter with no matching mouseleave, which used to stall the sequence for good.
 */
const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;

export type SequencerOptions = {
  root: HTMLElement;            // gets .is-auto; hovering it pauses
  tabs: HTMLElement[];          // get .is-open and a progress bar
  panes?: HTMLElement[];        // hidden except the open one, matched by index
  interval?: number;            // ms per step
  minWidth?: number;            // below this viewport width it stays manual
  hoverZones?: HTMLElement[];   // extra elements that count as "the reader is here"
  viewTargets?: HTMLElement[];  // any one of these on screen keeps it running (defaults to root)
  onOpen?: (i: number) => void;
};

export function mountSequencer(o: SequencerOptions): { open: (i: number) => void; stop: () => void } {
  const { root, tabs, panes = [] } = o;
  if (!tabs.length) return { open: () => {}, stop: () => {} };
  const INTERVAL = o.interval ?? 3200, MIN_W = o.minWidth ?? 760;
  const zones = [root, ...(o.hoverZones ?? [])];
  const bars = tabs.map((t) => {
    const b = document.createElement("span"); b.className = "seq__bar"; b.setAttribute("aria-hidden", "true"); t.appendChild(b); return b;
  });
  let cur = 0, elapsed = 0, last = 0, raf = 0;
  const supported = !REDUCED && "IntersectionObserver" in window;
  let manual = false;                      // a click or an arrow key: deliberate, and permanent
  let narrow = innerWidth < MIN_W;         // too small to autoplay, but only until it is widened again
  let inView = false, hovering = false;

  const setBar = (i: number, p: number) => bars[i].style.setProperty("--p", p.toFixed(3));
  const open = (i: number) => {
    cur = i; elapsed = 0;
    tabs.forEach((t, j) => { t.classList.toggle("is-open", j === i); if (t.getAttribute("role") === "tab") t.setAttribute("aria-selected", String(j === i)); });
    panes.forEach((p, j) => { p.hidden = j !== i; });
    bars.forEach((_, j) => setBar(j, 0));
    o.onOpen?.(i);
  };
  const idle = () => { root.classList.remove("is-auto"); bars.forEach((_, j) => setBar(j, 0)); };
  const stop = () => { manual = true; if (raf) cancelAnimationFrame(raf); raf = 0; idle(); };
  /** The one question asked every frame. Nothing else decides whether it advances. */
  const running = () => supported && !manual && !narrow && inView && !hovering && !document.hidden;
  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    const dt = last ? Math.min(now - last, 250) : 0; last = now;   // clamped well under INTERVAL so a slow frame can never skip a step
    if (!running()) return;
    if (!root.classList.contains("is-auto")) { root.classList.add("is-auto"); elapsed = 0; }
    elapsed += dt;
    if (elapsed >= INTERVAL) open((cur + 1) % tabs.length);        // open() resets the clock
    setBar(cur, Math.min(1, elapsed / INTERVAL));
  };

  if (supported) {
    // in view if ANY watched element is on screen: the tab strip scrolls off while the open pane is still being read
    const targets = o.viewTargets?.length ? o.viewTargets : [root];
    const showing = new Set<Element>();
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) { if (e.isIntersecting) showing.add(e.target); else showing.delete(e.target); }
      inView = showing.size > 0;
    }, { threshold: 0 });
    targets.forEach((t) => io.observe(t));
    // real movement only: a pane growing under a still cursor must not count as hovering
    window.addEventListener("mousemove", (e) => {
      const over = zones.some((z) => z.contains(e.target as Node));
      if (over !== hovering) hovering = over;
    }, { passive: true });
    document.addEventListener("visibilitychange", () => { last = 0; });
    raf = requestAnimationFrame(frame);
  }
  // narrowing is reversible: widen the window and it comes back, unlike a click
  window.addEventListener("resize", () => {
    const n = innerWidth < MIN_W; if (n === narrow) return;
    narrow = n; if (narrow) idle();
  }, { passive: true });

  tabs.forEach((t, i) => {
    t.addEventListener("click", () => { stop(); open(i); });
    t.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") { stop(); const n = (i + 1) % tabs.length; open(n); tabs[n].focus(); }
      if (e.key === "ArrowLeft") { stop(); const n = (i + tabs.length - 1) % tabs.length; open(n); tabs[n].focus(); }
    });
  });
  open(0);
  return { open, stop };
}
