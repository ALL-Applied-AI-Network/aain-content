# ALL Applied AI Network — Content

<p align="center">
  <img src="brand/logos/all-aain-banner.png" alt="ALL Applied AI Network" width="600" />
</p>

<p align="center">
  <strong>Open-source applied AI curriculum — from zero to shipping AI products.</strong>
</p>

<p align="center">
  <a href="https://github.com/all-aain/content/actions/workflows/validate.yml"><img src="https://img.shields.io/github/actions/workflow/status/all-aain/content/validate.yml?label=content%20validation&style=flat-square" alt="Validation" /></a>
  <a href="https://github.com/all-aain/content/actions/workflows/deploy.yml"><img src="https://img.shields.io/github/actions/workflow/status/all-aain/content/deploy.yml?label=cdn%20deploy&style=flat-square" alt="Deploy" /></a>
  <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/"><img src="https://img.shields.io/badge/content-CC%20BY--NC--SA%204.0-blue?style=flat-square" alt="Content License" /></a>
  <a href="LICENSE-CODE.md"><img src="https://img.shields.io/badge/code-MIT-green?style=flat-square" alt="Code License" /></a>
  <a href="https://cdn.all-aain.org"><img src="https://img.shields.io/badge/CDN-cdn.all--aain.org-purple?style=flat-square" alt="CDN" /></a>
</p>

<p align="center">
  <a href="https://all-aain.org">Website</a> ·
  <a href="https://all-aain.org/docs">Docs</a> ·
  <a href="#the-learning-tree">Learning Tree</a> ·
  <a href="#playbooks">Playbooks</a> ·
  <a href="#workshops">Workshops</a> ·
  <a href="STYLE_GUIDE.md">Style Guide</a> ·
  <a href="https://discord.gg/all-aain">Discord</a>
</p>

---

### Sponsors

<p align="center">
  <em>Sponsors fund the network so students learn for free.</em>
</p>

<table align="center">
  <tr>
    <td align="center"><strong>NVIDIA</strong></td>
    <td align="center"><strong>Direct Supply</strong></td>
    <td align="center"><strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</strong></td>
    <td align="center"><strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</strong></td>
  </tr>
  <tr>
    <td align="center"><a href="https://nvidia.com"><img src="brand/sponsors/nvidia.png" alt="NVIDIA" height="48" /></a></td>
    <td align="center"><a href="https://directsupply.com"><img src="brand/sponsors/direct-supply.png" alt="Direct Supply" height="48" /></a></td>
    <td align="center"><a href="https://all-aain.org/sponsors"><em>Your logo here</em></a></td>
    <td align="center"><a href="https://all-aain.org/sponsors"><em>Your logo here</em></a></td>
  </tr>
</table>

<p align="center">
  <a href="https://all-aain.org/sponsors"><strong>Become a sponsor &rarr;</strong></a>
</p>

---

This is the shared content backbone for the **[ALL Applied AI Network](https://all-aain.org)** — a chapter-based organization connecting universities, student hubs, and industry sponsors into one ecosystem.

Every article, tutorial, playbook, and workshop here is deployed to a CDN. When we update content, **every hub website across the network serves the new version instantly** — zero action from hub maintainers.

The curriculum is designed for the applied AI engineer, not the academic researcher. It starts at absolute zero — someone who has never written a line of code — and builds a path to shipping real AI products. Theory and research are there for students who want to go deep, but they're a branch, not the starting point.

> **Looking to start a hub?** This repo is the content. Head to [`all-aain/hub`](https://github.com/all-aain/hub) for the website template, CLI, and SDK.

## The Learning Tree

The learning tree is an interactive, interconnected graph of learning resources — not a flat list of tutorials. Each node has prerequisites, unlocks new topics, and tracks student progress. Hubs can extend it with their own local content.

### Curriculum Overview

```
Layer 0                Layer 1                 Layer 2                  Layer 3
I want to learn AI     I'm coding with AI      I'm building AI apps     I ship AI products
───────────────────    ───────────────────     ───────────────────      ──────────────────
What is AI             Python through AI       AI APIs & SDKs           Web apps + AI
Setting up Cursor      Files & terminal        Prompt engineering       Databases & pipelines
Navigating an IDE      Git basics              RAG                      Deployment & Docker
First AI conversation  Working with data       Agents & tool use        Monitoring & eval
What is programming    Build: first script     Build: AI agent          Build: production app
                                ╲
                                 ╲
                    Layer 4                          Layer 5
                    I understand the engine           I go deep
                    ───────────────────              ──────────────────
                    Neural networks                  Computer vision
                    How models learn                 NLP & transformers
                    Embeddings & vectors             Reinforcement learning
                    Fine-tuning & adapters           Generative models
                    Classical ML                     MLOps & infrastructure
```

**Layers 0–3** are the main trunk: the applied AI engineer path.
**Layers 4–5** are branches for research-oriented students who want to understand how models work under the hood.
**Tooling** is a parallel track (AI IDEs, Git, Jupyter, cloud compute) that students enter anytime.

### How it works

Every learning resource has a `node.yaml` colocated with its markdown content:

```yaml
# learning/foundations/setting-up-cursor/node.yaml
id: "foundations/setting-up-cursor"
title: "Setting Up Cursor: Your AI-Powered Workspace"
difficulty: beginner
layer: 0
estimated_minutes: 30
tags: ["setup", "cursor", "ide", "getting-started"]

prerequisites: []
unlocks:
  - "foundations/first-conversation-with-ai"
  - "foundations/navigating-an-ide"

content_file: "setting-up-cursor.md"
```

On every push, GitHub Actions validates the graph (no orphans, no cycles, all references resolve) and generates `tree.json` — the full graph structure that hub websites fetch and render as an interactive skill tree.

## Playbooks

Battle-tested operational guides for running a hub. Written from the experience of scaling MSOE's AI Club to 500+ active members.

| Playbook | What it covers |
|---|---|
| **[Getting Started](playbooks/getting-started/)** | University buy-in, finding sponsors, leadership structure, transition planning |
| **[Innovation Labs](playbooks/innovation-labs/)** | Sponsor onboarding, team formation, judging, prizes, post-event hiring pipeline |
| **[Speaker Series](playbooks/speaker-series/)** | Format guide, speaker outreach templates, promotion strategy |
| **[Hackathons](playbooks/hackathons/)** | Planning checklist, sponsor integration, logistics |
| **[Research Groups](playbooks/research-groups/)** | Topic selection, publication guide, cross-hub collaboration |

## Workshops

Hands-on, session-ready workshop content. Each includes a facilitator guide, student materials, and optional Jupyter notebooks.

**Applied AI workshops** — the new core:
- Build a Chatbot · RAG from Scratch · Build an Agent · Deploy Your First AI App · Prompt Engineering Lab

**Deep dives** — adapted from MAIC's proven curriculum:
- Deep Learning from Scratch · CNNs · Image Segmentation · Intro to LLMs · Q-Learning · Attention Is All You Need · Embeddings

## Using This Content

### For hub websites (automatic)

Hub websites built with [`all-aain/hub`](https://github.com/all-aain/hub) fetch content from the CDN automatically. No configuration needed.

```
https://cdn.all-aain.org/tree.json
https://cdn.all-aain.org/manifest.json
https://cdn.all-aain.org/learning/foundations/setting-up-cursor/setting-up-cursor.md
```

### For custom integrations

Fetch directly from the CDN:

```typescript
const tree = await fetch('https://cdn.all-aain.org/tree.json').then(r => r.json());
const article = await fetch('https://cdn.all-aain.org/learning/intermediate/applied-ai/rag-fundamentals/rag-fundamentals.md').then(r => r.text());
```

Or use the [`@all-aain/hub`](https://github.com/all-aain/hub) SDK for a typed client:

```typescript
import { ContentClient } from '@all-aain/hub';

const content = new ContentClient();
const tree = await content.getTree();
const article = await content.getArticle('intermediate/applied-ai/rag-fundamentals');
```

## Repository Structure

```
learning/
├── foundations/            Layer 0–1: beginner → coding with AI
├── intermediate/
│   ├── applied-ai/        Layer 2: AI APIs, prompting, RAG, agents (the core)
│   ├── production/        Layer 3: web apps, deployment, monitoring
│   └── data-skills/       Data handling and visualization
├── advanced/
│   ├── foundations-of-ml/  Layer 4: neural nets, training, embeddings, classical ML
│   ├── computer-vision/    Layer 5: specialization
│   ├── nlp/                Layer 5: specialization
│   ├── reinforcement-learning/
│   ├── generative-models/
│   └── mlops/
├── tooling/               Parallel track: AI IDEs, Git, Jupyter, cloud
└── series/                Track definitions (ordered paths through the graph)

playbooks/                 Operational guides for hub leaders
workshops/                 Session-ready hands-on content
templates/                 Sponsor proposals, university proposals, reports
brand/                     Logos, colors, co-branding guide
scripts/                   Build tools (generate-tree, validate, manifest)
```

---

<p align="center">
  <sub>&copy; 2026 ALL Applied AI Network LLC. All rights reserved.</sub><br />
  <sub>ALL Applied AI Network&trade; and the ALL logo are trademarks of ALL Applied AI Network LLC.</sub>
</p>
