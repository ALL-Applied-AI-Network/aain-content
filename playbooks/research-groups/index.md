# Research Groups

6-month student research projects with ROSIE supercomputer access. 21 groups and 142 students in 2024 alone, 20+ papers published over three years, $10K+ in research competition winnings.

Research groups at MAIC are 6-month projects, November through April, that take teams of 3–8 students from literature review to a paper, poster, or conference submission. Every group gets a mentor (faculty, grad student, or industry researcher), access to ROSIE (our NVIDIA GPU-powered on-campus supercomputer, administered via `Dr. Retert`), and a path to present at MICS (the regional Midwest Instruction and Computing Symposium) or the ROSIE Supercomputer Super Challenge.

In 2024 we ran 21 research groups with 142 students — the largest single-year cohort in club history. Sample projects: **Lucas Gral's** LLMs for Foreign Languages (adaptive language learning that outperforms Duolingo-style flashcards); **William Lassiter's** AI for Vocal Cord Mobility Analysis (non-invasive ultrasound alternative to endoscopy); **Sam Keyser's** Multi-Agent RL in "The Crew" (cooperative agents with imperfect information); **Ben Paulson's** Nilus Project (collaboration with a Chilean startup building AI for artificial glaciers). Other featured groups: NourishNet, Silent Sound Synthesizers, Brain Alignment Innovators.

Ben was a 3× finalist at the ROSIE Supercomputer Super Challenge and won MICS Best Paper in both 2022 and 2024. Research groups are what convert members into contributors.

---

## Form the group

**The group is only as good as the commitment. Set the bar high and flakes will self-select out.**

### How we did it at MAIC

Research group formation happens at the Hands-On Project Celebration in Week 3 of the fall semester. This is where students who signed up via the hands-on project interest form get placed onto teams with announced mentors and announced topics. By the end of Week 3, every group member knows exactly what they're committing to: the mentor, the topic, the team, the ROSIE access next steps.

We pick mentors first, topics second, students third. Mentors are usually faculty (Dr. Kedziora, Dr. Yoder, Dr. Bukowy have all mentored multiple groups), sometimes grad students, occasionally industry researchers. Each mentor proposes a topic in the scope of their research interest — that way they're genuinely invested, not just assigned. Students rank their top 3 topic preferences on the signup form, and we match as best we can.

Group sizes vary: 3 for a small focused project, up to 8 for a bigger ambitious one. Mixed skill levels on purpose — a junior who's taken the CS ML class paired with freshmen who just finished Python.

### The repeatable version

**Who owns what:**
- **Mentor:** Proposes topic, sets direction, meets weekly with group, signs papers
- **Project lead (student):** Runs weekly meetings, owns the deliverable timeline, unblocks teammates
- **Group members:** Do the work. Read papers, write code, run experiments, write sections

**Formation timeline:**

| When | What |
|---|---|
| Summer before fall | Eboard recruits mentors, locks topics |
| Week 1 (semester) | Announce topics + mentors at Intro to MAIC |
| Week 2 | Open interest form — students rank top 3 topics |
| Week 3 (Celebration) | Teams announced, mentors introduced, ROSIE access begins |
| Weeks 4+ | Groups meet weekly, work through the semester |

**Interest form fields:**
- Name, year, major
- Top 3 topic preferences with 1-sentence why
- Available weekly meeting times
- Tech skills self-rating
- Hours/week commitment they can make

**The commitment bar we set:**
- 3–5 hours/week for the duration of the project
- Weekly group meetings (non-negotiable)
- At least one deliverable every 4 weeks
- Members who miss 2 weekly meetings without notice get dropped

**Incentives that work:**

| Incentive | Earn by |
|---|---|
| Points toward merch | Attending RG meetings |
| Researcher Hoodie | Participating in a research group |
| MICS cord + stole at graduation | Presenting research at MICS |
| Publication credit | Co-authoring the paper |
| ROSIE compute access | Automatic for all RG members |

### What we'd do differently

Early research groups (2021–22) had low commitment thresholds — we let students join with "whatever time you have." By week 6 half the groups had drifted. Now the signup form requires a specific hours/week commitment, and we explicitly set the 2-missed-meetings rule. The groups that stayed in 2022 still produce citations in our 2024 papers; the ones that drifted disappeared.

---

## Run experiments

**Read, design, test, iterate. A 4-week milestone cadence keeps groups from drifting.**

### How we did it at MAIC

The 6-month research group runs on a 4-week milestone cadence. Every 4 weeks each group delivers something concrete: a literature review summary, an experiment plan, first results, draft paper sections. If a group misses a milestone, the mentor intervenes rather than letting it drift to the next checkpoint. This rule alone raised our completion rate dramatically between 2022 and 2024.

Weekly group meetings rotate between paper reading and experiment work. For paper reading, the rule is everyone skims the paper before the meeting; during the meeting we go section-by-section with the mentor explaining hard parts. For experiment work, the project lead runs the agenda: what shipped this week, what's blocked, who's doing what next.

ROSIE access is automatic for research group members — `Dr. Retert` adds new members to the `ai_club` directory. Compute budgets are effectively unlimited for research groups (we've never had a team exceed what ROSIE can provide).

### The repeatable version

**The 6-month arc (November–April):**

| Month | Milestone |
|---|---|
| Month 1 (Nov) | Literature review summary |
| Month 2 (Dec) | Experiment plan + first baseline results |
| Month 3 (Feb) | Main experiments running, initial results |
| Month 4 (Mar) | Results + analysis, first paper draft |
| Month 5 (Apr) | Final paper + presentation practice |
| Month 6 (Apr/May) | MICS or other submission, showcase |

**Weekly meeting cadence:**
- **Paper-reading weeks:** Full group discusses one paper (selected by mentor)
- **Experiment weeks:** Project lead runs status + next steps agenda
- Alternate, or weight toward experiments in the later months

**Paper-reading protocol:**
- Mentor selects paper on Sunday, posts to Discord
- Everyone skims before Thursday meeting
- At meeting: one member gives 5-min summary, mentor fills gaps, group debates implications for their project
- Maintain a shared "lit review" doc in Notion or Google Drive — one paragraph per paper

**ROSIE compute workflow:**
- Students get `ai_club` directory access via Dr. Retert
- JupyterLab interface for most experiments
- SLURM for longer batch jobs
- Shared conda environments per group

**Experiment tracking:**
- Every experiment logged in a shared spreadsheet: config, seed, dataset, metric, result
- W&B or MLflow for detailed tracking (optional but helpful)
- Commit to a shared Git repo at least weekly

### What we'd do differently

We undervalued the mid-month check-in between major milestones. Groups would hit the 4-week milestone with a rushed deliverable, then drift for 3 weeks, then cram the next one. In 2024 we added a 2-week informal "what are you working on this week" check-in that sits between the 4-week milestones. Lightweight, 15 minutes, but it catches drift early.

---

## Publish

**A research group that doesn't publish is a study group. Pick your target early and write as you go.**

### How we did it at MAIC

Every research group picks a publication target by end of Month 2. Most aim for **MICS** (the regional Midwest conference) — lower barrier than a top-tier venue, but a real peer-reviewed submission that students can cite. Some aim for the **ROSIE Supercomputer Super Challenge** (campus-level, $2–5K + NVIDIA GPU prize). A few aim for workshop papers or arXiv preprints. A few ship an open-source release + technical blog post as the deliverable.

Ben Paulson won MICS Best Paper in 2022 and 2024. Several of our 2024 research groups presented at MICS 2025. The cord-and-stole honors incentive we created rewards students who present at any peer-reviewed venue — they walk at graduation with visible recognition.

Writing happens in parallel with experiments, not after them. We draft the intro + related work + methodology in Month 3 while experiments are still running, then fill in the results and discussion in Month 4. Groups that wait to write until experiments are "done" always run out of time.

### The repeatable version

**Publication targets from easiest to hardest:**

| Target | Barrier | Typical acceptance |
|---|---|---|
| Technical blog post | Very low | 100% (you publish it) |
| Open-source release + README | Very low | 100% (you ship it) |
| ROSIE Competition | Medium (internal review) | 50–70% get finalist |
| MICS | Medium (regional peer review) | 60–80% |
| arXiv preprint | No review required | 100% if submitted |
| Workshop paper (NeurIPS, ICML, ACL workshops) | High (peer review) | 20–40% |
| Main conference paper | Very high | 5–25% |

**Write as you go:**
- Month 3: Draft intro + related work + methodology sections
- Month 4: Fill in results + discussion
- Month 5: Polish, cite checking, abstract, final passes
- Month 6: Submit

**Co-authorship norms:**
- Everyone who contributes significantly gets authorship
- Author order: biggest contributor first, advisor last
- Include the mentor and the project lead by default; everyone else by contribution

**Handling rejection:**
- Don't take it personally. MICS Best Paper winners had other papers rejected that year.
- Submit to the next venue. A rejected paper + reviewer feedback makes the next submission stronger.
- Post to arXiv in the meantime so the work is citable.

**Beyond the paper:**
- Pitch a talk at MICS or the ROSIE Competition
- Write a blog post recap for your club website
- Make the code + data public on GitHub if possible
- Add the publication to your university's research showcase

### What we'd do differently

We used to let groups pick publication targets late (Month 4 or 5), which meant they'd aim for easier venues because they'd already missed submission deadlines for better ones. Now we require groups to pick a target by end of Month 2 and put the submission deadline on their calendar. The target shapes how they write; writing without one is academic cosplay.
