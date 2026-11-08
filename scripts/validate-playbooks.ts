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
 *  - the headings the dashboard keys its pictures to are all still there, and
 *    every phrase those pictures stand on (DASHBOARD_PHRASES)
 *  - Getting Started's week-by-week table, word for word (WEEK_ROWS)
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

/**
 * The phrases the dashboard's pictures stand on. A copy of every `source` list in
 * network-api src/components/learn/stories.ts (STORIES and DOORS), as of origin/main
 * b823d279. The dashboard's own test (scripts/test-learn.cjs) checks them against the
 * LIVE files, so it only fails after a bad edit has deployed; this catches it first.
 * When stories.ts changes, copy its lists here.
 */
const DASHBOARD_PHRASES: Record<string, string[]> = {
  "getting-started": ["first three weeks", "org fair (week 0)", "a great speaker by week 3", "projects kicked off by week 5", "Two things run at once", "wider community", "landed people jobs", "takes hard work", "with upperclassmen on your team", "before Christmas break", "You do not need experience", "Talk to 20 students individually", "fewer than half", "10+ people show up and stay engaged for an hour", "Pick a day, time, and room", "Bi-weekly is the sweet spot", "costs about 15% of attendance", "Write the operations guide as you go", "shadows you for at least one event", "runs one alongside you", "with you shadowing them", "Room reservation process", "Sponsor contact list", "Lock in 2–4 co-founders"],
  "speaker-series": ["Your own faculty", "Sponsor networks", "Alumni at tech companies", "Local industry cold outreach", "Conference speakers passing through", "Always confirm 4 weeks out", "Doors and food at 6:30", "an intro under 90 seconds", "a 45-minute talk", "15 minutes of Q&A with a seeded first question", "hard stop at 60", "Same-week thank-you", "30-day follow-up", "single spreadsheet", "next 3 speakers confirmed", "every other week"],
  "innovation-labs": ["8-week industry-sponsored competitions", "working prototype", "First meeting (30–45 min)", "Second meeting (30 min)", "Third meeting (45 min)", "Have the NDA conversation in meeting 1", "$5K is our default", "two weeks in legal back-and-forth", "Team composition (6–9 members)", "weekly office hours", "Mid-point check-in", "8 (Showcase)", "Three judges is the right number", "Rubric printed and visible", "Technical quality", "within 2 weeks", "Every student who completed the Lab gets one", "30 days after showcase", "8-week", "Lead with the problem their team actually has"],
  hackathons: ["Lock nonprofit partner", "Problem statement finalized", "Registration opens", "Food + catering locked", "first slide of the semester", "Friday night kickoff", "hasn't pushed code in 4 hours", "3-minute demos", "2-minute Q&A", "Food rotation", "Within 2 hours of demos ending", "Within 48 hours", "Within 2 weeks", "Within 30 days", "Top-3 teams deliver cleaned-up code", "Prize money never passes through a chapter account", "Venmo", "disbursed by the Foundation", "pays out through the university", "48 hours", "We cap teams at 7, minimum 2", "Lock one nonprofit partner"],
  "research-groups": ["mentors first, topics second, students third", "3–5 hours/week", "Weekly group meetings", "At least one deliverable every 4 weeks", "Literature review summary", "Experiment plan + first baseline results", "first paper draft", "Final paper", "2-week informal", "by end of Month 2", "Technical blog post", "Open-source release", "MICS", "Workshop paper", "Main conference paper", "6-month", "teams of 3–8", "Mentors first, topics second"],
  sponsorship: ["501(c)(3)", "holds and accounts for the money", "your chapter directs how it's spent", "the receipt states what is tax-deductible", "Speakers you already hosted", "Alumni at the company", "Faculty with endowed or discretionary funds", "The network", "had already been in our room", "Ask for a speaker slot first, not money", "Thank them within 48 hours", "Follow up within 30 days", "The tiers are how you close, not how you open", "two weeks of September legal back-and-forth", "NDA question on the table in **meeting one**", "relationship activity"],
};

/**
 * Getting Started's week-by-week table, row by row, as the dashboard's semester map
 * draws it (network-api src/components/learn/semester.ts WEEKS_OFFLINE, which its
 * test holds equal to the live file). `food` is the italic "food" note on the row.
 */
const WEEK_ROWS: Array<{ week: string; text: string; food: boolean }> = [
  { week: "0", text: "Org fair. Talk about the club, get people onto an interest list, get them saying they'll come to the first event.", food: false },
  { week: "1", text: "\"What is [your club]?\" The whole plan for the year, out loud.", food: true },
  { week: "2", text: "\"Getting a hands-on project.\" Why to join one, how, and what actually happens.", food: true },
  { week: "3", text: "Your first real event. Make it a great speaker.", food: true },
  { week: "4", text: "Another real event, or your first break week if you need one.", food: false },
  { week: "5", text: "The kick-off. Sign-ups closed earlier in the week; this is the reveal of who's on which team and who's mentoring them.", food: false },
  { week: "6+", text: "Bi-weekly speaker events and workshops. Weekly is fine if you can sustain it, the largest orgs typically run one a week.", food: false },
];

/** How the dashboard's test compares a phrase with a file. */
const norm = (t: string): string => t.replace(/\*\*|\*|`/g, "").replace(/\s+/g, " ").toLowerCase();

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

  // The phrases the dashboard's pictures stand on
  const text = norm(md);
  for (const q of DASHBOARD_PHRASES[slug] ?? []) {
    if (!text.includes(norm(q))) at(`the dashboard's pictures need the phrase "${q}"`);
  }

  // Getting Started's week table drives the dashboard's semester map, word for word
  if (slug === "getting-started") {
    const from = lines.findIndex((l) => /week by week/i.test(l));
    const rows = from === -1 ? [] : lines.slice(from + 1).filter((l) => l.startsWith("|")).map((l) => l.split("|").slice(1, -1).map((c) => c.trim())).filter((c) => /^\d+\+?$/.test(c[0]?.replace(/\*/g, "") ?? ""));
    const weeks = rows.map((c) => c[0].replace(/\*/g, ""));
    if (weeks.join(",") !== WEEK_ROWS.map((r) => r.week).join(",")) at(`the week-by-week table must list weeks 0 to 6+, found ${weeks.join(",") || "no table"}`);
    else
      rows.forEach((c, i) => {
        const want = WEEK_ROWS[i];
        const food = /\*[^*]*food[^*]*\*/i.test(c[1]);
        const said = norm(c[1].replace(/\*(?!\*)[^*]*food[^*]*\*(?!\*)/i, ""));
        if (said.trim() !== norm(want.text)) at(`week ${want.week} of the week-by-week table must read "${want.text}" (the dashboard's semester map)`);
        if (food !== want.food) at(`week ${want.week} of the week-by-week table ${want.food ? "needs" : "must not have"} its italic food note`);
      });
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
