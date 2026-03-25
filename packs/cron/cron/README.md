# Cron — Background Job Scheduler

The cron system lets your AI work in the background. Jobs run on a schedule — checking for things, sending alerts, generating briefings — without you having to ask.

## How It Works

`daemon.ts` is a long-running process that:
1. Reads `jobs.yaml` every minute
2. Checks if any job is due to run (based on cron schedule + timezone)
3. Executes each job's steps in order (script, claude-code, notify)
4. Logs results to `runs/` and updates `.state.json`

### Starting the Daemon

```bash
# Run in background
nohup bun run .claude/cron/daemon.ts &

# Or with a process manager
pm2 start "bun run .claude/cron/daemon.ts" --name ai-cron
```

## Job Configuration (jobs.yaml)

```yaml
jobs:
  morning-briefing:
    name: "Morning Briefing"
    schedule: "0 7 * * 1-5"        # 7 AM weekdays
    timezone: "America/New_York"
    enabled: true
    steps:
      - type: claude-code
        prompt_file: "BRIEFING.md"  # Prompt file in .claude/cron/
        model: "sonnet"
        timeout: 90                 # seconds
        allowed_tools:
          - Read
          - Glob
          - Grep
          - WebSearch
      - type: notify
        channel_id: "your-discord-channel-id"
        only_if_not: "NOTHING_TO_REPORT"
```

## Step Types

### `script`
Runs a shell command. Good for data fetching, API calls, file processing.
```yaml
- type: script
  run: "bun run .claude/scripts/check-weather.ts"
  timeout: 60
```

### `claude-code`
Runs a prompt through Claude Code. The AI can use tools, read files, and reason.
```yaml
- type: claude-code
  prompt_file: "HEARTBEAT.md"    # Markdown prompt in .claude/cron/
  system_prompt: "Be concise."
  model: "haiku"                 # haiku (cheap), sonnet (standard), opus (deep)
  max_turns: 5
  timeout: 90
  allowed_tools: [Read, Glob, Grep, WebSearch]
```

### `notify`
Sends output to Discord via webhook. Only fires if previous step produced output.
```yaml
- type: notify
  channel_id: "discord-channel-id"
  only_if_not: "NO_ALERTS"      # Suppress notification if output contains this string
```

## Cron Schedule Format

Standard 5-field cron: `minute hour day-of-month month day-of-week`

| Example | Meaning |
|---------|---------|
| `0 7 * * *` | Every day at 7 AM |
| `0 7 * * 1-5` | Weekdays at 7 AM |
| `*/30 * * * *` | Every 30 minutes |
| `0 9,17 * * *` | 9 AM and 5 PM daily |
| `0 8 * * 1` | Mondays at 8 AM |

## Ideas for Cron Jobs

### Beginner
- **Morning briefing**: Summarize goals, overdue items, and today's focus
- **Reminder checker**: Fire alerts for upcoming deadlines
- **Weather digest**: Morning weather summary for your city

### Intermediate
- **Job monitor**: Scrape target company career pages for new postings
- **Price tracker**: Monitor product/flight/stock prices and alert on changes
- **Weekly review**: Scan session history and extract patterns

### Advanced
- **Market analysis**: Run technical indicators on your watchlist before market open
- **Content pipeline**: Check for stale blog drafts, send nudges to finish them
- **System health**: Verify API keys still work, check disk space, validate data integrity

## Files in This Directory

| File | Purpose |
|------|---------|
| `daemon.ts` | Main daemon — reads jobs.yaml, executes on schedule |
| `jobs.yaml` | Job definitions — schedules, steps, config |
| `.state.json` | Auto-generated — tracks last run time per job |
| `runs/` | Auto-generated — JSONL logs of each execution |
| `HEARTBEAT.md` | Example prompt file for a heartbeat job |

## Environment

The daemon needs:
- `bun` in PATH
- `.claude/.env` with any API keys used by jobs
- `DISCORD_WEBHOOK_URL` in .env (if using notify steps)
