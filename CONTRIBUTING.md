# Contributing to ALL Applied AI Network Content

Thank you for helping build the open-source curriculum that powers the ALL Applied AI Network. Every contribution — whether it's a typo fix, a new article, or an entire workshop — reaches students at every hub in the network.

## Before You Start

- Read the **[Style Guide](STYLE_GUIDE.md)** for formatting standards, markdown components, and tone guidelines
- Browse existing content to get a feel for structure and quality expectations
- Check [open issues](https://github.com/ALL-Applied-AI-Network/aain-content/issues) for content that's been requested

## What You Can Contribute

| Type | Where it goes | How to start |
|---|---|---|
| **Learning tree article** | `learning/{layer}/{topic}/` | Create a directory with `node.yaml` + markdown + thumbnail |
| **Workshop** | `workshops/{name}/` | Create a directory with `metadata.yaml` + `workshop.md` |
| **Playbook** | `playbooks/{category}/` | Add a markdown file to an existing category or propose a new one |
| **Template** | `templates/` | Add a markdown template (sponsor proposals, reports, etc.) |
| **Bug fix / typo** | Anywhere | Open a PR directly |
| **New curriculum track** | `learning/series/` | Propose a `.yaml` series definition |

## Adding a Learning Tree Node

Every article in the learning tree needs a `node.yaml` file alongside its content:

```
learning/intermediate/applied-ai/my-new-topic/
├── node.yaml              # Required: metadata + graph connections
├── my-new-topic.md        # Required: the article content
└── thumbnail.png          # Required: 400x300px, used in tree visualization
```

### node.yaml template

```yaml
id: "intermediate/applied-ai/my-new-topic"
title: "My New Topic"
description: "A clear, one-sentence description of what the student will learn"
layer: 2
difficulty: intermediate       # beginner | intermediate | advanced
estimated_minutes: 45
thumbnail: "thumbnail.png"
tags: ["relevant", "tags"]

prerequisites:
  - "intermediate/applied-ai/some-prerequisite"
unlocks:
  - "intermediate/applied-ai/some-next-topic"

content_file: "my-new-topic.md"
notebook_file: null            # optional: Jupyter notebook
author: "Your Name"
last_updated: "2026-01-01"
```

**Important:** Only define `prerequisites` — the build system automatically verifies bidirectional consistency with `unlocks` on referenced nodes.

## Development Workflow

### 1. Fork and branch

```bash
git clone https://github.com/YOUR-USERNAME/aain-content.git
cd aain-content
git checkout -b add/my-new-topic
```

### 2. Write your content

Follow the [Style Guide](STYLE_GUIDE.md) for formatting. Use AI IDEs like Cursor or Claude Code — we encourage it and the style guide is written to work well with AI-assisted authoring.

### 3. Validate locally

```bash
npm install
npm run validate           # Checks content structure + tree integrity
npm run build              # Generates manifest.json + tree.json
```

Validation checks:
- All `node.yaml` files parse correctly
- No orphan nodes (every node is reachable)
- No cycles in the graph
- All prerequisite references resolve
- All referenced content files exist
- Thumbnails present and correctly sized

### 4. Open a pull request

```bash
git add .
git commit -m "add: my new topic article"
git push origin add/my-new-topic
```

Open a PR against `main`. CI will run validation automatically. A maintainer will review for content quality, accuracy, and style guide compliance.

## Content Quality Standards

- **Expert-quality writing.** Clear, precise, no filler. If a sentence doesn't teach something, cut it.
- **Applied focus.** Every concept should connect to something the student can build or use. Theory for theory's sake belongs in Layer 4–5, and even there it should feel practical.
- **Build challenges.** Every article should end with a hands-on challenge (use the `:::build-challenge` component).
- **Code that works.** All code examples must be runnable. Test them before submitting.
- **Proper attribution.** Cite sources. Link to original papers or documentation where relevant.

## Code of Conduct

Be respectful, constructive, and inclusive. We're building this for students of all backgrounds and experience levels. Content should be welcoming to someone who has never written a line of code.

## Questions?

- Open a [discussion](https://github.com/ALL-Applied-AI-Network/aain-content/discussions)
- Join our [Discord](https://discord.gg/all-applied-ai)
- Email: contribute@all-ai-network.org

---

<sub>&copy; 2026 ALL Applied AI Network LLC. By contributing, you agree that your contributions will be licensed under the repo's existing licenses (CC BY-NC-SA 4.0 for content, MIT for code).</sub>
