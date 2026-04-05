# Forming the Group

The right group composition matters more than the right topic. A motivated group of 4 can produce strong work on an average topic. A disengaged group of 8 will produce nothing on a brilliant topic. This page covers recruiting, sizing, role definition, and expectation-setting.

## Optimal Group Size

**Target: 4-6 members**

| Size | Pros | Cons |
|------|------|------|
| 3 | Tight coordination, fast decisions | One dropout cripples the group; limited perspectives |
| 4-5 | Best balance of bandwidth and coordination | Requires clear role definition |
| 6 | Enough people to split into sub-teams | Coordination overhead increases |
| 7-8 | Can tackle larger projects | Free-rider risk; meetings get unfocused |
| 9+ | Avoid this | Too many people for meaningful research collaboration |

If you have more than 8 interested students, consider running two parallel groups with different topics or sub-questions.

## Recruiting the Right Members

### What Matters Most
1. **Commitment**: Will they actually show up every week and do the work between meetings? This matters more than anything else.
2. **Curiosity**: Do they ask good questions? Are they genuinely interested in understanding how things work?
3. **Baseline skills**: Can they write Python code and read a technical paper (even slowly)? They do not need to be experts.
4. **Reliability**: Do they follow through on tasks they agree to take on?

### What Matters Less Than You Think
- GPA (high-GPA students are sometimes the worst at open-ended research because they want a "right answer")
- Prior research experience (you will teach them the process)
- Specific course prerequisites (motivation and coding ability matter more than having taken a specific ML class)

### How to Recruit

**From your existing club members**:
- Announce the research group at a regular meeting
- Be specific about the time commitment: "3-5 hours per week for the full semester, including a 90-minute weekly meeting"
- Emphasize what they will get: research experience, potential publication credit, a differentiated resume
- Collect interest forms and follow up individually

**Interest Form Fields**:
- Name, year, major
- Why are you interested in joining a research group? (2-3 sentences)
- What AI topics interest you most?
- Rate your comfort with: Python, reading papers, ML concepts (1-5)
- Can you commit to 3-5 hours per week for the full semester? (yes/no)
- Preferred meeting time (provide 3-4 options to choose from)

**Selection**: If you have more applicants than spots, prioritize commitment signals over skill level. A sophomore who writes a thoughtful paragraph about why they want to join is a better bet than a senior who checks all the boxes but writes "looks cool."

## Defining Roles

Clear roles prevent the "who is doing what?" problem that kills groups by Week 5.

### Core Roles

**Project Lead** (1 person)
- Sets the weekly agenda and runs meetings
- Tracks progress against the semester plan
- Makes final calls when the group cannot reach consensus
- Coordinates with the faculty mentor
- This should be the person who organized the group or the most experienced member

**Literature Reviewer** (1-2 people)
- Maintains the reading list and shared paper repository
- Prepares paper summaries for group discussion
- Tracks related work as the project evolves
- Helps write the related work section of any final output

**Experiment Lead** (1-2 people)
- Manages the codebase and experiment tracking
- Runs experiments and records results systematically
- Ensures reproducibility (documented environments, random seeds, clear configs)
- Handles compute logistics (Colab notebooks, cluster jobs)

**Writer/Communicator** (1 person)
- Leads the writing of the final output (paper, blog post, report)
- Prepares presentation slides for internal and external talks
- Maintains the project README and documentation
- Takes notes during meetings

### Role Rotation
Roles are primary, not exclusive. Everyone reads papers. Everyone reviews code. The Literature Reviewer should still run experiments occasionally, and the Experiment Lead should still read papers. Consider rotating the "paper presenter" role weekly so everyone builds that skill.

## Setting Expectations

Have an explicit expectations conversation at your first meeting. Cover these topics:

### Time Commitment
- **Weekly meeting**: 90 minutes (non-negotiable for all members)
- **Individual work**: 2-3 hours between meetings (reading, coding, writing)
- **Total**: 3.5-4.5 hours per week, every week, for the full semester

### Attendance Policy
- Missing one meeting is fine with advance notice
- Missing two consecutive meetings without communication is grounds for a conversation about continued membership
- If someone needs to step back, they should say so early rather than quietly disappearing

### Communication Norms
- Response time in the group chat: within 24 hours during the week
- All meeting notes posted within 24 hours of the meeting
- If you are stuck, ask. Struggling silently for a week wastes everyone's time.

### Authorship and Credit
Discuss this early to prevent conflict later:
- If the group produces a paper, all active contributors are co-authors
- Author order should reflect contribution level (discuss this as you approach the writing phase)
- Anyone who drops out before the output is finished gets acknowledged but not co-authorship (unless their contribution was substantial)
- All public presentations should credit every contributing member

### Conflict Resolution
- Disagreements about research direction: the group discusses, and the Project Lead makes the final call
- Disagreements about workload: bring it up in the group meeting, not in side conversations
- If someone is not pulling their weight: the Project Lead has a private conversation first, then escalates to a group discussion if needed

## The First Meeting

Your first meeting sets the tone. Here is a suggested agenda:

**First Meeting Agenda (90 minutes)**

| Time | Activity |
|------|----------|
| 0:00-0:10 | Introductions: name, year, what interests you about research |
| 0:10-0:20 | Overview of the semester plan and target output |
| 0:20-0:30 | Discuss and assign roles |
| 0:30-0:40 | Expectations conversation (time, attendance, communication) |
| 0:40-0:55 | Interest inventory for choosing a research direction |
| 0:55-1:10 | Logistics: meeting time, communication platform, shared drive |
| 1:10-1:20 | Assign first tasks (each person reads 1-2 papers before next meeting) |
| 1:20-1:30 | Questions and wrap-up |

## Tools and Infrastructure

Set up these before or during the first meeting:

- [ ] **Communication**: Slack channel, Discord server, or group chat
- [ ] **Document sharing**: Google Drive folder or Notion workspace
- [ ] **Paper management**: Shared Zotero library, Google Scholar collection, or a simple spreadsheet
- [ ] **Code repository**: GitHub repo with a clear folder structure
- [ ] **Meeting notes**: Shared doc where notes are posted after every meeting
- [ ] **Experiment tracking**: Weights & Biases, MLflow, or a shared spreadsheet

Keep it simple. Do not spend two meetings debating tools. Pick something everyone can access and move on.
