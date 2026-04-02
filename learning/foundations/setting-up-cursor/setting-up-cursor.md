# Setting Up Cursor: Your AI-Powered Workspace

Before you write a single line of code, you need a place to write it. In this article, you'll install Cursor — an AI-native code editor that lets you build software with an AI assistant built right in. By the end, you'll have your workspace ready to go.

## What Is an IDE?

:::definition[IDE (Integrated Development Environment)]
A software application that provides a complete workspace for writing, editing, running, and debugging code. Think of it as a workshop — it has all the tools you need in one place, organized so you can work efficiently.
:::

You could technically write code in Notepad or TextEdit, the same way you could build furniture with just a handsaw. But an IDE gives you power tools: syntax highlighting that color-codes your code so it's easier to read, a file explorer to manage your project, a built-in terminal to run commands, and — in Cursor's case — an AI assistant that can write and explain code alongside you.

:::callout[info]
Cursor is built on top of VS Code, the most popular code editor in the world. Everything you learn about Cursor's interface applies to VS Code too. The difference is that Cursor adds deep AI integration — chat, inline code generation, and an AI-aware composer — that makes it the ideal tool for learning to build with AI.
:::

## Why Cursor?

There are many code editors out there. We chose Cursor for this curriculum because:

- **AI is built in, not bolted on.** The AI features aren't an extension you install — they're core to how the editor works.
- **You start building with AI from day one.** Instead of spending weeks learning syntax before you can do anything interesting, you'll talk to the AI and build things immediately.
- **It's free to start.** Cursor has a free tier that includes AI features — enough to complete this entire curriculum.
- **It's real software.** Professional developers use Cursor daily. You're not learning on a toy — you're learning on the same tool used in production.

## Download and Install Cursor

:::tabs

### macOS

1. Open your browser and go to [cursor.com](https://cursor.com)
2. Click the **Download** button — it should automatically detect that you're on macOS
3. Open the downloaded `.dmg` file
4. Drag the **Cursor** icon into your **Applications** folder
5. Open Cursor from your Applications folder (or use Spotlight: press `Cmd + Space`, type "Cursor", press Enter)
6. If macOS asks whether you trust the application, click **Open**

:::callout[tip]
On first launch, macOS might block Cursor because it was downloaded from the internet. If you see a warning, go to **System Settings > Privacy & Security** and click **Open Anyway**.
:::

### Windows

1. Open your browser and go to [cursor.com](https://cursor.com)
2. Click the **Download** button — it should automatically detect that you're on Windows
3. Run the downloaded `.exe` installer
4. Follow the installation wizard — the default settings are fine
5. When installation completes, check the box to **Launch Cursor** and click **Finish**
6. Cursor should open automatically. If not, find it in your Start menu

:::callout[tip]
During installation, you may see an option to "Add to PATH." Make sure this is checked — it lets you open Cursor from the command line later, which is useful.
:::

### Linux

1. Open your browser and go to [cursor.com](https://cursor.com)
2. Click the **Download** button and select the Linux option (`.AppImage` or `.deb` depending on your distribution)
3. **For .AppImage:**
   - Open a terminal and navigate to your Downloads folder
   - Make the file executable: `chmod +x cursor-*.AppImage`
   - Run it: `./cursor-*.AppImage`
4. **For .deb (Ubuntu/Debian):**
   - Open a terminal and navigate to your Downloads folder
   - Install with: `sudo dpkg -i cursor-*.deb`
   - If there are dependency issues: `sudo apt-get install -f`
   - Launch Cursor from your application menu or by typing `cursor` in the terminal

:::callout[info]
On some Linux distributions, you may need to install additional dependencies. If Cursor fails to launch, check the Cursor documentation for your specific distribution.
:::

:::

## First Launch: Initial Setup

When you open Cursor for the first time, it walks you through a quick setup. Here's what to expect:

### 1. Sign In or Create an Account

Cursor will ask you to sign in. You can create a free account using your email or sign in with Google or GitHub. The free tier gives you access to the AI features you need for this curriculum.

:::callout[warning]
You need an account to use Cursor's AI features. Without signing in, the editor still works for writing code, but the AI chat, inline generation, and composer won't be available — and those are the features that make Cursor special.
:::

### 2. Pick a Theme

Cursor will ask you to choose a color theme. This is purely cosmetic — pick whatever looks good to you. You can always change it later.

:::details[How to change your theme later]
Open the Command Palette with `Cmd+Shift+P` (macOS) or `Ctrl+Shift+P` (Windows/Linux), type "Color Theme", and press Enter. You'll see a list of all available themes. Use the arrow keys to preview each one and press Enter to select.
:::

Popular choices:
- **Dark+ (default)** — easy on the eyes for long sessions
- **One Dark Pro** — a community favorite with good contrast
- **Light themes** — if you prefer coding in a bright environment, that's completely valid

### 3. Choose Your Settings

Cursor may ask about importing settings from VS Code (if you have it installed) or configuring default behavior. If you've never used a code editor before, just accept the defaults. They're sensible and you can customize everything later.

## Verify It's Working

Let's make sure everything is installed correctly with a simple test.

1. **Open Cursor** if it's not already open
2. You should see the **Welcome** tab in the main area
3. Look for the **sidebar** on the left — it has icons for file explorer, search, extensions, and more
4. Look for the **AI chat panel** — you can open it with `Cmd+L` (macOS) or `Ctrl+L` (Windows/Linux)

If you see all of these elements, Cursor is installed and ready. If something looks wrong or didn't load, try quitting and reopening the application.

:::callout[tip]
Take a moment to just look around. Click on different sidebar icons. Open menus. You don't need to understand everything right now — you just need to know the application is working. The next article walks you through every part of the interface in detail.
:::

## What You've Accomplished

You now have a professional AI-powered development environment installed on your machine. This is the same class of tool that professional software engineers use every day. You're not starting with a watered-down "beginner" version — you're starting with the real thing.

In the next articles, you'll learn to navigate this environment and have your first conversation with the AI built into it. The workspace is ready. Time to use it.

:::build-challenge

### Setup Check: Create Your First File

Let's make sure everything works by creating a simple file:

1. Open Cursor
2. Go to **File > New File** (or press `Cmd+N` on macOS / `Ctrl+N` on Windows/Linux)
3. Type the following text into the file:

```
Hello! My name is [your name] and I just set up Cursor.
Today's date is [today's date].
I'm starting my journey to become an applied AI engineer.
```

4. Save the file: press `Cmd+S` (macOS) or `Ctrl+S` (Windows/Linux)
5. When the save dialog appears, name the file `hello.txt` and save it somewhere you'll remember (like your Desktop or Documents folder)
6. Close the file and reopen it (**File > Open File**) to verify it saved correctly

If you can create, save, and reopen a file, your setup is complete. You're ready for the next step.

**Bonus:** Try opening the AI chat panel (`Cmd+L` or `Ctrl+L`) and type "What can you help me with?" to get a preview of what's coming.
:::
