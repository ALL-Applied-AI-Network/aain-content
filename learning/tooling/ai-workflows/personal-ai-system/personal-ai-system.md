# Building a Personal AI System

Most people use AI like a chatbot — ask a question, get an answer, start over next time. That's useful, but it leaves enormous value on the table.

The real power comes when you build a **persistent AI system** that knows your context, remembers your preferences, and compounds in value the longer you use it.

## Beyond the Chat Window

The problem with chatbot-style AI is that every conversation starts from zero. You explain the same context, re-state the same preferences, and re-describe the same projects every time you open a new session.

A personal AI system solves this by giving your AI tools a persistent layer of context — files, documents, and structured data that the AI reads every time it helps you.

## The Core Architecture

A personal AI system is built on files you control:

1. **User profile** — Who you are, what you're working on, your preferences and communication style
2. **Project files** — Context about your active projects, decisions made, open questions
3. **Relationship files** — Notes on people you work with, collaboration context
4. **Artifacts** — Outputs you've generated that inform future work
5. **Skill files** — Templates and patterns for tasks you do repeatedly

All of this lives in markdown files under version control (Git). You own the data. You can switch between AI tools without losing context. And the system gets better the more you use it.

## Why This Matters for Students

If you're working on projects in this network, a personal AI system means:

- Your AI assistant knows your project history across semesters
- It can help you write better project proposals because it knows what you've already built
- It remembers your coding style and preferred tools
- It can help you prepare for sponsor conversations with context about past interactions

:::callout[info]
The Applied AI Society calls this concept the "Personal Agentic OS" — see their full framework in the resources attached to this node.
:::

## Getting Started

The simplest version is a folder structure:

```
my-ai-context/
├── me.md                    # Your profile, skills, goals
├── projects/
│   ├── innovation-labs.md   # Current project context
│   └── capstone.md          # Another project
├── templates/
│   ├── project-proposal.md  # Reusable templates
│   └── weekly-update.md
└── notes/
    └── sponsor-meeting.md   # Meeting context
```

Point your AI tools at this folder (Claude Code's `CLAUDE.md`, Cursor's `.cursorrules`, etc.) and every interaction starts with full context.

## Going Deeper

The resources attached to this node include the full "Personal Agentic OS" framework and a hands-on workshop for building your own. Start simple — even a single `me.md` file that your AI reads is a massive upgrade over starting from scratch every time.
