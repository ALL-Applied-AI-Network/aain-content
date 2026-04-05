# Structured Outputs & Data Extraction

## Why Structured Outputs Matter

If you've built anything with an LLM, you've hit this wall: the model gives you a perfectly good answer... as a blob of unstructured text. You ask for a list of products, and you get a paragraph. You ask for a JSON object, and you get JSON wrapped in markdown code fences with a chatty preamble.

**Structured outputs** solve this by forcing the model to return data in a specific, validated format. This is not a nice-to-have — it is the foundation of every reliable AI-powered data pipeline.

Consider the difference:

```
# Unstructured (fragile)
"The product is a Sony WH-1000XM5 headphones, priced at $349.99,
 currently in stock with 4.7 stars from 2,341 reviews."

# Structured (reliable)
{
  "name": "Sony WH-1000XM5",
  "price": 349.99,
  "in_stock": true,
  "rating": 4.7,
  "review_count": 2341
}
```

With structured outputs, you get data you can validate, store, query, and pipe into downstream systems without writing brittle regex parsers.

---

## Three Approaches to Structured Output

There are three main strategies for getting structured data from LLMs, each with different tradeoffs.

### 1. JSON Mode

Most API providers offer a "JSON mode" that constrains the model to output valid JSON.

```python
from openai import OpenAI
client = OpenAI()

response = client.chat.completions.create(
    model="gpt-4o",
    response_format={"type": "json_object"},
    messages=[
        {"role": "system", "content": "Extract product info as JSON."},
        {"role": "user", "content": "The Sony WH-1000XM5 costs $349.99..."}
    ]
)
```

**Pros:** Simple, built-in, no extra dependencies.
**Cons:** No schema validation — you get valid JSON, but no guarantee it matches your expected structure. The model might return `{"product_name": ...}` instead of `{"name": ...}`.

### 2. Function Calling / Tool Use

Function calling lets you define a JSON Schema that the model must conform to:

```python
tools = [{
    "type": "function",
    "function": {
        "name": "extract_product",
        "parameters": {
            "type": "object",
            "properties": {
                "name": {"type": "string"},
                "price": {"type": "number"},
                "in_stock": {"type": "boolean"}
            },
            "required": ["name", "price", "in_stock"]
        }
    }
}]
```

**Pros:** Schema-enforced structure, widely supported.
**Cons:** Verbose to define, no Python-native validation, error handling is manual.

### 3. Instructor + Pydantic (Recommended)

Instructor wraps function calling with Pydantic models, giving you Python-native validation, automatic retries, and clean code:

```python
import instructor
from pydantic import BaseModel, Field
from openai import OpenAI

client = instructor.from_openai(OpenAI())

class Product(BaseModel):
    name: str = Field(description="Product name")
    price: float = Field(gt=0, description="Price in USD")
    in_stock: bool
    rating: float = Field(ge=0, le=5)
    review_count: int = Field(ge=0)

product = client.chat.completions.create(
    model="gpt-4o",
    response_model=Product,
    messages=[
        {"role": "user", "content": "Extract: Sony WH-1000XM5, $349.99..."}
    ]
)

print(product.name)   # "Sony WH-1000XM5"
print(product.price)  # 349.99
```

**Pros:** Pythonic, validated, automatic retries on validation failure, clean API.
**Cons:** Extra dependency, Python-specific (though similar libraries exist for other languages).

---

## Pydantic Models for Validation

The real power of the Instructor approach is Pydantic's validation. You can enforce constraints that go far beyond JSON Schema:

```python
from pydantic import BaseModel, Field, field_validator
from typing import Optional
from enum import Enum

class Sentiment(str, Enum):
    POSITIVE = "positive"
    NEGATIVE = "negative"
    NEUTRAL = "neutral"

class ReviewAnalysis(BaseModel):
    sentiment: Sentiment
    confidence: float = Field(ge=0.0, le=1.0)
    key_topics: list[str] = Field(min_length=1, max_length=5)
    summary: str = Field(max_length=200)
    recommended: bool
    price_mentioned: Optional[float] = None

    @field_validator("key_topics")
    @classmethod
    def topics_must_be_lowercase(cls, v):
        return [t.lower().strip() for t in v]
```

This model guarantees:
- Sentiment is one of exactly three values
- Confidence is between 0 and 1
- There are 1-5 key topics, all lowercased
- Summary is under 200 characters
- Price is optional but validated if present

If the model returns data that violates any of these constraints, Instructor automatically retries with the validation error message included in the prompt.

---

## Practical Example: Extracting Data from Unstructured Text

Here is a complete example that extracts structured meeting notes from raw transcript text:

```python
import instructor
from pydantic import BaseModel, Field
from openai import OpenAI

client = instructor.from_openai(OpenAI())

class ActionItem(BaseModel):
    description: str
    assignee: str
    due_date: str | None = None

class MeetingNotes(BaseModel):
    title: str
    date: str
    attendees: list[str]
    key_decisions: list[str]
    action_items: list[ActionItem]
    next_meeting: str | None = None

transcript = """
[Your raw meeting transcript here]
"""

notes = client.chat.completions.create(
    model="gpt-4o",
    response_model=MeetingNotes,
    messages=[
        {
            "role": "system",
            "content": "Extract structured meeting notes from the transcript."
        },
        {"role": "user", "content": transcript}
    ],
    max_retries=3
)

# Now you have clean, validated, typed data
for item in notes.action_items:
    print(f"  [{item.assignee}] {item.description} (due: {item.due_date})")
```

---

## Error Handling and Retries

LLMs do not always get it right on the first try. Instructor handles this with automatic retries:

```python
# Automatic retries with validation feedback
notes = client.chat.completions.create(
    model="gpt-4o",
    response_model=MeetingNotes,
    messages=[...],
    max_retries=3  # Retry up to 3 times on validation failure
)
```

When a retry happens, Instructor includes the Pydantic validation error in the next attempt, so the model can self-correct. For example, if the model returns a confidence of 1.5, the retry prompt will include something like "value must be less than or equal to 1.0."

For production systems, you should also handle the case where all retries are exhausted:

```python
from instructor.exceptions import InstructorRetryException

try:
    result = client.chat.completions.create(
        model="gpt-4o",
        response_model=Product,
        messages=[...],
        max_retries=3
    )
except InstructorRetryException:
    # Log the failure, fall back to manual review, etc.
    logger.error("Failed to extract structured data after 3 retries")
```

---

## When to Use Structured Outputs vs Free-Form

Structured outputs are not always the right choice. Here is a decision framework:

**Use structured outputs when:**
- You need to store, query, or pipe data into another system
- You need validated, typed data (prices, dates, enums)
- You are building extraction pipelines (documents, emails, forms)
- You need deterministic output format for downstream code
- You are doing classification or labeling tasks

**Use free-form text when:**
- You need creative writing, summaries, or explanations
- The output is consumed directly by a human
- The structure of the response is genuinely variable
- You are building conversational interfaces

**The hybrid approach:** Many real applications use both. A customer support bot might generate a free-form response for the user *and* extract structured metadata (intent, sentiment, entities) for the backend:

```python
class SupportResponse(BaseModel):
    reply: str = Field(description="Natural language reply to the customer")
    intent: str = Field(description="Classified intent category")
    sentiment: Sentiment
    escalate: bool = Field(description="Whether this needs human review")
    entities: list[str] = Field(description="Key entities mentioned")
```

This gives you the best of both worlds: a natural response for the user and structured data for your systems.

---

## Key Takeaways

1. **Structured outputs transform LLMs from text generators into data extraction engines.** This is what makes AI applications reliable enough for production.
2. **Instructor + Pydantic is the current best practice** for Python. It gives you validation, retries, and clean code with minimal overhead.
3. **Design your Pydantic models carefully.** Good field descriptions, sensible constraints, and optional fields for data that may not always be present.
4. **Always handle failures.** Even with retries, extraction can fail. Build fallback paths into your pipelines.
5. **Think hybrid.** Many applications benefit from both structured extraction and free-form generation in the same call.
