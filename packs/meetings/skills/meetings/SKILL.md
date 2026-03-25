---
name: meetings
description: Meeting intelligence — live capture, structured extraction, action item tracking, and daily standup review.
version: 1.0.0
---

# Meetings Skill

**Auto-loads when**: User mentions meeting, standup, action items, meeting prep, or "end meeting".

## Workflows

### Meeting Prep
- "Prep me for [meeting name]"
- "What should I cover in my 1:1 with [person]?"
-> **Workflow**: workflows/meeting-prep.md

### Meeting Start
- "Start meeting: [title]" / "Meeting with [names]"
-> **Workflow**: workflows/meeting-start.md

### Meeting End
- "End meeting" / "Meeting notes"
-> **Workflow**: workflows/meeting-end.md

### Standup Review
- "Standup" / "What's on my plate?"
-> **Workflow**: workflows/standup.md

## Data Files (gitignored — create in data/)

| File | Purpose |
|------|---------|
| `data/meetings.jsonl` | One JSON record per meeting (date, title, attendees, summary, decisions) |
| `data/action-items.jsonl` | One JSON record per action item (owner, due, status, source meeting) |
| `inbox/` | Raw meeting notes (dropped in during meetings) |
| `series/` | Living docs for recurring meetings (1:1s, standups) |

## Rules
- Always present a summary for review before writing to files
- Action items must have: owner, due date, and source meeting
- Flag overdue items in every standup
- Never lose a decision or commitment — extract everything
