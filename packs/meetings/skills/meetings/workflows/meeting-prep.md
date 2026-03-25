# Meeting Prep Workflow

## Trigger
User asks to prepare for a meeting.

## Steps

1. **Identify the meeting**: Get title, attendees, purpose.
2. **Load context**:
   - Check `data/meetings.jsonl` for past meetings with these attendees
   - Check `data/action-items.jsonl` for open items related to attendees
   - Check `series/[slug].md` if this is a recurring meeting
3. **Build prep doc**:
   - Open items from last meeting
   - Action items due or overdue
   - Suggested topics based on current goals (PROFILE/GOALS.md)
   - Questions to ask

## Output Format
```
## Prep: [Meeting Title]
**With**: [attendees]
**Last met**: [date, key topics]

### Open Items
- [item] — [status]

### Suggested Topics
1. [topic] — [why now]

### Questions to Ask
- [question]
```
