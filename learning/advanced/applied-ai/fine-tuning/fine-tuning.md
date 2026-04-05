# Fine-Tuning Fundamentals

## When to Fine-Tune (and When Not To)

Fine-tuning is one of the most powerful techniques in the applied AI toolkit — and one of the most misused. Before you fine-tune anything, you need to understand where it sits in the hierarchy of approaches.

**The escalation ladder:**

1. **Better prompts** — Free, instant, no training data needed. Start here.
2. **Few-shot examples** — Add examples to your prompt. Still free, still instant.
3. **RAG** — Add external knowledge. Good for factual accuracy and freshness.
4. **Fine-tuning** — Teach the model new behaviors, styles, or domain knowledge.
5. **Training from scratch** — Almost never the right answer for applied AI engineers.

**Fine-tune when:**
- You need consistent output formatting that prompting cannot achieve reliably
- You need to replicate a specific writing style or tone across thousands of outputs
- You want to reduce latency by eliminating long system prompts
- You have a well-defined task with hundreds or thousands of examples
- You need to reduce cost by moving from a large model to a smaller fine-tuned one

**Do NOT fine-tune when:**
- You do not have at least 50-100 high-quality examples (more is better)
- Your task changes frequently (prompts are easier to update)
- You need the model to access external knowledge (use RAG instead)
- Better prompting would solve the problem (try that first)
- You cannot measure quality (how would you know if fine-tuning helped?)

---

## Dataset Preparation

The quality of your fine-tuning dataset is everything. A small, clean dataset consistently outperforms a large, noisy one.

### Format

Most fine-tuning APIs expect conversation-format JSONL:

```jsonl
{"messages": [{"role": "system", "content": "You are a medical coding assistant."}, {"role": "user", "content": "Patient presents with acute bronchitis..."}, {"role": "assistant", "content": "ICD-10: J20.9 - Acute bronchitis, unspecified"}]}
{"messages": [{"role": "system", "content": "You are a medical coding assistant."}, {"role": "user", "content": "Diagnosis: Type 2 diabetes with neuropathy..."}, {"role": "assistant", "content": "ICD-10: E11.40 - Type 2 diabetes mellitus with diabetic neuropathy, unspecified"}]}
```

### Dataset Quality Checklist

- **Consistent format:** Every example follows the exact same structure
- **Accurate outputs:** Every assistant response is the correct, ideal response
- **Diverse inputs:** Cover the full range of inputs your model will see in production
- **No contradictions:** Examples should not teach conflicting behaviors
- **Appropriate length:** Assistant responses should be the length you want in production
- **Deduplication:** Remove or consolidate near-duplicate examples

### How Much Data?

- **Minimum viable:** 50-100 examples for simple tasks (classification, formatting)
- **Good results:** 200-500 examples for moderate tasks
- **Complex tasks:** 1,000+ examples for nuanced behavior changes
- **Diminishing returns:** Quality plateaus somewhere around 5,000-10,000 examples for most tasks

### Train/Validation Split

Always hold out 10-20% of your data for validation:

```python
import random

random.shuffle(dataset)
split = int(len(dataset) * 0.8)
train_data = dataset[:split]
val_data = dataset[split:]
```

The validation set lets you detect overfitting and measure real performance.

---

## OpenAI Fine-Tuning API Walkthrough

Here is a practical walkthrough using OpenAI's fine-tuning API, which is representative of the hosted fine-tuning workflow:

```python
from openai import OpenAI
client = OpenAI()

# Step 1: Upload your training file
training_file = client.files.create(
    file=open("training_data.jsonl", "rb"),
    purpose="fine-tune"
)

# Step 2: Create a fine-tuning job
job = client.fine_tuning.jobs.create(
    training_file=training_file.id,
    model="gpt-4o-mini-2024-07-18",
    hyperparameters={
        "n_epochs": 3,
        "batch_size": "auto",
        "learning_rate_multiplier": "auto"
    }
)

# Step 3: Monitor training
while True:
    status = client.fine_tuning.jobs.retrieve(job.id)
    print(f"Status: {status.status}")
    if status.status in ["succeeded", "failed"]:
        break

# Step 4: Use your fine-tuned model
response = client.chat.completions.create(
    model=status.fine_tuned_model,  # e.g., "ft:gpt-4o-mini:org:custom-name:id"
    messages=[
        {"role": "system", "content": "You are a medical coding assistant."},
        {"role": "user", "content": "Patient presents with..."}
    ]
)
```

Key settings:
- **Epochs:** 2-4 for most tasks. More epochs risk overfitting.
- **Learning rate:** Start with "auto" and only adjust if results are poor.
- **Base model:** Start with the smallest model that works. Fine-tuned gpt-4o-mini often matches or beats base gpt-4o on narrow tasks.

---

## LoRA and Parameter-Efficient Methods

Full fine-tuning updates every parameter in the model, which is expensive and requires significant GPU memory. **LoRA (Low-Rank Adaptation)** is the dominant alternative.

### How LoRA Works

Instead of updating the full weight matrices, LoRA adds small trainable matrices alongside the frozen original weights:

```
Original weight: W (frozen, e.g., 4096 x 4096)
LoRA adapter:    A (trainable, e.g., 4096 x 16)
                 B (trainable, e.g., 16 x 4096)

Effective weight: W + A * B
```

The "rank" (16 in this example) controls the capacity of the adapter. Typical values are 8-64. This reduces trainable parameters by 100-1000x while achieving comparable performance.

### Using LoRA with Hugging Face PEFT

```python
from peft import LoraConfig, get_peft_model
from transformers import AutoModelForCausalLM

model = AutoModelForCausalLM.from_pretrained("meta-llama/Llama-3-8b")

lora_config = LoraConfig(
    r=16,                    # Rank
    lora_alpha=32,           # Scaling factor
    target_modules=["q_proj", "v_proj"],  # Which layers to adapt
    lora_dropout=0.05,
    bias="none",
    task_type="CAUSAL_LM"
)

model = get_peft_model(model, lora_config)
model.print_trainable_parameters()
# trainable params: 6,553,600 || all params: 8,030,261,248 || trainable%: 0.0816
```

### Other Parameter-Efficient Methods

- **QLoRA:** LoRA applied to a 4-bit quantized base model — trains on a single GPU
- **Prefix Tuning:** Adds trainable tokens to the input, keeping all model weights frozen
- **Adapters:** Small bottleneck layers inserted between existing layers

For most applied AI engineers, the choice is between hosted fine-tuning (OpenAI, Anthropic, etc.) and LoRA/QLoRA for open-source models.

---

## Evaluation: Before and After

Fine-tuning without evaluation is guesswork. You need to measure performance before and after on the same test set.

### Evaluation Framework

```python
def evaluate_model(model_name, test_set):
    results = []
    for example in test_set:
        response = call_model(model_name, example["input"])
        score = score_response(response, example["expected_output"])
        results.append(score)
    return {
        "accuracy": sum(r["correct"] for r in results) / len(results),
        "avg_similarity": sum(r["similarity"] for r in results) / len(results),
        "format_compliance": sum(r["valid_format"] for r in results) / len(results),
    }

# Compare base vs fine-tuned
base_metrics = evaluate_model("gpt-4o-mini", test_set)
ft_metrics = evaluate_model("ft:gpt-4o-mini:org:name:id", test_set)

print(f"Base accuracy: {base_metrics['accuracy']:.1%}")
print(f"Fine-tuned accuracy: {ft_metrics['accuracy']:.1%}")
```

### What to Measure

- **Task-specific accuracy:** Does it get the right answer?
- **Format compliance:** Does it follow the expected output structure?
- **Regression checks:** Did fine-tuning break anything the base model got right?
- **Edge cases:** How does it handle inputs outside the training distribution?

---

## Cost and Latency Considerations

Fine-tuning involves costs at three stages:

1. **Training cost:** Proportional to dataset size x epochs x model size. OpenAI charges per-token for training.
2. **Hosting cost:** Fine-tuned models may cost more per-token for inference. Check provider pricing.
3. **Iteration cost:** You will likely fine-tune multiple times as you improve your dataset.

**Latency benefits:** A fine-tuned model can eliminate long system prompts, reducing input tokens and improving latency. A fine-tuned gpt-4o-mini with a short prompt can be faster and cheaper than base gpt-4o with a long prompt while achieving similar quality on your specific task.

---

## The Fine-Tuning Decision Framework

Before starting a fine-tuning project, answer these questions:

1. **Have you tried better prompting?** If not, do that first.
2. **Do you have enough quality data?** 50+ examples minimum, 200+ preferred.
3. **Can you measure success?** You need an evaluation set and clear metrics.
4. **Is the task stable?** Fine-tuning is expensive to redo. If requirements change weekly, stick with prompts.
5. **Is the cost justified?** Compare fine-tuning cost + reduced inference cost vs. just using a bigger base model.

If you answered "yes" to all five, fine-tuning is likely worth pursuing. If any answer is "no," address that gap first.

---

## Key Takeaways

1. **Fine-tuning sits above prompting and RAG in the escalation ladder.** Exhaust simpler approaches first.
2. **Dataset quality beats dataset quantity.** 200 perfect examples beat 2,000 noisy ones.
3. **LoRA makes fine-tuning accessible.** You do not need massive GPU clusters for parameter-efficient methods.
4. **Always evaluate before and after.** Without measurement, you cannot know if fine-tuning helped or hurt.
5. **Think about the full cost picture.** Training cost, inference cost, iteration cost, and the cost of maintaining fine-tuned models over time.
