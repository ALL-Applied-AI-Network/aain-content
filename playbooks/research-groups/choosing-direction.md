# Choosing a Research Direction

Picking the right research topic is the decision that shapes your entire semester. Go too broad and you will never make progress. Go too narrow and you will run out of interesting questions in a month. This page covers how to find a topic that sustains a group of undergraduates for a full semester.

## The Three Criteria

A good undergraduate research topic must be:

1. **Interesting enough** that your group will show up every week even when it gets hard
2. **Scoped enough** that you can produce a tangible output in one semester
3. **Accessible enough** that undergraduates can make meaningful contributions without years of background

All three must be true. A topic that is fascinating but requires a PhD-level background in differential geometry is not a good fit. A topic that is easy but boring will lose your group by Week 4.

## Starting the Search

### Step 1: Interest Inventory (Week 1, 30 minutes)

Have each group member independently list:
- 3 AI topics they find genuinely interesting (not just "sounds impressive")
- 1 recent AI news story that caught their attention
- 1 problem in their daily life or field of study where AI could help

Collect all responses and look for clusters. If three people listed "language models" and two listed "AI for healthcare," those are candidate directions.

### Step 2: Landscape Survey (Week 1-2, 2 hours per person)

For each candidate direction, assign one person to do a quick landscape survey:
- Search Google Scholar for "[topic] survey" or "[topic] tutorial" from the last 2 years
- Read the abstract and introduction of 2-3 survey papers
- Identify 3-5 active sub-problems within the topic
- Note which sub-problems have publicly available datasets and code

### Step 3: Feasibility Check (Week 2, group discussion)

For each sub-problem identified, evaluate:

| Question | Red Flag | Green Flag |
|----------|----------|------------|
| Can we get data? | Requires medical records, proprietary data, or expensive APIs | Public datasets, Hugging Face, Kaggle, or data we can collect ourselves |
| Can we run experiments? | Needs 8 GPUs for a week | Runs on Colab or a single GPU in hours |
| Is there existing code? | Everything is from scratch | Official repos, Hugging Face models, or well-documented baselines |
| Can we contribute? | The problem is "solved" by large labs | Open questions remain, or we can apply existing methods to a new domain |
| Can we understand it? | Requires 3 prerequisite papers we have never read | 1-2 weeks of reading gets us to the frontier |

### Step 4: Commit (Week 2-3)

Pick one direction. The group votes, but the project lead makes the final call if there is a tie. You can always pivot in Week 4-5 if the topic turns out to be a dead end, but indecision in the early weeks is the most common reason groups fail to produce anything.

## Good Research Directions for Undergraduates

These are categories that tend to work well for undergraduate research groups:

### Applying Existing Methods to New Domains
Take a well-studied technique (fine-tuning language models, object detection, time series forecasting) and apply it to a domain where it has not been tried or where results are sparse.

**Example**: Fine-tuning a vision model to classify types of damage in building inspection photos using a dataset you collect from a local housing authority.

### Reproducing and Extending Published Work
Pick a recent paper, reproduce its main results, and then extend it: new dataset, different hyperparameters, ablation study, or applying the method to a related task.

**Example**: Reproduce the results of a paper on few-shot text classification, then test whether the approach works on a low-resource language using publicly available data.

### Benchmarking and Comparison Studies
Compare multiple approaches to the same problem on the same dataset. This is genuinely useful to the community and does not require inventing new methods.

**Example**: Compare 5 different approaches to tabular data classification (XGBoost, neural networks, transformers for tabular data, etc.) on 10 public datasets and analyze when each approach wins.

### Building Tools and Datasets
Create a dataset that does not exist, or build a tool that makes a common research task easier.

**Example**: Build a curated dataset of AI-related course syllabi from 50 universities, annotated by topic and difficulty level, to study how AI education is evolving.

## Directions to Avoid

- **Anything requiring data you do not have and cannot get**: If the project depends on a data partnership that has not been established, find a different topic
- **Broad survey papers with no experiments**: "A Survey of AI in Healthcare" is a fine starting point for reading, but your group should aim to produce results, not just summarize other people's work
- **Competing directly with industry labs on their benchmarks**: You will not beat Google's latest model on ImageNet. Find a niche where your contribution matters.
- **Topics with no reproducible baselines**: If you cannot find code or clear methodology to reproduce existing results, you will spend the whole semester just trying to match the baseline

## The Research Question Template

Once you have a direction, formalize it with a research question. A good research question has this structure:

**"How does [method/approach] perform on [task/domain] compared to [baseline], and what factors affect its performance?"**

Examples:
- "How does LoRA fine-tuning of Llama compare to full fine-tuning on domain-specific medical Q&A, and how does the size of the fine-tuning dataset affect the gap?"
- "How do transformer-based models for tabular data compare to gradient-boosted trees across datasets with varying feature types and sizes?"
- "How well do zero-shot object detection models identify native plant species from trail camera images, and what characteristics of the images predict failure?"

## Making the Decision

Use this checklist before committing:

- [ ] At least 3 group members are genuinely interested in the topic
- [ ] You have identified at least one publicly available dataset
- [ ] You have found at least 2-3 relevant papers with available code
- [ ] Experiments can run on available compute (Colab, university cluster, or personal hardware)
- [ ] You can articulate a specific research question (not just a vague area)
- [ ] A faculty member or mentor has confirmed the question is reasonable in scope
- [ ] The topic has not already been exhaustively covered by a recent survey or benchmark

Write up your chosen direction in one page: the question, why it matters, what data and methods you will use, and what output you are targeting. This becomes your group's charter for the semester.
