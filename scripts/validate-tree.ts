#!/usr/bin/env tsx
/**
 * validate-tree.ts
 *
 * Validates the learning-tree structure by reading every node.yaml and
 * series.yaml, then checking schema conformance, referential integrity,
 * bidirectional link consistency, cycle-freedom, and reachability.
 *
 * Exit code 0 = all checks pass, 1 = one or more failures.
 */

import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { glob } from "glob";
import YAML from "yaml";
import chalk from "chalk";
import { NodeYamlSchema, SeriesYamlSchema } from "./schema.js";
import type { NodeYaml, SeriesYaml } from "./schema.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CheckResult {
  name: string;
  passed: boolean;
  errors: string[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CONTENT_ROOT = path.resolve(import.meta.dirname, "..");
const LEARNING_DIR = path.join(CONTENT_ROOT, "learning");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function check(name: string, fn: () => string[]): CheckResult {
  const errors = fn();
  return { name, passed: errors.length === 0, errors };
}

function printResults(results: CheckResult[]): boolean {
  let allPassed = true;
  console.log();
  console.log(chalk.bold("Learning Tree Validation"));
  console.log(chalk.dim("=".repeat(50)));

  for (const r of results) {
    if (r.passed) {
      console.log(chalk.green(`  ✓  ${r.name}`));
    } else {
      allPassed = false;
      console.log(chalk.red(`  ✗  ${r.name}`));
      for (const err of r.errors) {
        console.log(chalk.red(`       - ${err}`));
      }
    }
  }

  console.log();
  if (allPassed) {
    console.log(chalk.green.bold("All tree validation checks passed."));
  } else {
    console.log(chalk.red.bold("Tree validation failed. See errors above."));
  }
  console.log();
  return allPassed;
}

// ---------------------------------------------------------------------------
// Load files
// ---------------------------------------------------------------------------

interface LoadedNode {
  filePath: string;
  dirPath: string;
  raw: unknown;
  parsed?: NodeYaml;
}

interface LoadedSeries {
  filePath: string;
  raw: unknown;
  parsed?: SeriesYaml;
}

function loadNodeFiles(): LoadedNode[] {
  if (!existsSync(LEARNING_DIR)) {
    return [];
  }
  const files = glob.sync("**/node.yaml", { cwd: LEARNING_DIR, absolute: true });
  return files.map((filePath) => {
    const content = readFileSync(filePath, "utf-8");
    return {
      filePath,
      dirPath: path.dirname(filePath),
      raw: YAML.parse(content),
    };
  });
}

function loadSeriesFiles(): LoadedSeries[] {
  if (!existsSync(LEARNING_DIR)) {
    return [];
  }
  const seriesDir = path.join(LEARNING_DIR, "series");
  if (!existsSync(seriesDir)) return [];
  const files = glob.sync("*.yaml", { cwd: seriesDir, absolute: true });
  return files.map((filePath) => {
    const content = readFileSync(filePath, "utf-8");
    return {
      filePath,
      raw: YAML.parse(content),
    };
  });
}

// ---------------------------------------------------------------------------
// Validation checks
// ---------------------------------------------------------------------------

function validateSchemas(nodes: LoadedNode[]): CheckResult {
  return check("Node YAML schemas are valid", () => {
    const errors: string[] = [];
    for (const node of nodes) {
      const result = NodeYamlSchema.safeParse(node.raw);
      if (!result.success) {
        const relPath = path.relative(CONTENT_ROOT, node.filePath);
        for (const issue of result.error.issues) {
          errors.push(`${relPath}: ${issue.path.join(".")} — ${issue.message}`);
        }
      } else {
        node.parsed = result.data;
      }
    }
    return errors;
  });
}

function validateSeriesSchemas(seriesList: LoadedSeries[]): CheckResult {
  return check("Series YAML schemas are valid", () => {
    const errors: string[] = [];
    for (const s of seriesList) {
      const result = SeriesYamlSchema.safeParse(s.raw);
      if (!result.success) {
        const relPath = path.relative(CONTENT_ROOT, s.filePath);
        for (const issue of result.error.issues) {
          errors.push(`${relPath}: ${issue.path.join(".")} — ${issue.message}`);
        }
      } else {
        s.parsed = result.data;
      }
    }
    return errors;
  });
}

function validateUniqueIds(nodes: LoadedNode[]): CheckResult {
  return check("All node IDs are unique", () => {
    const errors: string[] = [];
    const seen = new Map<string, string>();
    for (const node of nodes) {
      if (!node.parsed) continue;
      const prev = seen.get(node.parsed.id);
      if (prev) {
        errors.push(
          `Duplicate id "${node.parsed.id}" in ${path.relative(CONTENT_ROOT, node.filePath)} ` +
          `(first seen in ${prev})`
        );
      } else {
        seen.set(node.parsed.id, path.relative(CONTENT_ROOT, node.filePath));
      }
    }
    return errors;
  });
}

function validatePrerequisiteRefs(nodes: LoadedNode[]): CheckResult {
  return check("All prerequisite references point to existing nodes", () => {
    const errors: string[] = [];
    const ids = new Set(nodes.filter((n) => n.parsed).map((n) => n.parsed!.id));
    for (const node of nodes) {
      if (!node.parsed) continue;
      for (const prereq of node.parsed.prerequisites) {
        if (!ids.has(prereq)) {
          errors.push(
            `Node "${node.parsed.id}" references unknown prerequisite "${prereq}"`
          );
        }
      }
    }
    return errors;
  });
}

function validateUnlockRefs(nodes: LoadedNode[]): CheckResult {
  return check("All unlock references point to existing nodes", () => {
    const errors: string[] = [];
    const ids = new Set(nodes.filter((n) => n.parsed).map((n) => n.parsed!.id));
    for (const node of nodes) {
      if (!node.parsed) continue;
      for (const unlock of node.parsed.unlocks) {
        if (!ids.has(unlock)) {
          errors.push(
            `Node "${node.parsed.id}" references unknown unlock "${unlock}"`
          );
        }
      }
    }
    return errors;
  });
}

function validateBidirectionalConsistency(nodes: LoadedNode[]): CheckResult {
  return check("Bidirectional link consistency (unlocks <-> prerequisites)", () => {
    const errors: string[] = [];
    const parsed = nodes.filter((n) => n.parsed).map((n) => n.parsed!);
    const byId = new Map(parsed.map((n) => [n.id, n]));

    for (const node of parsed) {
      // If A lists B in unlocks, B must list A in prerequisites
      for (const unlockId of node.unlocks) {
        const target = byId.get(unlockId);
        if (target && !target.prerequisites.includes(node.id)) {
          errors.push(
            `"${node.id}" lists "${unlockId}" in unlocks, but "${unlockId}" ` +
            `does not list "${node.id}" in prerequisites`
          );
        }
      }

      // If A lists B in prerequisites, B must list A in unlocks
      for (const prereqId of node.prerequisites) {
        const target = byId.get(prereqId);
        if (target && !target.unlocks.includes(node.id)) {
          errors.push(
            `"${node.id}" lists "${prereqId}" in prerequisites, but "${prereqId}" ` +
            `does not list "${node.id}" in unlocks`
          );
        }
      }
    }
    return errors;
  });
}

function validateNoCycles(nodes: LoadedNode[]): CheckResult {
  return check("No cycles in the prerequisite graph (topological sort)", () => {
    const errors: string[] = [];
    const parsed = nodes.filter((n) => n.parsed).map((n) => n.parsed!);

    // Build adjacency list: edges go from prerequisite -> node (direction of progress)
    const adj = new Map<string, string[]>();
    for (const node of parsed) {
      if (!adj.has(node.id)) adj.set(node.id, []);
      for (const prereq of node.prerequisites) {
        if (!adj.has(prereq)) adj.set(prereq, []);
        adj.get(prereq)!.push(node.id);
      }
    }

    // DFS cycle detection
    const WHITE = 0; // unvisited
    const GRAY = 1;  // in current DFS path
    const BLACK = 2; // fully explored
    const color = new Map<string, number>();
    const parent = new Map<string, string | null>();

    for (const id of adj.keys()) {
      color.set(id, WHITE);
    }

    function dfs(u: string): boolean {
      color.set(u, GRAY);
      for (const v of adj.get(u) ?? []) {
        if (color.get(v) === GRAY) {
          // Reconstruct cycle path
          const cycle: string[] = [v, u];
          let cur = u;
          while (cur !== v && parent.get(cur) != null) {
            cur = parent.get(cur)!;
            cycle.push(cur);
          }
          cycle.reverse();
          errors.push(`Cycle detected: ${cycle.join(" -> ")}`);
          return true;
        }
        if (color.get(v) === WHITE) {
          parent.set(v, u);
          if (dfs(v)) return true;
        }
      }
      color.set(u, BLACK);
      return false;
    }

    for (const id of adj.keys()) {
      if (color.get(id) === WHITE) {
        parent.set(id, null);
        dfs(id);
      }
    }

    return errors;
  });
}

function validateNoOrphans(nodes: LoadedNode[]): CheckResult {
  return check("No orphan nodes (all reachable from a root)", () => {
    const errors: string[] = [];
    const parsed = nodes.filter((n) => n.parsed).map((n) => n.parsed!);
    if (parsed.length === 0) return errors;

    // Root nodes = nodes with no prerequisites
    const roots = parsed.filter((n) => n.prerequisites.length === 0);
    if (roots.length === 0) {
      errors.push("No root nodes found (every node has prerequisites)");
      return errors;
    }

    // BFS from all root nodes through unlocks
    const visited = new Set<string>();
    const queue = roots.map((r) => r.id);
    const byId = new Map(parsed.map((n) => [n.id, n]));

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);
      const node = byId.get(current);
      if (node) {
        for (const unlockId of node.unlocks) {
          if (!visited.has(unlockId)) {
            queue.push(unlockId);
          }
        }
      }
    }

    for (const node of parsed) {
      if (!visited.has(node.id)) {
        errors.push(`Orphan node "${node.id}" is not reachable from any root node`);
      }
    }

    return errors;
  });
}

function validateContentFilesExist(nodes: LoadedNode[]): CheckResult {
  return check("All content_file references exist on disk", () => {
    const errors: string[] = [];
    for (const node of nodes) {
      if (!node.parsed) continue;
      const contentPath = path.join(node.dirPath, node.parsed.content_file);
      if (!existsSync(contentPath)) {
        errors.push(
          `Node "${node.parsed.id}": content_file "${node.parsed.content_file}" ` +
          `not found at ${path.relative(CONTENT_ROOT, contentPath)}`
        );
      }
    }
    return errors;
  });
}

function validateThumbnailsExist(nodes: LoadedNode[]): CheckResult {
  return check("All thumbnail references exist on disk", () => {
    const errors: string[] = [];
    for (const node of nodes) {
      if (!node.parsed) continue;
      const thumbPath = path.join(node.dirPath, node.parsed.thumbnail);
      if (!existsSync(thumbPath)) {
        errors.push(
          `Node "${node.parsed.id}": thumbnail "${node.parsed.thumbnail}" ` +
          `not found at ${path.relative(CONTENT_ROOT, thumbPath)}`
        );
      }
    }
    return errors;
  });
}

function validateSeriesNodeRefs(
  seriesList: LoadedSeries[],
  nodes: LoadedNode[]
): CheckResult {
  return check("All series node references point to existing nodes", () => {
    const errors: string[] = [];
    const ids = new Set(nodes.filter((n) => n.parsed).map((n) => n.parsed!.id));
    for (const s of seriesList) {
      if (!s.parsed) continue;
      for (const nodeId of s.parsed.nodes) {
        if (!ids.has(nodeId)) {
          errors.push(
            `Series "${s.parsed.id}" references unknown node "${nodeId}"`
          );
        }
      }
    }
    return errors;
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const nodes = loadNodeFiles();
  const seriesList = loadSeriesFiles();

  console.log(
    chalk.dim(
      `Found ${nodes.length} node.yaml file(s) and ${seriesList.length} series.yaml file(s)`
    )
  );

  // Run all checks in order — later checks depend on schemas being parsed first
  const results: CheckResult[] = [];

  results.push(validateSchemas(nodes));
  results.push(validateSeriesSchemas(seriesList));
  results.push(validateUniqueIds(nodes));
  results.push(validatePrerequisiteRefs(nodes));
  results.push(validateUnlockRefs(nodes));
  results.push(validateBidirectionalConsistency(nodes));
  results.push(validateNoCycles(nodes));
  results.push(validateNoOrphans(nodes));
  results.push(validateContentFilesExist(nodes));
  results.push(validateThumbnailsExist(nodes));
  results.push(validateSeriesNodeRefs(seriesList, nodes));

  const allPassed = printResults(results);
  process.exit(allPassed ? 0 : 1);
}

main().catch((err) => {
  console.error(chalk.red("Unexpected error during tree validation:"), err);
  process.exit(1);
});
