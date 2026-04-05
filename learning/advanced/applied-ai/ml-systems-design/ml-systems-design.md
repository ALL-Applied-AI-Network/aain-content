# ML Systems Design

## From Prototype to Production

Building a working demo is the easy part. The hard part is building a system that works reliably at scale, handles failures gracefully, and can be maintained by a team over months and years.

This lesson covers the architecture patterns, operational practices, and design decisions that separate AI prototypes from AI products.

---

## Architecture Patterns for LLM Applications

Most production LLM applications follow one of a few common patterns.

### The Basic API Wrapper

The simplest pattern: your application calls an LLM API and returns the result.

```
User -> Your API -> LLM Provider -> Your API -> User
```

This works for simple use cases but fails when you need reliability, caching, or complex workflows.

### The RAG Pipeline

Add retrieval to ground responses in your data:

```
User -> Query Processing -> Retrieval -> Context Assembly -> LLM -> Post-processing -> User
                              |
                        Vector Store / Search Index
```

Each stage is a potential point of failure that needs monitoring.

### The Agent Architecture

For complex tasks, the LLM orchestrates multiple tools and steps:

```
User -> Orchestrator LLM -> [Tool A, Tool B, Tool C] -> Orchestrator LLM -> User
              |                                              |
         Planning/Reasoning                          Result Synthesis
```

Agent architectures are powerful but introduce significant complexity in error handling, cost control, and observability.

### The Pipeline / Chain Pattern

Break complex tasks into deterministic stages with LLM calls at specific points:

```
Input -> Classify (LLM) -> Route -> Process (LLM/Code) -> Validate -> Output
```

This is often more reliable than pure agent approaches because each stage has clear inputs, outputs, and failure modes.

---

## Latency vs Cost Tradeoffs

Every design decision in an LLM application involves a latency-cost tradeoff.

### Model Selection

| Model | Latency | Cost | Quality |
|-------|---------|------|---------|
| GPT-4o | ~2s | $$$ | Highest |
| GPT-4o-mini | ~0.5s | $ | Good for most tasks |
| Claude 3.5 Haiku | ~0.3s | $ | Fast and capable |
| Local (Llama 3) | Varies | Fixed | No per-token cost |

**The pattern:** Use the smallest model that meets your quality bar. Route complex queries to larger models and simple ones to smaller models.

### Streaming

For user-facing applications, streaming the response dramatically improves perceived latency:

```python
stream = client.chat.completions.create(
    model="gpt-4o",
    messages=messages,
    stream=True,
)

for chunk in stream:
    if chunk.choices[0].delta.content:
        yield chunk.choices[0].delta.content
```

Time-to-first-token matters more than total generation time for user experience.

### Parallelization

When you need multiple LLM calls, run them in parallel:

```python
import asyncio

async def process_batch(items):
    tasks = [call_llm(item) for item in items]
    return await asyncio.gather(*tasks)
```

This turns 5 sequential 2-second calls (10s total) into 5 parallel calls (2s total).

---

## Caching Strategies

LLM calls are expensive and slow. Caching is one of the highest-leverage optimizations.

### Exact Match Cache

Cache responses for identical inputs:

```python
import hashlib

def get_or_create(prompt, model, **kwargs):
    cache_key = hashlib.sha256(
        f"{model}:{prompt}:{kwargs}".encode()
    ).hexdigest()

    cached = cache.get(cache_key)
    if cached:
        return cached

    response = llm.create(prompt=prompt, model=model, **kwargs)
    cache.set(cache_key, response, ttl=3600)
    return response
```

### Semantic Cache

For similar (not identical) queries, use embedding similarity to find cached results:

```python
query_embedding = embed(query)
similar = cache.search(query_embedding, threshold=0.95)
if similar:
    return similar.response  # Return cached response for similar query
```

### Cache Invalidation

The hard problem. Strategies include:
- **TTL-based:** Expire after N hours/days
- **Event-based:** Invalidate when source data changes
- **Version-based:** Include a version key that you increment on data updates

---

## Monitoring and Alerting

You cannot fix what you cannot see. Production LLM systems need monitoring at multiple levels.

### Operational Metrics

- **Latency** (p50, p95, p99) per endpoint
- **Error rate** — API failures, timeouts, rate limits
- **Cost** — per-request and aggregate, broken down by model
- **Throughput** — requests per second, tokens per second

### Quality Metrics

- **Output quality scores** — via LLM-as-judge or user feedback
- **Hallucination rate** — percentage of responses with unsupported claims
- **Relevance scores** — for RAG systems, how relevant is the retrieved context
- **Format compliance** — percentage of responses matching expected structure

### Drift Detection

Monitor for distribution shifts in inputs and outputs:

```python
# Track input characteristics over time
metrics = {
    "avg_input_length": np.mean([len(r.input) for r in recent_requests]),
    "topic_distribution": classify_topics(recent_requests),
    "language_distribution": detect_languages(recent_requests),
}

# Alert if distribution shifts significantly
if kl_divergence(current_distribution, baseline_distribution) > threshold:
    alert("Input distribution drift detected")
```

### Alerting Rules

Set alerts for:
- Latency p95 exceeding SLA
- Error rate above threshold (e.g., > 1%)
- Cost spike (e.g., > 2x daily average)
- Quality score drop (e.g., average rating below threshold)
- Provider outage (consecutive failures)

---

## Deployment Patterns

### Blue-Green Deployment

Run two identical environments. Deploy to the inactive one, test, then switch traffic:

```
Load Balancer -> [Blue (current)] 100%
                 [Green (new)]     0%

# After testing green:
Load Balancer -> [Blue (old)]      0%
                 [Green (current)] 100%
```

Rollback is instant — just switch back.

### Canary Deployment

Route a small percentage of traffic to the new version and monitor:

```
Load Balancer -> [Current version]  95%
                 [New version]       5%
```

If metrics look good, gradually increase the canary percentage. If something goes wrong, route all traffic back to the current version.

### Shadow Mode

Run the new version in parallel without serving its results to users:

```python
async def handle_request(query):
    # Production response
    response = await current_model.generate(query)

    # Shadow response (logged but not returned)
    asyncio.create_task(
        shadow_model.generate(query).then(log_shadow_response)
    )

    return response
```

This lets you compare quality metrics before any user impact.

---

## Error Handling and Fallbacks

LLM applications have more failure modes than traditional software. Plan for all of them.

### Common Failure Modes

- **Provider outage:** The LLM API is down
- **Rate limiting:** You have exceeded your quota
- **Timeout:** The request took too long
- **Content filter:** The provider blocked the request
- **Malformed output:** The model returned unparseable data
- **Quality degradation:** The model returns technically valid but low-quality output

### Fallback Strategies

```python
async def generate_with_fallbacks(prompt):
    # Try primary model
    try:
        return await call_model("gpt-4o", prompt, timeout=10)
    except (Timeout, APIError):
        pass

    # Fallback to secondary model
    try:
        return await call_model("claude-3-5-sonnet", prompt, timeout=10)
    except (Timeout, APIError):
        pass

    # Fallback to cached response
    cached = find_similar_cached_response(prompt)
    if cached:
        return cached

    # Final fallback: graceful degradation
    return "I'm unable to process this request right now. Please try again later."
```

### Circuit Breaker Pattern

If a provider is failing repeatedly, stop sending requests:

```python
class CircuitBreaker:
    def __init__(self, failure_threshold=5, reset_timeout=60):
        self.failures = 0
        self.threshold = failure_threshold
        self.reset_timeout = reset_timeout
        self.state = "closed"  # closed = normal, open = blocking

    def call(self, func, *args):
        if self.state == "open":
            if time_since_opened > self.reset_timeout:
                self.state = "half-open"
            else:
                raise CircuitOpenError()

        try:
            result = func(*args)
            self.failures = 0
            self.state = "closed"
            return result
        except Exception:
            self.failures += 1
            if self.failures >= self.threshold:
                self.state = "open"
            raise
```

---

## The Build vs Buy Decision

For every component in your AI system, you face a build-vs-buy decision:

**Buy (managed services) when:**
- The component is not your core differentiator
- You need to move fast and validate the idea
- Operational burden of self-hosting is not justified
- The managed service has better reliability than you can achieve

**Build (self-host) when:**
- Data privacy requirements prevent using external services
- You need fine-grained control over behavior
- Cost at scale makes managed services prohibitive
- The component is your core competitive advantage

Common decisions:
- **LLM inference:** Buy (OpenAI, Anthropic) unless you have strict privacy requirements or massive scale
- **Vector database:** Buy for most cases (managed Pinecone, Weaviate Cloud), build if latency-critical
- **Orchestration:** Build (your application logic is your differentiator)
- **Monitoring:** Buy (Datadog, Langfuse) unless you have specialized needs

---

## Key Takeaways

1. **Choose the simplest architecture that works.** API wrapper beats RAG pipeline beats agent architecture — unless you genuinely need the complexity.
2. **Cache aggressively.** LLM calls are expensive and slow. Caching is often the single highest-leverage optimization.
3. **Monitor everything, alert selectively.** Track latency, cost, errors, and quality. Alert only on actionable signals.
4. **Plan for failure.** Multi-provider fallbacks, circuit breakers, and graceful degradation are not optional in production.
5. **Buy until you have a reason to build.** Managed services let you focus on your actual product instead of infrastructure.
