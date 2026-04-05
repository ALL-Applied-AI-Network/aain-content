# APIs and Web Basics

Every time you check the weather on your phone, scroll through social media, or ask an AI a question, your device is talking to a server somewhere on the internet. That conversation happens through APIs. Understanding how they work is one of the most practical skills you can build as a developer, and it is the gateway to working with AI services programmatically.

## What Is an API?

:::definition[API (Application Programming Interface)]
A structured way for one piece of software to request data or actions from another. Think of it as a menu at a restaurant: the menu tells you what you can order, you make a request, and the kitchen sends back your food. You don't need to know how the kitchen works.
:::

APIs are everywhere. When a mobile app shows you the current weather, it is calling a weather API. When a website processes your payment, it is calling a payment API. When you use ChatGPT, your browser is calling OpenAI's API behind the scenes.

The key insight is that APIs turn complex systems into simple, predictable interfaces. You send a request in a specific format, and you get a response in a specific format. That predictability is what makes them so powerful.

## How the Web Works: HTTP in 60 Seconds

The web runs on a protocol called HTTP (HyperText Transfer Protocol). Every time your browser loads a page, it sends an HTTP request to a server, and the server sends back an HTTP response.

:::callout[info]
HTTP is just a set of rules for how two computers talk to each other. It is the language of the web, and every API you will use in this curriculum speaks it.
:::

An HTTP request has a few key parts:

- **Method** (what you want to do): GET, POST, PUT, DELETE
- **URL** (where to send it): like `https://api.weather.com/current`
- **Headers** (metadata): things like authentication tokens, content type
- **Body** (optional data): the information you are sending, usually in JSON format

An HTTP response comes back with:

- **Status code**: a number indicating success or failure
- **Headers**: metadata about the response
- **Body**: the actual data you asked for

## The Most Important HTTP Methods

You will use two methods constantly:

**GET** requests data from a server. It is like asking a question. "What is the weather in Milwaukee?" You are not changing anything, just reading.

**POST** sends data to a server. It is like filling out a form and submitting it. "Here is my prompt, please generate a response." You are asking the server to do something with the data you provide.

```python
# Conceptual examples — we will make these real shortly
# GET: "Give me information"
GET https://api.example.com/users/42

# POST: "Here's data, do something with it"
POST https://api.example.com/messages
Body: {"text": "Hello, AI!"}
```

There are other methods (PUT for updating, DELETE for removing), but GET and POST will cover 90% of what you do with AI APIs.

## HTTP Status Codes: Reading the Response

Every response includes a status code. You don't need to memorize all of them, but knowing the categories saves hours of debugging:

| Code Range | Meaning | Common Examples |
|-----------|---------|-----------------|
| 200-299 | Success | 200 OK, 201 Created |
| 400-499 | Client error (your fault) | 400 Bad Request, 401 Unauthorized, 404 Not Found, 429 Too Many Requests |
| 500-599 | Server error (their fault) | 500 Internal Server Error, 503 Service Unavailable |

:::callout[tip]
When you get a 401, check your API key. When you get a 429, you are sending requests too fast. When you get a 500, it is the server's problem, not yours. These three codes will explain most of the errors you encounter.
:::

## JSON: The Language APIs Speak

Most modern APIs communicate using JSON (JavaScript Object Notation). It is a simple text format for representing structured data.

```json
{
  "name": "Ada Lovelace",
  "role": "Applied AI Engineer",
  "skills": ["Python", "prompt engineering", "RAG"],
  "active": true,
  "projects": 7
}
```

JSON has a few basic types:
- **Strings**: text in double quotes (`"hello"`)
- **Numbers**: integers or decimals (`42`, `3.14`)
- **Booleans**: `true` or `false`
- **Arrays**: ordered lists (`["a", "b", "c"]`)
- **Objects**: key-value pairs (`{"key": "value"}`)
- **null**: represents "no value"

The beauty of JSON is that Python can read and write it natively. A JSON object maps directly to a Python dictionary, and a JSON array maps to a Python list.

```python
import json

# JSON string to Python dict
data = json.loads('{"name": "Ada", "skills": ["Python", "AI"]}')
print(data["name"])       # Ada
print(data["skills"][0])  # Python

# Python dict to JSON string
output = json.dumps({"status": "success", "count": 42})
print(output)  # {"status": "success", "count": 42}
```

## Making Your First API Request with Python

Python's `requests` library makes HTTP calls simple. If you have not installed it yet, run `pip install requests` in your terminal.

```python
import requests

# Make a GET request to a free public API
response = requests.get("https://httpbin.org/get")

# Check the status code
print(response.status_code)  # 200

# Parse the JSON response
data = response.json()
print(data["origin"])  # Your IP address
```

That is it. Three lines to make an API call, check if it worked, and read the response. Let's try a POST request:

```python
import requests

# Send data with a POST request
response = requests.post(
    "https://httpbin.org/post",
    json={"message": "Hello from Python!", "count": 1}
)

print(response.status_code)  # 200
data = response.json()
print(data["json"])  # {'message': 'Hello from Python!', 'count': 1}
```

:::callout[info]
The `json=` parameter in `requests.post()` automatically converts your Python dictionary to JSON and sets the correct Content-Type header. This is the pattern you will use with every AI API.
:::

## Reading API Documentation

Every API comes with documentation that tells you what endpoints are available, what data to send, and what you will get back. Here is how to read API docs efficiently:

1. **Find the base URL** — the root address all endpoints share (e.g., `https://api.openai.com/v1`)
2. **Identify the endpoint** — the specific path for what you want (e.g., `/chat/completions`)
3. **Check the method** — GET, POST, etc.
4. **Look at required parameters** — what data must you include?
5. **Check authentication** — most APIs require an API key in the headers
6. **Read the response format** — what does the JSON response look like?

```python
import requests

# A typical authenticated API call pattern
headers = {
    "Authorization": "Bearer your-api-key-here",
    "Content-Type": "application/json"
}

response = requests.post(
    "https://api.example.com/v1/endpoint",
    headers=headers,
    json={"param1": "value1", "param2": "value2"}
)

if response.status_code == 200:
    result = response.json()
    print(result)
else:
    print(f"Error {response.status_code}: {response.text}")
```

## Error Handling: When Things Go Wrong

APIs fail. Servers go down, keys expire, rate limits get hit. Good code handles these cases gracefully:

```python
import requests

def call_api(url, data):
    try:
        response = requests.post(url, json=data, timeout=30)
        response.raise_for_status()  # Raises an exception for 4xx/5xx
        return response.json()
    except requests.exceptions.Timeout:
        print("Request timed out — the server took too long to respond.")
    except requests.exceptions.HTTPError as e:
        print(f"HTTP error: {e.response.status_code} — {e.response.text}")
    except requests.exceptions.ConnectionError:
        print("Could not connect — check your internet or the API URL.")
    return None
```

:::callout[tip]
Always set a `timeout` on your requests. Without one, your program can hang forever if a server stops responding. Thirty seconds is a reasonable default for most API calls.
:::

## What You've Learned

You now understand the fundamental building blocks that power every AI API:

- **APIs** are structured interfaces for software to communicate
- **HTTP** is the protocol — GET reads data, POST sends data
- **JSON** is the data format — maps directly to Python dicts and lists
- **Status codes** tell you what happened (200 good, 4xx your problem, 5xx their problem)
- **The `requests` library** makes all of this straightforward in Python

In the next lesson on How AI APIs Work, you will use these exact skills to make your first calls to Claude and OpenAI. Everything you just learned translates directly — the only difference is the specific endpoints and parameters.
