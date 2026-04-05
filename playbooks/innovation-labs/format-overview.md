# The Innovation Lab Format

This page covers the standard Innovation Lab structure from start to finish. Use it as a reference when planning your first Lab or adapting the format for your club's size and sponsor type.

## The Standard Timeline

A typical Innovation Lab runs 4-5 weeks. Here is the week-by-week breakdown:

| Week | Phase | Key Activities |
|------|-------|---------------|
| Week 0 | Pre-Launch | Sponsor alignment, problem brief finalized, team sign-ups open |
| Week 1 | Kickoff | Problem reveal, team formation, data access, initial exploration |
| Week 2 | Deep Work | EDA, baseline models, mentor office hours |
| Week 3 | Iteration | Model improvement, pipeline building, midpoint check-in |
| Week 4 | Polish | Final model tuning, presentation prep, dry runs |
| Week 5 | Showcase | Final presentations to sponsor panel, judging, awards |

For a 3-week compressed format, combine Weeks 2-3 into a single sprint and reduce the polish period to 2-3 days.

## Team Sizes

The sweet spot is **4 students per team**. Here is why:

- **3 students**: Works if all are strong. Risk of one person carrying the team.
- **4 students**: Allows natural role division (data prep, modeling, evaluation, presentation). One absence does not derail progress.
- **5 students**: Acceptable, but coordination overhead increases. Best when the problem has clearly separable components.
- **6+**: Avoid. Free-rider risk goes up sharply and teams struggle to divide work.

## Deliverable Milestones

Build accountability into the timeline with concrete deliverables at each stage.

### Milestone 1: Problem Understanding (End of Week 1)
- [ ] One-page problem statement in team's own words
- [ ] Initial EDA notebook with 5+ visualizations
- [ ] List of 3 candidate approaches with pros/cons
- [ ] Questions for the sponsor (submitted before first office hours)

### Milestone 2: Working Baseline (End of Week 2)
- [ ] At least one model producing predictions on the target task
- [ ] Evaluation metrics defined and baseline scores recorded
- [ ] Data pipeline documented (another team member could run it)
- [ ] Updated approach plan based on what they have learned

### Milestone 3: Improved Solution (End of Week 3)
- [ ] At least two approaches compared with documented results
- [ ] Error analysis showing where the model fails and why
- [ ] Draft of key findings for the final presentation
- [ ] Code cleaned up enough for a demo

### Milestone 4: Final Submission (End of Week 4)
- [ ] Final model with reproducible training and evaluation scripts
- [ ] Slide deck (8-12 slides, see Judging and Showcase for format)
- [ ] Written summary (1-2 pages) of approach, results, and recommendations
- [ ] 5-minute dry run completed with at least one peer reviewer

## How the Final Showcase Works

The showcase is a public event where teams present to the sponsor panel. Standard format:

1. **8-minute presentation** per team (strict time limit)
2. **5-minute Q&A** from judges
3. **Deliberation period** after all teams present (judges score independently, then discuss)
4. **Awards and feedback** given to all teams, not just winners

Invite everyone: club members who did not compete, faculty, other students, and the sponsor's broader team. The audience energy matters.

## Format Variations

### Small Club (Under 20 Members)
- Run 3-4 teams instead of 8-12
- Consider a single sponsor with one problem (all teams tackle the same challenge from different angles)
- Shorter timeline (3 weeks) to maintain energy

### Large Club (50+ Members)
- Multiple sponsors with different problems
- Add a "track" system where teams choose which problem to work on
- Consider a qualifying round where teams submit a proposal before being accepted

### Non-Technical Sponsor
- Spend extra time on problem scoping (see Scoping the Problem)
- Assign a "sponsor liaison" from your leadership team to translate between business language and technical requirements
- Simplify the final presentation format to focus on business impact over technical depth

### Remote or Hybrid
- Use a shared Slack or Discord channel per team for async collaboration
- Schedule synchronous mentor office hours with clear time slots
- Record final presentations for sponsors who cannot attend live
- Use a shared leaderboard (even a simple Google Sheet) to maintain competitive energy

## Room and Equipment Needs

- **Kickoff event**: Large room with projector, seats for all participants
- **Working sessions**: Book a room with power outlets and wifi for weekly co-working (optional but increases engagement by 2-3x)
- **Compute**: Most projects work fine with Google Colab or free-tier cloud credits. For GPU-heavy work, see if your university has a shared compute cluster or request cloud credits from the sponsor.
- **Showcase**: Largest room you can book. Projector, microphone if 30+ attendees, table for refreshments.

## Common Pitfalls

1. **Problem too vague**: If the sponsor says "use AI to improve our business," you need to scope harder. See Scoping the Problem.
2. **No data access by kickoff**: Teams cannot start without data. Get data transfer agreements sorted at least one week before kickoff.
3. **Ghost teams**: Teams that sign up but stop showing up. The milestone system catches this early. Follow up after Milestone 1 if a team goes silent.
4. **Sponsor disengagement**: If the sponsor stops answering questions, the Lab loses its edge over a regular hackathon. Set expectations in the sponsor agreement for response times.
5. **Presentation overload**: 12 teams x 13 minutes = nearly 3 hours. Cap at 8 teams per showcase session, or run parallel tracks with different judges.
