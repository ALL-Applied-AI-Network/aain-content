# Working with Databases

So far you have been reading data from files — CSVs, JSON, text files. That works for small projects, but as your AI applications grow, you need something more powerful. What happens when you want to search through thousands of conversation logs, update a single record without rewriting an entire file, or let multiple parts of your application access the same data simultaneously? That is where databases come in.

## Why Databases Matter for AI Applications

Every real AI application needs persistent storage. Chatbots need to remember conversation history. RAG pipelines need document metadata. Agents need to log their actions. Evaluation systems need to store results across runs.

:::definition[Database]
A structured system for storing, organizing, and retrieving data efficiently. Unlike flat files, databases support fast searching, concurrent access, and complex queries without loading everything into memory.
:::

You could store all of this in JSON files, but databases give you:

- **Speed** — query millions of rows without loading them all into memory
- **Structure** — enforce rules about what data looks like (no missing fields, correct types)
- **Searching** — find exactly what you need with powerful query languages
- **Concurrency** — multiple processes can read and write safely at the same time
- **Reliability** — transactions ensure your data stays consistent even if something crashes

## SQL: The Language of Databases

SQL (Structured Query Language) is how you talk to most databases. It has been around since the 1970s and it is not going anywhere. Every database — from SQLite on your laptop to PostgreSQL in production — speaks SQL.

:::callout[info]
SQL is one of the most valuable skills in tech. It shows up in data science, backend development, analytics, and increasingly in AI engineering. Learning it here pays dividends everywhere.
:::

SQL operates on tables. A table is like a spreadsheet: rows and columns with a defined structure.

```sql
-- A table for storing AI conversation logs
CREATE TABLE conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_message TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    model TEXT DEFAULT 'claude-3-5-sonnet',
    tokens_used INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## The Four Essential SQL Operations

### SELECT: Reading Data

```sql
-- Get all conversations
SELECT * FROM conversations;

-- Get only messages from today
SELECT user_message, ai_response
FROM conversations
WHERE created_at >= date('now');

-- Count conversations by model
SELECT model, COUNT(*) as total
FROM conversations
GROUP BY model;
```

### INSERT: Adding Data

```sql
-- Add a new conversation
INSERT INTO conversations (user_message, ai_response, model, tokens_used)
VALUES ('What is RAG?', 'RAG stands for...', 'claude-3-5-sonnet', 150);
```

### UPDATE: Modifying Data

```sql
-- Fix a record
UPDATE conversations
SET tokens_used = 175
WHERE id = 42;
```

### DELETE: Removing Data

```sql
-- Remove old conversations
DELETE FROM conversations
WHERE created_at < date('now', '-30 days');
```

## SQLite: The Perfect Starting Database

SQLite is a database that lives in a single file on your computer. No server to install, no configuration, no passwords. Python includes it in the standard library.

:::callout[tip]
SQLite powers more applications than any other database engine in the world. It is inside every iPhone, every Android phone, every web browser, and most desktop applications. It is not a toy — it is a production-grade database that happens to be incredibly simple to use.
:::

```python
import sqlite3

# Connect to a database (creates the file if it doesn't exist)
conn = sqlite3.connect("my_ai_app.db")
cursor = conn.cursor()

# Create a table
cursor.execute("""
    CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_message TEXT NOT NULL,
        ai_response TEXT NOT NULL,
        model TEXT DEFAULT 'claude-3-5-sonnet',
        tokens_used INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
""")
conn.commit()
```

## Building a Conversation Logger

Let's build something practical — a module that logs every AI conversation to a database so you can analyze usage patterns, debug issues, and track costs.

```python
import sqlite3
from datetime import datetime


class ConversationLogger:
    def __init__(self, db_path="conversations.db"):
        self.conn = sqlite3.connect(db_path)
        self.conn.row_factory = sqlite3.Row  # Return dicts instead of tuples
        self._create_tables()

    def _create_tables(self):
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS conversations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_message TEXT NOT NULL,
                ai_response TEXT NOT NULL,
                model TEXT,
                tokens_used INTEGER,
                cost_cents REAL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        self.conn.commit()

    def log(self, user_message, ai_response, model="claude-3-5-sonnet",
            tokens_used=0, cost_cents=0.0):
        self.conn.execute(
            """INSERT INTO conversations
               (user_message, ai_response, model, tokens_used, cost_cents)
               VALUES (?, ?, ?, ?, ?)""",
            (user_message, ai_response, model, tokens_used, cost_cents)
        )
        self.conn.commit()

    def get_recent(self, limit=10):
        cursor = self.conn.execute(
            "SELECT * FROM conversations ORDER BY created_at DESC LIMIT ?",
            (limit,)
        )
        return [dict(row) for row in cursor.fetchall()]

    def get_total_cost(self):
        cursor = self.conn.execute(
            "SELECT SUM(cost_cents) as total FROM conversations"
        )
        result = cursor.fetchone()
        return result["total"] or 0.0

    def search(self, query):
        cursor = self.conn.execute(
            "SELECT * FROM conversations WHERE user_message LIKE ?",
            (f"%{query}%",)
        )
        return [dict(row) for row in cursor.fetchall()]
```

Using it:

```python
logger = ConversationLogger()

# Log a conversation
logger.log(
    user_message="Explain what a vector database is",
    ai_response="A vector database is a specialized database...",
    model="claude-3-5-sonnet",
    tokens_used=250,
    cost_cents=0.075
)

# Check recent conversations
recent = logger.get_recent(5)
for conv in recent:
    print(f"[{conv['created_at']}] {conv['user_message'][:50]}...")

# Check total spending
total = logger.get_total_cost()
print(f"Total cost: ${total / 100:.2f}")
```

## Parameterized Queries: Staying Safe

:::callout[warning]
Never insert user data directly into SQL strings. This creates SQL injection vulnerabilities — one of the most common and dangerous security flaws in software.
:::

```python
# DANGEROUS — never do this
query = f"SELECT * FROM users WHERE name = '{user_input}'"

# SAFE — always use parameterized queries
cursor.execute("SELECT * FROM users WHERE name = ?", (user_input,))
```

The `?` placeholder tells SQLite to treat the value as data, not as SQL code. This prevents attackers from injecting malicious SQL through your inputs.

## Querying Patterns for AI Applications

Here are SQL patterns you will use repeatedly when building AI applications:

```python
# Find the most expensive conversations
cursor.execute("""
    SELECT user_message, tokens_used, cost_cents
    FROM conversations
    ORDER BY cost_cents DESC
    LIMIT 5
""")

# Daily usage summary
cursor.execute("""
    SELECT date(created_at) as day,
           COUNT(*) as conversations,
           SUM(tokens_used) as total_tokens,
           SUM(cost_cents) as total_cost
    FROM conversations
    GROUP BY date(created_at)
    ORDER BY day DESC
""")

# Find conversations about a specific topic
cursor.execute("""
    SELECT * FROM conversations
    WHERE user_message LIKE '%RAG%' OR ai_response LIKE '%RAG%'
    ORDER BY created_at DESC
""")
```

## From SQLite to Production Databases

SQLite is perfect for local development, prototyping, and single-user applications. When you need to scale, the same SQL knowledge transfers directly:

| Feature | SQLite | PostgreSQL | MySQL |
|---------|--------|------------|-------|
| Setup | Zero config | Server install | Server install |
| Concurrency | Single writer | Many writers | Many writers |
| Best for | Local apps, prototypes | Production apps | Web applications |
| Python library | Built-in | `psycopg2` | `mysql-connector` |

The SQL you learned here works in all of them with minor syntax differences.

## What You've Learned

You can now store and query structured data for your AI applications:

- **Databases** provide speed, structure, and reliability that flat files cannot match
- **SQL** is the universal language for working with structured data (SELECT, INSERT, UPDATE, DELETE)
- **SQLite** gives you a production-quality database with zero configuration
- **Python's sqlite3 module** makes database operations straightforward
- **Parameterized queries** protect against SQL injection
- **Practical patterns** for logging conversations, tracking costs, and searching histories

The conversation logger you built here is a real tool you can drop into any AI project. As you build chatbots, RAG pipelines, and agents in the coming lessons, having a solid database layer will make everything more robust and debuggable.
