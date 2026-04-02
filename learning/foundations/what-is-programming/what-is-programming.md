# What Is Programming? Code, Languages, and How Computers Think

You've set up your tools and had your first conversation with AI about code. Now it's time to understand what code actually is, why there are so many programming languages, and why Python is the one you'll use to build AI applications. This article gives you the conceptual foundation that makes everything else click.

## Code Is Just Instructions

:::definition[Code (Source Code)]
A set of instructions written in a programming language that tells a computer what to do. Each line of code is a specific instruction — store this value, make this decision, repeat this action, display this result.
:::

At its core, programming is writing instructions for a machine. The machine is incredibly fast and precise, but it's also incredibly literal. It does exactly what you tell it to do — nothing more, nothing less. If your instructions have a mistake, the computer doesn't figure out what you meant. It either does the wrong thing or stops and tells you there's an error.

Here's a useful analogy: imagine giving someone directions to your house. If you say "turn left at the big tree," a human might figure it out even if the tree is medium-sized. A computer would stop and say "ERROR: no big tree found." Code has to be precise.

:::callout[tip]
This precision is actually a good thing. When your code doesn't work, it's because the instructions are wrong — and the computer tells you exactly where the problem is. Debugging (fixing broken code) is a skill you'll build over time, and AI tools make it dramatically easier.
:::

## Why Programming Languages Exist

Computers don't understand English. At the deepest level, they only understand binary — sequences of 0s and 1s. Writing instructions in binary would be impossibly tedious, so humans created programming languages as a bridge.

:::definition[Programming Language]
A formal language with specific rules and syntax that allows humans to write instructions a computer can execute. Programming languages are designed to be readable by humans while being precise enough for machines to interpret.
:::

A programming language lets you write something like:

```python
print("Hello, world!")
```

Instead of the thousands of binary instructions that actually make your computer display those words on screen. The language handles the translation for you.

### Why Are There So Many Languages?

Different languages are designed for different purposes, the same way different tools are designed for different jobs. You wouldn't use a screwdriver to hammer a nail. Similarly:

- **Python** is designed for readability and rapid development — ideal for AI, data science, and scripting
- **JavaScript** runs in web browsers — it's how websites become interactive
- **C** and **C++** give you precise control over hardware — used in operating systems, game engines, and embedded devices
- **SQL** is specifically for working with databases
- **Rust** emphasizes safety and performance — growing popular for systems programming

:::callout[info]
You don't need to learn all these languages. Most developers know 2-3 well and can pick up others as needed. In this curriculum, you'll focus on Python because it's the dominant language for AI work.
:::

## Why Python?

Python is the language of choice for AI and machine learning, and it's one of the best languages for beginners. Here's why:

**It reads like English.** Compare these two ways to print "Hello" five times:

:::tabs

### Python
```python
for i in range(5):
    print("Hello")
```

### Java
```java
public class Main {
    public static void main(String[] args) {
        for (int i = 0; i < 5; i++) {
            System.out.println("Hello");
        }
    }
}
```

:::

The Python version is shorter, simpler, and closer to how you'd describe the task in English. That readability makes it easier to learn, easier to debug, and faster to write.

**The AI ecosystem runs on it.** The most important AI libraries and frameworks — PyTorch, TensorFlow, LangChain, OpenAI's SDK, Anthropic's SDK — are all Python-first. When you build AI applications, Python is the language that connects you to the tools you need.

**Massive community.** If you have a question, someone has already asked it. If you need a library for something, someone has already built it. Python's community is one of the largest and most helpful in all of programming.

**AI tools understand it deeply.** When you ask Cursor's AI to write Python code, it generates high-quality results because Python is heavily represented in the data these models were trained on.

## What Does "Running Code" Mean?

When you write code, you're creating a text file with instructions. That file just sits there — it doesn't do anything until you **run** it.

:::definition[Running Code (Executing Code)]
The process of telling your computer to read a code file and carry out the instructions inside it, line by line. When you "run a Python script," you're asking the Python interpreter to read your `.py` file and execute each instruction in order.
:::

For Python, running code works like this:

1. You write your instructions in a file (for example, `greeting.py`)
2. You open the terminal
3. You type `python greeting.py` and press Enter
4. The Python **interpreter** reads your file from top to bottom, executing each line
5. You see the output in the terminal

:::definition[Interpreter]
A program that reads your source code line by line and executes each instruction immediately. Python is an interpreted language — you don't need to compile (translate) your code into binary first. You write it, you run it, you see results.
:::

This is different from **compiled languages** like C or Java, where you have to translate the entire program into machine code before you can run it. Python's interpreted nature makes the feedback loop fast: write, run, see results, adjust, repeat.

## Reading Code: A Line-by-Line Walkthrough

Let's look at a simple Python script and understand every line. This is the kind of analysis you'll do constantly — reading code is just as important as writing it.

```python
name = input("What is your name? ")
age = int(input("How old are you? "))
birth_year = 2026 - age

print(f"Hello, {name}!")
print(f"You were probably born in {birth_year}.")
```

Here's what each line does:

**Line 1:** `name = input("What is your name? ")`
- `input(...)` displays the text in quotes and waits for the user to type something
- Whatever the user types gets stored in a **variable** called `name`
- A variable is like a labeled box — you put a value in it and can use that label to get the value back later

**Line 2:** `age = int(input("How old are you? "))`
- Same pattern — asks for input and stores it
- `int(...)` converts the text the user types into a number (because `input` always gives you text, even if the user types "25")
- The result is stored in a variable called `age`

**Line 3:** `birth_year = 2026 - age`
- Creates a new variable called `birth_year`
- Calculates its value by subtracting `age` from 2026
- This is basic math — code can do arithmetic just like a calculator

**Line 5:** `print(f"Hello, {name}!")`
- `print(...)` displays text in the terminal
- The `f` before the quotes makes it an **f-string** — a string where you can insert variables using `{curly braces}`
- `{name}` gets replaced with whatever the user typed on line 1

**Line 6:** `print(f"You were probably born in {birth_year}.")`
- Same pattern — prints a message with the calculated birth year inserted

:::callout[tip]
Notice that the code runs from top to bottom. Line 1 happens first, then line 2, then line 3, and so on. This sequential flow is the most basic form of program execution. Later you'll learn about conditions (do this OR that) and loops (do this repeatedly), which give programs more complex behavior.
:::

## Scripts vs. Programs

You'll hear both terms. Here's the practical difference:

:::definition[Script]
A relatively short, self-contained code file that performs a specific task. You run it, it does its thing, it's done. The greeting example above is a script.
:::

:::definition[Program (Application)]
A larger, more complex piece of software, usually made up of multiple files working together. A web application, a mobile app, or an AI chatbot are programs. Programs often run continuously and respond to user actions rather than just executing once from top to bottom.
:::

The line between the two is blurry, and it doesn't matter much. You'll start by writing scripts and gradually build toward full applications. The concepts are the same — programs are just bigger.

## You Don't Memorize Syntax

Here's something that surprises many beginners: professional developers don't have every function and syntax rule memorized. They look things up constantly — in documentation, on Stack Overflow, and increasingly by asking AI.

:::callout[info]
With AI tools like Cursor, the balance has shifted even further. You need to understand **concepts** — what variables are, how loops work, what a function does — but you don't need to memorize exact syntax. You describe what you want, the AI writes the code, and you verify that it's correct. Understanding beats memorization every time.
:::

This is why the previous article on talking to AI comes before this one. The way you'll learn Python in this curriculum is by describing what you want to build, reading what the AI generates, and developing an intuition for how code works. Syntax details come naturally through exposure — not through flashcards.

## What Comes Next

You now understand the big picture:

- Code is instructions for a computer, written in a programming language
- Python is the language you'll use because it's readable, powerful, and central to AI
- Running code means telling the interpreter to execute your instructions
- You read code line by line, top to bottom
- AI tools help you write code, but you need to understand what they produce

Next, you'll start writing real Python — with AI at your side — and build things that actually run.

:::build-challenge

### Explore: Read and Modify AI-Generated Code

Use what you learned to analyze and change a piece of code:

1. Open Cursor and create a new file called `explore.py`
2. Open the AI chat (`Cmd+L` / `Ctrl+L`) and ask: **"Write a simple 5-line Python script that does something interesting with numbers. Add a comment on each line explaining what it does."**
3. **Read every line and every comment.** Make sure you can follow the logic from top to bottom.
4. Now for the challenge: **pick one line and change it.** Before you run the code, **predict** what the change will do. Write your prediction down (in a comment in the file or on paper).
5. Run the script in the terminal (`python explore.py` or `python3 explore.py`). Was your prediction correct?
6. If your prediction was wrong, ask the AI: "I changed line X to Y and expected Z, but got W. Why?"

This loop — read, predict, test, understand — is the core of learning to program. Every professional developer does it. You're already practicing it.
:::
