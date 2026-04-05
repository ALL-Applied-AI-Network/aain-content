/**
 * Generate test thumbnail styles using OpenAI image generation.
 * Produces multiple style variations for "What Is AI?" to let the user pick.
 */

import OpenAI from "openai";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const OUTPUT_DIR = path.join(__dirname, "..", "site", "test-thumbnails");

const styles = [
  {
    name: "flat-icon",
    prompt:
      "A minimal flat-design icon for a learning module about artificial intelligence. Simple geometric shapes: a stylized brain made of connected nodes/circles on a dark navy background (#0d0d1f). Use a warm gold accent color (#e0a83a). Clean, modern, no text. Square format, suitable as a small thumbnail.",
  },
  {
    name: "isometric",
    prompt:
      "An isometric 3D illustration of a glowing AI brain/neural network for a tech learning platform. Soft neon blue and purple gradients on a dark background (#0d0d1f). Low-poly style, clean edges, no text. Modern tech aesthetic. Square format, small thumbnail size.",
  },
  {
    name: "line-art",
    prompt:
      "A single-line continuous art illustration of an AI concept — a brain merging with circuit patterns. Thin glowing teal lines (#3dadcf) on a dark navy background (#0d0d1f). Minimal, elegant, no text. Like a technical blueprint. Square format thumbnail.",
  },
  {
    name: "gradient-abstract",
    prompt:
      "An abstract gradient artwork representing artificial intelligence. Flowing organic shapes with gold (#e0a83a) and deep purple (#9b6dd7) gradients on a dark background (#0d0d1f). Subtle particle/dot patterns. No text, no faces. Modern, premium feel. Square thumbnail.",
  },
];

async function generateImage(style: { name: string; prompt: string }) {
  console.log(`Generating "${style.name}" style...`);

  try {
    const response = await client.images.generate({
      model: "gpt-image-1",
      prompt: style.prompt,
      n: 1,
      size: "1024x1024",
      quality: "medium",
    });

    const imageData = response.data?.[0]?.b64_json;
    if (!imageData) {
      console.error(`No image data for ${style.name}`);
      return null;
    }

    const outputPath = path.join(OUTPUT_DIR, `${style.name}.png`);
    fs.writeFileSync(outputPath, Buffer.from(imageData, "base64"));
    console.log(`  Saved: ${outputPath}`);
    return outputPath;
  } catch (err: any) {
    console.error(`Error generating ${style.name}:`, err?.message || err);
    return null;
  }
}

async function main() {
  // Ensure output dir exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log(`Generating ${styles.length} style variations for "What Is AI?"...\n`);

  const results: string[] = [];
  for (const style of styles) {
    const result = await generateImage(style);
    if (result) results.push(result);
  }

  console.log(`\nDone! Generated ${results.length}/${styles.length} images.`);
  console.log(`Output directory: ${OUTPUT_DIR}`);
}

main().catch(console.error);
