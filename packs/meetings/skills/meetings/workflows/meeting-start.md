# Meeting Start Workflow

## Trigger
User says "start meeting" with a title and/or attendee names.

## Steps

1. **Parse input**: Extract meeting title and attendees from the user's message.
2. **Create inbox file**: `inbox/YYYY-MM-DD-[slug].md` with frontmatter (date, title, attendees).
3. **Load context**: Pull open action items for these attendees.
4. **Ready**: Tell the user the meeting is live. They can paste notes, bullet points, or transcripts into the conversation.

## Notes
- Keep friction low — this should take under 5 seconds
- The user will dump raw notes during the meeting; structure comes at meeting-end
