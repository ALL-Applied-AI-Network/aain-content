# Debugging with AI

Your code will break. This is not a failure — it is a normal, unavoidable part of programming. The difference between a beginner who gets stuck for hours and a productive developer is not that one writes perfect code. It is that one knows how to read errors, form hypotheses, and systematically fix problems. And right now, AI is the most powerful debugging partner you have ever had access to.

## Why Debugging Matters More Than Writing Code

:::callout[info]
Professional developers spend more time reading and fixing code than writing new code. Debugging is not a side skill — it is the core skill. Getting good at it makes everything else faster.
:::

Every error message is information. Every traceback tells a story. The goal is to learn to read that story, not to fear it. And when the story is unclear, you now have an AI that can translate it for you.

## Reading Python Error Messages

When Python encounters a problem, it produces a traceback — a detailed report of what went wrong and where. Let's decode one:

```
Traceback (most recent call last):
  File "app.py", line 15, in <module>
    result = process_data(user_input)
  File "app.py", line 8, in process_data
    return data["name"].upper()
TypeError: string indices must be integers, not 'str'
```

Read tracebacks from **bottom to top**:

1. **Last line** — the error type and message: `TypeError: string indices must be integers, not 'str'`
2. **Second to last** — the exact line that failed: `return data["name"].upper()`
3. **Above that** — where the function was called from: `result = process_data(user_input)`
4. **File and line number** — where to look in your code: `app.py, line 8`

The error tells you that `data` is a string, not a dictionary. You tried to use `data["name"]` as if it were a dict, but Python interpreted `"name"` as a string index into another string.

## The Most Common Python Errors

Here are the errors you will see most often and what they mean:

**SyntaxError** — Python cannot understand your code structure.
```
SyntaxError: expected ':'
```
Usually a missing colon, parenthesis, or quote. Check the line indicated and the line above it.

**NameError** — You used a variable that doesn't exist.
```
NameError: name 'respnse' is not defined
```
Almost always a typo. Check your spelling carefully.

**TypeError** — You used the wrong type of data for an operation.
```
TypeError: can only concatenate str (not "int") to str
```
You tried `"count: " + 42` instead of `"count: " + str(42)` or `f"count: {42}"`.

**KeyError** — You asked a dictionary for a key it doesn't have.
```
KeyError: 'username'
```
The dictionary exists, but the key `'username'` is not in it. Print the dictionary's keys to see what is actually available.

**IndexError** — You tried to access a list position that doesn't exist.
```
IndexError: list index out of range
```
Your list has 3 items (indices 0, 1, 2) but you asked for index 3 or higher.

**AttributeError** — You called a method that doesn't exist on that object.
```
AttributeError: 'NoneType' object has no attribute 'strip'
```
The variable is `None` when you expected it to be a string. Something earlier returned nothing.

**ImportError / ModuleNotFoundError** — Python cannot find the module you are importing.
```
ModuleNotFoundError: No module named 'openai'
```
Either the package is not installed, or you are not in the right virtual environment.

## Using AI to Understand Errors

When you hit an error you don't understand, AI is your best first resource. Here is how to use it effectively:

**Step 1: Copy the full traceback.** Don't just send the last line. The full traceback gives the AI context about your code structure and the chain of calls that led to the error.

**Step 2: Include the relevant code.** The AI needs to see what you wrote, not just the error. Copy the function or block of code around the failing line.

**Step 3: Ask specific questions.** Instead of "fix my code," try:

- "What does this error mean?"
- "Why is `data` a string here when I expected a dictionary?"
- "What are the possible causes of this TypeError?"

```
Here is my code:

def process_data(raw):
    return raw["name"].upper()

result = process_data("hello")

I'm getting this error:
TypeError: string indices must be integers, not 'str'

What does this error mean and how do I fix it?
```

The AI will explain that you are passing a string `"hello"` to a function that expects a dictionary, and suggest either changing the function call or changing the function logic.

## The Systematic Debugging Workflow

Don't just throw errors at AI randomly. Follow this process:

### 1. Read the Error First

Before asking anyone or anything for help, spend 30 seconds reading the error yourself. You will be surprised how often the answer is right there.

### 2. Reproduce the Problem

Can you make the error happen again? If it is intermittent, what conditions trigger it? Being able to reliably reproduce a bug is half of solving it.

### 3. Isolate the Cause

Use `print()` statements to check the state of your variables at different points:

```python
def process_response(api_result):
    print(f"DEBUG: type={type(api_result)}, value={api_result}")  # Add this
    data = api_result["choices"][0]["message"]
    print(f"DEBUG: data={data}")  # And this
    return data["content"]
```

This tells you exactly where things diverge from your expectations.

### 4. Form a Hypothesis

Based on the error and your investigation, guess what is wrong. "I think the API is returning a string instead of a dictionary when there is an error." Then test that hypothesis.

### 5. Ask AI When Stuck

If you have spent 5-10 minutes and are still stuck, that is the right time to ask AI for help. You will learn more because you already have context about the problem.

:::callout[tip]
The best AI debugging prompt includes: (1) what you expected to happen, (2) what actually happened, (3) the full error message, and (4) the relevant code. Give the AI everything it needs to help you in a single message.
:::

## Rubber Duck Debugging with AI

Rubber duck debugging is a classic technique: explain your code line by line to an inanimate object (traditionally a rubber duck on your desk), and the act of explaining often reveals the bug. AI makes this dramatically more effective because it can actually respond.

Try this approach when you are stuck:

```
I'm trying to build a function that reads a CSV file and returns
the average of the "price" column. Here's what my code does step
by step:

1. Opens the file with open()
2. Creates a csv.reader
3. Loops through rows and adds prices to a list
4. Returns sum(prices) / len(prices)

But I'm getting 0.0 as the result even though the CSV has prices.
Can you help me figure out what's wrong?
```

The AI might point out that `csv.reader` returns strings, so your prices list is full of strings like `"29.99"` instead of floats. You need `float(row[1])` when appending.

## Debugging Beyond Error Messages

Not all bugs produce errors. Sometimes your code runs without crashing but gives the wrong result. These are harder to find:

**Print intermediate values.** Add `print()` at every step and check if each value matches your expectations.

**Test with simple inputs.** If your function is supposed to double a number, test it with `2` first. Does it return `4`? Work up to complex inputs.

**Check your assumptions.** The bug is almost always in a place where reality differs from what you assumed. Are you sure that variable is a list and not a tuple? Are you sure the API returns the key you think it does?

**Compare with working examples.** Find a working version of similar code (in documentation, tutorials, or previous projects) and compare line by line.

## When to Stop Debugging and Start Over

Sometimes a function is so tangled that fixing it takes longer than rewriting it. Here are signs it is time to start fresh:

- You have been debugging the same function for over 30 minutes
- You don't understand what your own code does anymore
- Each fix introduces a new bug
- The function is trying to do too many things at once

Starting over with a clearer plan is not failure. It is efficiency.

## Building a Debugging Mindset

:::callout[info]
Every bug you fix teaches you something. The most experienced developers are not people who avoid bugs — they are people who have seen and fixed thousands of them. Each error message you decode adds to your pattern library.
:::

Over time, you will start recognizing errors instantly. "Oh, that's a KeyError — let me check what keys the API actually returned." "That's a None coming back from a function — it probably hit an early return I forgot about." This pattern recognition comes only from practice.

## What You've Learned

You now have a systematic approach to debugging:

- **Read tracebacks bottom to top** — the error type and the failing line are your starting points
- **Common Python errors** have common causes — learn the pattern for each
- **AI is your debugging partner** — give it the full context (error, code, expectations)
- **Follow a systematic workflow** — read, reproduce, isolate, hypothesize, verify
- **Rubber duck debugging with AI** turns explanation into discovery
- **Not all bugs crash** — learn to trace logic errors with print statements and simple test cases

The next time your code breaks, don't panic. Read the error, form a theory, and work through it methodically. You have the tools.
