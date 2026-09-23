import assert from "node:assert/strict";

// Intentionally anonymous: a sharing crawler cannot sign in to the dashboard.
const pages = [
  ["https://all-ai-network.org/", "/public/social/all-network-2026-09.png"],
  ["https://dashboard.all-ai-network.org/", "/social/all-dashboard-2026-09.png"],
  ["https://dashboard.all-ai-network.org/sign-in", "/social/all-dashboard-2026-09.png"],
];

for (const [url, imagePath] of pages) {
  const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
  assert.equal(response.status, 200, `${url}: page must be public`);
  const html = await response.text();
  const tags = new Map();
  for (const tag of html.matchAll(/<meta\s+[^>]*>/gi)) {
    const attributes = Object.fromEntries(
      [...tag[0].matchAll(/([\w:-]+)="([^"]*)"/g)].map((m) => [m[1], m[2]]),
    );
    const key = attributes.property ?? attributes.name;
    if (key?.startsWith("og:") || key?.startsWith("twitter:")) {
      assert.ok(!tags.has(key), `${url}: duplicate ${key}`);
      tags.set(key, attributes.content);
    }
  }
  const imageUrl = new URL(imagePath, url).href;
  for (const key of ["og:image", "twitter:image"]) assert.equal(tags.get(key), imageUrl, `${url}: ${key}`);
  for (const key of ["og:title", "og:description", "og:image:alt", "twitter:image:alt"]) assert.ok(tags.get(key), `${url}: missing ${key}`);
  assert.equal(tags.get("og:image:width"), "1200");
  assert.equal(tags.get("og:image:height"), "630");
  assert.equal(tags.get("og:image:type"), "image/png");
  assert.equal(tags.get("twitter:card"), "summary_large_image");

  const image = await fetch(imageUrl, { signal: AbortSignal.timeout(30000) });
  assert.equal(image.status, 200, `${imageUrl}: image must be public`);
  assert.match(image.headers.get("content-type") ?? "", /^image\/png/);
  const png = Buffer.from(await image.arrayBuffer());
  assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  assert.equal(png.readUInt32BE(16), 1200);
  assert.equal(png.readUInt32BE(20), 630);
  assert.ok(png.length < 1_000_000, "Keep link-preview assets below 1 MB");
  console.log(`PASS ${url}: public metadata and 1200 × 630 PNG (${Math.round(png.length / 1024)} KB)`);
}
