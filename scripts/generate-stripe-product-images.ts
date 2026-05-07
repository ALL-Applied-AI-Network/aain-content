/**
 * Generate Stripe product art for the sponsor portal — Connect + Recruit.
 * Uses OpenAI's gpt-image-1 with the same isometric style as the
 * existing pipeline / pillar icons (see generate-icons.ts).
 *
 * Usage: tsx scripts/generate-stripe-product-images.ts
 */

import OpenAI from "openai";
import fs from "node:fs";
import path from "node:path";

// Load API key from .env (sibling of this script).
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
    console.error("OPENAI_API_KEY not found in content/.env");
    process.exit(1);
}

const client = new OpenAI({ apiKey });

const OUTPUT_DIR = path.resolve(
    import.meta.dirname,
    "../../sponsor-portal/stripe-product-images",
);
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const BASE_STYLE = `Isometric 3D illustration on a solid dark background (hex #0a0a0b). Clean 30-degree isometric perspective with flat-shaded geometric forms — just enough depth to feel 3D, no heavy shadows. Premium, modern, confident. No text, no labels, no logos. Square composition, centered. Must read clearly when displayed at small thumbnail sizes (e.g. 96x96 in a Stripe Checkout summary).`;

interface ImageSpec {
    filename: string;
    prompt: string;
}

const images: ImageSpec[] = [
    {
        filename: "connect.png",
        prompt: `${BASE_STYLE} Subject: a single glowing message — a clean isometric paper-airplane shape made of bright blue (#3b82f6) — flying from a small geometric humanoid figure on the left toward a profile card silhouette on the right. The path of the message is implied by a soft light trail behind the airplane. The two endpoints (figure and card) are minimal flat-shaded gray geometric forms — the message is the bright focal element. Conveys: focused one-on-one outreach, single channel.`,
    },
    {
        filename: "recruit.png",
        prompt: `${BASE_STYLE} Subject: a central elevated isometric platform or hub (rounded geometric pedestal in soft slate gray) with three floating profile cards arranged in a fan around it at slightly different heights. Each card glows a different accent color: blue (#3b82f6), cyan (#22d3ee), and pink (#ec4899). Thin glowing connection beams run between the central hub and each card. The composition feels like a recruiter's command center pulling talent from multiple regions simultaneously. Powerful, premium, multi-channel. The three accent colors are the visual focal points.`,
    },
];

async function generateImage(spec: ImageSpec): Promise<boolean> {
    const outPath = path.join(OUTPUT_DIR, spec.filename);
    console.log(`Generating ${spec.filename}...`);

    try {
        const response = await client.images.generate({
            model: "gpt-image-1",
            prompt: spec.prompt,
            n: 1,
            size: "1024x1024",
            quality: "high",
        });

        const imageData = response.data?.[0]?.b64_json;
        if (!imageData) {
            console.error(`  FAILED: No image data returned for ${spec.filename}`);
            return false;
        }

        const buffer = Buffer.from(imageData, "base64");
        fs.writeFileSync(outPath, buffer);
        console.log(
            `  OK -> ${outPath} (${(buffer.length / 1024).toFixed(0)} KB)`,
        );
        return true;
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`  FAILED: ${spec.filename} — ${msg}`);
        return false;
    }
}

async function main() {
    console.log(`Output dir: ${OUTPUT_DIR}\n`);
    let ok = 0;
    let fail = 0;
    for (const spec of images) {
        const success = await generateImage(spec);
        if (success) ok++;
        else fail++;
    }
    console.log(`\nDone. ${ok} generated, ${fail} failed.`);
}

main().catch((err) => {
    console.error("Fatal:", err);
    process.exit(1);
});
