/**
 * film-loop.ts — a silent loop that stands in for a film until someone asks for it.
 *
 * A `<video data-loop>` plays muted on repeat while it is on screen, and pauses
 * when it scrolls away or the tab is hidden. Reduced motion never starts it: the
 * poster stays. Two ways to get the real film, with sound:
 *
 *   playInPlace(video, src)   the loop's own frame becomes the film, with controls
 *   openFilm({ src, ... })    a modal player over the page (native <dialog>, so it
 *                             sits in the top layer, takes focus, and Esc closes it)
 *
 * `mountFilmButtons(root)` wires every `[data-film-open]` button to openFilm, reading
 * data-src, data-poster and data-title.
 */

const REDUCED = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Start every silent loop under root that isn't running yet. */
export function mountLoops(root: ParentNode = document): void {
  const loops = Array.from(root.querySelectorAll<HTMLVideoElement>("video[data-loop]:not([data-loop-on])"));
  if (!loops.length) return;
  loops.forEach((v) => {
    v.dataset.loopOn = "";
    v.muted = true;
    v.loop = true;
    v.playsInline = true;
  });
  if (REDUCED || typeof IntersectionObserver !== "function") return;
  const seen = new Set<HTMLVideoElement>();
  const sync = (v: HTMLVideoElement) => {
    if (!("loop" in v.dataset)) return; // it has become the film
    if (seen.has(v) && !document.hidden) void v.play().catch(() => {});
    else v.pause();
  };
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const v = e.target as HTMLVideoElement;
        if (e.isIntersecting) seen.add(v);
        else seen.delete(v);
        sync(v);
      }
    },
    { threshold: 0.25 },
  );
  loops.forEach((v) => io.observe(v));
  document.addEventListener("visibilitychange", () => loops.forEach(sync));
}

/** Turn a loop's frame into the film itself, with sound and controls. */
export function playInPlace(video: HTMLVideoElement, src: string, poster?: string): void {
  delete video.dataset.loop;
  video.pause();
  video.querySelectorAll("source").forEach((s) => s.remove());
  if (poster) video.poster = poster;
  video.loop = false;
  video.muted = false;
  video.src = src;
  video.controls = true;
  video.focus();
  void video.play().catch(() => {});
}

let dialog: HTMLDialogElement | null = null;

/** Play a film in a modal over the page. */
export function openFilm(opts: { src: string; poster?: string; title: string }): void {
  if (typeof HTMLDialogElement !== "function") {
    window.location.href = opts.src;
    return;
  }
  if (!dialog) {
    dialog = document.createElement("dialog");
    dialog.className = "film-dlg";
    dialog.innerHTML = `
      <div class="film-dlg__box">
        <div class="film-dlg__bar"><b class="film-dlg__t"></b><button type="button" class="film-dlg__x" aria-label="Close the film">&times;</button></div>
        <video class="film-dlg__v" controls playsinline preload="auto"></video>
      </div>`;
    document.body.appendChild(dialog);
    const d = dialog;
    d.querySelector(".film-dlg__x")!.addEventListener("click", () => d.close());
    // A click on the dimmed page around the box closes it too.
    d.addEventListener("click", (e) => { if (e.target === d) d.close(); });
    d.addEventListener("close", () => {
      const v = d.querySelector<HTMLVideoElement>("video")!;
      v.pause();
      v.removeAttribute("src");
      v.load();
    });
  }
  const v = dialog.querySelector<HTMLVideoElement>("video")!;
  dialog.querySelector(".film-dlg__t")!.textContent = opts.title;
  v.setAttribute("aria-label", opts.title);
  if (opts.poster) v.poster = opts.poster;
  v.src = opts.src;
  dialog.showModal();
  void v.play().catch(() => {});
}

/** Wire every [data-film-open] button under root to the modal player. */
export function mountFilmButtons(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>("[data-film-open]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      openFilm({ src: btn.dataset.src!, poster: btn.dataset.poster, title: btn.dataset.title ?? "Film" });
    });
  });
}
