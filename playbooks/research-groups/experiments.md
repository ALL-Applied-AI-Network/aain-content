# Designing and Running Experiments

The transition from reading papers to running experiments is the hardest part of undergraduate research. This page covers how to formulate testable questions, design experiments you can actually run with student resources, manage compute, and track results properly.

## From Research Question to Experiment Plan

### The Hypothesis-Experiment Loop

Every experiment should follow this structure:

1. **Hypothesis**: "We believe [X] because [Y]."
2. **Experiment**: "To test this, we will [specific procedure]."
3. **Expected outcome**: "If our hypothesis is correct, we expect to see [measurable result]."
4. **Actual outcome**: "We observed [result]."
5. **Interpretation**: "This means [conclusion], and the next question is [Z]."

Write this down before running anything. It prevents the "we ran 50 experiments and do not know what we learned" problem.

### Example

**Hypothesis**: "We believe that adding domain-specific pre-training to a language model will improve performance on medical question answering because the model will learn medical terminology and reasoning patterns."

**Experiment**: "Fine-tune Llama-3-8B on 10K medical textbook passages, then evaluate on the MedQA benchmark. Compare to the base model and to a model fine-tuned on the same number of general-domain passages."

**Expected outcome**: "The domain-pre-trained model should outperform both baselines by at least 5% accuracy on MedQA."

## Designing Experiments for Student Resources

### Compute Reality Check

Before designing an experiment, answer these questions:
- What hardware do you have? (Personal laptops, Colab free/Pro, university cluster, cloud credits)
- How long can a single experiment run? (Colab free tier disconnects after ~12 hours)
- How many experiments can you run in parallel?
- What is your total compute budget for the semester?

### Strategies for Limited Compute

| Strategy | How It Helps |
|----------|-------------|
| **Smaller models** | Use 7B parameter models instead of 70B. Use ResNet-18 instead of ResNet-152. |
| **Smaller datasets** | Subsample for development runs. Only use the full dataset for final results. |
| **Fewer epochs** | Train for 3 epochs instead of 10 during exploration. Extend for final runs. |
| **Efficient methods** | Use LoRA/QLoRA for fine-tuning instead of full fine-tuning. |
| **Cached features** | Pre-compute embeddings once and reuse them across experiments. |
| **Smart baselines** | Start with the simplest model that could work. Only add complexity when you understand why it helps. |

### The Experiment Pyramid

Structure your experiments in layers:

```
Layer 3: Ablation studies (what matters and why)
    ^
Layer 2: Compare approaches (which method works best)
    ^
Layer 1: Reproduce baseline (can we match published results)
    ^
Layer 0: Data pipeline (load, clean, split, evaluate)
```

Do not skip layers. Layer 0 catches data bugs. Layer 1 confirms your evaluation is correct. Layer 2 answers your research question. Layer 3 provides insight into why.

## Experiment Tracking

Track every experiment. Without tracking, you will forget what you tried, what worked, and why.

### What to Track

For every experiment, record:
- **Experiment ID**: A unique name (e.g., `exp-042-lora-rank16-lr3e4`)
- **Date**: When it ran
- **Configuration**: All hyperparameters, model version, data splits, random seed
- **Results**: All evaluation metrics
- **Notes**: What you were trying to learn and what you observed
- **Duration**: How long it took (important for compute budgeting)
- **Status**: Completed, failed, or in progress

### Tools for Tracking

**Simple option**: A shared spreadsheet or markdown table in your repo.

```markdown
| ID | Date | Model | LR | Epochs | Accuracy | F1 | Notes |
|----|------|-------|-----|--------|----------|-----|-------|
| 001 | 3/15 | bert-base | 2e-5 | 3 | 78.2% | 0.76 | Baseline |
| 002 | 3/16 | bert-base | 5e-5 | 3 | 79.1% | 0.77 | Higher LR helps |
| 003 | 3/16 | bert-base | 2e-5 | 10 | 79.8% | 0.78 | More epochs also helps |
```

**Better option**: Weights & Biases (free for academics) or MLflow. These automatically log metrics, hyperparameters, and training curves. The setup takes 15 minutes and saves hours over a semester.

### Code Organization

```
/project/
  /data/
    /raw/           # Original data, never modified
    /processed/     # Cleaned and preprocessed data
    /splits/        # Train/val/test splits (fixed for reproducibility)
  /src/
    data.py         # Data loading and preprocessing
    model.py        # Model definitions
    train.py        # Training loop
    evaluate.py     # Evaluation metrics
    config.py       # Configuration management
  /experiments/
    exp-001/        # Config + results for each experiment
    exp-002/
  /notebooks/       # Exploration and visualization
  README.md         # How to set up and run everything
  requirements.txt  # Dependencies with pinned versions
```

## Running Experiments Systematically

### The Weekly Experiment Cycle

| Day | Activity |
|-----|----------|
| Meeting day | Review last week's results, decide next experiments |
| Day after meeting | Set up experiments, write configs, prepare code changes |
| Mid-week | Run experiments, monitor for failures |
| Day before meeting | Analyze results, prepare summary for the group |

### Experiment Checklist (Before You Run)

- [ ] Hypothesis written down
- [ ] Code changes committed to the repo (so you can trace results to code)
- [ ] Configuration saved (not just in your head)
- [ ] Random seed set (for reproducibility)
- [ ] Evaluation metric confirmed (same as what you will report)
- [ ] Expected runtime estimated (so you know if something is hanging)
- [ ] Results will be saved automatically (not just printed to console)

### Experiment Checklist (After You Run)

- [ ] Results recorded in the tracking system
- [ ] Results match or explain differences from expectations
- [ ] Any errors or warnings investigated
- [ ] Key findings summarized in 2-3 sentences
- [ ] Next experiment planned based on what you learned

## Common Mistakes

### Not Setting Random Seeds
Your results are not reproducible if you cannot re-run the exact same experiment and get the same numbers. Set seeds for Python, NumPy, PyTorch, and any other random sources.

```python
import random
import numpy as np
import torch

def set_seed(seed=42):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)
```

### Overfitting to the Test Set
Never use the test set to make decisions about your model. Use a validation set for development and only evaluate on the test set for final results. If you evaluate on test 20 times and pick the best one, you are overfitting.

### Changing Too Many Things at Once
If you change the model, the learning rate, and the data preprocessing in one experiment, you cannot tell which change caused the improvement. Change one thing at a time.

### Ignoring Negative Results
An experiment that shows your hypothesis was wrong is just as valuable as one that confirms it. Record negative results carefully. They prevent you from repeating the same mistake and often reveal something interesting.

### Not Checking the Data
Before running any model, look at your data. Print 10 random examples. Check for label errors, formatting issues, and distribution skew. Data bugs are the most common source of confusing results.

## Interpreting Results Honestly

- **Do not cherry-pick metrics.** Report the metric you defined before running the experiment.
- **Report variance.** Run at least 3 seeds and report mean and standard deviation.
- **Acknowledge limitations.** If your experiment only used 10% of the data or a small model, say so.
- **Distinguish significant from noise.** A 0.3% improvement on one run is probably noise. A 3% improvement averaged over 5 seeds is likely real.
- **Look at failure cases.** The examples where your model fails are more informative than the ones where it succeeds.
