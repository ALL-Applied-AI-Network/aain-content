#!/usr/bin/env tsx
/**
 * validate-content.ts
 *
 * Validates content files across the repository:
 *  - Learning node directories have required files (node.yaml, content_file, thumbnail)
 *  - Markdown files have reasonable structure
 *  - No broken relative image references inside markdown
 *  - Workshop directories have metadata.yaml
 *
 * Exit code 0 = all checks pass, 1 = one or more failures.
 */

import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { glob } from "glob";
import YAML from "yaml";
import chalk from "chalk";
import { NodeYamlSchema, MetadataYamlSchema } from "./schema.js";

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
const WORKSHOPS_DIR = path.join(CONTENT_ROOT, "workshops");

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
  console.log(chalk.bold("Content Validation"));
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
    console.log(chalk.green.bold("All content validation checks passed."));
  } else {
    console.log(chalk.red.bold("Content validation failed. See errors above."));
  }
  console.log();
  return allPassed;
}

/**
 * Extract all relative image paths from a markdown string.
 * Matches both ![alt](path) syntax and <img src="path"> syntax.
 * Ignores absolute URLs (http://, https://, //).
 */
function extractMarkdownImagePaths(markdown: string): string[] {
  const paths: string[] = [];

  // Markdown image syntax: ![alt](path)
  const mdImageRegex = /!\[[^\]]*\]\(([^)]+)\)/g;
  let match: RegExpExecArray | null;
  while ((match = mdImageRegex.exec(markdown)) !== null) {
    const imgPath = match[1].trim();
    if (!imgPath.startsWith("http://") && !imgPath.startsWith("https://") && !imgPath.startsWith("//")) {
      paths.push(imgPath);
    }
  }

  // HTML image syntax: <img src="path">
  const htmlImageRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  while ((match = htmlImageRegex.exec(markdown)) !== null) {
    const imgPath = match[1].trim();
    if (!imgPath.startsWith("http://") && !imgPath.startsWith("https://") && !imgPath.startsWith("//")) {
      paths.push(imgPath);
    }
  }

  return paths;
}

// ---------------------------------------------------------------------------
// Validation checks
// ---------------------------------------------------------------------------

function validateLearningNodeDirectories(): CheckResult {
  return check("Learning node directories have required files", () => {
    const errors: string[] = [];
    if (!existsSync(LEARNING_DIR)) return errors;

    const nodeFiles = glob.sync("**/node.yaml", {
      cwd: LEARNING_DIR,
      absolute: true,
    });

    for (const nodeFile of nodeFiles) {
      const dir = path.dirname(nodeFile);
      const relDir = path.relative(CONTENT_ROOT, dir);

      // Parse the node.yaml to find the content_file and thumbnail references
      try {
        const content = readFileSync(nodeFile, "utf-8");
        const raw = YAML.parse(content);
        const result = NodeYamlSchema.safeParse(raw);

        if (!result.success) {
          // Schema validation is handled in validate-tree; skip here
          continue;
        }

        const node = result.data;

        // Check content_file exists
        const contentFilePath = path.join(dir, node.content_file);
        if (!existsSync(contentFilePath)) {
          errors.push(
            `${relDir}: content_file "${node.content_file}" does not exist`
          );
        }

        // Check thumbnail exists
        const thumbnailPath = path.join(dir, node.thumbnail);
        if (!existsSync(thumbnailPath)) {
          errors.push(
            `${relDir}: thumbnail "${node.thumbnail}" does not exist`
          );
        }

        // Check notebook_file if specified
        if (node.notebook_file) {
          const notebookPath = path.join(dir, node.notebook_file);
          if (!existsSync(notebookPath)) {
            errors.push(
              `${relDir}: notebook_file "${node.notebook_file}" does not exist`
            );
          }
        }
      } catch (err) {
        errors.push(
          `${relDir}: failed to parse node.yaml — ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }

    return errors;
  });
}

function validateMarkdownStructure(): CheckResult {
  return check("Markdown files have proper structure", () => {
    const errors: string[] = [];

    // Check all markdown files in learning/
    const mdFiles = existsSync(LEARNING_DIR)
      ? glob.sync("**/*.md", { cwd: LEARNING_DIR, absolute: true })
      : [];

    for (const mdFile of mdFiles) {
      const relPath = path.relative(CONTENT_ROOT, mdFile);
      try {
        const content = readFileSync(mdFile, "utf-8").trim();

        if (content.length === 0) {
          errors.push(`${relPath}: file is empty`);
          continue;
        }

        // Check for a top-level heading (# Title) somewhere in the file
        const hasHeading = /^#\s+.+/m.test(content);
        if (!hasHeading) {
          errors.push(`${relPath}: missing a top-level heading (# Title)`);
        }
      } catch (err) {
        errors.push(
          `${relPath}: failed to read — ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }

    return errors;
  });
}

function validateMarkdownImageReferences(): CheckResult {
  return check("No broken image references in markdown files", () => {
    const errors: string[] = [];

    const mdFiles = existsSync(LEARNING_DIR)
      ? glob.sync("**/*.md", { cwd: LEARNING_DIR, absolute: true })
      : [];

    for (const mdFile of mdFiles) {
      const relPath = path.relative(CONTENT_ROOT, mdFile);
      const dir = path.dirname(mdFile);

      try {
        const content = readFileSync(mdFile, "utf-8");
        const imagePaths = extractMarkdownImagePaths(content);

        for (const imgPath of imagePaths) {
          const resolved = path.resolve(dir, imgPath);
          if (!existsSync(resolved)) {
            errors.push(`${relPath}: broken image reference "${imgPath}"`);
          }
        }
      } catch (err) {
        errors.push(
          `${relPath}: failed to read — ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }

    return errors;
  });
}

function validateWorkshopMetadata(): CheckResult {
  return check("Workshop directories have valid metadata.yaml", () => {
    const errors: string[] = [];
    if (!existsSync(WORKSHOPS_DIR)) return errors;

    // Each subdirectory of workshops/ should have a metadata.yaml
    const metadataFiles = glob.sync("*/metadata.yaml", {
      cwd: WORKSHOPS_DIR,
      absolute: true,
    });

    // Also find workshop dirs that are missing metadata.yaml
    const workshopDirs = glob.sync("*/", {
      cwd: WORKSHOPS_DIR,
      absolute: true,
    });

    for (const workshopDir of workshopDirs) {
      const dirName = path.basename(workshopDir);
      const metadataPath = path.join(workshopDir, "metadata.yaml");

      if (!existsSync(metadataPath)) {
        errors.push(`workshops/${dirName}: missing metadata.yaml`);
        continue;
      }
    }

    // Validate each found metadata.yaml
    for (const metaFile of metadataFiles) {
      const relPath = path.relative(CONTENT_ROOT, metaFile);
      try {
        const content = readFileSync(metaFile, "utf-8");
        const raw = YAML.parse(content);
        const result = MetadataYamlSchema.safeParse(raw);

        if (!result.success) {
          for (const issue of result.error.issues) {
            errors.push(`${relPath}: ${issue.path.join(".")} — ${issue.message}`);
          }
        }
      } catch (err) {
        errors.push(
          `${relPath}: failed to parse — ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }

    return errors;
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const results: CheckResult[] = [];

  results.push(validateLearningNodeDirectories());
  results.push(validateMarkdownStructure());
  results.push(validateMarkdownImageReferences());
  results.push(validateWorkshopMetadata());

  const allPassed = printResults(results);
  process.exit(allPassed ? 0 : 1);
}

main().catch((err) => {
  console.error(chalk.red("Unexpected error during content validation:"), err);
  process.exit(1);
});
