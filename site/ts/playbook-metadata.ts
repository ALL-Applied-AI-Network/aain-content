/**
 * playbook-metadata.ts — Structured metadata for each playbook.
 *
 * Used by:
 *   - playbooks-page.ts (the Playbooks library: the year map and the cards)
 *   - playbook-page.ts  (the header at the top of each playbook)
 *
 * The markdown in playbooks/<slug>/index.md is the source of truth for what a
 * playbook says. This file holds what the pages show around it. `tagline` repeats
 * the file's first paragraph, `keys` its three "Start here" lines,
 * `actions[].anchor` names its headings and `minutes` is its reading time:
 * scripts/validate-content.ts fails if any of them drifts from the markdown.
 *
 * The dashboard keeps its own copy (network-api src/lib/playbook-metadata.tsx).
 * The accents here are the dashboard's event-type colours, so a playbook wears
 * the same colour on both surfaces.
 */

export type PlaybookTrack = "The Whole Year" | "The Pulse" | "The Depth" | "The Money";

export interface PlaybookAction {
  /** Short label on the button, Title Case: "Week 1", "Plan It". */
  label: string;
  /** One-line sub-copy under the label: "Validate the idea". */
  sub: string;
  /** In-page anchor the action scrolls to (e.g. "#week-1"). Must match a heading id in the playbook. */
  anchor: string;
}

export interface PlaybookStat {
  /** A short fact: "8 weeks", "Every 2 weeks". */
  value: string;
  /** Lowercase label under it: "from the kick-off". */
  label: string;
}

/** A film that covers the same ground as the playbook, for people who would
 *  rather watch than read. Silent and captioned on screen, so it works muted. */
export interface PlaybookFilm {
  /** Path to the mp4, relative to the site root. */
  src: string;
  /** Poster frame shown before playback. */
  poster: string;
  /** Runtime as it reads on screen, e.g. "3:39". */
  runtime: string;
  /** What the film is called, which may differ from the playbook's title. */
  title: string;
  /** One line on what watching it gets you, in the playbook's own voice. */
  blurb: string;
}

export interface PlaybookMeta {
  slug: string;
  title: string;
  /** Inline SVG markup (string) used as the playbook's icon. It inherits
   *  `currentColor`, so the accent drives the stroke. */
  icon: string;
  /** CSS color for this playbook: the dashboard's colour for the same track. */
  accent: string;
  /** Which part of the year this playbook runs. */
  track: PlaybookTrack;
  /** The file's first paragraph, word for word: the reader shows it as the header's line. */
  tagline: string;
  /** Three facts that let someone compare playbooks at a glance. */
  stats: [PlaybookStat, PlaybookStat, PlaybookStat];
  actions: [PlaybookAction, PlaybookAction, PlaybookAction];
  /** The file's three "Start here" lines, word for word. */
  keys: [string, string, string];
  /** Reading time in minutes: words in the file / 220, rounded. */
  minutes: number;
  /** Optional: the film that covers this playbook. Not every playbook has one. */
  film?: PlaybookFilm;
}

const BUILD_FILM: PlaybookFilm = {
  src: "./public/film/how-to-run-a-build-event.mp4",
  poster: "./public/film/how-to-run-a-build-event.jpg",
  runtime: "3:02",
  title: "How to Run a Build Event",
  blurb: "Nine decisions behind an Innovation Lab or a hackathon, answered side by side.",
};

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
    accent: "#22d3ee",
    track: "The Whole Year",
    tagline: "How to open the year so people stay, run two tracks all semester, and hand the chapter on so it outlives you.",
    stats: [
      { value: "3 weeks", label: "decide the year" },
      { value: "2 tracks", label: "at once" },
      { value: "Week 5", label: "projects kick off" },
    ],
    keys: [
      "The first three weeks decide the year: org fair (week 0), say the whole year out loud (week 1), a great speaker by week 3, projects kicked off by week 5.",
      "Run two tracks at once: an hour-long event every two weeks in a slot that never moves, and at least one hands-on project a semester.",
      "Write down how you run things as you go, and recruit next year's board in the spring, not after graduation.",
    ],
    minutes: 6,
    actions: [
      { label: "Week 1", sub: "Prove there's demand", anchor: "#week-1" },
      { label: "First Semester", sub: "One slot, one project", anchor: "#first-semester" },
      { label: "Year Two", sub: "The first handoff", anchor: "#year-two" },
    ],
    film: {
      src: "./public/film/your-first-five-weeks.mp4",
      poster: "./public/film/your-first-five-weeks.jpg",
      runtime: "3:39",
      title: "Your First Five Weeks",
      blurb: "The five weeks that decide the year, week by week, with the calendar the arc runs on.",
    },
  },
  {
    slug: "speaker-series",
    title: "Speaker Series",
    icon: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
      <line x1="12" y1="19" x2="12" y2="22"/>
    </svg>`,
    accent: "#60a5fa",
    track: "The Pulse",
    tagline: "The pulse of the chapter: a speaker or a workshop every other week, in the same slot, with food. It's the front door most people walk through.",
    stats: [
      { value: "Every 2 weeks", label: "one fixed slot" },
      { value: "60 minutes", label: "then a hard stop" },
      { value: "Faculty first", label: "for speakers" },
    ],
    keys: [
      "Ask your own faculty first, then your sponsors' networks and alumni. Warm introductions beat cold outreach. Confirm each speaker four or more weeks out.",
      "One slot, never moved, every other week. Doors and food at 6:30, an intro under 90 seconds, a 45-minute talk, 15 minutes of Q&A with a seeded first question, hard stop at 60.",
      "The series is your sponsor pipeline: a thank-you the same week, a follow-up at 30 days, and one list of every speaker.",
    ],
    minutes: 3,
    actions: [
      { label: "Find a Speaker", sub: "Warm introductions first", anchor: "#find-a-speaker" },
      { label: "Run the Event", sub: "The hour, to the minute", anchor: "#run-the-event" },
      { label: "Build the Series", sub: "Speakers become sponsors", anchor: "#build-the-series" },
    ],
    film: {
      src: "./public/film/how-to-run-a-speaker-event.mp4",
      poster: "./public/film/how-to-run-a-speaker-event.jpg",
      runtime: "3:11",
      title: "How to Run Speaker Events",
      blurb: "The slot, the ask, the two weeks of promotion, and the hour itself drawn to scale.",
    },
  },
  {
    slug: "sponsorship",
    title: "Sponsorship",
    icon: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0L12 5.35l-.77-.77a5.4 5.4 0 0 0-7.65 7.65l.77.77L12 20.66l7.65-7.66.77-.77a5.4 5.4 0 0 0 0-7.65Z"/>
    </svg>`,
    accent: "#fbbf24",
    track: "The Money",
    tagline: "Every sponsor the founding chapter landed had already been in its room. How to get companies there, what to ask for, and how the money reaches your chapter.",
    stats: [
      { value: "A talk first", label: "then money" },
      { value: "501(c)(3)", label: "holds the money" },
      { value: "48 hours", label: "to say thank you" },
    ],
    keys: [
      "Sponsors come from people already in your room: past speakers, alumni at the company, faculty with funds. Ask for a speaker slot first, not money.",
      "In the first real meeting, put the NDA on the table, recap the chapter as if they know nothing, and offer pathways rather than a price.",
      "The Foundation holds a company's gift and issues the receipt, and your chapter directs the spend. Nobody pays from a personal card.",
    ],
    minutes: 3,
    actions: [
      { label: "Sources", sub: "Four paths that work", anchor: "#where-sponsors-actually-come-from" },
      { label: "The Sequence", sub: "Slot, thanks, follow-up", anchor: "#the-sequence" },
      { label: "First Meeting", sub: "NDA on day one", anchor: "#the-first-real-meeting" },
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
    accent: "#a78bfa",
    track: "The Depth",
    tagline: "A company brings a real problem, mixed teams build for eight weeks, and the company leaves with a working prototype. The easiest way into hands-on work.",
    stats: [
      { value: "8 weeks", label: "from the kick-off" },
      { value: "6 to 9", label: "students a team" },
      { value: "Newer students", label: "welcome" },
    ],
    keys: [
      "Lead with the problem their team actually has, and put NDA and IP on the table in the first meeting. Students don't sign NDAs.",
      "The shape: about eight weeks from the week 5 kick-off, teams of six to nine mixed across years, and a sponsor engineer holding weekly office hours.",
      "Close the loop: cleaned-up code to the sponsor within two weeks, a letter for every finisher, and an email 30 days after the showcase about the next one.",
    ],
    minutes: 4,
    actions: [
      { label: "Pitch a Sponsor", sub: "Three meetings", anchor: "#pitch-a-sponsor" },
      { label: "Run the Lab", sub: "Eight weeks, one problem", anchor: "#run-the-lab" },
      { label: "Showcase and Handoff", sub: "Judge and deliver", anchor: "#showcase-and-handoff" },
    ],
    film: BUILD_FILM,
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
    accent: "#f472b6",
    track: "The Depth",
    tagline: "A 48-hour build around one nonprofit's real problem, ending in code the nonprofit can keep. The founding chapter calls its version Hacksgiving.",
    stats: [
      { value: "48 hours", label: "in person" },
      { value: "2 to 7", label: "students a team" },
      { value: "10 weeks", label: "of planning" },
    ],
    keys: [
      "Lock one nonprofit partner ten weeks out and write a single challenge statement with them. It's final by week minus six.",
      "Announce it on the first slide of the semester, though registration opens at week minus four. A new chapter runs a hackathon or an Innovation Lab first, not both.",
      "Prize money never passes through a chapter account or a Venmo: the Foundation or your university pays it out. Sort that before you announce a figure.",
    ],
    minutes: 3,
    actions: [
      { label: "Plan It", sub: "Ten-week countdown", anchor: "#plan-it" },
      { label: "Run It", sub: "48 hours on the clock", anchor: "#run-it" },
      { label: "Wrap It", sub: "Handoff and payout", anchor: "#wrap-it" },
    ],
    film: BUILD_FILM,
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
    accent: "#4ade80",
    track: "The Depth",
    tagline: "A small team of advanced students, one mentor and one question, for about six months, ending in a paper, a poster or a release.",
    stats: [
      { value: "6 months", label: "into spring" },
      { value: "3 to 8", label: "students a group" },
      { value: "Mentor first", label: "then the topic" },
    ],
    keys: [
      "Mentors first, topics second, students third: lock mentors and topics over the summer and announce them in week 1.",
      "Set the bar in the sign-up form and hold it: 3–5 hours/week, weekly group meetings, at least one deliverable every 4 weeks.",
      "Pick the publication target by end of Month 2, and write the introduction while experiments still run.",
    ],
    minutes: 3,
    actions: [
      { label: "Form the Group", sub: "Mentors, topics, students", anchor: "#form-the-group" },
      { label: "Run Experiments", sub: "A deliverable every 4 weeks", anchor: "#run-experiments" },
      { label: "Publish", sub: "Pick the target early", anchor: "#publish" },
    ],
  },
];

/** Find a playbook by slug. Returns undefined if not found. */
export function getPlaybook(slug: string): PlaybookMeta | undefined {
  return PLAYBOOKS.find((p) => p.slug === slug);
}
