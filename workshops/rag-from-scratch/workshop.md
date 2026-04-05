# RAG from Scratch

Build a retrieval-augmented generation (RAG) system from the ground up. No frameworks, no magic -- just Python, embeddings, and a clear understanding of how each piece works.

## Workshop Overview

RAG is the most practical technique for making AI systems work with your own data. Instead of fine-tuning a model (which is expensive and slow), RAG retrieves relevant documents at query time and includes them in the prompt. This workshop builds every component of a RAG pipeline by hand so you understand what tools like LangChain and LlamaIndex are doing under the hood.

You will load a set of documents, split them into chunks, generate embeddings, store them for search, retrieve relevant chunks for a user query, and generate an answer grounded in those chunks. By the end, you will have a working system that can answer questions about any document collection you give it.

## Prerequisites

- Comfortable with Python (functions, lists, dictionaries, file I/O)
- Basic understanding of AI APIs (completed "How AI APIs Work" or equivalent)
- Familiarity with what embeddings are conceptually (we will reinforce this in the workshop)

## Materials Needed

Install the following before the workshop:

- Python 3.10+
- A code editor (Cursor recommended)
- `pip install openai numpy python-dotenv`
- An OpenAI API key stored in a `.env` file
- Download the workshop document set (link provided before session)

## Agenda

| Time | Section | Description |
|---|---|---|
| 0:00 - 0:10 | **The RAG Mental Model** | Whiteboard the full RAG pipeline. |
| 0:10 - 0:25 | **Loading and Chunking Documents** | Load text files and implement chunking. |
| 0:25 - 0:40 | **Generating Embeddings** | Convert text chunks into vectors. |
| 0:40 - 0:55 | **Building a Vector Search** | Implement cosine similarity search with NumPy. |
| 0:55 - 1:05 | **Break** | |
| 1:05 - 1:20 | **Generation with Context** | Combine retrieval with generation. |
| 1:20 - 1:35 | **Evaluation and Failure Modes** | Test with tricky queries and diagnose failures. |
| 1:35 - 1:40 | **Wrap-Up and Next Steps** | Discuss production paths and frameworks. |

---

## Part 1: The RAG Mental Model (10 min)

Before writing code, understand the architecture. A RAG system has two phases:

**Indexing Phase** (done once, ahead of time):
1. Load documents
2. Split them into chunks
3. Generate an embedding vector for each chunk
4. Store chunks + vectors for later search

**Query Phase** (done for every user question):
1. Generate an embedding for the user's question
2. Search for the most similar chunk embeddings
3. Retrieve the text of those chunks
4. Build a prompt that includes the chunks as context
5. Send to the LLM and get an answer grounded in your documents

**Why RAG instead of fine-tuning?**
- Fine-tuning bakes knowledge into model weights (expensive, slow, hard to update)
- RAG keeps knowledge in a searchable store (cheap, instant updates, auditable)
- RAG lets you cite sources -- you know which documents informed the answer

Create your project structure:

```bash
mkdir rag-workshop && cd rag-workshop
python -m venv venv
source venv/bin/activate
pip install openai numpy python-dotenv
mkdir documents
```

Create a `.env` file:

```
OPENAI_API_KEY=sk-your-key-here
```

### Prepare Sample Documents

Create 3-4 short text files in the `documents/` folder. You can use any topic. Here are examples:

**documents/python_basics.txt:**
```
Python is a high-level, interpreted programming language created by Guido van Rossum
and first released in 1991. Python's design philosophy emphasizes code readability with
its notable use of significant whitespace. It supports multiple programming paradigms,
including structured, object-oriented, and functional programming.

Python is dynamically typed and garbage-collected. It supports modules and packages,
which encourages program modularity and code reuse. The Python Package Index (PyPI)
hosts over 400,000 packages covering everything from web development to scientific
computing.
```

**documents/machine_learning.txt:**
```
Machine learning is a subset of artificial intelligence that focuses on building systems
that learn from data. Instead of being explicitly programmed with rules, ML systems
identify patterns in training data and use those patterns to make predictions on new data.

There are three main types of machine learning: supervised learning, where the model
learns from labeled examples; unsupervised learning, where the model finds structure
in unlabeled data; and reinforcement learning, where an agent learns by interacting
with an environment and receiving rewards or penalties.

Common supervised learning algorithms include linear regression, decision trees,
random forests, and neural networks. The choice of algorithm depends on the nature
of the data, the size of the dataset, and the specific problem being solved.
```

Create at least one more file on a topic of your choice.

---

## Part 2: Loading and Chunking Documents (15 min)

Create `rag.py` -- this will be your main file.

```python
import os
from pathlib import Path

def load_documents(directory: str) -> list[dict]:
    """Load all .txt files from a directory."""
    documents = []
    for filepath in Path(directory).glob("*.txt"):
        with open(filepath, "r") as f:
            text = f.read()
        documents.append({
            "filename": filepath.name,
            "text": text,
        })
        print(f"Loaded {filepath.name} ({len(text)} chars)")
    return documents

# Test it
docs = load_documents("documents")
print(f"\nLoaded {len(docs)} documents")
```

Now implement chunking. Chunking splits documents into smaller pieces that fit in the model's context and are granular enough for precise retrieval.

```python
def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
    """Split text into overlapping chunks."""
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        chunks.append(chunk.strip())
        start = end - overlap
    return [c for c in chunks if c]  # Remove empty chunks

def chunk_documents(documents: list[dict], chunk_size: int = 500, overlap: int = 50) -> list[dict]:
    """Chunk all documents, preserving source metadata."""
    all_chunks = []
    for doc in documents:
        chunks = chunk_text(doc["text"], chunk_size, overlap)
        for i, chunk in enumerate(chunks):
            all_chunks.append({
                "text": chunk,
                "source": doc["filename"],
                "chunk_index": i,
            })
    print(f"Created {len(all_chunks)} chunks from {len(documents)} documents")
    return all_chunks

# Test it
docs = load_documents("documents")
chunks = chunk_documents(docs)
for c in chunks[:3]:
    print(f"\n--- {c['source']} chunk {c['chunk_index']} ---")
    print(c["text"][:100] + "...")
```

### Why Overlap?

If an important sentence falls right at the boundary between two chunks, overlap ensures it appears in both. Without overlap, you risk splitting key information across chunks where neither chunk alone has the full context.

### Exercise

Try different `chunk_size` values (200, 500, 1000) and observe how the chunks change. Smaller chunks are more precise but may lack context. Larger chunks provide more context but are less targeted.

---

## Part 3: Generating Embeddings (15 min)

Embeddings convert text into numerical vectors where similar meaning produces similar vectors. This is what makes semantic search possible.

```python
from dotenv import load_dotenv
from openai import OpenAI
import numpy as np

load_dotenv()
client = OpenAI()

def get_embeddings(texts: list[str], model: str = "text-embedding-3-small") -> np.ndarray:
    """Generate embeddings for a list of texts."""
    response = client.embeddings.create(
        model=model,
        input=texts,
    )
    embeddings = [item.embedding for item in response.data]
    return np.array(embeddings)

# Test with a small example
test_texts = [
    "Python is a programming language",
    "Java is a programming language",
    "I like eating pizza for dinner",
]
test_embeddings = get_embeddings(test_texts)
print(f"Shape: {test_embeddings.shape}")
print(f"Each embedding has {test_embeddings.shape[1]} dimensions")
```

Now embed all your chunks:

```python
def embed_chunks(chunks: list[dict]) -> tuple[list[dict], np.ndarray]:
    """Generate embeddings for all chunks."""
    texts = [c["text"] for c in chunks]
    # Batch in groups of 100 to avoid API limits
    all_embeddings = []
    for i in range(0, len(texts), 100):
        batch = texts[i:i+100]
        embeddings = get_embeddings(batch)
        all_embeddings.append(embeddings)
        print(f"Embedded batch {i//100 + 1}")
    return chunks, np.vstack(all_embeddings)

docs = load_documents("documents")
chunks = chunk_documents(docs)
chunks, embeddings = embed_chunks(chunks)
print(f"\nEmbeddings shape: {embeddings.shape}")
```

### Quick Intuition Check

Let's verify that embeddings capture semantic similarity:

```python
def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """Compute cosine similarity between two vectors."""
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

# Compare our test embeddings
print(f"Python vs Java (similar): {cosine_similarity(test_embeddings[0], test_embeddings[1]):.4f}")
print(f"Python vs Pizza (different): {cosine_similarity(test_embeddings[0], test_embeddings[2]):.4f}")
```

You should see that the two programming language sentences have a much higher similarity score than the programming vs. pizza comparison. This is the entire basis of vector search.

---

## Part 4: Building a Vector Search (15 min)

Now build the search function. Given a query, embed it, then find the chunks with the highest cosine similarity.

```python
def search(query: str, chunks: list[dict], embeddings: np.ndarray, top_k: int = 3) -> list[dict]:
    """Search for the most relevant chunks for a query."""
    # Embed the query
    query_embedding = get_embeddings([query])[0]

    # Compute similarity against all chunk embeddings
    similarities = np.dot(embeddings, query_embedding) / (
        np.linalg.norm(embeddings, axis=1) * np.linalg.norm(query_embedding)
    )

    # Get top-k indices
    top_indices = np.argsort(similarities)[::-1][:top_k]

    # Return chunks with scores
    results = []
    for idx in top_indices:
        results.append({
            **chunks[idx],
            "score": float(similarities[idx]),
        })
    return results

# Test it
results = search("What types of machine learning are there?", chunks, embeddings)
for r in results:
    print(f"\n[Score: {r['score']:.4f}] {r['source']} chunk {r['chunk_index']}")
    print(r["text"][:150] + "...")
```

### Exercise

Try several different queries and inspect the results:
- A question directly answered by one of your documents
- A question that spans multiple documents
- A question not covered by any document

Notice how the similarity scores change. Relevant results should score significantly higher than irrelevant ones.

---

## Part 5: Generation with Context (15 min)

Now combine retrieval with generation. This is the core of RAG -- give the model relevant context and ask it to answer based on that context.

```python
def rag_query(question: str, chunks: list[dict], embeddings: np.ndarray) -> str:
    """Answer a question using RAG."""
    # Step 1: Retrieve relevant chunks
    results = search(question, chunks, embeddings, top_k=3)

    # Step 2: Build the context string
    context_parts = []
    for r in results:
        context_parts.append(f"[Source: {r['source']}]\n{r['text']}")
    context = "\n\n---\n\n".join(context_parts)

    # Step 3: Build the prompt
    prompt = f"""Answer the following question based on the provided context.
If the context does not contain enough information to answer the question,
say so explicitly. Do not make up information.

Context:
{context}

Question: {question}

Answer:"""

    # Step 4: Generate the answer
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a helpful assistant that answers questions based on provided context. Always cite which source document your answer comes from."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.2,
    )

    return response.choices[0].message.content

# Test the full pipeline
docs = load_documents("documents")
chunks = chunk_documents(docs)
chunks, embeddings = embed_chunks(chunks)

answer = rag_query("What are the main types of machine learning?", chunks, embeddings)
print(answer)
```

### The Full Pipeline in Action

Let's wrap it in an interactive loop:

```python
def main():
    print("Loading and indexing documents...")
    docs = load_documents("documents")
    chunks = chunk_documents(docs)
    chunks, embeddings = embed_chunks(chunks)
    print(f"\nRAG system ready. {len(chunks)} chunks indexed.")
    print("Ask questions about your documents. Type 'quit' to exit.\n")

    while True:
        question = input("Question: ")
        if question.lower() in ("quit", "exit"):
            break

        print("\nSearching...")
        answer = rag_query(question, chunks, embeddings)
        print(f"\nAnswer: {answer}\n")

if __name__ == "__main__":
    main()
```

### Key Prompt Design Decisions

Notice the prompt template:
- **Instruction to stay grounded:** "If the context does not contain enough information, say so"
- **Citation instruction:** "Always cite which source document your answer comes from"
- **Low temperature (0.2):** Reduces creativity in favor of factual accuracy

These are not optional. Without them, the model will happily hallucinate answers that sound plausible but are not in your documents.

---

## Part 6: Evaluation and Failure Modes (15 min)

Test your system with these deliberately tricky queries and diagnose the failures.

### Test 1: Direct Question

Ask something clearly answered by your documents. This should work well. If it does not, check your chunk size -- the answer might be split across chunk boundaries.

### Test 2: Cross-Document Question

Ask something that requires information from multiple documents. Does the system retrieve chunks from different sources? Does the answer synthesize them?

### Test 3: Out-of-Scope Question

Ask something not covered by any document:

```
Question: What is the capital of France?
```

A good RAG system should say it cannot answer from the provided context. If it answers anyway, strengthen your system prompt.

### Test 4: Ambiguous Query

Ask a vague question like "Tell me about learning." Does it retrieve ML-related chunks or general learning chunks? This reveals how your chunking and embedding strategy handles ambiguity.

### Common Failure Modes

| Failure | Symptom | Fix |
|---|---|---|
| Wrong chunks retrieved | Answer is about the wrong topic | Improve chunking, try smaller chunks |
| Answer not grounded | Model ignores context and uses own knowledge | Strengthen system prompt, lower temperature |
| Partial answer | Chunk is too short to contain the full answer | Increase chunk size or overlap |
| No relevant chunks | All similarity scores are low | Add more documents, check embedding quality |

### Exercise

Identify at least one failure in your system. Diagnose the root cause and try to fix it by adjusting chunk size, overlap, the prompt template, or the number of retrieved chunks.

---

## Part 7: Wrap-Up and Next Steps (5 min)

You built every component of a RAG pipeline by hand:

1. **Document loader** -- reads files from disk
2. **Chunker** -- splits text into overlapping segments
3. **Embedder** -- converts text to vectors via the OpenAI API
4. **Vector search** -- finds similar chunks using cosine similarity
5. **Generator** -- answers questions using retrieved context

### When to Graduate to Real Tools

Your hand-built system works but is not production-ready. Here is when to use what:

- **Vector databases** (Pinecone, Weaviate, Chroma) -- when you have thousands of documents and need fast, persistent search
- **LangChain / LlamaIndex** -- when you want pre-built chunking strategies, retrieval chains, and integrations
- **Hybrid search** -- combining keyword search (BM25) with vector search for better retrieval

But because you built it from scratch, you now understand what these tools are actually doing. When something goes wrong in production, you will know where to look.

---

## Key Takeaways

- RAG is retrieval + generation: find relevant context, then ask the model to answer using that context
- Chunking strategy directly affects retrieval quality -- there is no universal "right" chunk size
- Cosine similarity on embeddings is the core search mechanism in most RAG systems
- Evaluating RAG output requires checking both retrieval quality (did you find the right chunks?) and generation quality (did the model use them correctly?)
- The prompt template is a critical component -- it must instruct the model to stay grounded in the provided context

## Next Steps

- Add more documents and test how the system scales
- Implement a persistent embedding cache so you do not re-embed documents on every run
- Try different embedding models and compare retrieval quality
- Explore the "Build an Agent" workshop for the next step in applied AI
