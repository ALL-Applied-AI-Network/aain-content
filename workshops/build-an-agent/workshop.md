# Build an Agent

Build an AI agent that can use tools to accomplish tasks. By the end of this workshop, you will have an agent that can search the web, do math, read and write files, and decide which tools to use on its own.

## Workshop Overview

An AI agent is a program where a language model decides what actions to take in a loop. Instead of a single prompt-response pair, the agent observes a task, picks a tool, executes it, reads the result, and decides what to do next -- repeating until the task is complete.

This workshop builds an agent step by step. You will define tools as Python functions, wire them into the OpenAI function calling API, and implement the agent loop that ties everything together. No frameworks -- you will understand every piece.

## Prerequisites

- Completed the "Build a Chatbot" workshop (or equivalent experience with the OpenAI chat API)
- Comfortable with Python (functions, dictionaries, JSON, basic error handling)
- An OpenAI API key

## Materials Needed

Install the following before the workshop:

- Python 3.10+
- A code editor (Cursor recommended)
- `pip install openai python-dotenv requests`
- An OpenAI API key stored in a `.env` file

## Agenda

| Time | Section | Description |
|---|---|---|
| 0:00 - 0:10 | **What Is an Agent?** | Mental model: the observe-think-act loop. |
| 0:10 - 0:30 | **Defining Tools** | Write Python functions and describe them as tool schemas. |
| 0:30 - 0:50 | **Function Calling** | Use the OpenAI API to let the model choose and call tools. |
| 0:50 - 1:05 | **The Agent Loop** | Build the core loop: think, act, observe, repeat. |
| 1:05 - 1:15 | **Break** | |
| 1:15 - 1:40 | **Adding More Tools** | Web search and file operations. |
| 1:40 - 2:00 | **Error Handling and Guardrails** | Make the agent robust. |
| 2:00 - 2:20 | **Testing and Extensions** | Test with complex tasks. Add your own tools. |
| 2:20 - 2:30 | **Show and Tell** | Demo your agent's capabilities. |

---

## Part 1: What Is an Agent? (10 min)

A chatbot responds to messages. An agent takes actions.

The core difference is the **loop**. A chatbot processes one input and produces one output. An agent runs in a cycle:

1. **Observe** -- read the current state (user task + tool results so far)
2. **Think** -- the LLM decides what to do next
3. **Act** -- execute a tool (calculator, web search, file write, etc.)
4. **Repeat** -- feed the tool result back to the LLM and let it decide the next step
5. **Stop** -- the LLM decides the task is complete and gives a final answer

The model is not "running code." It is choosing which tool to call and what arguments to pass. Your code executes the tool and reports the result back. The model sees the result and decides what to do next.

Create your project:

```bash
mkdir agent-workshop && cd agent-workshop
python -m venv venv
source venv/bin/activate
pip install openai python-dotenv requests
```

Create a `.env` file:

```
OPENAI_API_KEY=sk-your-key-here
```

---

## Part 2: Defining Tools (20 min)

Tools are just Python functions. The key is writing a **schema** that tells the model what the tool does, what parameters it takes, and when to use it.

Create `agent.py`:

```python
import json
import math
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()
client = OpenAI()

# --- Tool implementations ---

def calculator(expression: str) -> str:
    """Evaluate a mathematical expression."""
    try:
        # Only allow safe math operations
        allowed_names = {
            "abs": abs, "round": round,
            "min": min, "max": max,
            "sqrt": math.sqrt, "pow": math.pow,
            "pi": math.pi, "e": math.e,
            "sin": math.sin, "cos": math.cos, "tan": math.tan,
            "log": math.log, "log10": math.log10,
        }
        result = eval(expression, {"__builtins__": {}}, allowed_names)
        return str(result)
    except Exception as e:
        return f"Error: {e}"

def get_current_time() -> str:
    """Get the current date and time."""
    from datetime import datetime
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")

def count_words(text: str) -> str:
    """Count the number of words in a text string."""
    word_count = len(text.split())
    return f"{word_count} words"
```

Now define the **tool schemas**. These tell the model what tools are available and how to call them:

```python
# --- Tool schemas for the API ---

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "calculator",
            "description": "Evaluate a mathematical expression. Supports basic arithmetic (+, -, *, /), powers (**), square root (sqrt), trigonometry (sin, cos, tan), and logarithms (log, log10). Use Python math syntax.",
            "parameters": {
                "type": "object",
                "properties": {
                    "expression": {
                        "type": "string",
                        "description": "The math expression to evaluate, e.g. '2 + 2' or 'sqrt(144)' or '3.14 * 5**2'",
                    },
                },
                "required": ["expression"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_current_time",
            "description": "Get the current date and time. Use when the user asks about the current time or date.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "count_words",
            "description": "Count the number of words in a given text.",
            "parameters": {
                "type": "object",
                "properties": {
                    "text": {
                        "type": "string",
                        "description": "The text to count words in",
                    },
                },
                "required": ["text"],
            },
        },
    },
]

# Map function names to their implementations
TOOL_FUNCTIONS = {
    "calculator": calculator,
    "get_current_time": get_current_time,
    "count_words": count_words,
}
```

### Schema Design Tips

The description is the most important field. It tells the model **when** to use the tool. A bad description means the model will pick the wrong tool or fail to use it when it should.

- Be specific about what the tool does and does not do
- Include examples of valid inputs in parameter descriptions
- Mention edge cases the tool handles

---

## Part 3: Function Calling (20 min)

The OpenAI API has native support for function calling. When you provide tool schemas, the model can choose to call a tool instead of generating text.

```python
def call_model(messages: list, tools: list = TOOLS) -> dict:
    """Call the model with messages and available tools."""
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
        tools=tools,
    )
    return response.choices[0].message
```

Test a single tool call:

```python
# Test: ask something that should trigger the calculator
messages = [
    {"role": "system", "content": "You are a helpful assistant with access to tools. Use them when needed."},
    {"role": "user", "content": "What is 247 * 38?"},
]

response_message = call_model(messages)
print(f"Content: {response_message.content}")
print(f"Tool calls: {response_message.tool_calls}")

if response_message.tool_calls:
    tool_call = response_message.tool_calls[0]
    print(f"\nTool: {tool_call.function.name}")
    print(f"Args: {tool_call.function.arguments}")

    # Execute the tool
    args = json.loads(tool_call.function.arguments)
    func = TOOL_FUNCTIONS[tool_call.function.name]
    result = func(**args)
    print(f"Result: {result}")
```

### What Happened

1. The model received the user message and the list of available tools
2. Instead of responding with text, it returned a `tool_calls` object
3. The tool call specifies the function name and arguments as JSON
4. Your code parses the arguments and calls the actual function
5. You now have a result that needs to go back to the model

The model does not execute the tool. It tells you what to call. You execute it and report back.

---

## Part 4: The Agent Loop (15 min)

Now build the core loop. This is the heart of the agent.

```python
def run_agent(user_message: str, max_iterations: int = 10) -> str:
    """Run the agent loop until the task is complete."""
    messages = [
        {
            "role": "system",
            "content": """You are a helpful assistant with access to tools.
Use tools when they would help answer the user's question accurately.
When you have enough information to answer, respond directly without calling a tool.
Think step by step about what you need to do.""",
        },
        {"role": "user", "content": user_message},
    ]

    for i in range(max_iterations):
        print(f"\n--- Iteration {i + 1} ---")

        # Step 1: Call the model
        response_message = call_model(messages)

        # Step 2: Check if the model wants to use tools
        if not response_message.tool_calls:
            # No tool calls -- the model is done, return its response
            print(f"Agent response: {response_message.content}")
            return response_message.content

        # Step 3: Process each tool call
        # Add the assistant's message (with tool calls) to history
        messages.append(response_message)

        for tool_call in response_message.tool_calls:
            func_name = tool_call.function.name
            func_args = json.loads(tool_call.function.arguments)

            print(f"Calling tool: {func_name}({func_args})")

            # Execute the tool
            func = TOOL_FUNCTIONS.get(func_name)
            if func:
                result = func(**func_args)
            else:
                result = f"Error: Unknown tool '{func_name}'"

            print(f"Result: {result}")

            # Add the tool result to the conversation
            messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "content": str(result),
            })

    return "Agent reached maximum iterations without completing the task."

# Test it
if __name__ == "__main__":
    print(run_agent("What is the square root of 1764, and is that number prime?"))
```

### The Flow

1. User asks a question
2. Model sees the question and the available tools
3. Model decides to call `calculator` with `sqrt(1764)`
4. Your code runs the calculation and returns `42.0`
5. Model sees the result, thinks about whether 42 is prime
6. Model may call the calculator again to check divisibility, or just reason about it
7. Model gives the final answer

### Exercise

Test the agent with these prompts:
- "What time is it, and how many hours until midnight?"
- "Calculate the area of a circle with radius 7.5 meters"
- "Count the words in this sentence: The quick brown fox jumps over the lazy dog"

---

## Part 5: Adding More Tools (25 min)

Let's add tools that make the agent genuinely useful.

### Tool: Web Search (via DuckDuckGo)

```python
import requests

def web_search(query: str) -> str:
    """Search the web using DuckDuckGo Instant Answer API."""
    try:
        response = requests.get(
            "https://api.duckduckgo.com/",
            params={"q": query, "format": "json", "no_html": 1},
            timeout=10,
        )
        data = response.json()

        results = []
        if data.get("AbstractText"):
            results.append(f"Summary: {data['AbstractText']}")
        if data.get("RelatedTopics"):
            for topic in data["RelatedTopics"][:3]:
                if isinstance(topic, dict) and "Text" in topic:
                    results.append(f"- {topic['Text']}")

        if results:
            return "\n".join(results)
        return "No results found. Try a more specific query."
    except Exception as e:
        return f"Search error: {e}"
```

### Tool: Read File

```python
def read_file(filepath: str) -> str:
    """Read the contents of a text file."""
    try:
        with open(filepath, "r") as f:
            content = f.read()
        if len(content) > 2000:
            return content[:2000] + "\n... (truncated)"
        return content
    except FileNotFoundError:
        return f"Error: File '{filepath}' not found"
    except Exception as e:
        return f"Error reading file: {e}"
```

### Tool: Write File

```python
def write_file(filepath: str, content: str) -> str:
    """Write content to a text file."""
    try:
        with open(filepath, "w") as f:
            f.write(content)
        return f"Successfully wrote {len(content)} characters to {filepath}"
    except Exception as e:
        return f"Error writing file: {e}"
```

Now add the schemas for the new tools and register them:

```python
TOOLS.extend([
    {
        "type": "function",
        "function": {
            "name": "web_search",
            "description": "Search the web for information. Use when you need current facts, definitions, or information you are not confident about. Returns a summary and related topics.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The search query",
                    },
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "read_file",
            "description": "Read the contents of a text file from disk. Use when you need to examine a file's contents.",
            "parameters": {
                "type": "object",
                "properties": {
                    "filepath": {
                        "type": "string",
                        "description": "Path to the file to read",
                    },
                },
                "required": ["filepath"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "write_file",
            "description": "Write content to a text file. Creates the file if it does not exist, overwrites if it does.",
            "parameters": {
                "type": "object",
                "properties": {
                    "filepath": {
                        "type": "string",
                        "description": "Path to the file to write",
                    },
                    "content": {
                        "type": "string",
                        "description": "The content to write to the file",
                    },
                },
                "required": ["filepath", "content"],
            },
        },
    },
])

TOOL_FUNCTIONS.update({
    "web_search": web_search,
    "read_file": read_file,
    "write_file": write_file,
})
```

### Test the Expanded Agent

```python
if __name__ == "__main__":
    # Test web search
    print(run_agent("What is the population of Tokyo?"))

    # Test file operations
    print(run_agent("Write a haiku about programming to a file called haiku.txt, then read it back to verify."))
```

---

## Part 6: Error Handling and Guardrails (20 min)

A real agent needs to handle failures gracefully.

### Retry Logic

```python
def run_agent(user_message: str, max_iterations: int = 10) -> str:
    """Run the agent loop with error handling."""
    messages = [
        {
            "role": "system",
            "content": """You are a helpful assistant with access to tools.
Use tools when they would help answer the user's question accurately.
If a tool returns an error, try a different approach or explain what went wrong.
When you have enough information to answer, respond directly.
Think step by step.""",
        },
        {"role": "user", "content": user_message},
    ]

    for i in range(max_iterations):
        print(f"\n--- Iteration {i + 1} ---")

        try:
            response_message = call_model(messages)
        except Exception as e:
            print(f"API error: {e}")
            return f"Sorry, I encountered an error communicating with the AI service: {e}"

        if not response_message.tool_calls:
            return response_message.content or "I was unable to generate a response."

        messages.append(response_message)

        for tool_call in response_message.tool_calls:
            func_name = tool_call.function.name
            print(f"Calling: {func_name}")

            try:
                func_args = json.loads(tool_call.function.arguments)
            except json.JSONDecodeError:
                result = f"Error: Invalid arguments from model"
                print(f"Bad arguments: {tool_call.function.arguments}")
                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": result,
                })
                continue

            func = TOOL_FUNCTIONS.get(func_name)
            if not func:
                result = f"Error: Unknown tool '{func_name}'"
            else:
                try:
                    result = func(**func_args)
                except Exception as e:
                    result = f"Error executing {func_name}: {e}"

            print(f"Result: {result[:200]}")
            messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "content": str(result),
            })

    return "I reached the maximum number of steps without completing the task. Here is what I have so far based on the conversation."
```

### Guardrails to Consider

1. **Max iterations** -- prevents infinite loops (already implemented)
2. **File path restrictions** -- limit file operations to a safe directory
3. **Output length limits** -- truncate long tool results
4. **Cost tracking** -- count tokens across the loop to avoid runaway API costs

```python
# Example: restrict file operations to a safe directory
import os

SAFE_DIR = os.path.abspath("./workspace")
os.makedirs(SAFE_DIR, exist_ok=True)

def safe_read_file(filepath: str) -> str:
    """Read a file, restricted to the workspace directory."""
    full_path = os.path.abspath(os.path.join(SAFE_DIR, filepath))
    if not full_path.startswith(SAFE_DIR):
        return "Error: Access denied. Files must be in the workspace directory."
    return read_file(full_path)

def safe_write_file(filepath: str, content: str) -> str:
    """Write a file, restricted to the workspace directory."""
    full_path = os.path.abspath(os.path.join(SAFE_DIR, filepath))
    if not full_path.startswith(SAFE_DIR):
        return "Error: Access denied. Files must be in the workspace directory."
    return write_file(full_path, content)
```

---

## Part 7: Testing and Extensions (20 min)

### Multi-Step Task Test

Give the agent a task that requires multiple tool calls:

```python
print(run_agent(
    "Search the web for the height of Mount Everest in meters. "
    "Then calculate what percentage of a flight at cruising altitude "
    "(11,000 meters) that height represents. "
    "Write a summary of your findings to results.txt."
))
```

Watch the agent loop: it should search, calculate, then write the file.

### Build Your Own Tool

Spend 10 minutes adding a tool of your choice. Ideas:

- **Weather lookup** -- use a free weather API
- **Text summarizer** -- use the LLM itself as a tool for summarization
- **URL fetcher** -- fetch and extract text from a web page
- **Random number generator** -- for games or simulations
- **Unit converter** -- convert between measurement units

Template for adding a new tool:

1. Write the Python function
2. Write the tool schema (name, description, parameters)
3. Add both to `TOOL_FUNCTIONS` and `TOOLS`
4. Test it with a prompt that should trigger the tool

### Interactive Mode

Add a chat loop for interactive testing:

```python
def interactive():
    print("Agent ready. Type 'quit' to exit.\n")
    while True:
        user_input = input("You: ")
        if user_input.lower() in ("quit", "exit"):
            break
        response = run_agent(user_input)
        print(f"\nAgent: {response}\n")

if __name__ == "__main__":
    interactive()
```

---

## Part 8: Show and Tell (10 min)

Demo your agent:
- What tools did you add?
- What was the most complex task your agent completed?
- Did you run into any interesting failure modes?

---

## Key Takeaways

- An agent is a loop: observe, think, act, repeat until done
- The model chooses tools based on their descriptions -- schema design is critical
- Function calling is a structured way for models to invoke your code
- Guardrails (max iterations, path restrictions, error handling) are not optional in production
- The agent pattern is the foundation for more complex systems like multi-agent workflows

## Next Steps

- Add persistent memory so the agent remembers past conversations
- Implement parallel tool calling (the model can request multiple tools at once)
- Explore agent frameworks: LangGraph, CrewAI, OpenAI Assistants API
- Try the "Deploy Your First AI App" workshop to put your agent online
