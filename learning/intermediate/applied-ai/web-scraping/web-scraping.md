# Web Scraping for AI

The internet is the largest dataset ever created, and most of it is not available through convenient APIs. When you need to collect training data, build a knowledge base, or gather information for your AI applications, web scraping is the tool that makes it possible. But scraping comes with responsibilities — doing it right means being fast, respectful, and ethical.

## Why Scraping Matters for AI Engineers

AI applications are only as good as the data behind them. RAG pipelines need documents to search through. Fine-tuning requires domain-specific examples. Evaluation needs ground truth data. Sometimes the data you need is sitting on web pages, and there is no API to access it.

:::definition[Web Scraping]
The automated extraction of data from websites by programmatically downloading web pages and parsing their HTML content. Think of it as teaching your computer to read websites the way you do, but faster and at scale.
:::

Common AI use cases for scraping:

- Building knowledge bases from documentation sites
- Collecting product reviews for sentiment analysis
- Gathering research papers and their metadata
- Creating datasets for training or evaluation
- Monitoring competitor content or pricing changes

## HTML: The Structure Behind Every Web Page

Before you can extract data from a page, you need to understand how pages are built. Every website is written in HTML (HyperText Markup Language), which uses tags to structure content:

```html
<html>
  <head>
    <title>Example Page</title>
  </head>
  <body>
    <h1>Welcome</h1>
    <div class="article">
      <h2>Introduction to AI</h2>
      <p>Artificial intelligence is transforming how we build software.</p>
      <a href="https://example.com/learn-more">Learn more</a>
    </div>
    <div class="article">
      <h2>Getting Started with Python</h2>
      <p>Python is the most popular language for AI development.</p>
    </div>
  </body>
</html>
```

The key concepts:
- **Tags** like `<h1>`, `<p>`, `<div>` define what kind of content something is
- **Attributes** like `class="article"` and `href="..."` add metadata to tags
- **Nesting** creates a tree structure — elements contain other elements
- **Classes and IDs** are your best friends for finding specific content

## BeautifulSoup: Your Parsing Toolkit

BeautifulSoup is the standard Python library for parsing HTML. Install it with:

```bash
pip install beautifulsoup4 requests
```

Here is the basic pattern:

```python
import requests
from bs4 import BeautifulSoup

# 1. Download the page
response = requests.get("https://example.com")
html = response.text

# 2. Parse the HTML
soup = BeautifulSoup(html, "html.parser")

# 3. Find what you need
title = soup.find("h1").text
print(title)  # "Welcome"
```

## Finding Elements

BeautifulSoup gives you several ways to locate elements:

```python
# Find the first matching element
first_article = soup.find("div", class_="article")

# Find ALL matching elements
all_articles = soup.find_all("div", class_="article")

# Find by ID
header = soup.find(id="main-header")

# Find by CSS selector (most flexible)
links = soup.select("div.article a")

# Get text content
for article in all_articles:
    title = article.find("h2").text
    body = article.find("p").text
    print(f"{title}: {body}")
```

:::callout[tip]
Use your browser's developer tools (right-click, Inspect Element) to examine the HTML structure of any page. This tells you which tags, classes, and IDs to target in your scraper.
:::

## A Practical Scraper: Extracting Documentation

Let's build something useful — a scraper that extracts content from a documentation site for use in a RAG pipeline:

```python
import requests
from bs4 import BeautifulSoup
import json
import time


def scrape_docs_page(url):
    """Scrape a single documentation page and extract structured content."""
    response = requests.get(url, timeout=30)
    response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")

    # Extract the main content area (varies by site)
    content = soup.find("main") or soup.find("article") or soup.find("body")

    # Get the title
    title_tag = content.find("h1")
    title = title_tag.text.strip() if title_tag else "Untitled"

    # Get all text paragraphs
    paragraphs = []
    for p in content.find_all(["p", "li"]):
        text = p.get_text(strip=True)
        if len(text) > 20:  # Skip tiny fragments
            paragraphs.append(text)

    # Get code blocks
    code_blocks = []
    for code in content.find_all("pre"):
        code_blocks.append(code.get_text(strip=True))

    return {
        "url": url,
        "title": title,
        "paragraphs": paragraphs,
        "code_blocks": code_blocks,
        "word_count": sum(len(p.split()) for p in paragraphs)
    }


def scrape_multiple_pages(urls, delay=1.0):
    """Scrape multiple pages with rate limiting."""
    results = []
    for i, url in enumerate(urls):
        print(f"Scraping {i+1}/{len(urls)}: {url}")
        try:
            page_data = scrape_docs_page(url)
            results.append(page_data)
        except Exception as e:
            print(f"  Error: {e}")
        time.sleep(delay)  # Be respectful
    return results
```

## Ethics and robots.txt: Scraping Responsibly

:::callout[warning]
Web scraping exists in a legal and ethical gray area. Just because you can scrape a site does not mean you should. Always check the site's terms of service and `robots.txt` before scraping.
:::

Every website can publish a `robots.txt` file that tells automated tools what they are and are not allowed to access:

```python
import requests

# Check robots.txt before scraping
robots_url = "https://example.com/robots.txt"
response = requests.get(robots_url)
print(response.text)
```

A typical robots.txt looks like:

```
User-agent: *
Disallow: /private/
Disallow: /api/
Crawl-delay: 2
```

This says: all bots are allowed, except for `/private/` and `/api/` paths, and please wait 2 seconds between requests.

**Rules for ethical scraping:**

1. **Check robots.txt** and respect its rules
2. **Read the Terms of Service** — some sites explicitly prohibit scraping
3. **Rate limit your requests** — never hammer a server with rapid-fire requests
4. **Identify yourself** — set a descriptive User-Agent header
5. **Cache aggressively** — don't re-download pages you already have
6. **Use APIs when available** — scraping is a last resort, not a first choice
7. **Don't scrape personal data** without consent

```python
# Set a polite User-Agent header
headers = {
    "User-Agent": "MyAIProject/1.0 (educational; contact@example.com)"
}
response = requests.get(url, headers=headers)
```

## Rate Limiting and Being a Good Citizen

A server that gets hit with hundreds of requests per second might slow down or crash, affecting real users. Rate limiting prevents this:

```python
import time

def polite_scrape(urls, requests_per_second=0.5):
    """Scrape URLs at a respectful pace."""
    delay = 1.0 / requests_per_second
    results = []

    for url in urls:
        response = requests.get(url, timeout=30)
        results.append(response)
        time.sleep(delay)

    return results
```

:::callout[tip]
A good rule of thumb: if you would not be comfortable explaining your scraping behavior to the website owner, you should probably change your approach. One request every 1-2 seconds is generally considered polite for small-scale scraping.
:::

## Handling Common Scraping Challenges

**Pages that require JavaScript:** Some sites load content dynamically with JavaScript. BeautifulSoup only sees the initial HTML. For these sites, you need a browser automation tool like Playwright or Selenium, which are beyond the scope of this lesson but worth knowing about.

**Pagination:** Many sites spread content across multiple pages:

```python
def scrape_paginated(base_url, max_pages=10):
    """Follow pagination links to scrape multiple pages."""
    all_items = []

    for page_num in range(1, max_pages + 1):
        url = f"{base_url}?page={page_num}"
        response = requests.get(url, timeout=30)
        soup = BeautifulSoup(response.text, "html.parser")

        items = soup.find_all("div", class_="item")
        if not items:
            break  # No more pages

        for item in items:
            all_items.append(item.get_text(strip=True))

        time.sleep(1)

    return all_items
```

**Inconsistent HTML structure:** Real websites are messy. Always use defensive coding:

```python
# Fragile
title = soup.find("h1").text  # Crashes if no h1 exists

# Robust
title_tag = soup.find("h1")
title = title_tag.text.strip() if title_tag else "Unknown"
```

## Storing Scraped Data

Once you have scraped data, store it in a format ready for your AI pipeline:

```python
import json

def save_scraped_data(data, filepath="scraped_data.json"):
    """Save scraped data as JSON for downstream processing."""
    with open(filepath, "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"Saved {len(data)} records to {filepath}")


def load_scraped_data(filepath="scraped_data.json"):
    """Load previously scraped data."""
    with open(filepath, "r") as f:
        return json.load(f)
```

For larger datasets, consider using SQLite (covered in the Working with Databases lesson) instead of JSON files. It handles searching and filtering much more efficiently.

## What You've Learned

You can now collect data from the web responsibly and effectively:

- **HTML structure** uses tags, attributes, and nesting to organize content
- **BeautifulSoup** parses HTML and lets you find elements by tag, class, ID, or CSS selector
- **robots.txt** and ethical guidelines tell you what is appropriate to scrape
- **Rate limiting** protects servers and keeps you in good standing
- **Defensive coding** handles the messiness of real-world HTML
- **Practical patterns** for paginated content, storing results, and building knowledge bases

This skill connects directly to the RAG Fundamentals lesson — the documents you scrape here become the knowledge base your RAG pipeline searches through.
