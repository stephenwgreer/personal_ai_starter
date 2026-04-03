# Calendar Pack — Setup Guide

Your AI gets its own Google account and uses it like an EA — reading your schedule, adding events, and sending you reminders about upcoming birthdays and important dates.

## Architecture

```
┌─────────────────────┐
│  Google Calendar     │  Your personal calendar(s)
│  (your account)      │  shared with the AI's account
└──────────┬──────────┘
           │ shared (writer access)
┌──────────▼──────────┐
│  AI's Google Account │  e.g., darin.my.pa@gmail.com
│  (service identity)  │  Has its own calendar + access to yours
└──────────┬──────────┘
           │
    ┌──────┴──────┐
    │             │
┌───▼───┐  ┌─────▼─────┐
│ Sync  │  │  MCP      │
│ Script│  │  (live)   │
└───┬───┘  └───────────┘
    │ writes JSON
┌───▼──────────────┐
│ upcoming.json    │  Next 30 days of events
│ reminder-state   │  What's been acknowledged
└───┬──────────────┘
    │ read by
┌───▼──────────────┐
│ Calendar Digest  │  Cron job (daily)
│ (claude-code)    │  Generates tiered reminders
└───┬──────────────┘
    │
┌───▼──────────────┐
│ Discord / Output │  Alerts delivered
└──────────────────┘
```

**Two paths, two purposes:**
- **Sync script** (cron, daily) — Headless. Fetches calendar via Google API, writes JSON. No LLM needed.
- **MCP** (live sessions) — Interactive. Read/write calendar events during conversation. Requires OAuth session.

## Step-by-Step Setup

### 1. Create (or designate) the AI's Google account

Your AI needs its own Gmail account. This is its identity for calendar access, email, and other Google services.

Example: `darin.my.pa@gmail.com`

### 2. Enable Google Calendar API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (e.g., "Personal AI Calendar")
3. Enable the **Google Calendar API**:
   - APIs & Services → Library → search "Google Calendar API" → Enable

### 3. Create OAuth credentials for headless access

The sync script runs unattended, so it needs credentials that don't require a browser.

**Option A: OAuth refresh token (recommended for personal use)**

1. APIs & Services → Credentials → Create Credentials → OAuth client ID
2. Application type: **Desktop app**
3. Download the `client_secret.json`
4. Run the one-time auth flow:

```bash
# Install the Google API client
cd your-ai-repo/.claude/data/calendar
bun add googleapis

# Run the auth helper (included in the pack)
bun run .claude/cron/calendar-sync.ts --auth
```

This opens a browser, you log in as the AI's account, and it saves a `token.json` with a refresh token.

**Option B: Service account (recommended for shared/team setups)**

1. APIs & Services → Credentials → Create Credentials → Service Account
2. Download the JSON key file
3. Save as `.claude/data/calendar/credentials.json`
4. Share your calendar with the service account's email address

### 4. Share your calendar with the AI

1. Open Google Calendar on your personal account
2. Settings → your calendar → Share with specific people
3. Add the AI's email (e.g., `darin.my.pa@gmail.com`)
4. Permission: **Make changes to events**

**Important:** Check your default event visibility:
- Settings → Event settings → Default visibility
- Change from "Only me" to **"Default"**
- Events set to "Only me" are invisible to shared accounts, even with full access

If you have multiple Google accounts with calendars, share each one separately.

### 5. Configure the sync script

Edit `.claude/cron/calendar-sync.ts` and set:

```typescript
const CONFIG = {
  calendars: [
    { id: "you@gmail.com", label: "Personal", access: "writer" },
    // Add more calendars as needed
  ],
  timezone: "America/Denver",
  lookaheadDays: 30,
  outputPath: ".claude/data/calendar/upcoming.json",
  statePath: ".claude/data/calendar/reminder-state.json",
  credentialsPath: ".claude/data/calendar/token.json",
};
```

### 6. Add cron jobs

Add these to your `.claude/cron/jobs.yaml`:

```yaml
  calendar-sync:
    name: "Calendar Sync"
    schedule: "0 6 * * *"          # 6 AM daily
    timezone: "America/Denver"
    enabled: true
    steps:
      - type: script
        run: "bun run .claude/cron/calendar-sync.ts"
        timeout: 30

  calendar-digest:
    name: "Calendar Digest"
    schedule: "15 6 * * *"         # 6:15 AM daily (after sync)
    timezone: "America/Denver"
    enabled: true
    steps:
      - type: claude-code
        prompt_file: "CALENDAR_DIGEST.md"
        model: "haiku"
        max_turns: 3
        timeout: 60
        allowed_tools: [Read, Glob, Grep]
      - type: notify
        channel_id: "your-discord-channel-id"
        only_if_not: "NO_CALENDAR_ALERTS"
```

### 7. Test it

```bash
# Run sync manually
bun run .claude/cron/calendar-sync.ts

# Check the output
cat .claude/data/calendar/upcoming.json | jq '.events | length'

# Run digest manually (through cron daemon or direct)
# The digest reads upcoming.json and generates reminders
```

## Reminder Tiers

The digest uses a tiered alert system for important dates:

| Timeframe | Alert Level | Purpose |
|-----------|-------------|---------|
| 30 days out | Heads up | "Varinder's birthday is Aug 15. Want to plan something?" |
| 14 days out | Reminder | "Two weeks until Varinder's birthday. Have you handled this?" |
| 7 days out | Final notice | "One week out — last chance to prepare" |
| Day of | Action | "Text Varinder happy birthday today" |

### Acknowledging Reminders

When you tell your AI you've handled something ("ordered a gift for Varinder"), it marks it in `reminder-state.json`. You won't get nagged again for that event — only the day-of nudge to text.

## Live Calendar Access (MCP)

During interactive sessions, your AI can also access calendars through the Google Calendar MCP:

- **Read** your schedule for any date range
- **Create** events (reservations, reminders, blocks)
- **Update** events (reschedule, add guests)
- **Delete** events
- **Find free time** for scheduling

This requires the Claude.ai Google Calendar MCP to be connected (`/mcp` in Claude Code).

The MCP and sync script are independent — the MCP is for live interaction, the sync script is for background monitoring.

## Files

| File | Purpose |
|------|---------|
| `calendar-sync.ts` | Fetches next 30 days, writes upcoming.json |
| `CALENDAR_DIGEST.md` | Prompt for the digest cron job |
| `calendar-README.md` | This file — setup guide |
| `data/calendar/upcoming.json` | Auto-generated — next 30 days of events |
| `data/calendar/reminder-state.json` | Auto-generated — acknowledged reminders |
| `data/calendar/token.json` | Your OAuth credentials (gitignored) |

## Troubleshooting

**Events not showing up?**
- Check event visibility (Settings → Default visibility → must NOT be "Only me")
- Verify sharing permissions (must be "Make changes to events" or "See all event details")
- Check which calendar the events are on — sub-calendars (Birthdays, Family) need to be shared separately
- Auto-created events from Gmail (travel, reservations) may live on a different account

**Auth errors in cron?**
- OAuth tokens expire every ~2 hours for interactive sessions, but refresh tokens (saved in token.json) should auto-renew
- If token.json stops working, re-run `calendar-sync.ts --auth`

**Multiple accounts?**
- Add each calendar ID to the `calendars` config array
- The sync script merges events from all calendars into one `upcoming.json`
