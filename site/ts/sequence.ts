/** sequence.ts — one thing open at a time, advancing on its own until someone touches it.
 *  Used by Start a Chapter's kit and The Network's stories. The home pipeline keeps its own copy. */
const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;

export type SequencerOptions = {
  root: HTMLElement;              // watched for visibility; hovering it pauses
  tabs: HTMLElement[];            // get .is-open / .is-timing and a bar
  panes?: HTMLElement[];          // hidden except the open one, matched by index
  interval?: number;              // ms per step
  minWidth?: number;              // no autoplay below this viewport width
  onOpen?: (i: number) => void;
};

export function mountSequencer(o: SequencerOptions): { open: (i: number) => void; stop: () => void } {
  const { root, tabs, panes = [] } = o; const INTERVAL = o.interval ?? 3200;
  let cur = 0, auto = !REDUCED && innerWidth >= (o.minWidth ?? 760) && "IntersectionObserver" in window, timer = 0, deadline = 0, remaining = INTERVAL;
  tabs.forEach((t) => { const bar = document.createElement("span"); bar.className = "seq__bar"; bar.setAttribute("aria-hidden", "true"); t.appendChild(bar); });
  root.style.setProperty("--seq-interval", INTERVAL + "ms");
  const open = (i: number) => {
    cur = i;
    tabs.forEach((t, j) => { t.classList.toggle("is-open", j === i); if (t.getAttribute("role") === "tab") t.setAttribute("aria-selected", String(j === i)); });
    panes.forEach((p, j) => { p.hidden = j !== i; });
    o.onOpen?.(i);
  };
  const restartBar = () => { tabs.forEach((t) => t.classList.remove("is-timing")); void tabs[cur].offsetWidth; tabs[cur].classList.add("is-timing"); };
  const arm = (ms: number) => { deadline = performance.now() + ms; timer = window.setTimeout(() => { timer = 0; open((cur + 1) % tabs.length); restartBar(); arm(INTERVAL); }, ms); };
  const pause = () => { if (!timer) return; clearTimeout(timer); timer = 0; remaining = Math.max(400, deadline - performance.now()); root.classList.add("is-paused"); };
  const resume = () => { if (!auto || timer) return; root.classList.remove("is-paused"); if (!root.classList.contains("is-auto")) { root.classList.add("is-auto"); restartBar(); remaining = INTERVAL; } arm(remaining); };
  const stop = () => { auto = false; clearTimeout(timer); timer = 0; root.classList.remove("is-auto", "is-paused"); tabs.forEach((t) => t.classList.remove("is-timing")); };
  if (auto) {
    new IntersectionObserver(([e]) => { if (e.isIntersecting) resume(); else pause(); }, { threshold: 0.3 }).observe(root);
    root.addEventListener("mouseenter", pause); root.addEventListener("mouseleave", resume);
  }
  window.addEventListener("resize", () => { if (innerWidth < (o.minWidth ?? 760)) stop(); });
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
