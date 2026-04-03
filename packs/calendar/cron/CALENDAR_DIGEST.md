# Calendar Digest

Read the calendar data and reminder state, then generate tiered alerts for important upcoming dates.

## Input Files

1. `.claude/data/calendar/upcoming.json` — next 30 days of events (written by calendar-sync.ts)
2. `.claude/data/calendar/reminder-state.json` — events that have been acknowledged

## Rules

**Tiered reminders for birthdays and important recurring dates:**

| Days Out | Alert |
|----------|-------|
| 28-30 | "Heads up — [name]'s birthday is [date]. Want to plan something?" |
| 13-15 | "Two weeks until [name]'s birthday. Have you handled this?" |
| 6-8 | "One week — final reminder for [name]'s birthday" |
| 0 (today) | "Text [name] happy birthday today" |

**Skip** events that appear in reminder-state.json as `acknowledged: true` for the current tier — but always send the day-of reminder.

**Event importance signals** (flag these even if not a birthday):
- Events with "birthday", "anniversary", "wedding" in the title
- All-day recurring events (likely important dates)
- Events with 3+ attendees (likely group plans)
- Travel events (flights, hotels, trains) within 7 days

**Ignore:**
- Regular meetings and calls
- Routine recurring events (weekly syncs, standups)
- Past events

## Output Format

If there are alerts:

```
CALENDAR ALERTS — [today's date]

BIRTHDAYS & DATES
- [tier emoji] [name] — [date] ([X days out]). [action suggestion]

UPCOMING TRAVEL
- [date]: [event summary] ([location])

THIS WEEK
- [date] [time]: [event summary]
```

Tier emojis: 📅 (30 days), ⚠️ (14 days), 🔴 (7 days), 🎂 (today)

If there are no alerts worth reporting, output exactly: `NO_CALENDAR_ALERTS`
