#!/usr/bin/env tsx
/**
 * generate-manifest.ts
 *
 * Generates manifest.json at the repository root — a flat index of ALL
 * content files across learning nodes, playbooks, workshops, and templates.
 *
 * The manifest is consumed by the website to discover and render content
 * without needing to walk the filesystem.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { glob } from "glob";
import YAML from "yaml";
import chalk from "chalk";
import { NodeYamlSchema, MetadataYamlSchema } from "./schema.js";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CONTENT_ROOT = path.resolve(import.meta.dirname, "..");
const LEARNING_DIR = path.join(CONTENT_ROOT, "learning");
const PLAYBOOKS_DIR = path.join(CONTENT_ROOT, "playbooks");
const WORKSHOPS_DIR = path.join(CONTENT_ROOT, "workshops");
const TEMPLATES_DIR = path.join(CONTENT_ROOT, "templates");
const OUTPUT_PATH = path.join(CONTENT_ROOT, "manifest.json");

// ---------------------------------------------------------------------------
// Types for the output JSON
// ---------------------------------------------------------------------------

interface ManifestEntry {
  type: "learning" | "playbook" | "workshop" | "template";
  id?: string;
  title: string;
  description?: string;
  path: string;
  thumbnail?: string;
}

interface ManifestJson {
  version: string;
  generated_at: string;
  content: ManifestEntry[];
}

// ---------------------------------------------------------------------------
// Content discovery
// ---------------------------------------------------------------------------

/**
 * Discover learning nodes from node.yaml files.
 */
function discoverLearningContent(): ManifestEntry[] {
  if (!existsSync(LEARNING_DIR)) return [];

  const entries: ManifestEntry[] = [];
  const nodeFiles = glob.sync("**/node.yaml", { cwd: LEARNING_DIR, absolute: true });

  for (const filePath of nodeFiles) {
    try {
      const content = readFileSync(filePath, "utf-8");
      const raw = YAML.parse(content);
      const result = NodeYamlSchema.safeParse(raw);

      if (result.success) {
        const dir = path.dirname(filePath);
        const relDir = path.relative(CONTENT_ROOT, dir);
        const node = result.data;

        entries.push({
          type: "learning",
          id: node.id,
          title: node.title,
          description: node.description,
          path: path.join(relDir, node.content_file),
          thumbnail: path.join(relDir, node.thumbnail),
        });
      }
    } catch {
      // Skip unparseable files — validation scripts catch these
    }
  }

  return entries;
}

/**
 * Discover playbook content.
 * Playbooks are expected to have an index.md at their root.
 */
function discoverPlaybooks(): ManifestEntry[] {
  if (!existsSync(PLAYBOOKS_DIR)) return [];

  const entries: ManifestEntry[] = [];
  const indexFiles = glob.sync("*/index.md", { cwd: PLAYBOOKS_DIR, absolute: true });

  for (const filePath of indexFiles) {
    try {
      const content = readFileSync(filePath, "utf-8");
      const relPath = path.relative(CONTENT_ROOT, filePath);

      // Extract title from the first heading
      const titleMatch = content.match(/^#\s+(.+)$/m);
      const title = titleMatch ? titleMatch[1].trim() : path.basename(path.dirname(filePath));

      entries.push({
        type: "playbook",
        title,
        path: relPath,
      });
    } catch {
      // Skip unreadable files
    }
  }

  return entries;
}

/**
 * Discover workshop content via metadata.yaml files.
 */
function discoverWorkshops(): ManifestEntry[] {
  if (!existsSync(WORKSHOPS_DIR)) return [];

  const entries: ManifestEntry[] = [];
  const metaFiles = glob.sync("*/metadata.yaml", { cwd: WORKSHOPS_DIR, absolute: true });

  for (const filePath of metaFiles) {
    try {
      const content = readFileSync(filePath, "utf-8");
      const raw = YAML.parse(content);
      const result = MetadataYamlSchema.safeParse(raw);

      if (result.success) {
        const dir = path.dirname(filePath);
        const relDir = path.relative(CONTENT_ROOT, dir);
        const meta = result.data;

        // Look for the primary workshop file (workshop.md or index.md)
        let workshopFile = "workshop.md";
        if (!existsSync(path.join(dir, workshopFile))) {
          workshopFile = "index.md";
        }

        entries.push({
          type: "workshop",
          title: meta.title,
          description: meta.description,
          path: path.join(relDir, workshopFile),
        });
      }
    } catch {
      // Skip unparseable files
    }
  }

  return entries;
}

/**
 * Discover template content.
 * Templates are expected to have an index.md or README.md at their root.
 */
function discoverTemplates(): ManifestEntry[] {
  if (!existsSync(TEMPLATES_DIR)) return [];

  const entries: ManifestEntry[] = [];

  // Look for any markdown files at the top level of each template directory
  const templateDirs = glob.sync("*/", { cwd: TEMPLATES_DIR, absolute: true });

  for (const dir of templateDirs) {
    const indexPath = path.join(dir, "index.md");
    const readmePath = path.join(dir, "README.md");
    const primaryFile = existsSync(indexPath)
      ? indexPath
      : existsSync(readmePath)
        ? readmePath
        : null;

    if (primaryFile) {
      try {
        const content = readFileSync(primaryFile, "utf-8");
        const relPath = path.relative(CONTENT_ROOT, primaryFile);

        const titleMatch = content.match(/^#\s+(.+)$/m);
        const title = titleMatch ? titleMatch[1].trim() : path.basename(dir);

        entries.push({
          type: "template",
          title,
          path: relPath,
        });
      } catch {
        // Skip unreadable files
      }
    }
  }

  return entries;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log(chalk.dim("Generating manifest.json..."));

  const content: ManifestEntry[] = [
    ...discoverLearningContent(),
    ...discoverPlaybooks(),
    ...discoverWorkshops(),
    ...discoverTemplates(),
  ];

  const manifest: ManifestJson = {
    version: "1.0.0",
    generated_at: new Date().toISOString(),
    content,
  };

  writeFileSync(OUTPUT_PATH, JSON.stringify(manifest, null, 2) + "\n", "utf-8");

  // Print summary by type
  const counts = content.reduce(
    (acc, entry) => {
      acc[entry.type] = (acc[entry.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  console.log(chalk.green.bold(`manifest.json written to ${path.relative(process.cwd(), OUTPUT_PATH)}`));
  console.log(
    chalk.dim(
      `  ${content.length} total entries: ` +
      Object.entries(counts)
        .map(([type, count]) => `${count} ${type}(s)`)
        .join(", ")
    )
  );
}

main().catch((err) => {
  console.error(chalk.red("Unexpected error during manifest generation:"), err);
  process.exit(1);
});
