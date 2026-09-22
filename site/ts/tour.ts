/**
 * tour.ts — the dashboard tour that sits under the doors in the close band.
 *
 * One <video>, two films, no control bar on the first one:
 *
 *   • The 33-second cut is silent and chromeless, so it reads as a moving
 *     screenshot rather than a media player. Its source is attached only when
 *     the frame scrolls into view (preload="none" + poster in the markup), so
 *     a visitor who never reaches the bottom of the page downloads no video.
 *   • It plays once and stops on the film's own baked end card. No loop.
 *   • The whole frame is a link to the mp4. Clicking or keying it swaps the
 *     same element to the full 1:27 walkthrough instead — from 0:00, unmuted,
 *     with the browser's controls, because that one is watched deliberately.
 *   • prefers-reduced-motion: reduce never autoplays; the poster and the
 *     cue over it stay, so there is still a way in.
 *
 * Without JS nothing is bound, so the frame is a plain <a> to the full mp4
 * over the poster, and the line under it links to the same file: both still
 * work, neither is a dead control.
 */

export function mountTour(): void {
  const root = document.querySelector<HTMLElement>("[data-tour]");
  if (!root) return;
  const video = root.querySelector<HTMLVideoElement>("video");
  if (!video) return;
  const hit = root.querySelector<HTMLElement>("[data-tour-hit]");
  const previewSrc = video.dataset.previewSrc;
  const fullSrc = video.dataset.fullSrc;
  if (!previewSrc || !fullSrc) return;

  let isFull = false;
  let previewStarted = false;

  /** Attach the preview and run it. Called once, from the observer. */
  const startPreview = (): void => {
    if (previewStarted || isFull) return;
    previewStarted = true;
    video.src = previewSrc;
    video.load();
    // is-playing (and only it) takes the cue off the picture. A refused
    // play() — iOS Low Power Mode, a strict autoplay policy — therefore
    // leaves the poster up with the cue still on it, which is the whole
    // point: never a dead frame.
    void video.play().then(() => root.classList.add("is-playing")).catch(() => {});
  };

  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
  if (!reduced) {
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        startPreview();
      }, { threshold: 0.3 });
      io.observe(root);
    } else {
      startPreview();
    }
  }

  /** Swap to the full walkthrough and play it from the top, with sound and
   *  controls. Only ever off a real click or keypress, so autoplay policy
   *  allows the unmuted start. */
  const playFull = (ev: Event): void => {
    ev.preventDefault();
    if (!isFull) {
      isFull = true;
      previewStarted = true;
      root.classList.remove("is-resting", "is-playing");
      root.classList.add("is-full");
      hit?.setAttribute("hidden", "");
      video.src = fullSrc; // an explicit src replaces whatever is playing
      if (video.dataset.fullPoster) video.poster = video.dataset.fullPoster;
      if (video.dataset.fullLabel) video.setAttribute("aria-label", video.dataset.fullLabel);
      video.removeAttribute("aria-hidden");
      video.muted = false;
      video.removeAttribute("muted");
      video.controls = true;
      video.load(); // a fresh load starts at 0:00
      // The element that was focused is the one just hidden; without this the
      // keyboard lands on <body> and the control bar of an 87-second film is
      // behind the user.
      video.focus();
    } else {
      video.currentTime = 0;
    }
    void video.play().catch(() => { video.controls = true; });
  };

  root.querySelectorAll<HTMLElement>("[data-tour-full]").forEach((el) => el.addEventListener("click", playFull));
  // The frame is a link, so Enter is free; Space scrolls a link, and this one
  // behaves like a button, so take Space on the frame only — the quiet text
  // link under it stays an ordinary link.
  hit?.addEventListener("keydown", (ev) => {
    if (ev.key === " " || ev.key === "Spacebar") playFull(ev);
  });

  video.addEventListener("ended", () => {
    if (isFull) return;
    root.classList.remove("is-playing");
    root.classList.add("is-resting");
  });
}
