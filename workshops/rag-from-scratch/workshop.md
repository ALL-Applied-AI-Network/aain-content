# RAG from Scratch

Build a retrieval-augmented generation (RAG) system from the ground up. No frameworks, no magic -- just Python, embeddings, and a clear understanding of how each piece works.

> **Status: Coming Soon** -- The full hands-on content for this workshop is under development. The outline below reflects the planned structure and scope.

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
| 0:00 - 0:10 | **The RAG Mental Model** | Whiteboard the full RAG pipeline. Understand why retrieval solves the "knowledge cutoff" and "hallucination" problems better than fine-tuning for most use cases. |
| 0:10 - 0:25 | **Loading and Chunking Documents** | Load text files into Python. Implement a chunking strategy: fixed-size with overlap. Discuss why chunk size and overlap matter for retrieval quality. |
| 0:25 - 0:40 | **Generating Embeddings** | Call the OpenAI embeddings API to convert text chunks into vectors. Understand what an embedding represents and why similar texts produce similar vectors. |
| 0:40 - 0:55 | **Building a Vector Search** | Implement cosine similarity search using NumPy. No vector database needed -- build the search function yourself so you understand exactly what is happening. Query your document collection and inspect the results. |
| 0:55 - 1:05 | **Break** | |
| 1:05 - 1:20 | **Generation with Context** | Combine retrieval with generation. Build the prompt template that includes retrieved chunks, send it to the chat API, and see your RAG system answer questions about your documents. |
| 1:20 - 1:35 | **Evaluation and Failure Modes** | Test your system with tricky queries. Identify common RAG failures: wrong chunks retrieved, answer not grounded in context, chunk too short for full answer. Discuss strategies for each. |
| 1:35 - 1:40 | **Wrap-Up and Next Steps** | Discuss when to graduate to a vector database, how frameworks like LangChain map to what you built, and where to go from here. |

## Key Takeaways

- RAG is retrieval + generation: find relevant context, then ask the model to answer using that context
- Chunking strategy directly affects retrieval quality -- there is no universal "right" chunk size
- Cosine similarity on embeddings is the core search mechanism in most RAG systems
- Evaluating RAG output requires checking both retrieval quality (did you find the right chunks?) and generation quality (did the model use them correctly?)
