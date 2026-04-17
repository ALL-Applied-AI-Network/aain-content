# Innovation Labs

We invented the Innovation Lab format in 2024 to give industry sponsors a way to work with students on real AI problems. Brady Corp was our first partner: $5K prize pool, 60 students, a working prototype at the end.

Innovation Labs sit between Hacksgiving (48 hours, nonprofit, AI-for-good) and Research Groups (6 months, original research, publication track). They're 8-week industry-sponsored competitions optimized for a working prototype the sponsor can actually use.

The inaugural Innovation Lab ran October 10 – December 7, 2024 with **Brady Corporation**. Their Director of AI Operations, Franz, brought us a real challenge: *predict the volume of liquid in a container from a single image.* Brady's customers measure fluids in lab and industrial settings, and current methods are slow. We handed students a YOLOv8 segmentation baseline and 8 weeks. 60 students from MSOE and UW-Milwaukee, ~7 teams. Liquid Boogaloo won ($2.5K, 9 members), Liquid Lens took second ($1.5K), a UW-Milwaukee team took third ($1K). Every participant got a recommendation letter and a Brady Corp T-shirt. Ben Paulson and Adam Haile co-organized.

Brady came back for Spring 2025. The format works: sponsors get early access to talent, students get a portfolio project with a real company name on it, and MAIC gets a funded track that complements Hacksgiving.

---

## Pitch a sponsor

**The Innovation Lab pitch is different from a speaker pitch or a hackathon pitch. Lead with the talent access, not the charity.**

### How we did it at MAIC

We pitched Brady Corp starting from a warm intro via `Matt Vandenbush` — MSOE '98 CE, Brady's VP of infrastructure. The first real meeting was July 23, 2024 with Franz (Director of AI Ops), Eric (Director of Business Ops), Matt, Adam (Brady Product Manager interested in AI), and Brad (SE from MSOE '03). Ben opened by recapping what MAIC was — *"Demystify AI for everyone. High-level ~40–50 per meeting. Low-level 150 students across 21 research teams last year"* — and then offered three sponsorship pathways: Speaker Events, Innovation Labs, Research Groups. Brady was interested in all three, landed on Innovation Labs at $5K.

Between July and September we had three more meetings with Franz to scope the problem. The NDA conversation was the hardest part — Brady's CEO and president were nervous about competitors seeing the code, and we spent two weeks in legal back-and-forth in September that we should have had in week one. We've since moved NDA discussion into the first meeting, always.

### The repeatable version

**The pitch flow:**

1. **First meeting (30–45 min):** Warm intro or short email. Understand their business, their AI capacity, and what they want out of a student partnership (talent, visibility, product adoption, goodwill). Lay out three sponsorship pathways: Speaker Event, Innovation Lab, Research Group.
2. **Second meeting (30 min):** Agree on the pathway. Discuss budget range ($5K is our default for an Innovation Lab). Discuss IP and NDA requirements **here**, not later.
3. **Third meeting (45 min):** Draft the problem statement together. Get specific about data availability, evaluation criteria, and what a "win" looks like.
4. **Contract + kickoff:** Legal handles the NDA / sponsorship agreement. You start promotion 4 weeks out.

**Ben's actual opening pitch at the first Brady meeting** (paraphrased from 7/23/2024 meeting notes):

> Thanks for agreeing to meet. Quick recap on MAIC: we demystify AI for everyone. Two event tracks — high-level talks that draw 40–50 per meeting, and low-level hands-on research groups that ran 150 students across 21 teams last year. Brad mentioned you were interested in the Hacksgiving formula. In 2023 our first Hacksgiving was with a non-profit, Next Step Clinic, sponsored by the Endowed Chair. Over 40 students competed for $6K. Top-3 teams actually implemented their work with Next Step. It's a MSOE relationship with strong not-for-profit focus, and we iterate the format every year. What's your goal with MAIC? That'll help me figure out which of our three pathways — Speaker Events, Innovation Labs, or Research Groups — fits best.

**Sponsorship tier template:**

| Tier | Amount | What they get |
|---|---|---|
| Innovation Lab (full) | $5K–$20K | Problem statement ownership, mentor engineer slot, final showcase invite, logo on all materials, recruiting access to top teams |
| Speaker Event (single) | $500–$2K (optional) | 45-min talk slot, Q&A, recording rights, club shoutouts |
| Research Group sponsor | In-kind + mentor time | Named mentor role, paper acknowledgment, student connection pipeline |

**Have the NDA conversation in meeting 1.** Every time. Even if the answer is "we don't need one," having the conversation up front prevents the 2-week legal sprint we did with Brady in September 2024.

**Ask for the mentor slot.** An Innovation Lab without a sponsor engineer available for weekly office hours is a hackathon with a longer runway. The mentor is what makes it valuable for the sponsor and for students.

### What we'd do differently

We under-scoped the NDA conversation. Brady's CEO and president were nervous about competitors seeing the code, and we spent two weeks in legal back-and-forth in September 2024 that we should have handled in week one. Always lock the IP answer before students see the problem brief.

---

## Run the lab

**8 weeks, one clear problem, a baseline, and weekly office hours with the sponsor.**

### How we did it at MAIC

Innovation Lab kickoff happens at the "Hands-On Project Celebration" — week 3 of the fall semester. Teams are announced, mentors are introduced, and students get the problem brief plus the baseline code. For Brady, that was a YOLOv8 segmentation notebook with their example data and a clear evaluation metric.

From kickoff onward, teams have 6 working weeks. Weekly office hours with Franz (Brady's AI Ops director) on Zoom. A mid-point check-in at week 4 where each team does a 2-minute status update. Eboard members are available via Discord for unblocking. Teams that don't push code in a full week get a check-in — we learned that from Adam Haile's "stuck team" rescue protocol in Hacksgiving, and it applies here too.

The 60 students split into teams of 6–9. Mixing skill levels is intentional — we want a senior ML student paired with freshmen, not all seniors on one team. Final presentations happen on a dedicated day, not as part of a regular meeting.

### The repeatable version

**8-week structure:**

| Week | What happens |
|---|---|
| 0 (Kickoff) | Teams announced. Problem brief + baseline code distributed. Mentor introduced. |
| 1–3 | Teams explore the problem space. First eval runs. Weekly office hours start. |
| 4 | Mid-point check-in. Each team 2-min status update in front of the group. |
| 5–6 | Teams iterate. Real engineering work. Mentor unblocks. |
| 7 | Final prep. Practice demos. Slides/code cleanup. |
| 8 (Showcase) | Final presentations + judging + announcement. |

**Team composition (6–9 members):**
- Aim for mix: 1–2 seniors, 2–3 juniors, 2–3 sophomores, 1–2 freshmen
- Skills mix: at least one experienced ML person per team, rest can be learning
- Cross-university teams are valuable — our Brady lab had MSOE + UWM on same teams

**Problem brief must include:**
- Problem statement in plain English
- Why the sponsor cares (business context)
- Available data (or clear "find your own")
- Baseline code link + setup instructions
- Evaluation metric (how teams will be judged technically)
- Constraints (licensing, compute budget, submission format)

**Mentor expectations:**
- 1-hour weekly office hours (Zoom)
- Async Discord availability for unblockers
- Never writes code — explains concepts and approaches
- Attends mid-point check-in + final showcase

**The "stuck team" protocol:**
- If a team has no git activity in 7 days, eboard member DMs the team lead
- If no response in 48 hours, eboard member joins the team's channel for a 15-min unblock
- Most teams just need a nudge, not intervention

### What we'd do differently

Year one we didn't require the mid-point check-in to be in-person / live — teams submitted written updates. Half submitted; the other half we never heard from until the showcase. Requiring everyone to do a 2-minute live status update at week 4 forces teams to actually confront whether they're on track, and the group format makes strugglers ask for help.

---

## Showcase and handoff

**The final day is a pitch event. The sponsor gets the code the next week.**

### How we did it at MAIC

Final presentations ran Dec 7, 2024 at Diercks Hall. Each team got 8 minutes: 5-min demo, 3-min Q&A. Four judges: Franz (Brady Ops), Eric (Brady Business), Ben (MAIC president), and one MSOE faculty. The rubric we built with Brady: **Technical quality 40%, Business applicability 40%, Presentation 20%**.

Liquid Boogaloo won with the cleanest application of YOLOv8 + a downstream volume estimation head that handled colored liquids and opaque containers. $2.5K split 9 ways. Everyone got a participation rec letter and a Brady Corp T-shirt. The winning team delivered cleaned-up code to Brady within 2 weeks.

Brady came back for Spring 2025 because the engagement was professional and the output was real. The showcase mattered, but the handoff mattered more.

### The repeatable version

**Showcase day:**
- 8-minute team slots (5 demo + 3 Q&A)
- Four judges (2 from sponsor, 1 from club, 1 faculty)
- Audience: all participating students + sponsor team + faculty
- Rubric printed and visible
- Awards ceremony immediately after judging (don't make people wait)

**Rubric template:**

| Criterion | Weight | What we look for |
|---|---|---|
| Technical quality | 40% | Code cleanliness, appropriate ML choices, evaluation rigor |
| Business applicability | 40% | Would the sponsor actually use this? Does it solve the real problem? |
| Presentation | 20% | Clarity of demo, response to questions, team chemistry |

**Prize distribution (scale to your budget):**
- 1st: 50% of pool
- 2nd: 30% of pool
- 3rd: 20% of pool
- All participants: recommendation letter + sponsor swag

**Handoff package to sponsor (within 2 weeks):**
- Cleaned-up code from top 3 teams (or top 1, depending on agreement)
- Deployment/setup instructions
- Data + artifacts used in training
- Contact info for team leads (for sponsor to ask questions)

**Recommendation letters:**
- Every student who completed the Lab gets one
- Signed by the MAIC president
- References the sponsor and the problem
- Takes ~30 minutes total if you template it

**Convert to recurring:**
- 30 days after showcase, email the sponsor: "Want to do this again next year?"
- Brady came back for Spring 2025 because we asked within 30 days of the Fall 2024 showcase

### What we'd do differently

We didn't formalize the mentor-rec-letter loop until after Fall 2024 — teams whose mentors engaged deeply should get a second letter co-signed by the sponsor mentor, not just MAIC. It's a small ask for the sponsor and a massive boost for the student. Build it into the handoff template.
