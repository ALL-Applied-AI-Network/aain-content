# Files, Folders, and the Terminal

Every program you build lives somewhere on your computer — in files, organized into folders. Before you can run code, manage projects, or install packages, you need to understand how your computer organizes things and how to navigate that structure from the command line. This article gives you that foundation.

:::callout[info]
You don't need to know Python for this article. If you're working through Layer 1 in a different order, this one only requires the Layer 0 prerequisite "What is Programming."
:::

## The Filesystem

Your computer's filesystem is a tree. At the very top is the **root** — on macOS/Linux that's `/`, on Windows it's `C:\`. Everything else branches down from there.

:::definition[Filesystem]
The filesystem is how your operating system organizes data on disk. It's a hierarchy of folders (also called directories) containing files. Every file has a unique path that describes exactly where it lives.
:::

Here's a simplified view of what a typical project looks like:

```
home/
  yourname/
    Documents/
      projects/
        movie-recommender/
          main.py
          movies.json
          README.md
```

Every file has an **address** called a path. There are two kinds.

:::definition[Absolute Path]
An absolute path starts from the root and describes the full location. It works from anywhere on your system. Example: `/home/yourname/Documents/projects/movie-recommender/main.py`
:::

:::definition[Relative Path]
A relative path describes a location starting from where you currently are. If you're already inside `projects/`, the relative path to your script is just `movie-recommender/main.py`.
:::

Two special shortcuts show up constantly:

- `.` means "the current directory"
- `..` means "the parent directory" (one level up)

So if you're inside `movie-recommender/`, then `../` takes you back to `projects/`.

## The Terminal

The terminal (also called the command line, shell, or console) is a text-based interface to your computer. Instead of clicking through folders in Finder or File Explorer, you type commands.

:::definition[Terminal]
A text-based interface where you type commands to interact with your computer. It's faster and more powerful than clicking through menus — and it's essential for programming, because many tools only work from the command line.
:::

:::callout[tip]
You already have a terminal built into Cursor. Press Ctrl+` (backtick, the key above Tab) to toggle it open. You can also use your system's terminal app — Terminal on macOS, Windows Terminal or PowerShell on Windows.
:::

Why bother with the terminal when you have a perfectly good file explorer? Three reasons:

1. **Speed.** Renaming 100 files takes one command, not 100 clicks.
2. **Power.** Many developer tools (Git, pip, Python) are command-line tools.
3. **Automation.** You can write scripts that chain commands together.

## Essential Commands

Here are the commands you'll use every day. They're short, and they'll become muscle memory fast.

### Where am I?

:::tabs
---tab macOS / Linux
```bash
pwd
```
Stands for "print working directory." Shows your current location as an absolute path.
---tab Windows
```powershell
cd
```
Without any arguments, `cd` on Windows prints your current directory.
:::

### What's in here?

:::tabs
---tab macOS / Linux
```bash
ls
```
Lists files and folders in the current directory. Add `-la` for a detailed view with hidden files: `ls -la`.
---tab Windows
```powershell
dir
```
Lists files and folders in the current directory. Similar to `ls` on macOS/Linux.
:::

### Move to a different folder

:::tabs
---tab macOS / Linux
```bash
cd Documents/projects
```
Changes your current directory. Use `cd ..` to go up one level. Use `cd ~` to jump to your home directory.
---tab Windows
```powershell
cd Documents\projects
```
Same concept, but Windows uses backslashes `\` instead of forward slashes `/`. Use `cd ..` to go up one level.
:::

### Create a folder

:::tabs
---tab macOS / Linux
```bash
mkdir my-new-project
```
Creates a new directory. Add `-p` to create nested folders in one shot: `mkdir -p projects/ai-app/src`.
---tab Windows
```powershell
mkdir my-new-project
```
Same command on Windows. It also creates nested folders automatically.
:::

### Create or view a file

:::tabs
---tab macOS / Linux
```bash
touch hello.py          # Creates an empty file
cat hello.py            # Displays the file's contents
```
---tab Windows
```powershell
New-Item hello.py       # Creates an empty file
type hello.py           # Displays the file's contents
```
:::

### Copy, move, and delete

:::tabs
---tab macOS / Linux
```bash
cp hello.py backup.py          # Copy a file
mv hello.py src/hello.py       # Move a file (also used to rename)
rm hello.py                    # Delete a file (no undo!)
rm -r old-folder               # Delete a folder and everything in it
```
---tab Windows
```powershell
copy hello.py backup.py        # Copy a file
move hello.py src\hello.py     # Move a file
del hello.py                   # Delete a file
rmdir /s old-folder            # Delete a folder and everything in it
```
:::

:::callout[warning]
`rm` and `del` are permanent. There's no trash can, no undo. Double-check before you delete. A good habit: use `ls` (or `dir`) first to see what you're about to remove.
:::

## Running Python from the Terminal

This is why you learned the terminal — to run your code. If you have a file called `main.py`, you run it like this:

:::tabs
---tab macOS / Linux
```bash
python3 main.py
```
On macOS/Linux, use `python3` specifically. Just `python` may point to an older version or not exist at all.
---tab Windows
```powershell
python main.py
```
On Windows, `python` usually works after installing Python from python.org or through the Microsoft Store.
:::

You need to be in the same directory as the file, or provide the full path:

```bash
python3 /home/yourname/Documents/projects/main.py
```

:::callout[tip]
In Cursor, the built-in terminal automatically opens in your project's root folder. This means you can just type `python3 main.py` without navigating anywhere. It's one of the reasons an AI IDE is so convenient.
:::

## Environment Variables

:::definition[Environment Variable]
A named value stored in your system's environment that programs can read. They're commonly used for configuration — like API keys, file paths, or mode settings — without hardcoding those values in your source code.
:::

You'll encounter environment variables soon when you start working with AI APIs. For now, here's the key idea: instead of putting a secret API key directly in your code (dangerous — anyone who sees your code sees the key), you store it as an environment variable.

:::tabs
---tab macOS / Linux
```bash
# Set a variable for the current terminal session
export MY_API_KEY="sk-abc123"

# View it
echo $MY_API_KEY
```
---tab Windows
```powershell
# Set a variable for the current terminal session
$env:MY_API_KEY = "sk-abc123"

# View it
echo $env:MY_API_KEY
```
:::

These only last for the current terminal session. When you close the terminal, they disappear. There are ways to make them permanent, but you'll learn those when you actually need them for API keys in a later article.

## Cursor's Terminal vs. System Terminal

Cursor has a built-in terminal (Ctrl+`). It's the same as your system terminal — it runs the same commands, has the same capabilities. The advantage is that it's right there in your editor, already pointed at your project folder.

When should you use the system terminal instead?

- When you want multiple terminals side by side (Cursor supports split terminals too, but some people prefer separate windows)
- When you're running a long process and want to keep coding without the terminal taking up editor space
- When Cursor is closed and you need to run a quick command

For everything in this curriculum, the Cursor terminal is all you need.

## Quick Reference

Here's a cheat sheet you'll want to bookmark:

| Task | macOS/Linux | Windows |
|---|---|---|
| Where am I? | `pwd` | `cd` |
| List files | `ls` | `dir` |
| Change directory | `cd folder` | `cd folder` |
| Go up one level | `cd ..` | `cd ..` |
| Create folder | `mkdir name` | `mkdir name` |
| Create file | `touch file.py` | `New-Item file.py` |
| View file | `cat file.py` | `type file.py` |
| Copy | `cp src dest` | `copy src dest` |
| Move/rename | `mv src dest` | `move src dest` |
| Delete file | `rm file` | `del file` |
| Run Python | `python3 file.py` | `python file.py` |
| Set env variable | `export KEY="val"` | `$env:KEY = "val"` |

:::build-challenge
### Terminal-Only Project Setup

Complete this entire challenge using **only the terminal** — no Finder, no File Explorer, no clicking. Use Cursor's built-in terminal or your system terminal.

1. Navigate to your Documents folder (or wherever you keep projects)
2. Create a project folder called `terminal-practice`
3. Inside it, create three subfolders: `src`, `data`, and `tests`
4. Navigate into the `src` folder
5. Create a file called `hello.py`
6. Write `print("Hello from the terminal!")` into the file using this command:

:::tabs
---tab macOS / Linux
```bash
echo 'print("Hello from the terminal!")' > hello.py
```
---tab Windows
```powershell
echo print("Hello from the terminal!") > hello.py
```
:::

7. Run the Python file from the terminal and confirm you see the output
8. Navigate back to the `terminal-practice` folder and list all its contents to verify your structure

**Stretch goal:** Create a second Python file in `src/` that prints the current date and time (ask AI how to use Python's `datetime` module), then run it from the `terminal-practice` folder using a relative path: `python3 src/date_check.py`.
:::
