# Virtual Environments and Dependencies

You have written Python scripts, installed a few packages, and things are working. Then one day you install a new library for a project and suddenly a different project breaks. The package you just updated is incompatible with something you installed last month. Welcome to dependency hell.

Virtual environments solve this problem completely, and learning to use them now will save you countless hours of frustration as your projects grow more complex.

## Why Virtual Environments Matter

:::definition[Virtual Environment]
An isolated Python installation that has its own set of packages, independent from every other project on your machine. Each project gets its own sandbox where you can install whatever you need without affecting anything else.
:::

Without virtual environments, every `pip install` goes into one shared location. That means:

- Project A needs `openai==1.0` but Project B needs `openai==2.0` — impossible to satisfy both
- You upgrade a library for one project and break three others
- You have no idea which packages are actually needed for a specific project
- Sharing your project with someone else becomes a guessing game

With virtual environments, each project gets its own isolated set of packages. Project A can have `openai==1.0` and Project B can have `openai==2.0`, running side by side with zero conflicts.

:::callout[info]
Every professional Python developer uses virtual environments. Every serious open-source project assumes you will create one. This is not optional knowledge — it is a prerequisite for real-world Python development.
:::

## Creating Your First Virtual Environment

Python ships with a built-in tool called `venv` for creating virtual environments. No extra installation needed.

```bash
# Navigate to your project folder
cd my-ai-project

# Create a virtual environment named '.venv'
python -m venv .venv
```

That command creates a `.venv` directory inside your project containing a fresh Python installation. The name `.venv` is a convention — the leading dot keeps it hidden in file browsers, and the name makes its purpose obvious.

:::callout[tip]
Always name your virtual environment `.venv` and put it inside your project directory. This is the standard convention, and tools like VS Code and Cursor will automatically detect it.
:::

## Activating and Deactivating

Creating the environment does not start using it. You need to activate it first:

```bash
# macOS / Linux
source .venv/bin/activate

# Windows (Command Prompt)
.venv\Scripts\activate

# Windows (PowerShell)
.venv\Scripts\Activate.ps1
```

When activated, you will see `(.venv)` at the beginning of your terminal prompt. This tells you that any `python` or `pip` commands will use the isolated environment, not your system Python.

```bash
(.venv) $ python --version
Python 3.11.5

(.venv) $ which python    # macOS/Linux
/Users/you/my-ai-project/.venv/bin/python
```

To deactivate and return to your system Python:

```bash
(.venv) $ deactivate
$   # Back to normal — no more (.venv) prefix
```

## Installing Packages with pip

With your environment activated, `pip install` puts packages only in this environment:

```bash
(.venv) $ pip install requests openai anthropic
```

You can verify what is installed:

```bash
(.venv) $ pip list
Package    Version
---------- -------
anthropic  0.42.0
openai     1.58.0
requests   2.31.0
...
```

And you can install a specific version when you need it:

```bash
(.venv) $ pip install openai==1.58.0
```

## requirements.txt: Sharing Your Dependencies

When someone else wants to run your project (or you want to set it up on a new machine), they need the same packages. The `requirements.txt` file captures exactly what is installed:

```bash
# Generate requirements.txt from your current environment
(.venv) $ pip freeze > requirements.txt
```

This creates a file listing every package and its exact version:

```
anthropic==0.42.0
openai==1.58.0
requests==2.31.0
certifi==2024.2.2
...
```

Someone else can then recreate your exact environment:

```bash
# Create a fresh environment and install everything
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

:::callout[tip]
Commit `requirements.txt` to your Git repository but never commit the `.venv` directory itself. Add `.venv/` to your `.gitignore` file. The requirements file is small and portable; the environment directory is large and platform-specific.
:::

## venv vs. conda: Which to Use?

You will encounter two main approaches to environment management:

**venv + pip** (what we just covered):
- Built into Python — no extra installation
- Lightweight and fast
- Standard across the Python ecosystem
- Best for most AI and web development projects

**conda** (from Anaconda/Miniconda):
- Manages Python itself, not just packages
- Handles non-Python dependencies (C libraries, CUDA, etc.)
- Popular in data science and scientific computing
- Heavier installation, slower environment creation

For the projects in this curriculum, `venv` is the right choice. It is simpler, faster, and does everything you need. If you later work on projects requiring specific CUDA versions or complex scientific computing dependencies, conda becomes more useful.

## The Standard Project Setup Workflow

Here is the workflow you should follow every time you start a new project:

```bash
# 1. Create project directory
mkdir my-new-project
cd my-new-project

# 2. Initialize git
git init

# 3. Create virtual environment
python -m venv .venv

# 4. Activate it
source .venv/bin/activate  # macOS/Linux

# 5. Install your packages
pip install requests anthropic

# 6. Freeze dependencies
pip freeze > requirements.txt

# 7. Create .gitignore
echo ".venv/" >> .gitignore

# 8. Start coding
```

## Common Pitfalls and How to Avoid Them

**"ModuleNotFoundError" after installing a package**: You probably installed it in your system Python, not your virtual environment. Check for the `(.venv)` prefix in your terminal. Activate the environment and install again.

**Cursor or VS Code using the wrong Python**: Open the command palette (Cmd+Shift+P / Ctrl+Shift+P), search "Python: Select Interpreter," and choose the one inside `.venv`.

**"pip: command not found" on activation**: On some systems, you need to use `python -m pip` instead of bare `pip`. This always works regardless of how your system is configured.

**requirements.txt has too many packages**: `pip freeze` captures everything, including sub-dependencies. For cleaner requirements, consider listing only your direct dependencies manually and letting pip resolve the rest.

**Accidentally committing .venv to git**: If this happens, add `.venv/` to `.gitignore` and run `git rm -r --cached .venv` to remove it from tracking without deleting the directory.

## What You've Learned

You now have the skills to keep your Python projects clean and reproducible:

- **Virtual environments** isolate project dependencies so they never conflict
- **`python -m venv .venv`** creates an environment; `source .venv/bin/activate` starts using it
- **`pip install`** and **`pip freeze`** manage and record your packages
- **`requirements.txt`** lets anyone recreate your exact setup
- **`.gitignore`** should always exclude the `.venv` directory

From here on, every project you build in this curriculum should start with a virtual environment. It is a habit that separates hobbyists from professionals.
