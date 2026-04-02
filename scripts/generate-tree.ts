#!/usr/bin/env tsx
/**
 * generate-tree.ts
 *
 * Reads all validated node.yaml and series.yaml files from the learning/
 * directory and produces tree.json at the repository root.
 *
 * tree.json contains:
 *  - All nodes with their full metadata
 *  - All directed edges (prerequisite -> node)
 *  - All series definitions
 *  - Aggregate statistics
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { glob } from "glob";
import YAML from "yaml";
import chalk from "chalk";
import { NodeYamlSchema, SeriesYamlSchema } from "./schema.js";
import type { NodeYaml, SeriesYaml } from "./schema.js";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CONTENT_ROOT = path.resolve(import.meta.dirname, "..");
const LEARNING_DIR = path.join(CONTENT_ROOT, "learning");
const OUTPUT_PATH = path.join(CONTENT_ROOT, "tree.json");

// ---------------------------------------------------------------------------
// Types for the output JSON
// ---------------------------------------------------------------------------

interface TreeNode {
  id: string;
  title: string;
  description: string;
  layer: number;
  difficulty: string;
  estimated_minutes: number;
  thumbnail: string;
  tags: string[];
  prerequisites: string[];
  unlocks: string[];
  content_path: string;
  notebook_path?: string;
  author?: string;
  last_updated?: string;
}

interface TreeEdge {
  from: string;
  to: string;
}

interface TreeSeries {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  nodes: string[];
}

interface TreeStats {
  total_nodes: number;
  total_edges: number;
  total_series: number;
  by_layer: Record<string, number>;
  by_difficulty: Record<string, number>;
}

interface TreeJson {
  version: string;
  generated_at: string;
  nodes: TreeNode[];
  edges: TreeEdge[];
  series: TreeSeries[];
  stats: TreeStats;
}

// ---------------------------------------------------------------------------
// Loaders
// ---------------------------------------------------------------------------

function loadNodes(): { parsed: NodeYaml; dirPath: string }[] {
  if (!existsSync(LEARNING_DIR)) return [];

  const files = glob.sync("**/node.yaml", { cwd: LEARNING_DIR, absolute: true });
  const results: { parsed: NodeYaml; dirPath: string }[] = [];

  for (const filePath of files) {
    const content = readFileSync(filePath, "utf-8");
    const raw = YAML.parse(content);
    const result = NodeYamlSchema.safeParse(raw);
    if (result.success) {
      results.push({ parsed: result.data, dirPath: path.dirname(filePath) });
    } else {
      const relPath = path.relative(CONTENT_ROOT, filePath);
      console.warn(
        chalk.yellow(`Warning: skipping invalid node ${relPath}`)
      );
    }
  }

  return results;
}

function loadSeries(): SeriesYaml[] {
  if (!existsSync(LEARNING_DIR)) return [];

  const files = glob.sync("**/series.yaml", { cwd: LEARNING_DIR, absolute: true });
  const results: SeriesYaml[] = [];

  for (const filePath of files) {
    const content = readFileSync(filePath, "utf-8");
    const raw = YAML.parse(content);
    const result = SeriesYamlSchema.safeParse(raw);
    if (result.success) {
      results.push(result.data);
    } else {
      const relPath = path.relative(CONTENT_ROOT, filePath);
      console.warn(
        chalk.yellow(`Warning: skipping invalid series ${relPath}`)
      );
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Tree generation
// ---------------------------------------------------------------------------

function generateTree(): TreeJson {
  const loadedNodes = loadNodes();
  const loadedSeries = loadSeries();

  // Build tree nodes with paths relative to the content root
  const treeNodes: TreeNode[] = loadedNodes.map(({ parsed, dirPath }) => {
    const relDir = path.relative(CONTENT_ROOT, dirPath);
    const node: TreeNode = {
      id: parsed.id,
      title: parsed.title,
      description: parsed.description,
      layer: parsed.layer,
      difficulty: parsed.difficulty,
      estimated_minutes: parsed.estimated_minutes,
      thumbnail: path.join(relDir, parsed.thumbnail),
      tags: parsed.tags,
      prerequisites: parsed.prerequisites,
      unlocks: parsed.unlocks,
      content_path: path.join(relDir, parsed.content_file),
    };

    if (parsed.notebook_file) {
      node.notebook_path = path.join(relDir, parsed.notebook_file);
    }
    if (parsed.author) {
      node.author = parsed.author;
    }
    if (parsed.last_updated) {
      node.last_updated = parsed.last_updated;
    }

    return node;
  });

  // Build edges from prerequisites (prerequisite -> node)
  const edges: TreeEdge[] = [];
  for (const node of treeNodes) {
    for (const prereq of node.prerequisites) {
      edges.push({ from: prereq, to: node.id });
    }
  }

  // Build series
  const treeSeries: TreeSeries[] = loadedSeries.map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    difficulty: s.difficulty,
    nodes: s.nodes,
  }));

  // Compute statistics
  const byLayer: Record<string, number> = {};
  const byDifficulty: Record<string, number> = {};

  // Initialize all layer slots 0-5
  for (let i = 0; i <= 5; i++) {
    byLayer[String(i)] = 0;
  }

  for (const node of treeNodes) {
    byLayer[String(node.layer)] = (byLayer[String(node.layer)] || 0) + 1;
    byDifficulty[node.difficulty] = (byDifficulty[node.difficulty] || 0) + 1;
  }

  const stats: TreeStats = {
    total_nodes: treeNodes.length,
    total_edges: edges.length,
    total_series: treeSeries.length,
    by_layer: byLayer,
    by_difficulty: byDifficulty,
  };

  return {
    version: "1.0.0",
    generated_at: new Date().toISOString(),
    nodes: treeNodes,
    edges,
    series: treeSeries,
    stats,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log(chalk.dim("Generating tree.json..."));

  const tree = generateTree();
  writeFileSync(OUTPUT_PATH, JSON.stringify(tree, null, 2) + "\n", "utf-8");

  console.log(chalk.green.bold(`tree.json written to ${path.relative(process.cwd(), OUTPUT_PATH)}`));
  console.log(
    chalk.dim(
      `  ${tree.stats.total_nodes} nodes, ${tree.stats.total_edges} edges, ${tree.stats.total_series} series`
    )
  );
}

main().catch((err) => {
  console.error(chalk.red("Unexpected error during tree generation:"), err);
  process.exit(1);
});
