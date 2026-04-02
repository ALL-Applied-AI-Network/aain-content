# Build a Chatbot

Build a working AI chatbot from scratch. By the end of this workshop, you will have a chatbot with a web interface that you can customize and share with others.

> **Status: Coming Soon** -- The full hands-on content for this workshop is under development. The outline below reflects the planned structure and scope.

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
| 0:10 - 0:25 | **Your First API Call** | Make a single chat completion request. Understand the request/response structure: messages array, roles, model selection, and token usage. |
| 0:25 - 0:40 | **Conversation Memory** | Build a conversation loop that maintains history. Understand why the API is stateless and how you manage context by sending the full message array. |
| 0:40 - 0:55 | **System Prompts and Personality** | Design a system prompt that gives your chatbot a specific role, personality, and set of constraints. Experiment with how different system prompts change behavior. |
| 0:55 - 1:05 | **Break** | |
| 1:05 - 1:20 | **Adding a Web Interface** | Wrap your chatbot in a Gradio ChatInterface. Go from terminal-only to a shareable web app in under 20 lines of code. |
| 1:20 - 1:30 | **Customization and Stretch Goals** | Add features: streaming responses, conversation export, token counting, or multi-persona support. Participants choose their own adventure. |
| 1:30 - 1:40 | **Show and Tell** | Volunteers demo their chatbot's personality and any custom features they added. |

## Key Takeaways

- The chat completions API is stateless; your code manages conversation context
- System prompts are your primary tool for shaping chatbot behavior
- A production chatbot needs guardrails: token limits, error handling, and input validation
- Gradio makes it trivial to put a web interface on any Python function
