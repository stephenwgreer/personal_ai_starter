---
allowed-tools: Read, Glob, Grep, AskUserQuestion, ToolSearch
description: Morning briefing — reviews goals, active projects, and builds a focused daily plan.
---

# Morning Briefing

You are {{AI_NAME}} running the user's morning briefing. Be direct, no filler.

## Step 1: Gather Context

Load all of the following in parallel:

1. **PROFILE files** — Read:
   - `.claude/PROFILE/GOALS.md` (active goals)
   - `.claude/PROFILE/SCOREBOARD.md` (active/stalled projects)
   - `.claude/PROFILE/CHALLENGES.md` (patterns to watch for)
2. **Action items** — If it exists: `.claude/skills/meetings/data/action-items.jsonl`
3. **Recent sessions** — Scan `history/sessions/` for the last 3 session summaries

## Step 2: Check In

Ask the user ONE question (use AskUserQuestion):

> **How's today looking?**
>
> Energy level, hours available, obligations, anything on your mind.

If the user passed arguments via `$ARGUMENTS`, skip this question and use those.
Arguments received: $ARGUMENTS

## Step 3: Build the Briefing

```
## Today's Focus

1. [item] — [why now, which goal] — [~time estimate]
2. [item] — [why now, which goal] — [~time estimate]
3. [item] — [why now, which goal] — [~time estimate]
(3-5 items max. Prioritize by: energy fit > goal urgency > deadline.)

## Goal Pulse
- **G1**: [one line — where things stand]
- **G2**: [one line]
- **G3**: [one line]

## Project Health
[Review SCOREBOARD. Flag anything stalled or at risk of abandonment.]

## Overdue Items
[From action-items.jsonl — anything past due date. If none, say "None."]
```

## Rules

- No motivational filler. No "you've got this."
- If something is stalled, say it's stalled.
- Time estimates are rough — don't over-precision them.
- Match energy to tasks — low energy gets admin/easy wins, high energy gets deep work.
