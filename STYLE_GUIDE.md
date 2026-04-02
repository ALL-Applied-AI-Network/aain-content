# ALL Applied AI Network Content Style Guide

> The definitive reference for writing, formatting, and structuring content in the ALL Applied AI Network learning platform. This guide is intended for **human contributors** and **AI coding assistants** (Cursor, Claude Code, Copilot) alike.

---

## Table of Contents

- [1. Writing Philosophy](#1-writing-philosophy)
- [2. Article Structure](#2-article-structure)
- [3. Markdown Component Library](#3-markdown-component-library)
  - [Callouts](#callouts)
  - [Tabs](#tabs)
  - [Build Challenges](#build-challenges)
  - [Code Blocks](#code-blocks)
  - [Collapsible Sections](#collapsible-sections)
  - [Diagrams (Mermaid)](#diagrams-mermaid)
  - [Key Term Definitions](#key-term-definitions)
  - [Interactive Examples](#interactive-examples-future)
- [4. Code Style](#4-code-style)
- [5. Image Guidelines](#5-image-guidelines)
- [6. node.yaml Conventions](#6-nodeyaml-conventions)
- [7. Tone and Voice](#7-tone-and-voice)
- [8. AI-Assisted Authoring Guidelines](#8-ai-assisted-authoring-guidelines)
- [9. Example Article](#9-example-article)

---

## 1. Writing Philosophy

### Applied AI Engineering

This is not an academic textbook. Every piece of content exists to help someone **build something real** with AI. We write for applied AI engineers -- people who learn by doing, not by reading proofs.

### Audience

Write for someone who **has used a computer but has never written code**. That is the baseline. Never assume prior programming knowledge unless the article's prerequisites explicitly state it. At the same time, never talk down to the reader -- they are smart, they just have not been shown this yet.

### Core Principles

| Principle | What It Means in Practice |
|---|---|
| **Build-focused** | Every concept connects to something the student can build. If a section does not lead toward building, cut it or rewrite it. |
| **Expert quality** | Clear, precise, no filler. Write the explanation you wish existed when you were learning. |
| **Welcoming, not condescending** | Avoid phrases like "simply do X" or "it's easy." Acknowledge that new things are new. |
| **Practical over theoretical** | Theory serves practice. Introduce just enough theory to make the practical step make sense. |
| **Tested and runnable** | Every code example runs. Every command works. Every output is verified. |

### The "Best Possible Explanation" Test

Before submitting any article, ask: *Is this the best explanation of this topic that exists on the internet right now?* If not, keep refining. We are not porting content from other sources. We are creating the definitive applied AI learning path.

---

## 2. Article Structure

Every learning tree article follows this structure, in this order. Do not skip sections.

### Title (H1)

- Clear and specific
- Describes what the reader learns, not a vague topic
- Good: `# What Is an API and How Do You Use One?`
- Bad: `# APIs`

### Overview

Two to three sentences immediately after the title. State **what the reader learns** and **why it matters**. No fluff.

```markdown
In this article, you learn what an API is, why APIs are the backbone of modern
software, and how to make your first API call using Python. By the end, you have
working code that fetches real data from the internet.
```

### Prerequisites Callout

Use the `callout[info]` component to list what the reader should know before starting. Link to the prerequisite nodes in the learning tree.

```markdown
:::callout[info]
**Before you start**, make sure you are comfortable with:
- [Variables and data types](/learning/foundations/variables-and-types)
- [Running Python scripts](/learning/foundations/running-python)
:::
```

### Main Content

Break the content into logical sections using H2 (`##`) and H3 (`###`) headers. Each section should teach one concept and build on the previous one. Aim for a clear narrative arc:

1. **Set the context** -- why does this matter?
2. **Introduce the concept** -- what is it?
3. **Show it in action** -- code, diagram, or example
4. **Reinforce understanding** -- explain what just happened

### Key Takeaways

A bulleted list summarizing the main points. The reader should be able to scan this section and recall everything important from the article.

```markdown
## Key Takeaways

- An API is a structured way for programs to talk to each other over the internet.
- You send a **request** and receive a **response**, usually in JSON format.
- The `requests` library in Python makes API calls straightforward.
- Always check the status code before using the response data.
```

### Build Challenge

A hands-on exercise that applies everything from the article. Use the `build-challenge` component. Include clear requirements and a stretch goal for students who want more.

```markdown
:::build-challenge
**Build it:** Create a Python script that fetches the current weather for any
city using the OpenWeatherMap API.

- Accept a city name as user input
- Make a GET request to the weather API
- Display the temperature, conditions, and humidity
- Handle the case where the city is not found

**Stretch goal:** Add a 5-day forecast and format the output as a table.
:::
```

### What's Next

Link to the nodes that this article unlocks in the learning tree. Frame it as forward momentum.

```markdown
## What's Next

Now that you understand APIs, you are ready to:
- [Work with JSON data](/learning/foundations/working-with-json)
- [Build your first web scraper](/learning/data/web-scraping-basics)
```

---

## 3. Markdown Component Library

These are the custom components available in our content system. Use them consistently. Every component is shown here with its exact markdown syntax and a description of how it renders.

---

### Callouts

Callouts highlight important information. Use the right type for the right purpose.

#### Tip

For helpful advice, shortcuts, or best practices.

```markdown
:::callout[tip]
You can test API calls quickly using a tool called Postman before writing any code.
:::
```

**Renders as:** A green-accented box with a lightbulb icon and the content inside.

#### Warning

For common mistakes or things that might cause confusion.

```markdown
:::callout[warning]
Never commit API keys to a public repository. Use environment variables instead.
:::
```

**Renders as:** A yellow/amber-accented box with a warning triangle icon.

#### Info

For supplementary context, prerequisites, or background information.

```markdown
:::callout[info]
JSON stands for JavaScript Object Notation, but it is used in virtually every
programming language, not just JavaScript.
:::
```

**Renders as:** A blue-accented box with an information circle icon.

#### Danger

For critical warnings -- things that can cause data loss, security issues, or breaking changes.

```markdown
:::callout[danger]
Running this command deletes your database. Make sure you have a backup before
proceeding.
:::
```

**Renders as:** A red-accented box with a danger/exclamation icon.

---

### Tabs

Use tabs when showing the same concept in multiple languages, platforms, or approaches. The reader picks the one relevant to them.

```markdown
:::tabs
tab: Python
```python
import requests

response = requests.get("https://api.example.com/data")
print(response.json())
```

tab: TypeScript
```typescript
const response = await fetch("https://api.example.com/data");
const data = await response.json();
console.log(data);
```

tab: cURL
```bash
curl https://api.example.com/data
```
:::
```

**Renders as:** A tabbed interface where each tab label is clickable. Only one tab's content is visible at a time. The reader's tab selection persists across tab groups on the same page.

**When to use tabs:**
- Multi-language code examples
- OS-specific instructions (macOS / Windows / Linux)
- Multiple approaches to the same problem

**When NOT to use tabs:**
- Sequential steps (use numbered lists instead)
- Unrelated content (use separate sections instead)

---

### Build Challenges

The capstone exercise for every article. Use exactly this format.

```markdown
:::build-challenge
**Build it:** Write a clear, one-sentence description of what to build.

- Requirement 1 (specific and testable)
- Requirement 2
- Requirement 3
- Requirement 4

**Stretch goal:** A harder extension that pushes the student further.
:::
```

**Renders as:** A distinct card with a wrench/hammer icon, visually separated from the main content. Requirements render as a checklist.

**Guidelines for good build challenges:**
- The student should be able to complete it using *only* what was taught in the article
- Requirements should be specific enough that the student knows when they are done
- The stretch goal should require independent research or combining with previous knowledge

---

### Code Blocks

Always use fenced code blocks with a language identifier. Never use bare or unlabeled code blocks.

#### Basic code block

````markdown
```python
def greet(name: str) -> str:
    return f"Hello, {name}!"
```
````

#### Code block with a title

Use titles to show filenames or provide context.

````markdown
```python title="weather.py"
import requests

def get_weather(city: str) -> dict:
    """Fetch current weather data for a given city."""
    url = f"https://api.openweathermap.org/data/2.5/weather?q={city}"
    response = requests.get(url)
    return response.json()
```
````

**Renders as:** A code block with syntax highlighting and a filename tab above it reading "weather.py".

#### Code block with highlighted lines

````markdown
```python {3-4}
def process_data(raw: list[dict]) -> list[dict]:
    cleaned = []
    for item in raw:           # This line is highlighted
        cleaned.append(item)   # This line is highlighted
    return cleaned
```
````

#### Inline code

Use backticks for inline references to code elements: function names, variables, file names, terminal commands, and API endpoints.

- Use `response.status_code` to check whether the request succeeded.
- Open the file `config.yaml` in your editor.
- Run `pip install requests` in your terminal.

---

### Collapsible Sections

Use for optional details, solutions to exercises, or lengthy reference material that would disrupt the reading flow.

```markdown
:::details[Click to see the solution]
```python
def fibonacci(n: int) -> list[int]:
    """Return the first n numbers in the Fibonacci sequence."""
    sequence = [0, 1]
    for i in range(2, n):
        sequence.append(sequence[i - 1] + sequence[i - 2])
    return sequence[:n]

print(fibonacci(10))
# Output: [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
```
:::
```

**Renders as:** A collapsed section with a clickable header. The content is hidden by default and expands when clicked.

**When to use:**
- Exercise solutions (always collapse these)
- Long reference tables
- Detailed explanations that only some readers need
- Extended terminal output

---

### Diagrams (Mermaid)

Use Mermaid diagrams for flowcharts, architecture diagrams, and process visualizations. Prefer Mermaid over static images whenever the diagram contains text and simple shapes.

```markdown
:::diagram
graph LR
    A[User Input] --> B[API Request]
    B --> C{Status OK?}
    C -->|Yes| D[Parse JSON]
    C -->|No| E[Handle Error]
    D --> F[Display Data]
:::
```

**Renders as:** An inline SVG diagram generated from the Mermaid definition.

#### Supported diagram types

| Type | Use Case | Example Syntax |
|---|---|---|
| `graph LR` | Left-to-right flowcharts | Processes, data pipelines |
| `graph TD` | Top-down flowcharts | Decision trees, hierarchies |
| `sequenceDiagram` | Interaction between systems | API call sequences |
| `classDiagram` | Object relationships | Data models |
| `stateDiagram-v2` | State machines | Application states |

**Guidelines:**
- Keep diagrams simple -- if it needs more than 10-12 nodes, break it into multiple diagrams
- Use clear, descriptive labels inside nodes
- Use the diagram to supplement the text, not replace it

---

### Key Term Definitions

Use for important terminology that the reader may encounter for the first time.

```markdown
:::definition[API]
**Application Programming Interface** -- a set of rules that allows one piece of
software to talk to another. Think of it as a menu at a restaurant: you do not
need to know how the kitchen works, you just need to know what you can order.
:::
```

**Renders as:** A styled definition card with the term as a heading and the definition below. An anchor link is generated so other articles can link directly to this definition.

**Guidelines:**
- Define the term formally first, then add an analogy or plain-language explanation
- Keep definitions self-contained -- someone should understand the definition without reading the rest of the article
- Only define a term once per article (on first use)

---

### Interactive Examples (Future)

These components are planned but not yet implemented. Use the syntax now so content is ready when the feature ships.

```markdown
:::playground[python]
# Students can edit and run this code
name = input("What's your name? ")
print(f"Hello, {name}!")
:::
```

**Will render as:** An embedded code editor with a "Run" button. Students can modify the code and execute it in a sandboxed environment.

For now, include these blocks in articles where interactivity would add value. They render as standard code blocks until the playground feature is live.

---

## 4. Code Style

### Python

- Follow [PEP 8](https://peps.python.org/pep-0008/) formatting
- Use **type hints** on all function signatures
- Prefer **f-strings** over `.format()` or `%` formatting
- Use **pathlib** over `os.path` for file operations
- Use descriptive variable names: `weather_data`, not `wd` or `data`
- Include docstrings on all functions in longer examples

```python title="good_example.py"
def fetch_weather(city: str, api_key: str) -> dict:
    """Fetch current weather data from OpenWeatherMap.

    Args:
        city: Name of the city to look up.
        api_key: Your OpenWeatherMap API key.

    Returns:
        A dictionary containing temperature, humidity, and conditions.
    """
    base_url = "https://api.openweathermap.org/data/2.5/weather"
    params = {"q": city, "appid": api_key, "units": "metric"}
    response = requests.get(base_url, params=params)
    response.raise_for_status()
    return response.json()
```

### TypeScript

- Enable **strict mode** (`"strict": true` in tsconfig)
- Use `const` by default; use `let` only when reassignment is necessary; never use `var`
- Prefer **async/await** over `.then()` chains
- Use **explicit types** on function parameters and return values
- Use **interfaces** for object shapes

```typescript title="good_example.ts"
interface WeatherData {
  temperature: number;
  humidity: number;
  conditions: string;
}

async function fetchWeather(city: string, apiKey: string): Promise<WeatherData> {
  const baseUrl = "https://api.openweathermap.org/data/2.5/weather";
  const params = new URLSearchParams({ q: city, appid: apiKey, units: "metric" });
  const response = await fetch(`${baseUrl}?${params}`);

  if (!response.ok) {
    throw new Error(`Weather API error: ${response.status}`);
  }

  return await response.json();
}
```

### General Code Rules

| Rule | Rationale |
|---|---|
| Always include a language identifier on code blocks | Enables syntax highlighting and copy-paste accuracy |
| Use realistic variable names | `user_message`, not `foo`; `api_response`, not `x` |
| Keep examples runnable | The reader should be able to copy, paste, and execute |
| Include expected output where helpful | `# Output: {"temp": 22.5, "humidity": 65}` |
| Test every code block before submitting | Broken examples destroy trust |
| Prefer small, focused examples | One concept per code block; split long scripts into steps |

---

## 5. Image Guidelines

### Thumbnails

- **Dimensions:** 400x300 pixels
- **Format:** PNG
- **File naming:** `thumbnail.png` in the article directory
- **Alt text:** Descriptive, not decorative (e.g., `alt="Diagram showing how an API request flows from client to server and back"`)

### Article Images

- **Maximum width:** 800 pixels
- **Format:** PNG or WebP (prefer WebP for photographs, PNG for screenshots and diagrams)
- **Compression:** Optimize file size; aim for under 200KB per image
- **File naming:** Lowercase, hyphenated: `api-request-flow.png`
- **Location:** Store in the article's own directory alongside the markdown file

### Diagrams

- **Prefer Mermaid** over static images for anything with text and simple shapes
- If a static diagram is necessary, export as SVG when possible (scales cleanly)
- Include the source file (Figma link, `.drawio`, etc.) so diagrams can be updated later

### Screenshots

- Annotate with arrows, highlights, or numbered callouts to draw attention to the relevant part
- Crop tightly -- do not include unnecessary browser chrome or desktop background
- Use a consistent annotation style (red arrows, yellow highlights)

---

## 6. node.yaml Conventions

Every article directory contains a `node.yaml` file that defines its metadata and position in the learning tree. Here is the schema:

```yaml
id: foundations/what-is-an-api           # Matches the directory path under learning/
title: "What Is an API?"                 # Title case
description: "Learn what APIs are, why they matter, and how to make your first API call."
tags:
  - api                                  # Lowercase
  - http                                 # Hyphenated if multi-word
  - requests                             # Relevant to the content
  - beginner                             # Difficulty level as a tag
estimatedMinutes: 25                     # Realistic: include reading + build challenge time
prerequisites:
  - foundations/variables-and-types       # References other node IDs
  - foundations/running-python
unlocks:
  - foundations/working-with-json         # What this article unlocks
  - data/web-scraping-basics
authors:
  - name: "Your Name"
    github: "your-github-handle"
status: published                        # draft | review | published
```

### Rules

| Field | Convention |
|---|---|
| `id` | Matches the directory path exactly; lowercase; slash-separated |
| `title` | Title Case; clear and specific |
| `description` | One sentence; states what the reader learns |
| `tags` | Lowercase; hyphenated for multi-word; include difficulty level |
| `estimatedMinutes` | Total time including the build challenge; round to nearest 5 |
| `prerequisites` | List of node IDs the reader should complete first |
| `unlocks` | List of node IDs that become available after completing this one |
| `status` | One of `draft`, `review`, or `published` |

---

## 7. Tone and Voice

### Person and Tense

- **Second person:** Talk directly to the reader. "You send a request" not "The user sends a request."
- **Present tense:** "In this article, you learn..." not "you will learn." Present tense feels immediate and active.

### Voice and Sentence Structure

- **Active voice preferred:** "The server returns a response" not "A response is returned by the server."
- **Short paragraphs:** 3-4 sentences maximum. Dense walls of text lose readers.
- **Short sentences for complex ideas:** If a concept is difficult, use shorter sentences. Save compound sentences for simple connections.

### Word Choice

| Instead of... | Write... | Why |
|---|---|---|
| "Simply do X" | "Do X" | Nothing is simple when you are learning it |
| "Obviously" | *(delete it)* | If it were obvious, you would not need to say it |
| "In order to" | "To" | Shorter, clearer |
| "Utilize" | "Use" | Plain language |
| "It should be noted that" | *(state the thing directly)* | Filler |
| "Basically" | *(delete it or rewrite for clarity)* | Usually signals a vague explanation |
| "As you can see" | *(describe what they see)* | Do not assume what they see; show it |

### Technical Terminology

- **Define jargon on first use.** Use the `:::definition` component or a brief inline explanation.
- **Be precise.** Do not use "function" and "method" interchangeably if the distinction matters. Do not say "code" when you mean "script" or "module."
- **Use the same term consistently.** If you call it a "request" in paragraph one, do not call it a "call" in paragraph three without establishing that they mean the same thing.

### Analogies

Analogies are powerful for first-time learners. Use them, but follow these rules:

1. **One analogy per concept.** Do not stack analogies.
2. **State the analogy, then state the real thing.** The analogy opens the door; the precise definition walks through it.
3. **Do not over-extend analogies.** If the analogy breaks down after one paragraph, stop there.

---

## 8. AI-Assisted Authoring Guidelines

Contributors frequently use AI tools like Cursor, Claude Code, and GitHub Copilot to draft content. This section ensures AI-generated content meets our standards.

### For AI Agents

If you are an AI assistant generating content for this repository:

1. **Follow this style guide exactly.** Do not invent new component syntax. Do not skip required article sections.
2. **Reference this file** (`content/STYLE_GUIDE.md`) in your context window when generating articles.
3. **The `node.yaml` schema is the source of truth** for metadata. Do not add fields that are not in the schema. Do not omit required fields.
4. **Match the tone.** Second person, present tense, active voice, short paragraphs. Read the example article in Section 9 before generating.
5. **Test all code.** Every code block must be runnable. Include expected output in comments where the output is non-obvious.
6. **Do not invent URLs or external links.** If you reference an external resource, verify it exists. Dead links are worse than no links.
7. **Do not pad content.** If a concept takes two paragraphs to explain well, do not stretch it to five. Expert quality means concise quality.

### For Human Reviewers of AI-Generated Content

When reviewing AI-drafted articles, check for:

- [ ] **Code accuracy** -- Copy every code block and run it. AI models hallucinate APIs, invent function signatures, and produce code that looks right but fails.
- [ ] **Link validity** -- Click every link. AI models frequently generate plausible but nonexistent URLs.
- [ ] **Factual accuracy** -- Verify technical claims, especially about library behavior, API endpoints, and version-specific features.
- [ ] **Tone consistency** -- AI output sometimes drifts into academic or overly formal language. Bring it back to our conversational, build-focused voice.
- [ ] **Component syntax** -- Ensure the AI used the exact component syntax from Section 3, not something similar but wrong.
- [ ] **No filler** -- AI models tend to add transitional phrases and restate things. Cut ruthlessly.

### Validation

Run the content validation script before submitting any article:

```bash
npm run validate
```

This checks:
- `node.yaml` schema compliance
- Required article sections present
- Markdown syntax correctness
- Broken internal links
- Image file references

---

## 9. Example Article

Below is a complete, short article demonstrating every structural element, component, and tone guideline from this style guide. This is a real article, not placeholder content.

---

````markdown
# What Is an API?

An API is the standard way that software talks to other software over the
internet. In this article, you learn what APIs are, how they work, and how
to make your first API call in Python. By the end, you have working code that
fetches real data.

:::callout[info]
**Before you start**, make sure you are comfortable with:
- [Variables and data types](/learning/foundations/variables-and-types)
- [Installing Python packages](/learning/foundations/installing-packages)
:::

## The Restaurant Analogy

:::definition[API]
**Application Programming Interface** -- a set of rules that allows one piece of
software to request data or actions from another. You send a structured request
and receive a structured response.
:::

Think of an API like ordering at a restaurant. You (the **client**) look at the
menu and place an order. The waiter (the **API**) carries your order to the
kitchen (the **server**). The kitchen prepares your food and the waiter brings it
back to you. You never go into the kitchen yourself.

In software terms: your Python script sends a request to a server. The server
processes it and sends back data, usually in a format called JSON.

## How an API Call Works

Every API call follows the same pattern:

:::diagram
sequenceDiagram
    participant You as Your Script
    participant API as API Server
    You->>API: HTTP Request (GET /weather?city=Milwaukee)
    API-->>You: HTTP Response (JSON data)
:::

There are four key pieces:

1. **URL** -- the address of the API endpoint
2. **Method** -- what you want to do (GET = read data, POST = send data)
3. **Parameters** -- details about your request (which city, what format)
4. **Response** -- the data that comes back, plus a status code

:::callout[tip]
The status code tells you whether the request worked. `200` means success.
`404` means the resource was not found. `500` means the server had an error.
:::

## Your First API Call

Install the `requests` library if you have not already:

```bash
pip install requests
```

Now create a file and make your first API call:

```python title="first_api_call.py"
import requests

def fetch_random_fact() -> dict:
    """Fetch a random fact from the Numbers API."""
    url = "http://numbersapi.com/random/trivia"
    params = {"json": True}
    response = requests.get(url, params=params)

    # Always check whether the request succeeded
    response.raise_for_status()

    return response.json()

fact_data = fetch_random_fact()
print(f"Number: {fact_data['number']}")
print(f"Fact: {fact_data['text']}")
# Example output:
# Number: 42
# Fact: 42 is the answer to the Ultimate Question of Life, the Universe, and Everything.
```

Let us break down what happens:

1. `requests.get()` sends an HTTP GET request to the URL
2. `params={"json": True}` tells the API you want JSON back
3. `response.raise_for_status()` throws an error if the status code indicates failure
4. `response.json()` parses the JSON response into a Python dictionary

:::callout[warning]
Many APIs require an **API key** for authentication. Never hard-code API keys in
your source files. Store them in environment variables instead:

```python
import os

api_key = os.environ["MY_API_KEY"]
```
:::

## Handling Errors

API calls can fail. The network might be down, the API might be overloaded, or
you might send a bad request. Always handle errors gracefully.

```python title="error_handling.py"
import requests

def fetch_weather(city: str) -> dict | None:
    """Fetch weather data, returning None if the request fails."""
    url = "https://api.openweathermap.org/data/2.5/weather"
    params = {"q": city, "appid": "your-key-here", "units": "metric"}

    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.HTTPError as err:
        print(f"HTTP error: {err}")
    except requests.exceptions.ConnectionError:
        print("Could not connect to the API. Check your internet connection.")
    except requests.exceptions.Timeout:
        print("The request timed out. Try again later.")

    return None
```

:::details[Click to see a quick reference of common status codes]
| Code | Meaning | What to Do |
|---|---|---|
| `200` | OK | Parse the response |
| `201` | Created | Resource was created successfully |
| `400` | Bad Request | Check your parameters |
| `401` | Unauthorized | Check your API key |
| `403` | Forbidden | You do not have access |
| `404` | Not Found | Check the URL or resource ID |
| `429` | Too Many Requests | Slow down; you hit a rate limit |
| `500` | Internal Server Error | The server has a problem; try again later |
:::

## REST: The Most Common API Style

:::definition[REST]
**Representational State Transfer** -- an architectural style for APIs where
resources are identified by URLs and manipulated using standard HTTP methods
(GET, POST, PUT, DELETE).
:::

Most APIs you encounter are REST APIs. They follow predictable patterns:

:::tabs
tab: Read data (GET)
```bash
GET /api/users/42
```
Returns the user with ID 42.

tab: Create data (POST)
```bash
POST /api/users
Content-Type: application/json

{"name": "Ada Lovelace", "email": "ada@example.com"}
```
Creates a new user.

tab: Update data (PUT)
```bash
PUT /api/users/42
Content-Type: application/json

{"name": "Ada Lovelace", "email": "ada@new-email.com"}
```
Updates the user with ID 42.

tab: Delete data (DELETE)
```bash
DELETE /api/users/42
```
Deletes the user with ID 42.
:::

## Key Takeaways

- An API is a structured way for programs to exchange data over the internet.
- You send a **request** (with a URL, method, and parameters) and receive a **response** (with a status code and data).
- The `requests` library makes HTTP calls in Python straightforward.
- Always check the status code and handle errors before using response data.
- Most modern APIs follow the REST pattern with standard HTTP methods.

:::build-challenge
**Build it:** Create a Python script that displays information about any country
using the [REST Countries API](https://restcountries.com).

- Accept a country name as user input
- Make a GET request to `https://restcountries.com/v3.1/name/{country}`
- Display the country's capital, population, region, and languages
- Handle the case where the country name is not found
- Format the output so it is easy to read

**Stretch goal:** Let the user compare two countries side by side, showing the
differences in population, area, and number of languages.
:::

## What's Next

Now that you understand how APIs work, you are ready to:
- [Work with JSON data](/learning/foundations/working-with-json) -- learn to
  navigate and transform the data APIs return
- [Build your first web scraper](/learning/data/web-scraping-basics) -- fetch
  and parse data from websites that do not have an API
````

---

*This style guide is a living document. Update it as new components are added, conventions evolve, or problems recur. When in doubt, optimize for the reader's understanding.*
