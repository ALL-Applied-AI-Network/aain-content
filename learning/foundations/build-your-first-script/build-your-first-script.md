# Build Your First Script

This is the capstone for Layers 0 and 1. You've learned Python fundamentals, worked with files and APIs, and set up Git. Now you're going to combine all of it into a real, useful program — built with AI assistance from start to finish. This article walks you through the professional workflow: plan, build, test, debug, and ship.

:::callout[info]
This article assumes you've completed "Python Through AI" and "Reading and Writing Data." You'll also push your project to GitHub, so complete "Git Basics" first if you haven't.
:::

## The AI-Assisted Development Workflow

Before you write a single line of code, understand the workflow. This isn't just a "beginner tip" — it's how professional engineers build software with AI tools in 2026.

1. **Pick a problem** — What do you want your program to do?
2. **Plan the solution with AI** — Describe the program, ask AI to outline the architecture
3. **Build step by step** — Implement one piece at a time, not the whole thing at once
4. **Test and debug** — Run the code, find issues, fix them
5. **Commit and push** — Save your progress to GitHub

Each of these steps involves a conversation with AI. You're not asking AI to build the whole thing in one shot. You're collaborating — describing what you want, reading what it writes, asking questions, making changes, and gradually assembling a working program.

:::callout[warning]
The biggest mistake beginners make: asking AI to build the entire program at once, then trying to run a 200-line script they don't understand. When it breaks (it will), they have no idea where to start debugging. Build small pieces. Test each one. Stack them together.
:::

## Choose Your Project

Pick one of these three projects. They all use the skills you've learned — file I/O, data structures, user input, and functions. Choose the one that interests you most.

### Option A: Personal Expense Tracker

A command-line tool that lets you log expenses, save them to a CSV file, and view spending summaries. Practical, useful, and teaches you data persistence.

### Option B: Quiz Game

An interactive quiz that loads questions from a JSON file, tracks the player's score, and saves high scores. Fun, interactive, and teaches you game state management.

### Option C: Web Headline Scraper

A script that fetches data from a news API, extracts headlines, filters by keyword, and saves results to a file. Real-world, data-oriented, and teaches you API integration.

We'll walk through **Option A (Expense Tracker)** in detail. After that, you'll build your chosen project independently.

## Walkthrough: The Expense Tracker

### Step 1: Plan with AI

Open Cursor's AI chat and describe what you want:

> "I want to build a personal expense tracker in Python. It should: (1) let me add an expense with a description, amount, and category, (2) save all expenses to a CSV file so they persist between runs, (3) show a summary of spending by category, (4) show total spending. Design the architecture — what functions do I need and how should the CSV be structured?"

Read AI's response carefully. It'll probably suggest something like:

- A CSV file with columns: `date`, `description`, `amount`, `category`
- Functions: `add_expense()`, `load_expenses()`, `save_expense()`, `show_summary()`, `show_total()`
- A main menu loop that lets the user choose actions

This is your blueprint. You don't have to follow it exactly — if you want to change something, change it. The plan is a starting point, not a contract.

### Step 2: Build the data layer first

Start with the boring but essential part — reading and writing data. Create a file called `expense_tracker.py` and ask AI:

> "Write the functions to load expenses from a CSV file and save a new expense to it. The CSV columns should be date, description, amount, and category. Use Python's csv module."

```python
import csv
import os
from datetime import date

EXPENSES_FILE = "expenses.csv"

def load_expenses():
    """Load all expenses from the CSV file."""
    if not os.path.exists(EXPENSES_FILE):
        return []

    expenses = []
    with open(EXPENSES_FILE, "r") as file:
        reader = csv.DictReader(file)
        for row in reader:
            row["amount"] = float(row["amount"])
            expenses.append(row)
    return expenses

def save_expense(description, amount, category):
    """Append a new expense to the CSV file."""
    file_exists = os.path.exists(EXPENSES_FILE)

    with open(EXPENSES_FILE, "a", newline="") as file:
        writer = csv.DictWriter(
            file, fieldnames=["date", "description", "amount", "category"]
        )
        if not file_exists:
            writer.writeheader()
        writer.writerow({
            "date": date.today().isoformat(),
            "description": description,
            "amount": amount,
            "category": category,
        })
```

**Stop and read this code.** Make sure you understand every line before moving on.

- `os.path.exists()` checks if the file exists — on the very first run, it won't
- `load_expenses()` returns an empty list if there's no file yet
- `float(row["amount"])` converts the string from CSV back to a number
- `save_expense()` opens the file in **append** mode (`"a"`) so it adds to the end instead of overwriting
- The header row is only written when creating a new file

**Test it.** Add these lines at the bottom of your file:

```python
# Quick test - delete these lines later
save_expense("Coffee", 4.50, "Food")
save_expense("Bus pass", 25.00, "Transport")
print(load_expenses())
```

Run the script. Check that `expenses.csv` was created and contains the right data. Then delete the test lines.

:::callout[tip]
Testing as you go is not optional. Every time you write a new function, test it immediately. Don't write 5 functions and then discover the first one was broken. This habit will save you hours of debugging.
:::

### Step 3: Build the summary functions

Now ask AI for the analysis functions:

> "Write a function that takes a list of expense dictionaries and prints a summary showing total spending per category. Also write a function that shows the overall total."

```python
def show_summary(expenses):
    """Display spending breakdown by category."""
    if not expenses:
        print("No expenses recorded yet.")
        return

    categories = {}
    for expense in expenses:
        cat = expense["category"]
        categories[cat] = categories.get(cat, 0) + expense["amount"]

    print("\n--- Spending by Category ---")
    for category, total in sorted(categories.items()):
        print(f"  {category}: ${total:.2f}")

def show_total(expenses):
    """Display total spending."""
    total = sum(expense["amount"] for expense in expenses)
    print(f"\nTotal spending: ${total:.2f}")
    print(f"Number of expenses: {len(expenses)}")
```

New patterns to notice:

- `categories.get(cat, 0)` returns the current value for a category, or `0` if it doesn't exist yet. This avoids a KeyError.
- `:.2f` in the f-string formats the number to 2 decimal places — perfect for currency.
- `sum(expense["amount"] for expense in expenses)` is a **generator expression** — a concise way to sum a specific field across a list.

:::details[What's a generator expression?]
`sum(expense["amount"] for expense in expenses)` is shorthand for creating a list of all amounts and summing them. It's equivalent to:
```python
amounts = []
for expense in expenses:
    amounts.append(expense["amount"])
total = sum(amounts)
```
The generator version is more concise and uses less memory. You'll see this pattern everywhere in Python.
:::

### Step 4: Build the user interface

The final piece — a menu that lets the user interact with the tracker:

```python
def main():
    """Main program loop."""
    print("=== Personal Expense Tracker ===\n")

    while True:
        print("\nWhat would you like to do?")
        print("  1. Add an expense")
        print("  2. View summary by category")
        print("  3. View total spending")
        print("  4. View all expenses")
        print("  5. Quit")

        choice = input("\nEnter your choice (1-5): ").strip()

        if choice == "1":
            description = input("Description: ").strip()
            amount = float(input("Amount: $"))
            category = input("Category (Food, Transport, Entertainment, etc.): ").strip()
            save_expense(description, amount, category)
            print(f"Saved: {description} - ${amount:.2f} [{category}]")

        elif choice == "2":
            expenses = load_expenses()
            show_summary(expenses)

        elif choice == "3":
            expenses = load_expenses()
            show_total(expenses)

        elif choice == "4":
            expenses = load_expenses()
            if not expenses:
                print("No expenses recorded yet.")
            else:
                print("\n--- All Expenses ---")
                for e in expenses:
                    print(f"  {e['date']} | {e['description']} | ${e['amount']:.2f} | {e['category']}")

        elif choice == "5":
            print("Goodbye!")
            break

        else:
            print("Invalid choice. Please enter 1-5.")

if __name__ == "__main__":
    main()
```

:::details[What does `if __name__ == "__main__":` mean?]
This is a Python convention. When you run a file directly (`python expense_tracker.py`), Python sets `__name__` to `"__main__"`. The `if` check means "only run `main()` when this file is executed directly, not when it's imported by another file." It's a good habit for any script that has a main entry point.
:::

### Step 5: Test and debug

Run your expense tracker:

```bash
python expense_tracker.py
```

Test every menu option. Add a few expenses. View the summary. View all expenses. Try entering invalid input (what happens if you type "abc" as the amount?). The program crashes because `float("abc")` raises an error.

Ask AI to help you fix it:

> "How do I handle the case where the user types something that isn't a number for the expense amount? I want to show an error message and let them try again."

AI will show you **try/except** — Python's error handling:

```python
while True:
    try:
        amount = float(input("Amount: $"))
        break
    except ValueError:
        print("Please enter a valid number.")
```

This is a real debugging moment. You found a bug by testing, diagnosed it, and fixed it with AI's help. That's the workflow.

### Step 6: Commit and push

Your tracker works. Time to save it:

```bash
git init
git add expense_tracker.py
git commit -m "Add personal expense tracker with CSV persistence"
```

Create a README. Ask AI:

> "Write a short README.md for my expense tracker project. It's a command-line Python app that tracks personal expenses in a CSV file."

Save the README, then:

```bash
git add README.md
git commit -m "Add README with project description"
git remote add origin https://github.com/YOUR-USERNAME/expense-tracker.git
git push -u origin main
```

Two commits, each with a clear message. Your project is live on GitHub.

## What You Just Did

Take a step back and appreciate the full loop you completed:

1. **Planned** the project architecture with AI
2. **Built** the data layer (read/write CSV)
3. **Built** the analysis functions (summary, totals)
4. **Built** the user interface (menu loop)
5. **Tested** and found a bug (invalid input)
6. **Debugged** with AI's help (try/except)
7. **Committed** to Git with meaningful messages
8. **Pushed** to GitHub

This is software development. The tools and scale change as you advance, but this cycle — plan, build, test, debug, ship — stays the same whether you're building a CLI expense tracker or deploying an AI-powered web application.

:::callout[info]
You've now completed the foundational skills for applied AI engineering. You can write Python, work with data, use the terminal, manage code with Git, and collaborate with AI throughout the process. Everything from here builds on these foundations — AI APIs, RAG systems, agents, and deployments all use the same tools and patterns you've learned.
:::

:::build-challenge
### Your Capstone Project

Build one of the three projects below (or propose your own to AI and build that). This is your Layer 0-1 capstone — make it something you're proud of.

**Option A: Personal Expense Tracker** (if you followed along above)
Extend the walkthrough version with at least two new features. Ideas:
- Filter expenses by date range
- Delete an expense by number
- Export a monthly summary to a separate file
- Add budget limits per category with warnings

**Option B: Quiz Game**
Build an interactive quiz game that:
- Loads questions from a JSON file (create at least 10 questions with multiple-choice answers)
- Presents questions one at a time with numbered answer choices
- Tracks the player's score
- Saves high scores to a JSON file with the player's name and date
- Shows the top 5 high scores at the end

**Option C: Headline Fetcher**
Build a script that:
- Fetches posts from JSONPlaceholder (`https://jsonplaceholder.typicode.com/posts`) or another free API
- Lets the user search by keyword
- Displays matching results in a clean format
- Saves results to both JSON and CSV
- Shows basic statistics (how many results, most common words in titles)

**Requirements for all options:**
- Use at least 3 functions to organize your code
- Read from and write to at least one file (JSON or CSV)
- Handle invalid user input gracefully (no crashes)
- Write a README.md that explains what the project does, how to run it, and what you learned
- Push to GitHub with at least 3 commits with meaningful messages

**Stretch goal:** Ask AI to help you add color to your terminal output (look into the `colorama` package). Small touch, big visual impact.
:::
