# Your First Conversation with AI in Cursor

This is the article that changes everything. You're about to learn the core skill of this entire curriculum: writing code by talking to AI. Cursor has a built-in AI assistant that can generate code, explain what code does, fix errors, and build entire features from a description. You'll learn how to use it effectively — starting right now.

## The Big Idea

:::callout[info]
In this curriculum, you learn to code **by talking to AI**. You don't memorize syntax. You don't copy examples from a textbook. You describe what you want, the AI writes the code, and you learn to read, understand, and refine what it generates. This is how a growing number of professional developers actually work in 2026.
:::

This doesn't mean AI does everything for you. It means AI is your pair programmer — a collaborator that's extremely fast at writing code but needs you to direct it, verify its work, and understand what it produces. The human-AI team is stronger than either alone.

:::definition[Pair Programming]
A practice where two people work together on the same code. One writes while the other reviews, suggests improvements, and catches mistakes. With AI pair programming, the AI often writes while you direct, review, and learn.
:::

## Cursor's Three AI Features

Cursor gives you three ways to interact with AI. Each one is useful in different situations.

### 1. AI Chat (Cmd+L / Ctrl+L)

The chat panel opens on the side of your editor. It works like a conversation — you type a message, the AI responds. You can ask questions, request code, get explanations, or troubleshoot errors.

**When to use it:**
- You want to ask a question ("How do I read a file in Python?")
- You want the AI to generate a complete file or block of code
- You want an explanation of something you're looking at
- You want to brainstorm an approach before writing anything

**How to use it:**
1. Press `Cmd+L` (macOS) or `Ctrl+L` (Windows/Linux)
2. Type your message in the chat input
3. Press Enter to send
4. The AI responds with text, code, or both

:::callout[tip]
You can reference files in your chat. If you have a file open, the AI can see it. You can also type `@filename` to explicitly reference a specific file in your project. This gives the AI context about what you're working on.
:::

### 2. Inline Edit (Cmd+K / Ctrl+K)

This is for targeted edits. Select some code (or place your cursor on an empty line), press the shortcut, and describe what you want. The AI modifies just that section.

**When to use it:**
- You want to change something specific in existing code
- You want to add a function at your cursor position
- You want to rewrite a section to be better

**How to use it:**
1. Select the code you want to modify (or click where you want new code)
2. Press `Cmd+K` (macOS) or `Ctrl+K` (Windows/Linux)
3. Describe what you want in the prompt bar that appears
4. Press Enter — the AI generates the edit
5. Review the changes and press **Accept** or **Reject**

### 3. The Composer (Cmd+I / Ctrl+I)

The Composer is Cursor's most powerful feature. It can make changes across multiple files at once. It understands your entire project and can create, modify, and connect files together.

**When to use it:**
- You want to create something that involves multiple files
- You want to refactor code across your project
- You want to build a feature from a high-level description

:::callout[warning]
The Composer is powerful but can make many changes at once. Always review what it produces before accepting. As a beginner, start with the chat and inline edit — they're easier to control. You'll grow into the Composer naturally.
:::

## How to Prompt Effectively

The quality of what AI produces depends heavily on how you ask. Here are the principles that make the difference.

### Be Specific

Vague prompts get vague results. Compare these:

| Weak Prompt | Strong Prompt |
|---|---|
| "Make a program" | "Create a Python script that asks the user for their name and favorite color, then prints a greeting using both" |
| "Fix this" | "This function is supposed to return the sum of all even numbers in the list, but it's returning the sum of all numbers. Fix the filter condition" |
| "Add a feature" | "Add a function called `count_words` that takes a string and returns the number of words in it" |

### Give Context

Tell the AI what you're building and why. Context helps it make better decisions.

Instead of: "Write a function to process data"

Try: "I'm building a script that reads a CSV file of student grades. Write a function that takes a list of grade dictionaries and returns the average grade for each student."

### Ask for Explanations

This is how you learn. Don't just accept the code — ask the AI to teach you.

Try prompts like:
- "Create this function and explain each line"
- "What does this code do? Walk me through it step by step"
- "Why did you use a dictionary here instead of a list?"
- "What would happen if I changed this line to...?"

:::callout[tip]
The best prompt pattern for learning: **"Do X, and explain why you made the choices you did."** This gives you working code AND understanding in one response.
:::

### Iterate

Your first prompt rarely produces the perfect result. That's normal. Refine:

- "That's close, but change it so the output is sorted alphabetically"
- "Can you make this simpler? I don't understand the list comprehension"
- "Good, but add error handling for when the file doesn't exist"

Think of it as a conversation, not a single command. Each exchange gets you closer to what you want.

## Let's Practice: A Real Example

Here's a complete walkthrough of using Cursor's AI to build something.

### Step 1: Create a New File

Open a folder in Cursor (or use the `my-first-project` folder from the previous article). Create a new file called `greeting.py`.

:::callout[info]
The `.py` extension tells Cursor (and your computer) that this is a Python file. You'll learn more about Python in upcoming articles — for now, just know it's the programming language you'll use most in this curriculum.
:::

### Step 2: Open the Chat and Prompt

Press `Cmd+L` / `Ctrl+L` to open the AI chat. Type this prompt:

```
Create a Python script in the current file that:
1. Asks the user for their name
2. Asks for their favorite hobby
3. Prints a personalized message that includes both

Keep it simple. Add a comment explaining each line.
```

### Step 3: Review the Output

The AI will generate something like this:

```python
# Ask the user for their name and store it in a variable
name = input("What's your name? ")

# Ask the user for their favorite hobby
hobby = input("What's your favorite hobby? ")

# Print a personalized greeting using the name and hobby
print(f"Nice to meet you, {name}! It's awesome that you enjoy {hobby}.")
```

Read through the code and the comments. Even if you don't fully understand the syntax yet, you can probably follow what's happening: it asks two questions, stores the answers, and prints a message that includes both answers.

### Step 4: Ask Questions

Still in the chat, ask follow-up questions:

- "What does the `f` before the string do?"
- "What does `input()` do exactly?"
- "What would happen if the user just presses Enter without typing anything?"

The AI will explain each concept. This is active learning — you're building understanding by asking, not just reading.

### Step 5: Iterate

Now ask the AI to improve it:

"Add a check so that if the user enters an empty name, it asks again."

Watch how the AI modifies the code. Read the changes. Ask why it made the choices it did.

## The Right Mindset

:::callout[warning]
AI is not infallible. It can write code that looks correct but has subtle bugs. It can confidently explain something incorrectly. It can use outdated approaches. Your job is to **verify, understand, and learn** — not to blindly trust. As you gain experience, you'll get better at spotting when the AI is wrong.
:::

Here's how to think about your relationship with the AI:

**You are the decision-maker.** You decide what to build, what approach to take, and whether the code is correct. The AI is a fast, knowledgeable assistant — but it works for you.

**Understanding beats speed.** It's tempting to just accept every response and move on. Resist that. Take the time to read the code, ask questions, and make sure you understand what's happening. The goal isn't to produce code fast — it's to learn.

**Mistakes are information.** When the AI generates something wrong, that's a learning opportunity. Figure out why it's wrong. Ask the AI to explain the error. Debug it together. This is exactly what professional developers do.

## Quick Reference

| Feature | Shortcut (macOS) | Shortcut (Windows/Linux) | Best For |
|---|---|---|---|
| AI Chat | `Cmd+L` | `Ctrl+L` | Questions, generation, explanations |
| Inline Edit | `Cmd+K` | `Ctrl+K` | Targeted code changes |
| Composer | `Cmd+I` | `Ctrl+I` | Multi-file changes |

:::build-challenge

### Build: An AI-Generated Greeting Script

Use Cursor's AI to create a Python file — do not write the code yourself. Here's what to do:

1. Create a new file called `personal_greeting.py` in your project folder
2. Open the AI chat with `Cmd+L` / `Ctrl+L`
3. Prompt the AI to create a Python script that:
   - Asks for your name
   - Asks for your favorite food
   - Asks for a number between 1 and 10
   - Prints a fun personalized message using all three pieces of information
4. **Read every line** of the code the AI generates. For any line you don't understand, ask the AI to explain it.
5. After you understand the code, ask the AI to add one more feature — your choice. Maybe it tells a joke, gives a fun fact, or asks a follow-up question.

:::callout[tip]
To run your Python script, open the terminal (`` Cmd+` `` / `` Ctrl+` ``) and type `python personal_greeting.py` (or `python3 personal_greeting.py` on macOS/Linux). If Python isn't installed yet, don't worry — that comes in a later article. For now, focus on the conversation with AI and reading the code.
:::

**What to reflect on:** How specific did you need to be for the AI to give you what you wanted? Did you need to iterate? What did you learn from reading the code?
:::
