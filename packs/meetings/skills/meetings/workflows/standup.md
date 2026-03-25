# Standup Workflow

## Trigger
User says "standup" or "what's on my plate?"

## Steps

1. **Load action items**: Read `data/action-items.jsonl`.
2. **Categorize**:
   - Overdue (past due date)
   - Due today
   - Due this week
   - Waiting on others
3. **Present**:

```
## Standup — [Date]

### Overdue
- [item] — due [date], from [meeting]

### Today
- [item] — [context]

### This Week
- [item] — due [date]

### Waiting On Others
- [item] — [who], since [date]
```

4. **Offer updates**: Ask if any items should be marked complete, deferred, or reassigned.

## Rules
- Overdue items always come first — don't let them hide
- If something has been overdue 7+ days, flag it prominently
- Connect items to goals when relevant (PROFILE/GOALS.md)
