/**
 * tour.ts — the dashboard tour that sits under the doors in the close band.
 *
 * One <video>, no control bar until someone asks for it:
 *
 *   • The preview is silent and chromeless, so it reads as a moving
 *     screenshot rather than a media player. Its source is attached only when
 *     the frame scrolls into view (preload="none" + poster in the markup), so
 *     a visitor who never reaches the bottom of the page downloads no video.
 *   • It plays once and stops on the film's own baked end card. No loop.
 *   • The whole frame is a link to the mp4. Clicking or keying it gives the
 *     same element the browser's controls (unmuted). If data-full-src names a
 *     different file it swaps to that one from 0:00; since 2026-11 both are
 *     the one captioned 1:25 film, so the viewer keeps their place.
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

  // When the preview and the full film are one file (a silent, captioned film
  // since 2026-11), "full" only means "with controls": a click mid-film keeps
  // the viewer's place instead of reloading the same file from 0:00.
  const sameFilm = previewSrc === fullSrc;

  /** Switch to the full walkthrough, with sound and controls. Only ever off a
   *  real click or keypress, so autoplay policy allows the unmuted start.
   *  fromStart rewinds; a finished film always starts again from 0:00. */
  const playFull = (ev: Event, fromStart: boolean): void => {
    ev.preventDefault();
    if (!isFull) {
      isFull = true;
      root.classList.remove("is-resting", "is-playing");
      root.classList.add("is-full");
      hit?.setAttribute("hidden", "");
      if (!sameFilm || !previewStarted) {
        video.src = fullSrc; // an explicit src replaces whatever is playing
        if (video.dataset.fullPoster) video.poster = video.dataset.fullPoster;
        video.load(); // a fresh load starts at 0:00
      }
      previewStarted = true;
      if (video.dataset.fullLabel) video.setAttribute("aria-label", video.dataset.fullLabel);
      video.removeAttribute("aria-hidden");
      video.muted = false;
      video.removeAttribute("muted");
      video.controls = true;
      // The element that was focused is the one just hidden; without this the
      // keyboard lands on <body> and the film's control bar is behind the user.
      video.focus();
    }
    if (fromStart || video.ended) video.currentTime = 0;
    void video.play().catch(() => { video.controls = true; });
  };

  // The frame keeps the viewer's place; the text link under it ("Watch from
  // the start") rewinds.
  root.querySelectorAll<HTMLElement>("[data-tour-full]").forEach((el) =>
    el.addEventListener("click", (ev) => playFull(ev, el.hasAttribute("data-tour-restart"))));
  // The frame is a link, so Enter is free; Space scrolls a link, and this one
  // behaves like a button, so take Space on the frame only — the quiet text
  // link under it stays an ordinary link.
  hit?.addEventListener("keydown", (ev) => {
    if (ev.key === " " || ev.key === "Spacebar") playFull(ev, false);
  });

  video.addEventListener("ended", () => {
    if (isFull) return;
    root.classList.remove("is-playing");
    root.classList.add("is-resting");
  });
}
