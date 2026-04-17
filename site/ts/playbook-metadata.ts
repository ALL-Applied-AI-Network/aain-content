/**
 * playbook-metadata.ts — Structured metadata for each playbook.
 *
 * Used by:
 *   - playbooks-page.ts (the dedicated Playbooks landing grid)
 *   - playbook-page.ts  (the action header at the top of each index page)
 *
 * When you add or rename a playbook, update this file. It is the single
 * source of truth for taglines, stat pills, and action cards.
 */

export interface PlaybookAction {
  /** Short label on the button — e.g. "Week 1", "Plan it (10wk)". */
  label: string;
  /** One-line sub-copy under the label — e.g. "Validate the idea". */
  sub: string;
  /** Relative path to the sub-page inside playbooks/<slug>/. */
  file: string;
}

export interface PlaybookStat {
  /** Numerical or short phrase — e.g. "60 → 500+", "$18K", "3 years". */
  value: string;
  /** Lowercase label — e.g. "member growth", "in prizes". */
  label: string;
}

export interface PlaybookMeta {
  slug: string;
  title: string;
  emoji: string;
  accent: string; // CSS color used for accents on this playbook
  tagline: string;
  stats: [PlaybookStat, PlaybookStat, PlaybookStat];
  actions: [PlaybookAction, PlaybookAction, PlaybookAction];
}

export const PLAYBOOKS: PlaybookMeta[] = [
  {
    slug: "getting-started",
    title: "Getting Started",
    emoji: "🚀",
    accent: "#3b82f6",
    tagline:
      "Launch your AI hub from scratch using the same playbook that grew MAIC from 60 active members to 500+ — the largest undergrad AI club in the US.",
    stats: [
      { value: "60 → 500+", label: "member growth" },
      { value: "5 years", label: "of iteration" },
      { value: "$50K+", label: "in prizes" },
    ],
    actions: [
      { label: "Week 1", sub: "Validate the idea", file: "validating-the-idea.md" },
      { label: "First semester", sub: "Run the arc", file: "first-semester.md" },
      { label: "Year two", sub: "Build for longevity", file: "building-for-longevity.md" },
    ],
  },
  {
    slug: "hackathons",
    title: "Hackathons",
    emoji: "🏆",
    accent: "#f59e0b",
    tagline:
      "The Hacksgiving playbook — 3 years of running 48-hour AI-for-good hackathons with Milwaukee nonprofits.",
    stats: [
      { value: "3 years", label: "of Hacksgiving" },
      { value: "$18K+", label: "in prize pool" },
      { value: "3 nonprofits", label: "partnered with" },
    ],
    actions: [
      { label: "Plan it (10wk)", sub: "Build the timeline", file: "timeline.md" },
      { label: "Run it (48hr)", sub: "Day-of operations", file: "day-of.md" },
      { label: "Wrap it", sub: "Post-hackathon", file: "post-hackathon.md" },
    ],
  },
  {
    slug: "speaker-series",
    title: "Speaker Series",
    emoji: "🎤",
    accent: "#22d3ee",
    tagline:
      "Bi-weekly Thursdays in the ITC Great Hall — how MAIC hosts NVIDIA, Direct Supply, Kohl's, and Generac with 40–50 in the room.",
    stats: [
      { value: "10+", label: "speakers / year" },
      { value: "Bi-weekly", label: "Thursday cadence" },
      { value: "40–50", label: "typical attendance" },
    ],
    actions: [
      { label: "Find a speaker", sub: "Outreach playbook", file: "finding-speakers.md" },
      { label: "Run the event", sub: "Day-of script", file: "running-the-event.md" },
      { label: "Build the series", sub: "Make it recurring", file: "recurring-series.md" },
    ],
  },
  {
    slug: "innovation-labs",
    title: "Innovation Labs",
    emoji: "🔬",
    accent: "#a855f7",
    tagline:
      "Sponsor-backed AI competitions. We invented this format in 2024 with Brady Corp — 60 students, $5K pool, real industry problems.",
    stats: [
      { value: "60 students", label: "in first Lab" },
      { value: "$5K+", label: "sponsor pool" },
      { value: "2 schools", label: "MSOE + UWM" },
    ],
    actions: [
      { label: "Pitch a sponsor", sub: "Sponsor outreach", file: "finding-sponsors.md" },
      { label: "Run the lab", sub: "8-week competition", file: "running-the-competition.md" },
      { label: "Showcase + handoff", sub: "Judge + deliver", file: "judging-and-showcase.md" },
    ],
  },
  {
    slug: "research-groups",
    title: "Research Groups",
    emoji: "📚",
    accent: "#ec4899",
    tagline:
      "6-month student research projects with ROSIE supercomputer access. 21 groups and 142 students in 2024 alone.",
    stats: [
      { value: "21 groups", label: "in 2024" },
      { value: "142 students", label: "in one year" },
      { value: "20+ papers", label: "published" },
    ],
    actions: [
      { label: "Form the group", sub: "Recruit + scope", file: "forming-the-group.md" },
      { label: "Run experiments", sub: "Read, design, test", file: "experiments.md" },
      { label: "Publish", sub: "MICS, arXiv, or blog", file: "publication-pipeline.md" },
    ],
  },
];

/** Find a playbook by slug. Returns undefined if not found. */
export function getPlaybook(slug: string): PlaybookMeta | undefined {
  return PLAYBOOKS.find((p) => p.slug === slug);
}
