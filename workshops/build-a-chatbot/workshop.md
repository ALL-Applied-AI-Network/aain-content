# Build a Chatbot

Build a working AI chatbot from scratch. By the end of this workshop, you will have a chatbot with a web interface that you can customize and share with others.

## Workshop Overview

This workshop takes you from an empty Python file to a deployed chatbot. You will learn how to make API calls to a language model, manage conversation history, design a system prompt that shapes your chatbot's behavior, and wrap it all in a simple web UI using Gradio. The focus is on understanding what is happening at each layer, not just copy-pasting boilerplate.

## Prerequisites

- Comfortable reading and writing basic Python (variables, functions, loops)
- Completed the "How AI APIs Work" learning node, or equivalent familiarity with REST APIs
- An OpenAI API key (free tier is sufficient for this workshop)

## Materials Needed

Install the following before the workshop:

- Python 3.10+
- A code editor (Cursor recommended)
- `pip install openai gradio python-dotenv`
- An OpenAI API key stored in a `.env` file

## Agenda

| Time | Section | Description |
|---|---|---|
| 0:00 - 0:10 | **Setup Check** | Verify everyone's environment is working. Run a test API call. |
| 0:10 - 0:25 | **Your First API Call** | Make a single chat completion request. Understand the request/response structure. |
| 0:25 - 0:40 | **Conversation Memory** | Build a conversation loop that maintains history. |
| 0:40 - 0:55 | **System Prompts and Personality** | Design a system prompt that gives your chatbot a specific role. |
| 0:55 - 1:05 | **Break** | |
| 1:05 - 1:20 | **Adding a Web Interface** | Wrap your chatbot in a Gradio ChatInterface. |
| 1:20 - 1:30 | **Customization and Stretch Goals** | Add features: streaming, export, token counting. |
| 1:30 - 1:40 | **Show and Tell** | Volunteers demo their chatbot. |

---

## Part 1: Setup Check (10 min)

Create a project directory and set up your environment.

```bash
mkdir chatbot-workshop && cd chatbot-workshop
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install openai gradio python-dotenv
```

Create a `.env` file in your project directory:

```
OPENAI_API_KEY=sk-your-key-here
```

Verify your setup by running this test script. Save it as `test_setup.py`:

```python
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()
client = OpenAI()

response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[{"role": "user", "content": "Say hello in one sentence."}],
)

print(response.choices[0].message.content)
```

```bash
python test_setup.py
```

If you see a greeting, your environment is ready. If you get an error, check that your API key is correct and your `.env` file is in the right directory.

---

## Part 2: Your First API Call (15 min)

Create a new file called `chatbot.py`. This will be your main file for the rest of the workshop.

```python
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()
client = OpenAI()

def chat(user_message: str) -> str:
    """Send a single message and get a response."""
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "user", "content": user_message}
        ],
    )
    return response.choices[0].message.content

if __name__ == "__main__":
    answer = chat("What are three interesting facts about octopuses?")
    print(answer)
```

Run it and inspect the output. Now let's understand the structure.

### Key Concepts

The `messages` parameter is an array of message objects. Each message has a `role` and `content`:

- **`system`** -- Instructions that shape the model's behavior
- **`user`** -- Messages from the human
- **`assistant`** -- Messages from the model

The API is **stateless**. It does not remember previous calls. Every request must include the full conversation history you want the model to consider.

### Exercise

Modify the `chat` function to also print the token usage:

```python
def chat(user_message: str) -> str:
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": user_message}],
    )
    usage = response.usage
    print(f"Tokens -- prompt: {usage.prompt_tokens}, completion: {usage.completion_tokens}, total: {usage.total_tokens}")
    return response.choices[0].message.content
```

Understanding token usage matters because API costs and context limits are measured in tokens.

---

## Part 3: Conversation Memory (15 min)

The API is stateless, so your code is responsible for managing conversation context. Replace the contents of `chatbot.py`:

```python
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()
client = OpenAI()

def chat_loop():
    """Run an interactive chat loop with conversation memory."""
    messages = []

    print("Chatbot ready. Type 'quit' to exit.\n")

    while True:
        user_input = input("You: ")
        if user_input.lower() in ("quit", "exit"):
            break

        messages.append({"role": "user", "content": user_input})

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
        )

        assistant_message = response.choices[0].message.content
        messages.append({"role": "assistant", "content": assistant_message})

        print(f"\nBot: {assistant_message}\n")

if __name__ == "__main__":
    chat_loop()
```

Test it:

```bash
python chatbot.py
```

Try a multi-turn conversation. Ask a question, then ask a follow-up that references your first question. The bot should understand the context because you are sending the full history each time.

### How It Works

Each call to the API includes the entire `messages` list. The conversation grows with every exchange:

1. User says something -- append to `messages`
2. Send full `messages` list to the API
3. Model responds -- append its response to `messages`
4. Repeat

This means longer conversations use more tokens. In production you need strategies like truncation or summarization to manage context length.

### Exercise

Add a message counter that prints the current conversation length after each exchange:

```python
print(f"(conversation length: {len(messages)} messages)")
```

---

## Part 4: System Prompts and Personality (15 min)

A system prompt tells the model who it is and how it should behave. Modify your `chat_loop` function to start with a system prompt:

```python
def chat_loop():
    system_prompt = """You are a helpful study buddy for computer science students.
You explain concepts clearly using analogies and examples.
When someone asks a question, first check if you understand what they are asking,
then explain it step by step. Keep responses concise -- under 150 words unless
the topic genuinely requires more detail."""

    messages = [{"role": "system", "content": system_prompt}]

    print("Study Buddy ready. Type 'quit' to exit.\n")

    while True:
        user_input = input("You: ")
        if user_input.lower() in ("quit", "exit"):
            break

        messages.append({"role": "user", "content": user_input})

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
        )

        assistant_message = response.choices[0].message.content
        messages.append({"role": "assistant", "content": assistant_message})

        print(f"\nStudy Buddy: {assistant_message}\n")

if __name__ == "__main__":
    chat_loop()
```

### Exercise: Design Your Own Persona

Spend 5 minutes designing a system prompt for one of these personas (or invent your own):

- **Code Reviewer** -- Reviews code snippets and gives constructive feedback
- **Recipe Helper** -- Suggests recipes based on ingredients you have
- **Debate Partner** -- Takes the opposite side of any argument to sharpen your thinking
- **Storyteller** -- Turns any topic into an engaging short story

Tips for effective system prompts:

1. **Be specific about the role**: "You are a senior Python developer with 10 years of experience" is better than "You are a helpful assistant"
2. **Define constraints**: Set response length, tone, format
3. **Specify behavior for edge cases**: What should the bot do if it does not know something?
4. **Give examples**: Show the model what a good response looks like

---

## Part 5: Adding a Web Interface (15 min)

Gradio turns your Python function into a web app. Create a new file called `app.py`:

```python
from dotenv import load_dotenv
from openai import OpenAI
import gradio as gr

load_dotenv()
client = OpenAI()

SYSTEM_PROMPT = """You are a helpful study buddy for computer science students.
You explain concepts clearly using analogies and examples.
Keep responses concise and well-structured."""

def respond(message: str, history: list) -> str:
    """Handle a chat message with full conversation history."""
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    # Convert Gradio history format to OpenAI format
    for user_msg, bot_msg in history:
        messages.append({"role": "user", "content": user_msg})
        messages.append({"role": "assistant", "content": bot_msg})

    messages.append({"role": "user", "content": message})

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
    )

    return response.choices[0].message.content

demo = gr.ChatInterface(
    fn=respond,
    title="Study Buddy",
    description="Ask me anything about computer science. I will explain it step by step.",
    examples=[
        "What is recursion?",
        "Explain Big O notation like I am five",
        "What is the difference between a stack and a queue?",
    ],
)

if __name__ == "__main__":
    demo.launch()
```

```bash
python app.py
```

Open the URL shown in your terminal (usually `http://127.0.0.1:7860`). You now have a chatbot with a web interface.

### What Just Happened

Gradio's `ChatInterface` handles the UI, the message input, and the conversation history. Your `respond` function receives the new message and the full history, translates it to the OpenAI format, and returns the response. That is the entire integration.

---

## Part 6: Customization and Stretch Goals (10 min)

Choose one or more of these extensions to add to your chatbot.

### Option A: Streaming Responses

Streaming shows the response word by word instead of waiting for the full response:

```python
def respond(message: str, history: list) -> str:
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for user_msg, bot_msg in history:
        messages.append({"role": "user", "content": user_msg})
        messages.append({"role": "assistant", "content": bot_msg})
    messages.append({"role": "user", "content": message})

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
        stream=True,
    )

    partial_message = ""
    for chunk in response:
        if chunk.choices[0].delta.content is not None:
            partial_message += chunk.choices[0].delta.content
            yield partial_message
```

Note the change from `return` to `yield` -- this turns the function into a generator that Gradio knows how to stream.

### Option B: Conversation Export

Add a button that saves the conversation to a text file:

```python
import json
from datetime import datetime

def export_chat(history):
    if not history:
        return None
    filename = f"chat_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(filename, "w") as f:
        json.dump(history, f, indent=2)
    return filename
```

### Option C: Temperature Control

Add a slider that lets users control the model's creativity:

```python
demo = gr.ChatInterface(
    fn=respond,
    additional_inputs=[
        gr.Slider(0, 2, value=0.7, label="Temperature"),
    ],
)
```

Then add `temperature` as a parameter to your `respond` function and pass it to the API call.

---

## Part 7: Show and Tell (10 min)

Share your chatbot with the group:

1. What persona did you create?
2. What system prompt techniques worked best?
3. Did you add any extensions?

If time allows, try each other's chatbots and give feedback on the persona behavior.

---

## Key Takeaways

- The chat completions API is stateless; your code manages conversation context
- System prompts are your primary tool for shaping chatbot behavior
- A production chatbot needs guardrails: token limits, error handling, and input validation
- Gradio makes it trivial to put a web interface on any Python function

## Next Steps

- Add error handling for API failures and rate limits
- Implement token counting to stay within context limits
- Try different models (GPT-4o for higher quality, GPT-4o-mini for lower cost)
- Explore the "Deploy Your First AI App" workshop to put your chatbot on the internet
