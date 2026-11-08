# Playbook Style Guide

The six playbooks are short on purpose. An officer reads one between classes and acts on it the same week. If you're contributing, match this or don't ship it.

They're written by the founding chapter's team, from what it actually did. Keep them that way.

## The model they all teach

- **Two tracks run at once.** The pulse: a speaker or a workshop, about an hour, at least every two weeks. The depth: at least one hands-on project a semester (an Innovation Lab, a Research Group or a hackathon), kicked off in week 5.
- **The first three weeks decide the year.** A quiet start is what kills one.
- **New chapters start with a hackathon or an Innovation Lab.** Clubs that already run 40 to 100 members skip the founding steps.
- **Every job names the dashboard feature that does it**, by the name it has in the dashboard today.

## Shape

```
# Title

One sentence: what this playbook gets you.

Optional background: two to four sentences, or a small table.

## Start here

1. Key one, on one line.
2. Key two, on one line.
3. Key three, on one line.

## A chapter

**One or two bold sentences that say the chapter's point.**

A numbered checklist or a short table.

**In the dashboard:** the feature that does this job, by its real name.
```

- **Exactly three Start here keys**, each a single line. The dashboard shows them as three cards.
- **Three chapters** (Getting Started has four). Each opens with a bold lead of one or two sentences, under 260 characters.
- **Checklists and short tables beat prose.** Numbered lists with a bold opener are best: the dashboard lists the bold openers as a preview.
- **Name the dashboard feature for each job.** Most chapters close with an "In the dashboard" line; Sponsorship gathers its into one table. Use the names on screen: Events → New Event, the QR tile, Invite/Import Members, Request From the ALL Network, Sponsors → Requests, Compute → Find Compute, Funding → Money, the run sheet, Deliverables, Badges → New Certificate.
- **Length:** about 500 to 800 words. If it runs longer, cut the story, not the steps.

## Voice

- **First person plural** for the founding chapter's own experience ("we ran three"), plain instructions for everything else.
- **Roles, not names.** "The president", "a faculty member's endowed chair", "an alum in the company's engineering leadership". Never a third party's email, phone number, login, or a meeting's attendee list.
- **Real numbers only, scoped to where they're true.** A founding-chapter number says so. If you don't have the number, leave it out.
- **No em dashes.** No "verified", "proven", "celebration", "seamless" or "powerful". Never print a chapter count.
- **Don't confess for others.** Say what we'd do differently about our own work, never imply a partner or a sponsor mishandled anything.

## What the dashboard depends on

The dashboard's Getting Started reader parses these files live from all-ai-network.org. Its pictures are keyed to chapter headings and stand on phrases the files say. Changing either breaks the reader.

- **Keep every `##` heading.** Getting Started: Start here, Quick guide, Week 1, First semester, Year two (with its three "How we did it at MAIC" and three "The repeatable version" `###` headings). Speaker Series: Find a speaker, Run the event, Build the series. Innovation Labs: Pitch a sponsor, Run the lab, Showcase and handoff. Hackathons: Plan it, Run it, Wrap it. Research Groups: Form the group, Run experiments, Publish. Sponsorship: How we did it at MAIC (with "Where sponsors actually come from"), The repeatable version (with "The sequence" and "The first real meeting"), What we'd do differently. Innovation Labs and Sponsorship also need background text before Start here.
- **Keep the week-by-week table in Getting Started word for word.** The dashboard's semester map is drawn from it.
- **Before you push**, run the dashboard's own check against your copy. From a network-api checkout, with each file copied to `<dir>/<slug>.md`: `PLAYBOOK_DIR=<dir> node scripts/test-learn.cjs`. It names any phrase a picture still needs.
- **Update `site/ts/playbook-metadata.ts`** when a key, a heading or the length changes. `npm run validate` checks that the keys, anchors and reading times still match, that the week table is unchanged, and that every phrase the dashboard's pictures stand on is still there (a copy of the dashboard's list, in `scripts/validate-playbooks.ts`).

## Linking

Cross-links between playbooks are absolute, `https://all-ai-network.org/playbook.html?path=playbooks/<slug>/index.md`, so they also work inside the dashboard. Links within a playbook use the heading's anchor, like `#quick-guide`.
