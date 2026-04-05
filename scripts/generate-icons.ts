/**
 * Generate isometric 3D icons for the ALL Applied AI Network website
 * using OpenAI's gpt-image-1 model.
 *
 * Usage: tsx scripts/generate-icons.ts
 */

import OpenAI from "openai";
import fs from "node:fs";
import path from "node:path";

// Load API key from .env
const envPath = path.resolve(import.meta.dirname, "../.env");
const envContent = fs.readFileSync(envPath, "utf-8");
const apiKey = envContent
  .split("\n")
  .find((l) => l.startsWith("OPENAI_API_KEY="))
  ?.split("=")
  .slice(1)
  .join("=")
  ?.trim();

if (!apiKey) {
  console.error("OPENAI_API_KEY not found in .env");
  process.exit(1);
}

const client = new OpenAI({ apiKey });

const OUTPUT_DIR = path.resolve(
  import.meta.dirname,
  "../site/images/icons"
);

const BASE_STYLE = `Isometric 3D icon on a solid dark background (hex #111113). Flat colored geometric shapes with isometric perspective (30-degree angle). Minimal shading — flat icon style with just enough depth to feel 3D. Clean edges, simple geometric forms. No text, no labels. Must read well when displayed very small. Square composition, centered.`;

interface IconSpec {
  filename: string;
  prompt: string;
}

const icons: IconSpec[] = [
  // Pipeline Icons (Section 01)
  {
    filename: "pipeline-compute.png",
    prompt: `${BASE_STYLE} A simple isometric GPU server rack or server tower. Single accent color: blue (#3b82f6). Geometric box shapes stacked with small glowing indicators. Minimal detail — clean flat geometric forms.`,
  },
  {
    filename: "pipeline-mentorship.png",
    prompt: `${BASE_STYLE} Three simple isometric stylized people figures standing together as a group. Single accent color: cyan (#22d3ee). Geometric minimalist human shapes — circles for heads, simple angular bodies. Clean and abstract.`,
  },
  {
    filename: "pipeline-community.png",
    prompt: `${BASE_STYLE} Isometric network of connected nodes arranged in a circular pattern. Single accent color: pink (#ec4899). Simple geometric circles connected by lines forming a network diagram. Flat colored, minimal.`,
  },
  {
    filename: "pipeline-industry.png",
    prompt: `${BASE_STYLE} Isometric ascending bar chart showing growth, with 4-5 bars increasing in height. Single accent color: purple (#a855f7). Simple geometric rectangular bars on a flat base. Clean minimal style.`,
  },
  // Hub Pillar Icons (Section 03)
  {
    filename: "pillar-gpu.png",
    prompt: `${BASE_STYLE} Isometric supercomputer or GPU cluster — multiple server units stacked together with small indicator lights. Single accent color: blue (#3b82f6). Geometric box shapes with subtle light dots. Clean flat style.`,
  },
  {
    filename: "pillar-network.png",
    prompt: `${BASE_STYLE} Isometric globe or interconnected hub with nodes connected by lines radiating outward. Single accent color: cyan (#22d3ee). Simple geometric sphere with connection points. Flat colored, minimal.`,
  },
  {
    filename: "pillar-tools.png",
    prompt: `${BASE_STYLE} Isometric toolbox or construction kit with geometric tools — a wrench, gear, and building blocks arranged together. Single accent color: purple (#a855f7). Simple geometric shapes, flat colored, minimal detail.`,
  },
];

async function generateIcon(spec: IconSpec): Promise<boolean> {
  const outPath = path.join(OUTPUT_DIR, spec.filename);
  console.log(`Generating ${spec.filename}...`);

  try {
    const response = await client.images.generate({
      model: "gpt-image-1",
      prompt: spec.prompt,
      n: 1,
      size: "1024x1024",
      quality: "medium",
    });

    const imageData = response.data?.[0]?.b64_json;
    if (!imageData) {
      console.error(`  FAILED: No image data returned for ${spec.filename}`);
      return false;
    }

    const buffer = Buffer.from(imageData, "base64");
    fs.writeFileSync(outPath, buffer);
    console.log(`  OK -> ${outPath} (${(buffer.length / 1024).toFixed(0)} KB)`);
    return true;
  } catch (err: any) {
    console.error(`  FAILED: ${spec.filename} — ${err?.message ?? err}`);
    return false;
  }
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log(`Generating ${icons.length} icons...\n`);

  const results: { filename: string; ok: boolean }[] = [];

  // Generate sequentially to avoid rate limits
  for (const spec of icons) {
    const ok = await generateIcon(spec);
    results.push({ filename: spec.filename, ok });
  }

  console.log("\n=== Results ===");
  const succeeded = results.filter((r) => r.ok);
  const failed = results.filter((r) => !r.ok);

  console.log(`Succeeded: ${succeeded.length}/${results.length}`);
  for (const r of succeeded) {
    console.log(`  ✓ ${r.filename}`);
  }
  if (failed.length > 0) {
    console.log(`Failed: ${failed.length}/${results.length}`);
    for (const r of failed) {
      console.log(`  ✗ ${r.filename}`);
    }
  }
}

main();
