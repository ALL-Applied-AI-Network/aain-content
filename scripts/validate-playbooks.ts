#!/usr/bin/env tsx
/**
 * validate-playbooks.ts
 *
 * The six playbooks are read in three places: the public reader, the library
 * page, and the dashboard's Getting Started reader, which fetches the markdown
 * live from all-ai-network.org. This keeps the files and site/ts/playbook-metadata.ts
 * honest with each other and with the house rules (playbooks/PLAYBOOK-STYLE.md):
 *
 *  - the shape: a lede, exactly three single-line "Start here" keys, and every
 *    other ## heading opening with a bold lead under 260 characters
 *  - the headings the dashboard keys its pictures to are all still there
 *  - Getting Started's week-by-week table still has weeks 0 to 6+
 *  - metadata: tagline = the lede, keys = the Start here lines, every action's
 *    anchor is a heading, minutes = the reading time
 *  - copy: no em dashes, no banned words, no email address, phone number or
 *    long digit code, no third party named by a personal title
 *
 * Exit code 0 = all checks pass, 1 = one or more failures.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import chalk from "chalk";
import { PLAYBOOKS } from "../site/ts/playbook-metadata.js";

const ROOT = path.resolve(import.meta.dirname, "..");
const SLUGS = ["getting-started", "speaker-series", "sponsorship", "innovation-labs", "hackathons", "research-groups"];

/** The ## and ### headings the dashboard reader's pictures and old links depend on. */
const REQUIRED_IDS: Record<string, string[]> = {
  "getting-started": ["start-here", "quick-guide", "week-1", "first-semester", "year-two", "the-repeatable-version-1", "how-we-did-it-at-maic-2"],
  "speaker-series": ["start-here", "find-a-speaker", "run-the-event", "build-the-series"],
  sponsorship: ["start-here", "how-we-did-it-at-maic", "the-repeatable-version", "what-wed-do-differently", "where-sponsors-actually-come-from", "the-sequence", "the-first-real-meeting"],
  "innovation-labs": ["start-here", "pitch-a-sponsor", "run-the-lab", "showcase-and-handoff"],
  hackathons: ["start-here", "plan-it", "run-it", "wrap-it"],
  "research-groups": ["start-here", "form-the-group", "run-experiments", "publish"],
};

const BANNED = /\b(verified|proven|celebration|seamless|powerful|sponsor view)\b/i;

/** Heading ids as rehype-slug (github-slugger) gives them, repeats numbered. */
function slugger(): (text: string) => string {
  const seen = new Map<string, number>();
  return (text) => {
    const base = plain(text).toLowerCase().replace(/[^\p{L}\p{M}\p{N}\p{Pc}\- ]/gu, "").replace(/ /g, "-");
    let out = base;
    while (seen.has(out)) {
      const n = (seen.get(base) ?? 0) + 1;
      seen.set(base, n);
      out = `${base}-${n}`;
    }
    seen.set(out, 0);
    return out;
  };
}

function plain(md: string): string {
  return md
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*\s][^*]*)\*/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

/** Words a person reads: link text not URLs, and no table pipes. */
export function readingMinutes(md: string): number {
  const words = md
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .split(/\s+/)
    .filter((w) => /[A-Za-z0-9]/.test(w)).length;
  return Math.max(1, Math.round(words / 220));
}

function checkPlaybook(slug: string): string[] {
  const errors: string[] = [];
  const md = readFileSync(path.join(ROOT, "playbooks", slug, "index.md"), "utf-8");
  const meta = PLAYBOOKS.find((p) => p.slug === slug);
  const at = (msg: string) => errors.push(`${slug}: ${msg}`);
  if (!meta) at("missing from site/ts/playbook-metadata.ts");

  // Headings and their ids
  const slug2 = slugger();
  const headings: Array<{ level: number; text: string; id: string; line: number }> = [];
  const lines = md.split(/\r?\n/);
  let fence = false;
  lines.forEach((l, i) => {
    if (/^\s*(```|~~~)/.test(l)) fence = !fence;
    const h = fence ? null : l.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (h) headings.push({ level: h[1].length, text: h[2], id: slug2(h[2]), line: i });
  });
  const ids = new Set(headings.map((h) => h.id));
  for (const id of REQUIRED_IDS[slug] ?? []) if (!ids.has(id)) at(`the dashboard needs a heading with id #${id}`);

  // The lede: the first paragraph after the H1
  const afterTitle = md.replace(/^#\s+.*\n/, "");
  const lede = afterTitle.split(/\n\s*\n/).map((p) => p.trim()).find(Boolean) ?? "";
  if (!lede || /^[#|>\-*\d]/.test(lede)) at("the first paragraph after the title must be a one-line lede");
  if (meta && meta.tagline !== lede) at("tagline in playbook-metadata.ts must equal the file's first paragraph");

  // Start here: exactly three single-line numbered keys
  const start = headings.find((h) => h.id === "start-here");
  if (start) {
    const next = headings.find((h) => h.line > start.line && h.level <= 2);
    const body = lines.slice(start.line + 1, next ? next.line : undefined).filter((l) => l.trim());
    const keys = body.map((l) => l.match(/^\d+\.\s+(.*)$/)?.[1]).filter((k): k is string => Boolean(k));
    if (keys.length !== 3 || body.length !== 3) at(`Start here must be exactly three numbered lines, found ${body.length}`);
    if (meta && JSON.stringify(meta.keys) !== JSON.stringify(keys)) at("keys in playbook-metadata.ts must equal the Start here lines");
  }

  // Every other H2 opens with a bold lead under 260 characters
  for (const h of headings.filter((x) => x.level === 2 && x.id !== "start-here")) {
    const first = lines.slice(h.line + 1).find((l) => l.trim()) ?? "";
    if (!/^\*\*[^*]+\*\*$/.test(first.trim())) at(`"## ${h.text}" must open with a bold lead line`);
    else if (plain(first).length >= 260) at(`"## ${h.text}" lead is ${plain(first).length} characters (under 260)`);
  }

  // Metadata anchors and reading time
  if (meta) {
    for (const a of meta.actions) if (!ids.has(a.anchor.replace(/^#/, ""))) at(`action "${a.label}" points at ${a.anchor}, which isn't a heading`);
    const minutes = readingMinutes(md);
    if (meta.minutes !== minutes) at(`minutes is ${meta.minutes} in playbook-metadata.ts but the file reads in ${minutes}`);
  }

  // Getting Started's week table drives the dashboard's semester map
  if (slug === "getting-started") {
    const from = lines.findIndex((l) => /week by week/i.test(l));
    const weeks = lines.slice(from + 1).filter((l) => l.startsWith("|")).map((l) => l.split("|")[1]?.replace(/\*/g, "").trim()).filter((w) => /^\d+\+?$/.test(w ?? ""));
    if (weeks.join(",") !== "0,1,2,3,4,5,6+") at(`the week-by-week table must list weeks 0 to 6+, found ${weeks.join(",")}`);
  }

  // Copy rules
  lines.forEach((l, i) => {
    const where = `line ${i + 1}`;
    if (l.includes("—")) at(`${where}: em dash`);
    if (BANNED.test(l)) at(`${where}: banned word "${l.match(BANNED)?.[0]}"`);
    if (/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[a-z]{2,}/i.test(l)) at(`${where}: an email address`);
    if (/\(?\b\d{3}\)?[-. ]\d{3}[-. ]\d{4}\b/.test(l)) at(`${where}: a phone number`);
    if (/\b\d{6,}\b/.test(l)) at(`${where}: a long number that could be a code`);
    if (/\b(Dr|Prof|Mr|Ms|Mrs)\.\s+[A-Z]/.test(l)) at(`${where}: a person named by title; use the role`);
  });

  return errors;
}

function main(): void {
  const errors = SLUGS.flatMap(checkPlaybook);
  const extra = PLAYBOOKS.filter((p) => !SLUGS.includes(p.slug)).map((p) => `${p.slug}: in playbook-metadata.ts but not a playbook`);
  const all = [...errors, ...extra];
  console.log();
  console.log(chalk.bold("Playbook Validation"));
  console.log(chalk.dim("=".repeat(50)));
  if (all.length === 0) {
    console.log(chalk.green(`  ✓  ${SLUGS.length} playbooks: shape, dashboard headings, metadata and copy rules`));
    console.log();
    return;
  }
  for (const e of all) console.log(chalk.red(`  ✗  ${e}`));
  console.log();
  process.exit(1);
}

main();
