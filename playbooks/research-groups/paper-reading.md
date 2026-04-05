# The Paper Reading Pipeline

Reading research papers is a skill, and most undergraduates have never been taught how to do it. A structured paper reading pipeline turns your group from "we tried to read a paper and gave up after page 2" into "we can critically evaluate new work in our area." This page covers paper selection, reading protocols, discussion formats, and building a shared knowledge base.

## Selecting Papers

### Where to Find Papers
- **Conference proceedings**: NeurIPS, ICML, ICLR, AAAI, ACL, EMNLP, CVPR (depending on your area)
- **arXiv**: Filter by your sub-area and sort by recent. Check "Papers With Code" for papers with available implementations.
- **Curated lists**: Awesome lists on GitHub (e.g., awesome-transformers), Twitter/X threads from researchers, and blog posts that cite key papers
- **Reference chasing**: Read a paper you like, then read 2-3 papers it cites and 2-3 papers that cite it
- **Mentor recommendations**: If you have a faculty advisor, ask them for a "starter pack" of 5 foundational papers

### What Makes a Good Paper for Group Discussion

| Good for Discussion | Risky for Discussion |
|-------------------|---------------------|
| Clear methodology that can be understood with your group's background | Heavy on math that nobody in the group has seen before |
| Available code and data (so you can reproduce results) | No code, proprietary data, or unreproducible results |
| A concrete contribution (new method, new dataset, clear benchmark improvement) | Pure theory with no experiments |
| Published in the last 2-3 years | Seminal but dated (unless you are building foundational knowledge) |
| Reasonably short (8-15 pages) | 50-page survey (save these for individual reference, not group discussion) |

### Building a Reading Queue

Maintain a shared spreadsheet or document with your reading queue:

```
| Paper Title | Authors | Year | Venue | Status | Presenter | Key Contribution |
|-------------|---------|------|-------|--------|-----------|-----------------|
| [Title]     | [Names] | 2025 | ICML  | Read   | Alice     | New attention mechanism for long sequences |
| [Title]     | [Names] | 2024 | NeurIPS | Queued | Bob    | Benchmark for few-shot tabular classification |
```

Queue 4-6 papers ahead so you are never scrambling the day before a meeting.

## The Reading Protocol

The biggest failure mode for paper reading groups is simple: people show up without having read the paper. This protocol addresses that directly.

### Before the Meeting (Individual, 1-2 hours)

**First pass (30 minutes)**: Read the abstract, introduction, and conclusion. Look at all figures and tables. You should now understand what the paper claims to contribute.

**Second pass (30-45 minutes)**: Read the methodology section carefully. For each equation or algorithm, ask: "What is this doing and why?" Write down anything you do not understand.

**Third pass (15-30 minutes)**: Read the experiments and results. For each table or figure, ask: "Does this support the authors' claims? What is missing?"

### Reading Notes Template

Each group member fills this out before the meeting:

```markdown
# Paper: [Title]
# Reader: [Your name]

## One-sentence summary
[What does this paper do, in your own words?]

## Key contribution
[What is new here compared to prior work?]

## Strengths (2-3 bullet points)
- [What did the authors do well?]

## Weaknesses (2-3 bullet points)
- [What are the limitations, gaps, or questionable decisions?]

## Questions
- [What did you not understand?]
- [What would you ask the authors if you could?]

## Relevance to our project
[How does this relate to what we are working on? Any ideas it sparks?]
```

**Post these notes in your shared document at least 2 hours before the meeting.** This holds everyone accountable and gives the presenter time to address common questions.

## Meeting Discussion Format

### The Standard Format (60-75 minutes per paper)

| Time | Activity | Who |
|------|----------|-----|
| 0:00-0:15 | Paper presentation: background, method, results | Designated presenter |
| 0:15-0:25 | Clarification round: questions about things people did not understand | Everyone |
| 0:25-0:40 | Critical discussion: strengths, weaknesses, what is missing | Everyone |
| 0:40-0:50 | Connections: how does this relate to our project? Any ideas? | Everyone |
| 0:50-0:60 | Action items: experiments to try, follow-up papers to read | Project lead |

### Presentation Guidelines for the Presenter
- Do not just read the paper aloud. Explain it as if teaching someone who has not read it.
- Create 5-8 slides covering: problem setup, prior work (brief), proposed method, key results, and your take
- Redraw key figures rather than copying them. This forces you to understand what they show.
- Prepare 2-3 discussion questions to seed the conversation

### Discussion Facilitation Tips
- Go around the table and have each person share one strength and one weakness before opening to free discussion
- If the group is quiet, ask specific people: "Alice, what did you think about their choice of baseline?"
- Write key discussion points on a whiteboard or shared doc in real time
- End every discussion with "what should we do differently in our project based on this paper?"

## Building a Shared Knowledge Base

Over a semester, your group will read 10-15 papers. That knowledge is valuable only if you can access it later.

### The Paper Repository

Create a shared folder structure:

```
/research-group/
  /papers/
    /read/
      paper-title-1.pdf
      paper-title-1-notes.md
      paper-title-2.pdf
      paper-title-2-notes.md
    /to-read/
      paper-title-3.pdf
  /meeting-notes/
    week-01.md
    week-02.md
  /summaries/
    topic-overview.md
```

### Concept Map

After every 3-4 papers, spend 15 minutes updating a concept map that shows how the papers relate to each other and to your project. This can be:
- A diagram on a whiteboard (photograph it)
- A simple markdown document with sections and links
- A tool like Miro or Excalidraw

The concept map prevents the "we read 12 papers but cannot explain how they connect" problem.

## Common Failure Modes

1. **Nobody reads the paper**: Fix with the reading notes requirement. If notes are not posted, the meeting is rescheduled. This sounds harsh, but it only takes one reschedule for the group to start reading.

2. **The presenter just summarizes**: Push for critical analysis. After the summary, always ask: "What would you change about this paper?"

3. **Discussion stays surface-level**: Use specific prompts: "Is Experiment 3 fair to the baseline?" or "What happens if their assumption in Section 3.2 is wrong?"

4. **Papers are too hard**: Step back. Read a tutorial or survey first. There is no shame in spending two weeks building background before tackling a frontier paper.

5. **No connection to your project**: End every discussion with the explicit question: "What does this mean for what we are building?" If the answer is consistently "nothing," reconsider your reading list or your project direction.

## Reading Pace

A sustainable pace for an undergraduate research group:

- **Weeks 1-3**: 1 paper per week (build the habit and the background)
- **Weeks 4-8**: 1-2 papers per week (as you get faster and more focused)
- **Weeks 9-15**: 0-1 papers per week (shift focus toward your own experiments and writing)

Do not sacrifice experiment time for more reading. Reading is a means to doing, not an end in itself.
