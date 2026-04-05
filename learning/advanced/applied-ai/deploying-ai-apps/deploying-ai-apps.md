# Deploying AI Applications

You have built a chatbot, an agent, maybe a RAG pipeline. It works on your laptop. Now what? The gap between "works locally" and "accessible to users" is where most AI projects stall. Deployment is not glamorous, but it is the difference between a demo and a product. This lesson covers the practical path from a Python script to a running service — FastAPI for the backend, Docker for packaging, and cloud platforms for hosting.

## Why Deployment Is Different for AI Apps

Traditional web applications are mostly stateless — they process a request and return a response. AI applications add complexity:

- **Long response times** — LLM calls can take 5-30 seconds
- **Streaming** — users expect to see tokens appear in real-time, not wait for the full response
- **API keys and secrets** — your application holds credentials to expensive services
- **Variable costs** — every request costs money based on token usage
- **Large dependencies** — ML libraries are heavy (hundreds of megabytes)
- **State management** — conversation history, RAG indexes, agent memory

:::callout[info]
Deployment is a skill, not a one-time task. You will deploy, monitor, fix, and redeploy continuously. The goal is to make this cycle as fast and painless as possible.
:::

## FastAPI: Building Your AI Backend

FastAPI is the standard for building Python APIs. It is fast, has automatic documentation, and handles async operations natively — critical for AI applications that make slow API calls.

```bash
pip install fastapi uvicorn
```

A minimal AI backend:

```python
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import anthropic

app = FastAPI(title="My AI API")
client = anthropic.Anthropic()


class ChatRequest(BaseModel):
    message: str
    model: str = "claude-sonnet-4-20250514"
    max_tokens: int = 1024


class ChatResponse(BaseModel):
    response: str
    tokens_used: int


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Send a message and get an AI response."""
    message = client.messages.create(
        model=request.model,
        max_tokens=request.max_tokens,
        messages=[{"role": "user", "content": request.message}]
    )
    return ChatResponse(
        response=message.content[0].text,
        tokens_used=message.usage.input_tokens + message.usage.output_tokens
    )


@app.get("/health")
async def health():
    """Health check endpoint for monitoring."""
    return {"status": "healthy"}
```

Run it locally:

```bash
uvicorn main:app --reload --port 8000
```

Visit `http://localhost:8000/docs` to see the automatic interactive documentation.

## Adding Streaming Support

Users hate staring at a loading spinner for 10 seconds. Streaming sends tokens as they are generated:

```python
from fastapi.responses import StreamingResponse
import json


@app.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    """Stream AI responses token by token."""

    def generate():
        with client.messages.stream(
            model=request.model,
            max_tokens=request.max_tokens,
            messages=[{"role": "user", "content": request.message}]
        ) as stream:
            for text in stream.text_stream:
                yield f"data: {json.dumps({'text': text})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream"
    )
```

## Environment Variables: Managing Secrets

Never hardcode API keys. Use environment variables:

```python
import os

# Read from environment
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")
if not ANTHROPIC_API_KEY:
    raise ValueError("ANTHROPIC_API_KEY environment variable is required")
```

Create a `.env` file for local development (never commit this to git):

```
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
DATABASE_URL=sqlite:///./app.db
```

Load it with `python-dotenv`:

```python
from dotenv import load_dotenv
load_dotenv()  # Loads .env file into environment variables
```

:::callout[warning]
Add `.env` to your `.gitignore` immediately. Leaked API keys can cost you thousands of dollars in minutes. If you accidentally commit a key, rotate it immediately — deleting the commit is not enough because the key is in your git history.
:::

## Docker: Packaging Your Application

Docker packages your application with all its dependencies into a container that runs identically everywhere — your laptop, a teammate's machine, a cloud server.

Create a `Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies first (cached if requirements don't change)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose the port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Build and run:

```bash
# Build the image
docker build -t my-ai-app .

# Run the container
docker run -p 8000:8000 --env-file .env my-ai-app
```

:::callout[tip]
The `--env-file .env` flag passes your environment variables into the container without baking them into the image. This keeps secrets out of your Docker images, which could be shared or pushed to registries.
:::

## Docker Compose for Multi-Service Applications

Most real applications have multiple components. Docker Compose orchestrates them:

```yaml
# docker-compose.yml
version: "3.8"

services:
  api:
    build: .
    ports:
      - "8000:8000"
    env_file:
      - .env
    volumes:
      - ./data:/app/data
    depends_on:
      - db

  db:
    image: postgres:16
    environment:
      POSTGRES_DB: ai_app
      POSTGRES_USER: app
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

```bash
docker compose up -d  # Start all services in the background
docker compose logs -f api  # Follow API logs
docker compose down  # Stop everything
```

## Cloud Deployment Options

Where you deploy depends on your budget, scale, and complexity needs:

### Option 1: Platform-as-a-Service (Simplest)

**Railway, Render, Fly.io** — push your code, they handle everything else.

```bash
# Example with Railway
railway init
railway up
```

Pros: Zero infrastructure management, fast deploys, free tiers available.
Cons: Less control, can get expensive at scale, vendor lock-in.

### Option 2: Container Platforms

**AWS ECS, Google Cloud Run, Azure Container Apps** — deploy your Docker containers to managed infrastructure.

```bash
# Example: Google Cloud Run
gcloud run deploy my-ai-app \
  --source . \
  --region us-central1 \
  --allow-unauthenticated
```

Pros: More control than PaaS, scales to zero, pay per request.
Cons: More configuration, cloud CLI learning curve.

### Option 3: Virtual Machines

**AWS EC2, DigitalOcean Droplets, Hetzner** — rent a server and manage it yourself.

Pros: Full control, predictable pricing, can run anything.
Cons: You manage updates, security, scaling, and monitoring.

:::callout[info]
For your first deployment, start with a PaaS like Railway or Render. Get your app running and accessible. You can always migrate to more complex infrastructure later when you understand your needs.
:::

## Cost Management

AI applications have a unique cost profile — every API call costs money, and costs can spike unpredictably.

```python
# Simple rate limiter
from fastapi import HTTPException
from collections import defaultdict
import time

request_counts = defaultdict(list)
MAX_REQUESTS_PER_MINUTE = 20

@app.middleware("http")
async def rate_limit(request, call_next):
    client_ip = request.client.host
    now = time.time()

    # Clean old entries
    request_counts[client_ip] = [
        t for t in request_counts[client_ip] if now - t < 60
    ]

    if len(request_counts[client_ip]) >= MAX_REQUESTS_PER_MINUTE:
        raise HTTPException(status_code=429, detail="Rate limit exceeded")

    request_counts[client_ip].append(now)
    return await call_next(request)
```

Key cost management strategies:

- **Set budget alerts** on your AI API accounts
- **Implement rate limiting** to prevent abuse
- **Cache common responses** — if the same question comes up often, cache the answer
- **Use cheaper models** for simple tasks (don't use GPT-4 for classification)
- **Monitor token usage** per endpoint and per user
- **Set max_tokens limits** appropriate to each use case

## Monitoring and Logging

Once your app is live, you need to know what is happening:

```python
import logging
import time

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@app.middleware("http")
async def log_requests(request, call_next):
    start = time.time()
    response = await call_next(request)
    duration = time.time() - start

    logger.info(
        f"{request.method} {request.url.path} "
        f"status={response.status_code} "
        f"duration={duration:.2f}s"
    )
    return response
```

What to monitor:

- **Response latency** — how long are users waiting?
- **Error rates** — are requests failing?
- **Token usage** — how much are you spending?
- **Endpoint popularity** — which features are people using?

## Production Checklist

Before you call your deployment "production-ready," check these boxes:

- [ ] API keys are in environment variables, not in code
- [ ] `.env` is in `.gitignore`
- [ ] Health check endpoint exists (`/health`)
- [ ] Rate limiting is enabled
- [ ] Error responses don't leak internal details
- [ ] CORS is configured for your frontend domain
- [ ] Logging captures request details and errors
- [ ] Budget alerts are set on AI API accounts
- [ ] Docker image builds successfully from a clean checkout
- [ ] Streaming endpoints work correctly

## What You've Learned

You can now take an AI application from your laptop to the internet:

- **FastAPI** provides a fast, modern backend with automatic docs and streaming support
- **Environment variables** keep secrets out of your code
- **Docker** packages everything into a portable, reproducible container
- **Cloud platforms** range from simple PaaS to full infrastructure control
- **Cost management** prevents surprise bills through rate limiting, caching, and monitoring
- **Monitoring** tells you what is happening once real users start making requests

Deployment is iterative. Your first deploy will be simple and imperfect. That is correct. Ship it, learn from real usage, and improve. The best AI application is the one that is actually running and accessible to users.
