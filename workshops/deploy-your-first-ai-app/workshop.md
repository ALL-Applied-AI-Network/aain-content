# Deploy Your First AI App

Take a chatbot from localhost to a live URL. By the end of this workshop, you will have an AI-powered web app running on the internet that anyone can use.

## Workshop Overview

Building an AI app locally is step one. Getting it online is where it becomes real. This workshop walks through every layer of deployment: wrapping your chatbot in a FastAPI backend, building a minimal frontend, containerizing with Docker, and deploying to a cloud platform.

You will learn how production apps handle API keys securely, stream responses to the browser, and recover from errors. No prior deployment experience required -- we start from zero.

## Prerequisites

- Completed the "Build a Chatbot" workshop (or have a working chatbot using the OpenAI API)
- Comfortable with Python
- A GitHub account
- A free account on one of: Railway, Render, or Fly.io

## Materials Needed

Install the following before the workshop:

- Python 3.10+
- A code editor (Cursor recommended)
- `pip install fastapi uvicorn openai python-dotenv`
- Docker Desktop (install from docker.com -- used in Part 4)
- Git installed and configured
- An OpenAI API key

## Agenda

| Time | Section | Description |
|---|---|---|
| 0:00 - 0:10 | **Architecture Overview** | How web apps work: frontend, backend, API, deployment. |
| 0:10 - 0:30 | **FastAPI Backend** | Build the API server for your chatbot. |
| 0:30 - 0:50 | **Frontend** | Build a minimal chat UI with HTML and JavaScript. |
| 0:50 - 1:00 | **Break** | |
| 1:00 - 1:20 | **Docker** | Containerize your app for portable deployment. |
| 1:20 - 1:50 | **Deploy to the Cloud** | Push to Railway, Render, or Fly.io. |
| 1:50 - 2:00 | **Wrap-Up** | Share your live URLs and discuss next steps. |

---

## Part 1: Architecture Overview (10 min)

When your chatbot runs locally with Gradio, everything happens on one machine. In production, the pieces separate:

```
Browser (Frontend)  -->  Your Server (Backend)  -->  OpenAI API
     HTML/JS               FastAPI/Python              LLM
```

**Why FastAPI instead of Gradio for production?**
- Full control over the API design and response format
- Better for custom frontends (React, mobile apps, etc.)
- Built-in support for streaming responses via Server-Sent Events
- Industry-standard approach for building AI APIs

Create your project:

```bash
mkdir deploy-workshop && cd deploy-workshop
python -m venv venv
source venv/bin/activate
pip install fastapi uvicorn openai python-dotenv
```

Create a `.env` file:

```
OPENAI_API_KEY=sk-your-key-here
```

---

## Part 2: FastAPI Backend (20 min)

FastAPI is a Python web framework that makes building APIs fast. Create `main.py`:

```python
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import StreamingResponse, FileResponse
from pydantic import BaseModel
from openai import OpenAI
from dotenv import load_dotenv
import json
import os

load_dotenv()

app = FastAPI(title="AI Chatbot API")
client = OpenAI()

SYSTEM_PROMPT = """You are a helpful assistant. Be concise and clear.
If you do not know something, say so rather than guessing."""

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: list[ChatMessage]

@app.post("/api/chat")
async def chat(request: ChatRequest):
    """Handle a chat request and return a response."""
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    messages.extend([m.model_dump() for m in request.messages])

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
        )
        return {"response": response.choices[0].message.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health():
    """Health check endpoint."""
    return {"status": "ok"}
```

Test it:

```bash
uvicorn main:app --reload
```

Open another terminal and test with curl:

```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Hello!"}]}'
```

You should get a JSON response with the chatbot's reply.

### Adding Streaming

Streaming sends the response word by word, so the user sees text appear in real time. Add this endpoint to `main.py`:

```python
@app.post("/api/chat/stream")
async def chat_stream(request: ChatRequest):
    """Handle a chat request with streaming response."""
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    messages.extend([m.model_dump() for m in request.messages])

    def generate():
        try:
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                stream=True,
            )
            for chunk in response:
                if chunk.choices[0].delta.content:
                    data = json.dumps({"content": chunk.choices[0].delta.content})
                    yield f"data: {data}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            error_data = json.dumps({"error": str(e)})
            yield f"data: {error_data}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")
```

This uses **Server-Sent Events (SSE)** -- a standard protocol for streaming data from server to browser.

---

## Part 3: Frontend (20 min)

Create a `static/` directory and build a minimal chat UI.

```bash
mkdir static
```

Create `static/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Chatbot</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #f5f5f5;
            height: 100vh;
            display: flex;
            flex-direction: column;
        }
        header {
            background: #1a1a2e;
            color: white;
            padding: 1rem;
            text-align: center;
        }
        #chat-container {
            flex: 1;
            overflow-y: auto;
            padding: 1rem;
            max-width: 800px;
            margin: 0 auto;
            width: 100%;
        }
        .message {
            margin-bottom: 1rem;
            padding: 0.75rem 1rem;
            border-radius: 8px;
            max-width: 80%;
            line-height: 1.5;
        }
        .user-message {
            background: #1a1a2e;
            color: white;
            margin-left: auto;
        }
        .bot-message {
            background: white;
            border: 1px solid #ddd;
        }
        #input-area {
            padding: 1rem;
            background: white;
            border-top: 1px solid #ddd;
        }
        #input-form {
            max-width: 800px;
            margin: 0 auto;
            display: flex;
            gap: 0.5rem;
        }
        #message-input {
            flex: 1;
            padding: 0.75rem;
            border: 1px solid #ddd;
            border-radius: 8px;
            font-size: 1rem;
        }
        #send-button {
            padding: 0.75rem 1.5rem;
            background: #1a1a2e;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1rem;
        }
        #send-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
    </style>
</head>
<body>
    <header>
        <h1>AI Chatbot</h1>
    </header>
    <div id="chat-container"></div>
    <div id="input-area">
        <form id="input-form">
            <input type="text" id="message-input" placeholder="Type a message..." autocomplete="off" />
            <button type="submit" id="send-button">Send</button>
        </form>
    </div>

    <script>
        const chatContainer = document.getElementById('chat-container');
        const form = document.getElementById('input-form');
        const input = document.getElementById('message-input');
        const sendButton = document.getElementById('send-button');

        let messages = [];

        function addMessage(role, content) {
            const div = document.createElement('div');
            div.className = `message ${role === 'user' ? 'user-message' : 'bot-message'}`;
            div.textContent = content;
            chatContainer.appendChild(div);
            chatContainer.scrollTop = chatContainer.scrollHeight;
            return div;
        }

        async function sendMessage(userMessage) {
            // Add user message to UI and history
            addMessage('user', userMessage);
            messages.push({ role: 'user', content: userMessage });

            // Disable input while waiting
            sendButton.disabled = true;
            input.disabled = true;

            // Create bot message placeholder
            const botDiv = addMessage('assistant', '');

            try {
                // Use streaming endpoint
                const response = await fetch('/api/chat/stream', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ messages }),
                });

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let botMessage = '';

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const text = decoder.decode(value);
                    const lines = text.split('\n');

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6);
                            if (data === '[DONE]') break;
                            try {
                                const parsed = JSON.parse(data);
                                if (parsed.content) {
                                    botMessage += parsed.content;
                                    botDiv.textContent = botMessage;
                                    chatContainer.scrollTop = chatContainer.scrollHeight;
                                }
                            } catch (e) {}
                        }
                    }
                }

                messages.push({ role: 'assistant', content: botMessage });
            } catch (error) {
                botDiv.textContent = 'Error: Could not reach the server.';
            }

            sendButton.disabled = false;
            input.disabled = false;
            input.focus();
        }

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const message = input.value.trim();
            if (!message) return;
            input.value = '';
            sendMessage(message);
        });

        input.focus();
    </script>
</body>
</html>
```

Now serve the frontend from FastAPI. Add this to `main.py` after your API routes:

```python
# Serve the frontend
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def root():
    return FileResponse("static/index.html")
```

Restart the server and open `http://localhost:8000` in your browser. You should see a working chat interface with streaming responses.

---

## Part 4: Docker (20 min)

Docker packages your app and all its dependencies into a container that runs identically anywhere.

Create `requirements.txt`:

```
fastapi==0.115.0
uvicorn==0.30.0
openai==1.50.0
python-dotenv==1.0.1
```

Create `Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY main.py .
COPY static/ static/

# Expose the port
EXPOSE 8000

# Run the server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Create `.dockerignore`:

```
venv/
.env
__pycache__/
.git/
```

Build and run locally:

```bash
docker build -t ai-chatbot .
docker run -p 8000:8000 -e OPENAI_API_KEY=sk-your-key-here ai-chatbot
```

Open `http://localhost:8000` -- your app is now running in a container.

### Key Docker Concepts

- **Image** -- a snapshot of your app + dependencies (built from the Dockerfile)
- **Container** -- a running instance of an image
- **`-e` flag** -- passes environment variables into the container (how we securely provide the API key)
- **`-p` flag** -- maps a container port to a host port

Notice that the `.env` file is in `.dockerignore`. In production, you never bake secrets into images. You provide them at runtime via environment variables.

---

## Part 5: Deploy to the Cloud (30 min)

Choose one platform. All three have free tiers sufficient for this workshop.

### Option A: Railway

Railway is the simplest path from code to URL.

1. Push your code to GitHub:

```bash
git init
git add main.py requirements.txt Dockerfile static/ .dockerignore
git commit -m "Initial deployment"
```

Create a new repo on GitHub and push to it.

2. Go to [railway.app](https://railway.app) and sign in with GitHub
3. Click **New Project** > **Deploy from GitHub repo** > select your repo
4. Railway auto-detects the Dockerfile and starts building
5. Go to **Variables** tab and add `OPENAI_API_KEY` with your key
6. Go to **Settings** > **Networking** > **Generate Domain**
7. Your app is live at the generated URL

### Option B: Render

1. Push your code to GitHub (same as above)
2. Go to [render.com](https://render.com) and sign in
3. Click **New** > **Web Service** > connect your GitHub repo
4. Set **Runtime** to Docker
5. Add environment variable: `OPENAI_API_KEY` = your key
6. Click **Create Web Service**
7. Wait for the build to complete -- your URL will be shown on the dashboard

### Option C: Fly.io

1. Install the Fly CLI:

```bash
curl -L https://fly.io/install.sh | sh
```

2. Sign up and authenticate:

```bash
fly auth signup
```

3. Launch your app:

```bash
fly launch
```

Follow the prompts. Fly will detect your Dockerfile.

4. Set your API key:

```bash
fly secrets set OPENAI_API_KEY=sk-your-key-here
```

5. Deploy:

```bash
fly deploy
```

Your app will be live at `https://your-app-name.fly.dev`.

### Verify Your Deployment

1. Open your live URL in the browser
2. Send a test message
3. Check that streaming works
4. Try it on your phone -- the responsive CSS should handle mobile screens

### Troubleshooting

| Problem | Check |
|---|---|
| App does not load | Check build logs on the platform dashboard |
| "Internal Server Error" | Check that `OPENAI_API_KEY` is set in the platform's environment variables |
| Responses are slow | Normal on free tiers -- the container may cold-start |
| Streaming does not work | Ensure your platform supports Server-Sent Events (all three do) |

---

## Part 6: Wrap-Up (10 min)

Share your live URLs in the group chat. Try each other's deployed chatbots.

### What You Built

1. A **FastAPI backend** that handles chat requests and streams responses
2. A **frontend** with a clean chat UI and real-time streaming
3. A **Docker container** that packages everything for portable deployment
4. A **live deployment** on a cloud platform with secure API key management

### Production Considerations

Things to add before sharing widely:

- **Rate limiting** -- prevent abuse (use `slowapi` or platform-level limits)
- **Authentication** -- add user login if the app is not meant to be public
- **Cost controls** -- set spending limits on your OpenAI account
- **Logging** -- track usage and errors (platforms provide built-in logging)
- **CORS** -- configure allowed origins if you separate frontend/backend domains

---

## Key Takeaways

- Separating frontend and backend gives you flexibility for different clients
- Environment variables are the standard way to handle secrets in deployment
- Docker makes your app portable -- if it runs in the container, it runs anywhere
- Modern cloud platforms make deployment as simple as connecting a GitHub repo
- Streaming responses via SSE provide a dramatically better user experience

## Next Steps

- Add a custom domain to your deployment
- Implement rate limiting and authentication
- Set up CI/CD so pushes to main auto-deploy
- Try the "Build an Agent" workshop and deploy an agent instead of a chatbot
