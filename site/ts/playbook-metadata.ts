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
  /** In-page anchor the action scrolls to (e.g. "#week-1"). Must match a heading id in the playbook. */
  anchor: string;
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
  /** Inline SVG markup (string) used as the playbook's icon. Replaces the
   *  earlier emoji field — emoji renders inconsistently across platforms
   *  and never feels on-brand. The SVG inherits `currentColor` so the
   *  accent color drives the stroke. */
  icon: string;
  accent: string; // CSS color used for accents on this playbook
  tagline: string;
  stats: [PlaybookStat, PlaybookStat, PlaybookStat];
  actions: [PlaybookAction, PlaybookAction, PlaybookAction];
}

export const PLAYBOOKS: PlaybookMeta[] = [
  {
    slug: "getting-started",
    title: "Getting Started",
    icon: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
      <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
    </svg>`,
    accent: "#3b82f6",
    tagline:
      "Launch your AI hub from scratch using the same playbook that grew MAIC from 60 active members to 500+ — the largest undergrad AI club in the US.",
    stats: [
      { value: "60 → 500+", label: "member growth" },
      { value: "5 years", label: "of iteration" },
      { value: "$50K+", label: "in prizes" },
    ],
    actions: [
      { label: "Week 1", sub: "Validate and launch", anchor: "#week-1" },
      { label: "First semester", sub: "Run the arc", anchor: "#first-semester" },
      { label: "Year two", sub: "Build for longevity", anchor: "#year-two" },
    ],
  },
  {
    slug: "hackathons",
    title: "Hackathons",
    icon: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
      <path d="M4 22h16"/>
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
    </svg>`,
    accent: "#f59e0b",
    tagline:
      "The Hacksgiving playbook — 3 years of running 48-hour AI-for-good hackathons with Milwaukee nonprofits.",
    stats: [
      { value: "3 years", label: "of Hacksgiving" },
      { value: "$18K+", label: "in prize pool" },
      { value: "3 nonprofits", label: "partnered with" },
    ],
    actions: [
      { label: "Plan it", sub: "10-week countdown", anchor: "#plan-it" },
      { label: "Run it", sub: "48 hours on the clock", anchor: "#run-it" },
      { label: "Wrap it", sub: "Handoff and retro", anchor: "#wrap-it" },
    ],
  },
  {
    slug: "speaker-series",
    title: "Speaker Series",
    icon: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
      <line x1="12" y1="19" x2="12" y2="22"/>
    </svg>`,
    accent: "#22d3ee",
    tagline:
      "Bi-weekly Thursdays in the ITC Great Hall — how MAIC hosts NVIDIA, Direct Supply, Kohl's, and Generac with 40–50 in the room.",
    stats: [
      { value: "10+", label: "speakers / year" },
      { value: "Bi-weekly", label: "Thursday cadence" },
      { value: "40–50", label: "typical attendance" },
    ],
    actions: [
      { label: "Find a speaker", sub: "Sourcing and outreach", anchor: "#find-a-speaker" },
      { label: "Run the event", sub: "Day-of script", anchor: "#run-the-event" },
      { label: "Build the series", sub: "Make it recurring", anchor: "#build-the-series" },
    ],
  },
  {
    slug: "innovation-labs",
    title: "Innovation Labs",
    icon: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M9 2v6.31a4 4 0 0 1-.62 2.13L4.31 16.5A2.5 2.5 0 0 0 6.5 20.5h11a2.5 2.5 0 0 0 2.19-3.99l-4.07-6.07A4 4 0 0 1 15 8.31V2"/>
      <line x1="8" y1="2" x2="16" y2="2"/>
      <line x1="7.5" y1="12" x2="16.5" y2="12"/>
    </svg>`,
    accent: "#a855f7",
    tagline:
      "Sponsor-backed AI competitions. We invented this format in 2024 with Brady Corp — 60 students, $5K pool, real industry problems.",
    stats: [
      { value: "60 students", label: "in first Lab" },
      { value: "$5K+", label: "sponsor pool" },
      { value: "2 schools", label: "MSOE + UWM" },
    ],
    actions: [
      { label: "Pitch a sponsor", sub: "Sourcing and scoping", anchor: "#pitch-a-sponsor" },
      { label: "Run the lab", sub: "8-week competition", anchor: "#run-the-lab" },
      { label: "Showcase + handoff", sub: "Judge and deliver", anchor: "#showcase-and-handoff" },
    ],
  },
  {
    slug: "research-groups",
    title: "Research Groups",
    icon: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/>
      <line x1="9" y1="7" x2="15" y2="7"/>
      <line x1="9" y1="11" x2="15" y2="11"/>
    </svg>`,
    accent: "#ec4899",
    tagline:
      "6-month student research projects with ROSIE supercomputer access. 21 groups and 142 students in 2024 alone.",
    stats: [
      { value: "21 groups", label: "in 2024" },
      { value: "142 students", label: "in one year" },
      { value: "20+ papers", label: "published" },
    ],
    actions: [
      { label: "Form the group", sub: "Recruit and scope", anchor: "#form-the-group" },
      { label: "Run experiments", sub: "Read, design, test", anchor: "#run-experiments" },
      { label: "Publish", sub: "MICS, arXiv, or blog", anchor: "#publish" },
    ],
  },
];

/** Find a playbook by slug. Returns undefined if not found. */
export function getPlaybook(slug: string): PlaybookMeta | undefined {
  return PLAYBOOKS.find((p) => p.slug === slug);
}
