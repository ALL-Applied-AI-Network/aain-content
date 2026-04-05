# Running the Competition

The weeks between kickoff and showcase are where the real work happens. Your job as organizer shifts from event planning to project management. This page covers how to keep teams productive, handle problems early, and maintain energy through the middle weeks.

## Week-by-Week Guide

### Week 1: Exploration
**Your focus**: Make sure every team has working data access and understands the problem.

- Check in with every team lead by Wednesday to confirm data is loaded
- Hold your first office hours session (even if the sponsor is not there yet, you should be available)
- Collect Milestone 1 deliverables at end of week
- Review submissions and flag any team that seems stuck or confused

**Warning signs to watch for**:
- A team has not loaded the data yet
- A team's problem statement does not match the actual problem (they misunderstood)
- A team member has not shown up to any working sessions

### Week 2: Building
**Your focus**: Help teams move from exploration to working models.

- Review Milestone 1 submissions and give brief feedback (2-3 sentences per team)
- Sponsor office hours should start this week (schedule 2 slots, 30-45 min each)
- Share a quick "tips from last time" message in the main channel (common pitfalls, useful libraries, data quirks you have noticed)
- Collect Milestone 2 deliverables at end of week

**Warning signs**:
- A team is still doing EDA and has not started modeling
- A team is overcomplicating their approach (building a custom transformer when logistic regression would be a strong baseline)
- Communication has gone quiet in a team's channel

### Week 3: Iteration
**Your focus**: Push teams to go deeper, not wider.

- Encourage teams to do error analysis before trying more models
- Facilitate cross-team knowledge sharing (a brief 15-minute standup where each team shares one thing they learned)
- Collect Milestone 3 deliverables at end of week
- Start planning showcase logistics (room, projector, food, judges)

**Warning signs**:
- A team is stuck on the same accuracy and cannot improve
- A team has abandoned their approach and started over (help them salvage what they have)
- Team conflicts are surfacing (address immediately, see below)

### Week 4: Polish
**Your focus**: Shift attention from modeling to communication.

- Run a presentation workshop or share a slide template
- Schedule dry run presentations (each team presents to another team for feedback)
- Final Milestone 4 deliverables due by end of week
- Finalize showcase logistics: confirm judges, order food, test AV equipment

**Warning signs**:
- A team has a great model but cannot explain what it does
- A team has not started their slides yet
- A team member wants to drop out (talk to them; they have come this far)

## Office Hours

Office hours are the sponsor's primary engagement point during the Lab. Structure them well.

### Format
- **Duration**: 45 minutes per session, 2 sessions per week
- **Signup**: Teams sign up for 15-minute slots in advance
- **Location**: Video call works fine, but in-person is better if possible
- **Standing agenda**: Team gives 2-minute update, then asks questions for remaining time

### Tips for Effective Office Hours
- Have teams submit their questions 24 hours in advance so the mentor can prepare
- If a team does not sign up, reach out to them (they might be stuck but too intimidated to ask)
- Take notes on common questions and share answers with all teams
- If the sponsor mentor is unavailable one week, do not skip it. Run the session yourself and relay questions.

## Managing Teams That Are Stuck

Every Lab will have at least one team that hits a wall. Here is how to help:

### Technical Blockers
1. **Data issues**: Point them to documentation, connect them with the sponsor engineer, or help debug data loading
2. **Model not learning**: Suggest they simplify. Drop features, use a smaller dataset, try a simpler model. A working logistic regression beats a broken neural network.
3. **Compute limits**: Help them access university compute resources, optimize their code, or reduce dataset size for experimentation
4. **Library/tooling problems**: Pair them with a more experienced team member or connect them with a club mentor

### Motivation Blockers
1. **Behind other teams**: Remind them that judging values approach and insights, not just performance metrics. A team that clearly explains why their model struggles can score well.
2. **Internal conflict**: Meet with the team privately. Clarify roles, redistribute work if needed, and check back in 2 days.
3. **Perfectionism**: Some teams refuse to submit milestones because their work is not "good enough." Normalize iteration. The milestone is a checkpoint, not a final grade.

## Communication Channels

Set up clear communication infrastructure at the start:

### Channel Structure
```
#innovation-lab-general     - Announcements, deadlines, shared resources
#innovation-lab-questions    - Technical questions (encourage teams to help each other)
#team-alpha                  - Private team channel
#team-beta                   - Private team channel
#team-gamma                  - Private team channel
(etc.)
```

### What to Post and When
| When | What |
|------|------|
| Monday morning | Week overview: what is due, what events are scheduled |
| After milestone deadline | Brief feedback or acknowledgment that submissions were received |
| Mid-week | A tip, resource, or encouragement message |
| Before office hours | Reminder to sign up with questions |
| Friday afternoon | Weekend challenge or "fun fact" related to the problem domain |

## Keeping Energy High

The middle weeks (2-3) are where momentum dips. Counter this with:

- **Mini-leaderboard**: If appropriate, share anonymized performance comparisons (be careful: this motivates competitive teams but can discourage struggling ones)
- **Cross-team demos**: 15-minute sessions where teams show each other what they are working on
- **Sponsor shoutouts**: Ask the sponsor to send a brief message about why this work matters to them
- **Pizza and code nights**: An informal evening working session with food. Low structure, high social energy.
- **Progress highlights**: Share interesting findings from milestone reviews (with team permission) in the general channel

## Handling Dropouts

If a student drops mid-Lab:
1. Talk to them first. Understand why. Sometimes a quick role adjustment fixes the problem.
2. If they are leaving for good, redistribute their work within the team.
3. If a team drops below 3 members, consider merging with another small team (awkward but better than a 2-person team struggling to the finish).
4. Do not take it personally. Some attrition is normal, especially the first time you run a Lab.

## The Organizer's Weekly Checklist

Print this and check it off each week:

- [ ] Reviewed all milestone submissions (or confirmed none are due this week)
- [ ] Checked in with every team lead
- [ ] Confirmed office hours are scheduled and sponsor is prepared
- [ ] Posted at least 2 messages in the general channel
- [ ] Updated the timeline or calendar if anything changed
- [ ] Flagged any at-risk teams and have a plan to help them
- [ ] Coordinated with co-organizers on upcoming logistics
