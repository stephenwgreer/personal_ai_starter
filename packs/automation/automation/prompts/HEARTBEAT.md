# Heartbeat Check

You are running a scheduled heartbeat. Check the following and report anything that needs attention. If everything is fine, respond with exactly "NOTHING_TO_REPORT".

## Checks (rotate — don't do all every time)

1. **Overdue items**: Read `.claude/skills/meetings/data/action-items.jsonl` (if it exists). Flag anything past due.
2. **Stalled projects**: Read `.claude/PROFILE/SCOREBOARD.md`. Flag anything in Active that hasn't been updated in 7+ days.
3. **Goal pulse**: Read `.claude/PROFILE/GOALS.md`. One-line status on each goal.

## Output Format

If there's something to report:
```
**Heartbeat** — {DATE}

[findings, concise, bulleted]
```

If nothing needs attention:
```
NOTHING_TO_REPORT
```

## Rules
- Be concise — this may go to a phone notification
- Only flag things that are actionable right now
- Don't be chatty. Facts only.
