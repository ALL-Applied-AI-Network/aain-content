# AI-Powered Data Analysis

Data analysis used to require years of practice with pandas, matplotlib, and statistical methods before you could extract meaningful insights from a dataset. AI has changed the game. You can now use LLMs to help write analysis code, explain statistical patterns, and even generate visualizations — turning hours of work into minutes. But you still need to understand what the tools are doing and whether the results make sense.

## The New Data Analysis Workflow

The traditional workflow was: load data, explore manually, write complex pandas code from memory, iterate until the chart looks right. The AI-assisted workflow is fundamentally different:

1. Load your data and understand its shape
2. Ask AI to help write the analysis code
3. Review and run the generated code
4. Interpret the results with AI's help
5. Iterate on visualizations and insights

:::callout[info]
AI does not replace your judgment — it accelerates your execution. You still need to know what questions to ask, whether the analysis makes sense, and what the results mean for your specific domain. The AI handles the syntax; you handle the thinking.
:::

## Pandas Fundamentals: The Data Analysis Library

Pandas is the foundation of data analysis in Python. Every dataset you work with will start as a DataFrame — a table-like structure with rows and columns.

```python
import pandas as pd

# Load a CSV file
df = pd.read_csv("sales_data.csv")

# Quick overview of your data
print(df.shape)          # (1000, 8) — 1000 rows, 8 columns
print(df.columns.tolist())  # List all column names
print(df.dtypes)         # Data types of each column
df.head()                # First 5 rows
```

The essential pandas operations you will use constantly:

```python
# Filtering rows
expensive = df[df["price"] > 100]

# Selecting columns
prices = df[["product", "price", "quantity"]]

# Grouping and aggregating
daily_sales = df.groupby("date")["revenue"].sum()

# Sorting
top_products = df.sort_values("revenue", ascending=False).head(10)

# Basic statistics
print(df["price"].describe())  # count, mean, std, min, max, quartiles

# Handling missing values
df["price"].fillna(df["price"].median(), inplace=True)
```

:::callout[tip]
You do not need to memorize all of pandas. The most productive approach is to know what is possible, then ask AI to help with the specific syntax. "How do I group by month and calculate the rolling average?" is a great prompt.
:::

## Using LLMs to Write Analysis Code

Here is where AI transforms the workflow. Instead of searching Stack Overflow for pandas syntax, you describe what you want in plain English:

```python
import anthropic

client = anthropic.Anthropic()

def ask_analysis_question(df_description, question):
    """Ask an LLM to write pandas code for a specific analysis."""
    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1024,
        messages=[{
            "role": "user",
            "content": f"""I have a pandas DataFrame with these columns and types:
{df_description}

Write Python code to: {question}

Return only the code, no explanation. Use the variable 'df' for the DataFrame."""
        }]
    )
    return message.content[0].text
```

Using it:

```python
# Describe your data
description = """
- date (datetime): sale date
- product (str): product name
- category (str): product category
- price (float): unit price
- quantity (int): units sold
- revenue (float): total revenue
- region (str): sales region
"""

# Ask for analysis code
code = ask_analysis_question(
    description,
    "Find the top 5 products by total revenue, broken down by region"
)
print(code)
```

The AI will generate something like:

```python
result = (df.groupby(["region", "product"])["revenue"]
           .sum()
           .reset_index()
           .sort_values("revenue", ascending=False)
           .groupby("region")
           .head(5))
print(result)
```

:::callout[warning]
Always read and understand the code AI generates before running it. AI can produce code that looks correct but has subtle bugs — wrong column names, incorrect aggregation logic, or mishandled edge cases. Treat AI-generated code as a first draft, not a final answer.
:::

## Visualization with Matplotlib and Plotly

Charts reveal patterns that tables hide. Two libraries dominate Python visualization:

**Matplotlib** — the classic, works everywhere:

```python
import matplotlib.pyplot as plt

# Simple bar chart
top_products = df.groupby("product")["revenue"].sum().nlargest(10)

fig, ax = plt.subplots(figsize=(10, 6))
top_products.plot(kind="barh", ax=ax)
ax.set_xlabel("Total Revenue ($)")
ax.set_title("Top 10 Products by Revenue")
plt.tight_layout()
plt.savefig("top_products.png", dpi=150)
plt.show()
```

**Plotly** — interactive charts for exploration:

```python
import plotly.express as px

# Interactive scatter plot
fig = px.scatter(
    df,
    x="price",
    y="quantity",
    color="category",
    size="revenue",
    hover_data=["product"],
    title="Price vs. Quantity by Category"
)
fig.show()
```

You can also ask AI to generate visualization code:

```python
code = ask_analysis_question(
    description,
    "Create a line chart showing monthly revenue trends by category using matplotlib"
)
```

## Automated Insight Extraction

One of the most powerful applications of AI in data analysis is having the LLM look at summary statistics and generate insights in plain English:

```python
def extract_insights(df, context=""):
    """Have an LLM analyze summary statistics and generate insights."""
    # Compute summaries
    summary = {
        "shape": str(df.shape),
        "describe": df.describe().to_string(),
        "null_counts": df.isnull().sum().to_string(),
        "correlations": df.select_dtypes(include="number").corr().to_string()
    }

    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1024,
        messages=[{
            "role": "user",
            "content": f"""Analyze this dataset and provide 5 key insights.

Context: {context}

Dataset shape: {summary['shape']}

Statistical summary:
{summary['describe']}

Null values:
{summary['null_counts']}

Correlations:
{summary['correlations']}

Provide actionable insights, not just descriptions of the numbers."""
        }]
    )
    return message.content[0].text
```

```python
insights = extract_insights(
    df,
    context="This is sales data from an e-commerce company. "
            "We want to optimize pricing and inventory."
)
print(insights)
```

The AI might respond with insights like: revenue is concentrated in 3 product categories, weekend sales outperform weekdays by 40%, and there is a negative correlation between price and quantity that suggests pricing optimization opportunities.

## Exploratory Data Analysis Pattern

Here is a complete EDA workflow combining pandas and AI:

```python
def run_eda(filepath, context=""):
    """Run a complete exploratory data analysis with AI assistance."""
    # Load and inspect
    df = pd.read_csv(filepath)
    print(f"Loaded {len(df)} rows, {len(df.columns)} columns")
    print(f"Columns: {df.columns.tolist()}")
    print(f"\nData types:\n{df.dtypes}")
    print(f"\nMissing values:\n{df.isnull().sum()}")
    print(f"\nBasic statistics:\n{df.describe()}")

    # Check for obvious data quality issues
    duplicates = df.duplicated().sum()
    if duplicates > 0:
        print(f"\nWarning: {duplicates} duplicate rows found")

    # Generate AI insights
    insights = extract_insights(df, context)
    print(f"\nAI-Generated Insights:\n{insights}")

    return df
```

## Working with Real-World Messy Data

Real datasets are never clean. Here are patterns you will use constantly:

```python
# Convert date strings to datetime
df["date"] = pd.to_datetime(df["date"])

# Extract useful date components
df["month"] = df["date"].dt.month
df["day_of_week"] = df["date"].dt.day_name()
df["quarter"] = df["date"].dt.quarter

# Handle outliers
q1 = df["price"].quantile(0.25)
q3 = df["price"].quantile(0.75)
iqr = q3 - q1
df_clean = df[
    (df["price"] >= q1 - 1.5 * iqr) &
    (df["price"] <= q3 + 1.5 * iqr)
]

# Merge datasets
combined = pd.merge(sales_df, products_df, on="product_id", how="left")
```

## When to Trust AI Analysis (And When Not To)

AI is excellent at:
- Writing correct pandas syntax for well-described operations
- Spotting patterns in summary statistics
- Suggesting analyses you might not have thought of
- Explaining what a specific metric means

AI is unreliable at:
- Verifying its own calculations (always check the numbers)
- Understanding domain-specific context you haven't provided
- Making causal claims ("X causes Y" vs "X correlates with Y")
- Handling edge cases in messy data without explicit instructions

:::callout[info]
The golden rule of AI-assisted analysis: use AI to generate code and hypotheses, but always verify the results yourself. A chart that looks right can still be based on flawed logic. Check the numbers, question the assumptions, and confirm that the code does what you intended.
:::

## What You've Learned

You can now analyze data faster and more effectively with AI as your partner:

- **Pandas** is the foundation — load, filter, group, aggregate, and transform data
- **LLMs write analysis code** when you describe what you want in plain English
- **Matplotlib and Plotly** turn numbers into visual insights
- **Automated insight extraction** uses AI to find patterns in your summary statistics
- **Always verify AI output** — treat generated code as a draft, not a solution
- **Real data is messy** — date parsing, outlier handling, and merging are daily tasks

This combination of pandas fluency and AI assistance makes you dramatically more productive than either skill alone. The key is knowing what questions to ask and having the judgment to evaluate the answers.
