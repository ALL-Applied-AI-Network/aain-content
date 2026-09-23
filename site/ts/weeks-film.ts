/**
 * weeks-film.ts — Start a Chapter's "first five weeks" section: six week cards
 * over the Your First Five Weeks film, which plays itself with no control bar.
 *
 * The film is the clock. Each card is a chapter whose start ([data-from],
 * seconds) is the film's own section start from its 104 BPM beat table
 * (collateral/first-five-weeks/build.py). Whichever chapter holds
 * video.currentTime is lit and its .seq__bar fills. This is deliberately not
 * mountSequencer: the sequencer owns an interval clock, and a second clock
 * beside the video's would drift. Nothing here advances on its own; it only
 * reads the video.
 *
 *   • Chromeless, muted, playsinline, preload="none": no video bytes until the
 *     frame scrolls into view.
 *   • Starts the first time the frame is 35% on screen; pauses while it is off
 *     screen or the tab is hidden, and picks up where it left off. Plays once,
 *     no loop — the film's baked end card is the resting frame.
 *   • Clicking a card jumps the film to that week and plays. That is a real
 *     gesture, so it plays even under prefers-reduced-motion, which never
 *     autoplays.
 *   • The frame itself is a pause/play toggle: the one control WCAG 2.2.2 asks
 *     of moving content longer than five seconds. There is no scrubber, so the
 *     timing cannot be dragged around.
 *   • One predicate decides playback (shouldPlay). There is no paused state to
 *     get stuck in, so a missed event cannot strand it (see autoplay-sequencer).
 *
 * Without JS the video keeps its native controls and every card is a link to
 * the mp4 at that week (a #t= media fragment): nothing is a dead control.
 */

export function mountWeeksFilm(): void {
  const root = document.querySelector<HTMLElement>("[data-weeks-film]");
  if (!root) return;
  const video = root.querySelector<HTMLVideoElement>("video");
  const hit = root.querySelector<HTMLButtonElement>("[data-weeks-hit]");
  const pill = root.querySelector<HTMLElement>("[data-weeks-pill]");
  const cards = Array.from(root.querySelectorAll<HTMLAnchorElement>("a[data-from]"));
  if (!video || !hit || !pill || !cards.length) return;

  const from = cards.map((c) => Number(c.dataset.from));
  const arcFrom = Number(root.dataset.arcFrom); // the closing table: every week at once
  const arcTo = Number(root.dataset.arcTo);
  const bars = cards.map((c) => c.querySelector<HTMLElement>(".seq__bar"));
  const ALL = cards.length;

  // Chromeless from here on: the native bar goes, the frame becomes the toggle.
  video.controls = false;
  video.muted = true;
  hit.hidden = false;

  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
  let started = false;    // has playback ever been asked for, by scrolling in or a click
  let userPaused = false; // the reader paused it with the frame toggle
  let inView = false;
  let pendingSeek: number | null = null;
  let active = -2;        // -1 no chapter, 0..5 a week, ALL the closing table

  const chapterEnd = (i: number): number => (i === ALL - 1 ? arcFrom : from[i + 1]);
  const chapterAt = (t: number): number => {
    if (t >= arcFrom && t < arcTo) return ALL;
    for (let i = 0; i < ALL; i++) if (t >= from[i] && t < chapterEnd(i)) return i;
    return -1;
  };

  const paint = (): void => {
    const t = pendingSeek ?? video.currentTime;
    const i = chapterAt(t);
    if (i !== active) {
      active = i;
      cards.forEach((c, k) => {
        const on = k === i;
        c.classList.toggle("is-open", on);
        if (on) c.setAttribute("aria-current", "step");
        else c.removeAttribute("aria-current");
        bars[k]?.style.setProperty("--p", "0");
      });
      root.classList.toggle("is-arc", i === ALL);
    }
    if (i >= 0 && i < ALL) {
      const p = (t - from[i]) / (chapterEnd(i) - from[i]);
      bars[i]?.style.setProperty("--p", String(Math.min(1, Math.max(0, p))));
    }
  };

  const label = (): void => {
    const [word, name] = video.ended ? ["Watch again", "Watch the film again"]
      : video.paused ? ["Play", "Play the film"] : ["Pause", "Pause the film"];
    pill.textContent = word;
    hit.setAttribute("aria-label", name);
    root.classList.toggle("is-ended", video.ended);
  };

  /** A pause() that interrupts a pending play() rejects it with AbortError;
   *  that is not the browser refusing autoplay, so it must not mark it so. */
  const refused = (err: unknown): void => {
    if ((err as DOMException | undefined)?.name !== "AbortError") root.classList.add("is-refused");
  };

  // Frames, not timeupdate (~4 Hz), drive the bar while it plays.
  let raf = 0;
  const loop = (): void => {
    paint();
    raf = video.paused ? 0 : requestAnimationFrame(loop);
  };

  const shouldPlay = (): boolean =>
    started && !userPaused && !video.ended && inView && !document.hidden;

  const sync = (): void => {
    if (shouldPlay()) {
      if (video.paused) void video.play().catch(refused);
    } else if (!video.paused) {
      video.pause();
    }
    label();
  };

  /** Seek, even before metadata exists: with preload="none" the first click
   *  arrives at readyState 0, so remember the target until the film knows its
   *  own length. */
  const seek = (t: number): void => {
    if (video.readyState >= 1) {
      pendingSeek = null;
      video.currentTime = t;
    } else {
      pendingSeek = t;
    }
  };

  video.addEventListener("loadedmetadata", () => {
    if (pendingSeek !== null) {
      video.currentTime = pendingSeek;
      pendingSeek = null;
    }
  });
  video.addEventListener("play", () => {
    root.classList.add("is-playing", "is-auto");
    root.classList.remove("is-refused");
    label();
    if (!raf) raf = requestAnimationFrame(loop);
  });
  video.addEventListener("pause", () => {
    root.classList.remove("is-playing");
    paint();
    label();
  });
  video.addEventListener("seeked", paint);
  video.addEventListener("timeupdate", () => { if (!raf) paint(); });
  video.addEventListener("ended", () => {
    root.classList.remove("is-playing", "is-auto");
    paint();
    label();
  });

  // Cards: jump to that week and play.
  const navBottom = (): number => document.querySelector(".nav")?.getBoundingClientRect().bottom ?? 0;
  /** Where the film actually is, for when the observer cannot be trusted to
   *  have spoken (a scroll we started and the reader cut short). */
  const recheck = (): void => {
    const q = video.getBoundingClientRect();
    inView = q.bottom > 0 && q.top < window.innerHeight;
    sync();
  };

  cards.forEach((card, k) => {
    card.addEventListener("click", (ev) => {
      // Cmd/Ctrl/Shift/Alt-click keep their link meaning (the mp4 at this week).
      if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey || ev.button !== 0) return;
      ev.preventDefault();
      started = true;
      userPaused = false;
      seek(from[k]);
      paint();
      // Keep the lit card AND the film in view: bring the whole block up under
      // the nav (.weeks-film has scroll-margin-top), rather than just the film,
      // which pushed the cards off the top on laptop-height screens.
      const r = video.getBoundingClientRect();
      if (r.top < navBottom() || r.bottom > window.innerHeight) {
        // "auto" would inherit html { scroll-behavior: smooth }, so reduced
        // motion has to ask for "instant" explicitly.
        root.scrollIntoView({ behavior: reduced ? "instant" : "smooth", block: "start" });
        if ("onscrollend" in window) window.addEventListener("scrollend", recheck, { once: true });
        window.setTimeout(recheck, 1200);
      }
      // Assume it is arriving on screen so this click can play it now (a real
      // gesture); recheck() corrects that if the scroll never got there.
      inView = true;
      void video.play().catch(refused);
      label();
    });
  });

  // The frame: pause, resume, or watch again.
  hit.addEventListener("click", () => {
    if (video.ended) {
      seek(0);
      userPaused = false;
    } else if (!started || video.paused) {
      userPaused = false;
    } else {
      userPaused = true;
    }
    started = true;
    inView = true;
    if (!userPaused) void video.play().catch(refused);
    sync();
  });

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      const e = entries[entries.length - 1];
      inView = e.isIntersecting;
      if (!started && !reduced && e.intersectionRatio >= 0.35) started = true;
      sync();
    }, { threshold: [0, 0.35] });
    io.observe(video);
  } else {
    started = !reduced;
    inView = true;
    sync();
  }
  document.addEventListener("visibilitychange", sync);

  paint();
  label();
}
