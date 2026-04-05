# Scoping the Problem

Problem scoping is the single most important step in an Innovation Lab. A well-scoped problem makes the difference between teams producing genuine insights and teams floundering for four weeks. This page covers how to work with your sponsor to define a problem that hits the sweet spot.

## The Sweet Spot

A good Innovation Lab problem is:

- **Real**: Comes from an actual business need, not a textbook exercise
- **Bounded**: Can be meaningfully addressed in 3-5 weeks by a team of 4 students
- **Data-available**: The sponsor has data they can share (even if it needs anonymization)
- **Measurable**: There is a clear metric to evaluate solutions against
- **Interesting**: Students should learn something new by working on it

## The Problem Scoping Framework

Use this framework in your scoping meeting with the sponsor. Walk through each section and take notes.

### 1. Business Context
- What is the business problem this relates to?
- Who currently handles this task and how?
- What would "better" look like in concrete terms?
- What has the sponsor already tried?

### 2. Data Inventory
- What data exists? (formats, size, time range)
- How clean is it? (missing values, labeling quality)
- Can it be shared as-is, or does it need anonymization?
- How will it be transferred? (API, CSV dump, database access)
- Is there domain documentation (data dictionaries, business rules)?

### 3. Success Criteria
- What metric would the sponsor use to evaluate a solution?
- What is the current baseline performance (if any)?
- What improvement would be "interesting" vs. "impressive" vs. "production-ready"?
- Are there constraints (latency, interpretability, fairness)?

### 4. Scope Boundaries
- What is explicitly out of scope?
- Are there approaches the sponsor does not want explored (regulatory, ethical, technical)?
- Does the solution need to integrate with existing systems, or is a standalone prototype fine?

## Examples of Good vs. Bad Scoping

### Example 1: Local Manufacturer

**Too vague**: "Use AI to improve our manufacturing process."

**Well-scoped**: "We have 18 months of sensor data from our injection molding machines (temperature, pressure, cycle time) and a log of defective parts. Build a model that predicts defective parts before they come off the line, targeting at least 80% recall with under 20% false positive rate."

### Example 2: Food Bank

**Too vague**: "Help us with AI."

**Well-scoped**: "We receive 500+ donation items per week that volunteers manually sort into 15 categories. We have photos of 3,000 previously sorted items with labels. Build an image classifier that can suggest the correct category, measured by top-3 accuracy."

### Example 3: Healthcare System

**Too vague**: "Predict patient outcomes."

**Well-scoped**: "Using de-identified claims data (diagnosis codes, procedure codes, demographics) for 50,000 patients, predict which patients discharged after hip replacement surgery are at high risk of readmission within 30 days. Current readmission rate is 12%. We want a model that identifies the top 20% highest-risk patients with at least 50% precision."

## The Problem Brief Template

After the scoping meeting, write up a problem brief that teams will receive at kickoff. It should be 1-2 pages and include:

```markdown
# [Problem Title]

## Sponsor
[Company name and brief description]

## Background
[2-3 paragraphs of business context that a student with no domain
knowledge can understand]

## Problem Statement
[One clear paragraph defining exactly what teams should build]

## Data Description
[What data is provided, format, size, key columns/features, known issues]

## Evaluation Criteria
[Primary metric, baseline if available, any constraints]

## Deliverables
- Working model with evaluation results
- Code repository with documentation
- 8-minute presentation covering approach, results, and recommendations
- Written summary (1-2 pages)

## Resources
- Mentor contact: [name, email, available hours]
- Domain references: [links to relevant documentation]
- Similar work: [links to related papers or blog posts, if applicable]
```

## Common Scoping Mistakes

### The Problem Is Too Easy
If a team of students can solve it in a weekend with a tutorial, it is not challenging enough. Test this by asking: "Could I build a reasonable baseline in 2 hours?" If yes, the problem needs more depth. Add complexity through additional constraints, harder evaluation metrics, or a requirement to compare multiple approaches.

### The Problem Is Too Hard
If the sponsor's own data science team has been stuck on it for months, students probably will not crack it in four weeks. Ask the sponsor to identify a sub-problem or a simplified version that still has business value.

### The Data Does Not Exist Yet
"We will start collecting data next month" is not good enough. Teams need data on day one. If the sponsor does not have data ready, either postpone the Lab or switch to a problem where data exists.

### No Clear Metric
"Make it better" is not a metric. Push the sponsor to define a specific, measurable evaluation criterion. If they truly cannot, consider whether this problem is a better fit for an open-ended hackathon rather than an Innovation Lab.

### Too Many Problems at Once
Some sponsors want to pack three problems into one Lab. Resist this. Each problem should be a complete, self-contained challenge. If the sponsor has multiple problems, either pick the best one or run them as separate tracks with separate teams.

## Scoping Meeting Checklist

Before the meeting:
- [ ] Research the sponsor's industry and common AI use cases
- [ ] Prepare the problem scoping template (printed or shared doc)
- [ ] Confirm attendees include someone technical from the sponsor side

During the meeting:
- [ ] Walk through all four sections of the framework
- [ ] Ask about data availability and transfer timeline
- [ ] Discuss what students can and cannot share publicly
- [ ] Agree on mentor availability and communication channels
- [ ] Set a deadline for data delivery (at least 1 week before kickoff)

After the meeting:
- [ ] Draft the problem brief within 48 hours
- [ ] Send it to the sponsor for review and approval
- [ ] Confirm data transfer logistics and timeline
- [ ] Share the approved brief with your leadership team for feedback
