# Meeting End Workflow

## Trigger
User says "end meeting" or "meeting notes".

## Steps

1. **Gather raw input**: Collect all notes from the conversation since meeting-start.
2. **Extract structure**:
   - Summary (2-3 sentences)
   - Decisions made (bulleted)
   - Action items (owner, due date, description)
   - Open questions / parking lot
3. **Present for review**: Show the structured summary to the user BEFORE writing to files.
4. **On approval**:
   - Append meeting record to `data/meetings.jsonl`
   - Append action items to `data/action-items.jsonl`
   - Update `series/[slug].md` if recurring meeting
5. **Confirm**: Show what was saved.

## Rules
- Always get user approval before writing
- Every action item needs an owner and due date (ask if missing)
- If the meeting had decisions, make them explicit — don't bury them in notes
