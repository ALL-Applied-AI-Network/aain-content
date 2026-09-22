/**
 * tour.ts — the home page's dashboard tour.
 *
 * One <video> serves both films. It loads with the 33-second silent preview
 * (preload="none" + poster, so nothing is fetched until someone presses play).
 * When that preview ends, an end card appears over the last frame; that button
 * and the text link under the player both swap the same element to the full
 * 1:27 walkthrough and play it from the start, so the visitor stays here.
 *
 * Without JS the text link is a plain <a> to the mp4 and still works.
 */

export function mountTour(): void {
  const root = document.querySelector<HTMLElement>("[data-tour]");
  if (!root) return;
  const video = root.querySelector<HTMLVideoElement>("video");
  if (!video) return;
  const end = root.querySelector<HTMLElement>("[data-tour-end]");
  const meta = root.querySelector<HTMLElement>("[data-tour-now]");
  const fullSrc = video.dataset.fullSrc;
  if (!fullSrc) return;

  let isFull = false;

  const hideEnd = () => end?.setAttribute("hidden", "");

  /** Swap this player over to the full walkthrough and start it. The full film
   *  has narration the preview does not, so it only ever runs off a deliberate
   *  click, with the controls right there. */
  const playFull = (ev: Event) => {
    ev.preventDefault();
    hideEnd();
    if (!isFull) {
      isFull = true;
      video.src = fullSrc; // an explicit src wins over the <source> child
      if (video.dataset.fullPoster) video.poster = video.dataset.fullPoster;
      if (video.dataset.fullLabel) video.setAttribute("aria-label", video.dataset.fullLabel);
      video.load();
      root.classList.add("is-full");
      if (meta) meta.textContent = "1:27 · with narration";
    }
    video.currentTime = 0;
    void video.play().catch(() => { /* a blocked play leaves the controls, which is enough */ });
  };

  root.querySelectorAll<HTMLElement>("[data-tour-full]").forEach((el) => el.addEventListener("click", playFull));

  video.addEventListener("ended", () => { if (!isFull) end?.removeAttribute("hidden"); });
  video.addEventListener("play", hideEnd);
  video.addEventListener("seeking", hideEnd);
}
