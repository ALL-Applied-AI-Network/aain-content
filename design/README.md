# Link-preview cards

`link-preview.html` is the editable source for both 1200 × 630 PNGs. It uses the
existing ALL brain logo, Space Grotesk, brand colors, and the original student
photo. It is design source only; it is not bundled into the public website.

- Default variant → `public/social/all-network-2026-09.png` in this repository.
- `?variant=dashboard` → `public/social/all-dashboard-2026-09.png` in `aain-api`.

To export, open this file in Chromium at a **1200 × 630** viewport with device
scale factor **1**, wait for `document.fonts.ready` and for all images to load,
then save a viewport screenshot as PNG. The source font is loaded from Google
Fonts during export; the published PNGs do not depend on fonts or JavaScript.

Keep important content away from the edges. Inspect the full export and a
360-pixel-wide preview. Use a new versioned filename for future revisions so
sharing services can fetch fresh artwork. Update both Open Graph and Twitter
metadata together. Existing messages may retain cached previews.

After publishing both sites, run `node scripts/check-link-previews.mjs` to
check the public metadata and image responses without signing in.
