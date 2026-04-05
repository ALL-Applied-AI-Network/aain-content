# Advanced RAG Patterns

## Beyond Naive RAG

In the RAG Fundamentals lesson, you built a pipeline that loads documents, chunks them, embeds them, stores vectors, and retrieves relevant context for generation. That pipeline works — but it has real limitations that show up quickly in production.

**Common failure modes of naive RAG:**

- **Poor chunking:** Fixed-size chunks split sentences mid-thought, losing context. A chunk boundary might land right between a question and its answer.
- **Embedding mismatches:** Semantic similarity does not always mean relevance. The embedding for "What is the capital of France?" is close to "What is the capital of Germany?" — but only one answers your question.
- **No ranking signal:** All retrieved chunks are treated equally, even though some are far more relevant than others.
- **Query-document mismatch:** Users ask questions in natural language, but your documents might use different terminology.

This lesson covers the patterns that address these failures and push RAG systems from "demo quality" to "production quality."

---

## Chunking Strategies

How you split documents has an outsized impact on retrieval quality. There is no single best approach — the right strategy depends on your document types and query patterns.

### Fixed-Size Chunking

The simplest approach: split every N tokens with some overlap.

```python
def fixed_chunk(text, chunk_size=512, overlap=50):
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size - overlap):
        chunk = " ".join(words[i:i + chunk_size])
        chunks.append(chunk)
    return chunks
```

**When it works:** Uniform documents (e.g., product descriptions, form responses).
**When it fails:** Documents with meaningful structure (headers, sections, paragraphs).

### Recursive / Structure-Aware Chunking

Split on natural boundaries — paragraphs, then sentences, then words — only breaking smaller units when chunks exceed the size limit.

```python
from langchain.text_splitter import RecursiveCharacterTextSplitter

splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
    separators=["\n\n", "\n", ". ", " ", ""]
)
chunks = splitter.split_text(document_text)
```

This preserves paragraph and sentence boundaries whenever possible, which significantly improves coherence.

### Semantic Chunking

Group text by meaning rather than position. Embed each sentence, then find natural break points where the embedding similarity drops:

```python
from sentence_transformers import SentenceTransformer
import numpy as np

model = SentenceTransformer("all-MiniLM-L6-v2")
sentences = text.split(". ")
embeddings = model.encode(sentences)

# Find similarity between consecutive sentences
similarities = [
    np.dot(embeddings[i], embeddings[i+1])
    for i in range(len(embeddings) - 1)
]

# Split where similarity drops below threshold
breakpoints = [i for i, sim in enumerate(similarities) if sim < threshold]
```

**When to use it:** Documents that cover multiple topics, where you need clean topic boundaries.

### Document-Specific Chunking

For structured formats (HTML, Markdown, PDF), use the document's own structure:

- **Markdown:** Split on headers, keeping the header hierarchy as metadata
- **HTML:** Parse the DOM and chunk by semantic elements (article, section, p)
- **PDF:** Use layout analysis to identify sections, tables, and figures

The key insight: **include metadata with every chunk.** Knowing that a chunk came from "Section 3.2: Error Handling" is enormously valuable for retrieval and generation.

---

## Hybrid Search: BM25 + Embeddings

Embedding-based search finds semantically similar content. BM25 (keyword search) finds exact term matches. Neither is sufficient alone.

**Embeddings are good at:**
- Paraphrases and synonyms ("car" matches "automobile")
- Conceptual similarity ("machine learning" matches "neural networks")

**BM25 is good at:**
- Exact terms, acronyms, product names ("XGBoost", "GPT-4o")
- Specific identifiers ("error code 0x80070005")
- Rare or technical vocabulary

**Hybrid search combines both.** A common approach uses Reciprocal Rank Fusion (RRF) to merge results:

```python
def reciprocal_rank_fusion(results_lists, k=60):
    """Merge multiple ranked result lists using RRF."""
    scores = {}
    for results in results_lists:
        for rank, doc_id in enumerate(results):
            scores[doc_id] = scores.get(doc_id, 0) + 1 / (k + rank + 1)
    return sorted(scores, key=scores.get, reverse=True)

# Combine embedding search and BM25 results
embedding_results = vector_store.search(query_embedding, top_k=20)
bm25_results = bm25_index.search(query_text, top_k=20)

final_ranking = reciprocal_rank_fusion([embedding_results, bm25_results])
```

Many vector databases (Weaviate, Qdrant, Pinecone) now support hybrid search natively. Use it — the improvement over embeddings alone is consistent and significant.

---

## Reranking with Cross-Encoders

Initial retrieval (whether embedding-based or hybrid) is fast but imprecise. **Reranking** adds a second pass that scores each retrieved document against the query more carefully.

The key difference: embedding search uses **bi-encoders** (query and document are encoded independently), while reranking uses **cross-encoders** (query and document are processed together, allowing richer interaction).

```python
from sentence_transformers import CrossEncoder

reranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")

# First: retrieve top 20 candidates (fast)
candidates = vector_store.search(query, top_k=20)

# Then: rerank with cross-encoder (slower but more accurate)
pairs = [(query, doc.text) for doc in candidates]
scores = reranker.predict(pairs)

# Sort by reranking score, take top 5
reranked = sorted(zip(candidates, scores), key=lambda x: x[1], reverse=True)
top_docs = [doc for doc, score in reranked[:5]]
```

**The pattern:** Retrieve broadly (20-50 candidates), then rerank to select the best 3-5. This gives you the speed of embedding search with the accuracy of cross-encoder scoring.

Cohere, Jina, and Voyage AI all offer reranking APIs if you do not want to self-host.

---

## Query Transformation

Sometimes the user's query is not the best query for your retrieval system. Query transformation techniques bridge this gap.

### Query Expansion

Generate multiple phrasings of the same question:

```python
expansion_prompt = """Given this question, generate 3 alternative phrasings
that would help find relevant information:

Question: {query}

Return only the alternative phrasings, one per line."""
```

Search with all phrasings and merge results.

### Hypothetical Document Embeddings (HyDE)

Instead of embedding the question, generate a hypothetical answer and embed that:

```python
hyde_prompt = f"Write a short paragraph that would answer: {query}"
hypothetical_answer = llm.generate(hyde_prompt)
search_embedding = embed(hypothetical_answer)
results = vector_store.search(search_embedding, top_k=10)
```

This works because the hypothetical answer is in the same "language space" as your documents, improving embedding similarity.

### Step-Back Prompting

For specific questions, first ask a more general version:

- Specific: "What was the GDP of France in 2023?"
- Step-back: "What are the economic indicators of France?"

The broader query often retrieves more useful context.

---

## Evaluation Metrics

You cannot improve what you do not measure. RAG evaluation requires metrics for both retrieval and generation quality.

### Retrieval Metrics

- **Precision@k:** Of the top k retrieved documents, what fraction are relevant?
- **Recall@k:** Of all relevant documents, what fraction appear in the top k?
- **Mean Reciprocal Rank (MRR):** How high does the first relevant document rank? MRR = 1/rank of first relevant result, averaged over queries.
- **NDCG:** Normalized Discounted Cumulative Gain — accounts for both relevance and position.

### Generation Metrics

- **Faithfulness:** Does the generated answer stick to the retrieved context, or does it hallucinate?
- **Answer relevance:** Does the answer actually address the question?
- **Context relevance:** Is the retrieved context relevant to the question?

### Building an Evaluation Set

Start with 50-100 question-answer pairs with labeled relevant documents:

```python
eval_set = [
    {
        "question": "What is the return policy?",
        "expected_answer": "30-day full refund...",
        "relevant_doc_ids": ["policy-returns-v2", "faq-section-3"]
    },
    # ... more examples
]
```

Run your pipeline, measure metrics, change one thing, measure again. This is the iteration loop that separates good RAG systems from bad ones.

---

## The Iterative Improvement Workflow

Building production RAG is not a one-shot process. It is iterative:

1. **Build a baseline** with naive RAG (fixed chunks, embedding search, no reranking)
2. **Create an evaluation set** with real user questions and labeled answers
3. **Measure baseline metrics** (precision, recall, MRR, faithfulness)
4. **Change one thing** (chunking strategy, add BM25, add reranking, tune chunk size)
5. **Measure again** and compare
6. **Repeat** until metrics meet your quality bar

The most common mistakes are: changing multiple things at once (you cannot tell what helped), not measuring before making changes, and optimizing retrieval without measuring generation quality.

---

## Key Takeaways

1. **Naive RAG is a starting point, not a destination.** Fixed-size chunks and pure embedding search have well-known limitations.
2. **Chunking strategy matters more than most people think.** Match your chunking to your document structure and include metadata.
3. **Hybrid search (BM25 + embeddings) should be your default.** The improvement is consistent across domains.
4. **Reranking is high-leverage.** Retrieve broadly, rerank precisely.
5. **Measure everything.** Build an evaluation set early and iterate systematically. Without metrics, you are guessing.
