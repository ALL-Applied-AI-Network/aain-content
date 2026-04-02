# Reading and Writing Data

Programs become useful when they work with data that exists outside the code itself — files on disk, data from the internet, user input from a form. This article teaches you how to read and write the most common data formats (text, CSV, JSON) and how to pull live data from web APIs. These are the exact skills you'll need before connecting to AI services.

:::callout[info]
This article assumes you've completed "Python Through AI" and are comfortable with variables, lists, dictionaries, loops, and functions. You'll be writing real Python scripts from the start.
:::

## Text Files: The Simplest Data

Every file on your computer is just data. A `.txt` file is the simplest kind — plain text, nothing fancy. Python makes reading and writing text files straightforward.

### Writing to a file

```python
with open("notes.txt", "w") as file:
    file.write("This is my first line.\n")
    file.write("This is my second line.\n")
```

Let's unpack this:

- `open("notes.txt", "w")` opens a file for **w**riting. If the file doesn't exist, Python creates it. If it does exist, it **overwrites** it.
- `as file` gives you a variable to work with
- `file.write()` writes text to the file
- `\n` is a newline character — without it, everything runs together on one line

:::definition[The `with` Statement]
A Python pattern that automatically handles cleanup. When you open a file with `with`, Python guarantees the file gets properly closed when the block ends — even if an error occurs. Always use `with` for file operations.
:::

### Reading from a file

```python
with open("notes.txt", "r") as file:
    content = file.read()
    print(content)
```

The `"r"` means **r**ead mode. `.read()` grabs the entire file as one string. For reading line by line:

```python
with open("notes.txt", "r") as file:
    for line in file:
        print(line.strip())
```

`.strip()` removes the trailing newline character from each line. Without it, you'd get double-spaced output (the newline in the file plus the newline that `print` adds).

:::callout[tip]
The mode string matters. `"w"` overwrites, `"r"` reads, `"a"` appends (adds to the end without erasing). If you accidentally use `"w"` on an important file, you'll lose its contents. When in doubt, use `"r"` first to see what's there.
:::

## CSV Files: Structured Rows and Columns

:::definition[CSV (Comma-Separated Values)]
A plain text file where each line is a row of data, and columns are separated by commas. CSV is one of the most common formats for tabular data — spreadsheets, databases, and data exports all use it.
:::

A CSV file looks like this:

```
title,year,rating
Interstellar,2014,9.5
The Matrix,1999,9.0
Inception,2010,8.8
```

### Reading CSV with Python's built-in module

```python
import csv

with open("movies.csv", "r") as file:
    reader = csv.DictReader(file)
    for row in reader:
        print(f"{row['title']} ({row['year']}) - {row['rating']}/10")
```

`csv.DictReader` treats the first row as column headers and gives you each subsequent row as a dictionary. So `row['title']` gives you the movie title. This is much cleaner than splitting strings by commas yourself.

### Writing CSV

```python
import csv

movies = [
    {"title": "Arrival", "year": 2016, "rating": 8.5},
    {"title": "Dune", "year": 2021, "rating": 8.3},
]

with open("favorites.csv", "w", newline="") as file:
    writer = csv.DictWriter(file, fieldnames=["title", "year", "rating"])
    writer.writeheader()
    writer.writerows(movies)
```

The `newline=""` parameter prevents blank lines between rows on Windows. It's a quirk — just always include it when writing CSVs.

### A preview of pandas

For simple CSV tasks, the built-in `csv` module works fine. But as your data gets larger or more complex, you'll want **pandas** — a library that makes data manipulation fast and expressive.

```python
import pandas as pd

df = pd.read_csv("movies.csv")
print(df)
print(f"\nAverage rating: {df['rating'].mean()}")
print(f"\nMovies after 2010:\n{df[df['year'] > 2010]}")
```

:::definition[pandas]
A Python library for data analysis and manipulation. It introduces the DataFrame — a table-like structure that makes filtering, sorting, grouping, and analyzing data incredibly concise. It's the most-used library in data science.
:::

You don't need to master pandas right now — you'll see it constantly in later articles. For now, just know it exists and that `pd.read_csv()` is the fastest way to load a CSV.

:::details[Installing pandas]
pandas doesn't come with Python — you need to install it. In your terminal:

```bash
pip install pandas
```

If that doesn't work, try `pip3 install pandas`. This uses **pip**, Python's package manager, which you'll learn about in the next section.
:::

## JSON: The Language of APIs

:::definition[JSON (JavaScript Object Notation)]
A lightweight data format that uses key-value pairs and arrays. Despite the "JavaScript" in its name, it's the standard data format for web APIs across all languages. If you've worked with Python dictionaries, JSON will look very familiar.
:::

JSON looks almost identical to Python dictionaries:

```json
{
    "title": "Interstellar",
    "year": 2014,
    "rating": 9.5,
    "genres": ["sci-fi", "drama", "adventure"]
}
```

The differences from Python dicts: JSON uses double quotes only (no single quotes), `true`/`false` instead of `True`/`False`, and `null` instead of `None`. Python's `json` module handles these conversions automatically.

### Reading JSON

```python
import json

with open("movie.json", "r") as file:
    movie = json.load(file)

print(movie["title"])
print(movie["genres"][0])
```

`json.load()` reads a JSON file and converts it to a Python dictionary (or list). From there, you work with it exactly like any other dictionary.

### Writing JSON

```python
import json

data = {
    "movies": [
        {"title": "Interstellar", "year": 2014, "rating": 9.5},
        {"title": "The Matrix", "year": 1999, "rating": 9.0},
    ],
    "last_updated": "2026-03-30"
}

with open("collection.json", "w") as file:
    json.dump(data, file, indent=2)
```

The `indent=2` parameter makes the output human-readable (pretty-printed) instead of cramming everything on one line. Always use it when writing JSON files you'll read later.

:::callout[tip]
JSON is everywhere. API responses, configuration files, data exports — you'll work with JSON constantly. Get comfortable reading its structure: curly braces for objects (dicts), square brackets for arrays (lists), and everything is key-value pairs.
:::

## Installing Packages with pip

Python's standard library is powerful, but the real magic comes from third-party packages — code that other developers wrote and shared. You install them with **pip**.

:::definition[pip]
Python's package installer. It downloads and installs packages from PyPI (the Python Package Index), a repository of over 500,000 open-source Python packages. If you need to do something in Python, there's almost certainly a package for it.
:::

```bash
pip install requests
```

That's it. One command, and the `requests` library is available in your Python scripts. Some other packages you'll use soon:

```bash
pip install pandas        # Data analysis
pip install python-dotenv # Load environment variables from .env files
pip install openai        # OpenAI API client (coming in later articles)
```

:::callout[warning]
If `pip install` gives you a permission error, try `pip install --user requests` or use `pip3` instead of `pip`. On some systems, `pip` points to Python 2 while `pip3` points to Python 3.
:::

## Making HTTP Requests: Fetching Live Data

The internet runs on **HTTP requests**. When you visit a website, your browser sends an HTTP request and gets back HTML. When your code calls an API, it sends an HTTP request and gets back JSON.

:::definition[API (Application Programming Interface)]
A way for programs to talk to each other. A web API is a URL you can send data to and get data back from — like a vending machine for information. You'll use APIs to access AI models, weather data, databases, and thousands of other services.
:::

The `requests` library makes HTTP calls simple:

```python
import requests

response = requests.get("https://api.quotable.io/random")
data = response.json()

print(f"Quote: {data['content']}")
print(f"Author: {data['author']}")
```

That's a complete program that fetches a random quote from the internet. Let's trace it:

1. `requests.get()` sends a GET request to the URL (GET means "give me data")
2. `response.json()` parses the JSON response into a Python dictionary
3. You access the data with dictionary keys, just like any other dict

### Checking if the request succeeded

APIs sometimes fail — the server might be down, or you might have a typo in the URL. Always check:

```python
response = requests.get("https://api.quotable.io/random")

if response.status_code == 200:
    data = response.json()
    print(f"Quote: {data['content']}")
else:
    print(f"Error: status code {response.status_code}")
```

A status code of `200` means success. `404` means not found. `500` means the server had an error. You'll encounter these codes constantly when working with APIs.

### Passing parameters

Many APIs accept parameters to customize what data you get back:

```python
import requests

# Fetch a quote by a specific author (tag-based)
params = {"tags": "technology"}
response = requests.get("https://api.quotable.io/random", params=params)
data = response.json()

print(f"Quote: {data['content']}")
print(f"Author: {data['author']}")
```

The `params` dictionary gets appended to the URL as query parameters. This is cleaner than building the URL string manually.

## Putting It Together: Fetch, Save, Read Back

Here's a complete script that combines everything from this article:

```python
import requests
import json

# 1. Fetch data from an API
print("Fetching quotes from the API...")
quotes = []
for i in range(5):
    response = requests.get("https://api.quotable.io/random")
    if response.status_code == 200:
        data = response.json()
        quotes.append({
            "text": data["content"],
            "author": data["author"]
        })
        print(f"  Got quote {i + 1}: {data['author']}")

# 2. Save as JSON
with open("quotes.json", "w") as file:
    json.dump(quotes, file, indent=2)
print(f"\nSaved {len(quotes)} quotes to quotes.json")

# 3. Read it back and display
with open("quotes.json", "r") as file:
    loaded_quotes = json.load(file)

print("\n--- Your Saved Quotes ---")
for i, quote in enumerate(loaded_quotes, 1):
    print(f"\n{i}. \"{quote['text']}\"")
    print(f"   - {quote['author']}")
```

This script talks to the internet, structures the data, saves it to disk, reads it back, and displays it. That's a real data pipeline — a small one, but the pattern is identical to what production systems use.

:::callout[info]
Free public APIs are perfect for learning. Here are a few alternatives if the quote API is down:

- **JSONPlaceholder** (`https://jsonplaceholder.typicode.com/posts`) — fake blog posts, always available
- **Open-Meteo** (`https://api.open-meteo.com/v1/forecast?latitude=43.04&longitude=-87.91&current_weather=true`) — real weather data, no API key needed
- **Dog CEO** (`https://dog.ceo/api/breeds/image/random`) — random dog photos, because why not

In later articles, you'll work with AI APIs (OpenAI, Anthropic) that require API keys. The pattern is the same — the only difference is an authentication header.
:::

:::build-challenge
### API Data Pipeline

Build a Python script that creates a complete data pipeline: fetch, save, load, and summarize. Here's the spec:

1. Pick a free public API from the list above (or find your own — [this list](https://github.com/public-apis/public-apis) has hundreds)
2. Fetch at least 5 items from the API using `requests`
3. Save the response data as a JSON file with proper formatting
4. Read the JSON file back into Python
5. Print a formatted summary that includes:
   - How many items you fetched
   - A clean display of each item
   - At least one computed statistic (e.g., average length, most common author, etc.)

**Requirements:**
- Use `requests` for HTTP calls
- Use `json` for reading/writing
- Check the status code before processing the response
- Handle the case where the API might be unavailable (print a helpful error, don't crash)
- Use at least one function to organize your code

**Stretch goal:** Save the same data as both JSON and CSV. Read both files back and verify they contain the same information. Print which file is smaller in bytes (use `os.path.getsize()` — ask AI how).
:::
