# The Publication Pipeline

Publishing is not the only valid outcome for a research group, but it is the highest-impact one. This page covers realistic publication targets for undergraduates, the writing process, submission logistics, and how to handle the outcome.

## Realistic Targets

Not every research group should aim for a top-tier conference paper. Match your target to your group's experience and output quality.

### Target Tiers (from most to least selective)

**Tier 1: Workshop Papers at Major Conferences**
- Venues: NeurIPS workshops, ICML workshops, ICLR workshops, ACL workshops
- Length: 4-6 pages (shorter than full papers)
- Review standard: Novel and interesting, does not need to be state-of-the-art
- Timeline: Deadlines are typically 2-3 months before the conference
- Why this works for undergrads: Shorter papers, more accepting of preliminary results, and presenting at a major conference is a huge career boost

**Tier 2: Undergraduate Research Conferences**
- Venues: NCUR (National Conference on Undergraduate Research), your university's undergraduate research symposium, regional CS conferences
- Length: 2-8 pages depending on the venue
- Review standard: Demonstrates research competency and clear methodology
- Timeline: Deadlines are usually mid-semester (check your institution's calendar)
- Why this works for undergrads: Designed for your level. Acceptance rates are higher and reviewers expect undergraduate-level work.

**Tier 3: arXiv Preprints**
- No peer review. You upload your paper and it is publicly available.
- Length: Any
- Why this works: Gets your work out there, creates a citable reference, and demonstrates research ability to grad school admissions and employers
- Caveat: No quality filter means it does not carry the same weight as peer review

**Tier 4: Technical Blog Posts**
- Venues: Your club's website, Medium, personal blogs, Towards Data Science
- Length: 1,000-3,000 words
- Why this works: Wider audience than a paper, demonstrates communication skills, and good practice for technical writing
- Often more impactful for career purposes than a paper nobody reads

**Tier 5: Open-Source Contributions**
- Release code, datasets, or tools publicly
- A well-documented GitHub repo with a clear README and reproducible results is a legitimate research output
- Can be combined with any of the above

## The Writing Process

### Start Writing Early

The biggest mistake research groups make is leaving all the writing for the last two weeks. Start writing the paper structure in Week 6-8 of the semester, even before all experiments are done.

### Paper Structure

Most AI papers follow this structure:

```
1. Abstract (150-250 words)
   - Problem, approach, key results, implication

2. Introduction (1-1.5 pages)
   - What problem are you solving and why does it matter?
   - What is your approach at a high level?
   - What are your main results?
   - What are your contributions? (bulleted list)

3. Related Work (0.5-1 page)
   - What has been done before? How is your work different?
   - Organize by theme, not chronologically

4. Method (1-2 pages)
   - Detailed description of your approach
   - Clear enough that someone could reproduce it

5. Experiments (1-2 pages)
   - Datasets, baselines, metrics, results tables
   - Ablation studies and analysis

6. Discussion / Analysis (0.5-1 page)
   - What do the results mean?
   - Where does the approach fail? Why?

7. Conclusion (0.5 page)
   - Summary and future work

References
```

### Dividing the Writing

| Section | Who Should Write It | When |
|---------|-------------------|------|
| Related Work | Literature Reviewer | Weeks 8-10 |
| Method | Experiment Lead | Weeks 10-12 |
| Experiments | Experiment Lead + others | Weeks 11-13 |
| Introduction | Project Lead | Week 12-13 |
| Abstract | Project Lead | Week 13-14 |
| Discussion/Conclusion | Writer/Communicator | Week 13-14 |

The Introduction and Abstract are written last because they summarize the full paper.

### The Editing Cycle

1. **Draft 1**: Get words on the page. Do not worry about polish.
2. **Internal review**: Every group member reads and comments. Meet to discuss.
3. **Draft 2**: Address comments, improve clarity, add missing details.
4. **Mentor review**: Send to your faculty or industry mentor for feedback.
5. **Draft 3**: Final version incorporating mentor feedback.
6. **Proofread**: At least one person reads the entire paper out loud. This catches errors that silent reading misses.

## Co-Authorship Norms

Authorship in AI research follows these general norms:

- **First author**: The person who did the most work (usually the project lead or experiment lead)
- **Last author**: The faculty advisor (if they contributed meaningfully)
- **Middle authors**: Other contributors, ordered by contribution level
- **Equal contribution**: If two people contributed equally, note this with an asterisk

### Rules for Your Group
Discuss authorship early (Week 3-4) and revisit mid-semester. Use these guidelines:

- Everyone who contributed to the research is a co-author
- Contribution includes: running experiments, writing sections, developing methodology, building the codebase, and managing the project
- Reading papers alone does not qualify for authorship (but presenting papers and guiding the group's direction does)
- If someone drops out early, acknowledge them in the acknowledgments section instead

## Submission Logistics

### Finding the Right Venue
1. Check conference deadlines at [AI Deadlines](https://aideadlin.es/) or WikiCFP
2. Read 2-3 accepted papers from the venue to understand the expected quality level
3. Match your paper's length and scope to the venue's requirements
4. Check formatting requirements (most venues use LaTeX templates)

### Submission Checklist

- [ ] Paper formatted using the venue's template (LaTeX or provided Word format)
- [ ] All figures are high quality and legible when printed
- [ ] References are complete (no "[?]" or missing entries)
- [ ] Page limit respected (including references if required)
- [ ] Anonymous submission if required (remove author names, self-citations written in third person)
- [ ] Supplementary materials prepared if allowed (code, extended results)
- [ ] All co-authors have reviewed and approved the final version
- [ ] Submission account created on the platform (OpenReview, CMT, EasyChair)
- [ ] Paper uploaded at least 2 hours before the deadline (systems crash near deadlines)

## Handling the Outcome

### If Accepted
- Celebrate. This is a real achievement for an undergraduate group.
- Prepare the camera-ready version (address any reviewer feedback)
- Prepare a poster or presentation (see Presenting and Sharing Work)
- Share the news with your club, university, and the ALL Applied AI Network

### If Rejected
- Read the reviews carefully. Most reviews contain useful feedback, even harsh ones.
- Separate "this needs more work" (fixable) from "this is not a good fit for this venue" (try another venue)
- Have the group discuss the reviews together. It stings less when you process it as a team.
- Revise based on the feedback and resubmit to another venue
- Rejection is normal. The acceptance rate at top workshops is 30-50%. At main conferences, it is 20-30%. Most published researchers have more rejections than acceptances.

### If You Do Not Submit
That is okay too. A strong technical blog post, an open-source tool, or an arXiv preprint are all valid outcomes. The research process itself (reading, questioning, experimenting, analyzing) is valuable regardless of whether it ends in a publication.
