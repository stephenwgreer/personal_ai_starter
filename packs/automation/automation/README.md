# Automation — Background Job Scheduler

Your AI can work in the background on a schedule — checking for things, sending alerts, generating briefings — without you having to be in a session or ask.

## Two Modes

This pack supports two ways to run background jobs. You can use either or both.

### Full Mode (API Key)

Uses the **Agent SDK sidecar** — a Python process that gives your AI full access to all its tools, skills, MCP servers, and project context. This is the same AI you interact with in Claude Code, running headless.

**What it costs:** Requires an Anthropic API key from [platform.claude.com](https://platform.claude.com). This is usage-based billing separate from any Claude subscription. The default model is Haiku, which is very cheap — a typical heartbeat costs $0.01-0.03, so even running every 30 minutes all day you're looking at ~$1-2/day. The sidecar has a built-in daily budget cap (default $5) so you won't get surprised.

**What you get:** The AI can read your files, use your MCP integrations (calendar, email, Discord, Notion), run scripts, and make decisions with full context. This is what makes things like intelligent morning briefings and proactive monitoring actually useful.

**Setup:**
1. Get an API key from [platform.claude.com](https://platform.claude.com)
2. Add it to `.claude/.env` as `ANTHROPIC_API_KEY=sk-ant-...`
3. Install Python dependencies: `cd .claude/automation && uv sync` (or `pip install claude-agent-sdk`)
4. Jobs with `type: sidecar` will use this mode

### Lite Mode (Subscription)

Uses `claude --print` — the Claude Code CLI in non-interactive mode. This uses your existing Claude subscription (Free, Pro, or Max) with no additional cost.

**What it costs:** Nothing beyond your subscription.

**What you lose:** The AI runs without access to tools, skills, or MCP servers. It can only reason over whatever text you feed it in the prompt. You need to give it everything it needs — it can't read files, check your calendar, or use any integrations on its own.

**Best for:** Simple jobs where the prompt is self-contained — like formatting a pre-fetched data dump, generating a summary from piped input, or making a decision based on text passed in from a prior `script` step.

**Setup:**
1. Make sure `claude` CLI is installed and authenticated (`claude login`)
2. Jobs with `type: claude-code` will use this mode

## How It Works

`daemon.ts` is a long-running process that:
1. Reads `jobs.yaml` every minute
2. Checks if any job is due (cron schedule + timezone)
3. Executes each job's steps in order
4. Logs results to `runs/`

### Starting the Daemon

```bash
# Run in background
nohup bun run .claude/automation/daemon.ts &

# Or with a process manager
pm2 start "bun run .claude/automation/daemon.ts" --name ai-automation
```

## Step Types

### `script`
Runs a shell command. Good for data fetching, API calls, file processing.
```yaml
- type: script
  run: "bun run .claude/scripts/fetch-data.ts"
  timeout: 60
```

### `sidecar` (Full Mode)
Runs a prompt through the Agent SDK with full tool/skill/MCP access.
```yaml
- type: sidecar
  prompt_file: "HEARTBEAT.md"
  model: "haiku"              # haiku (~$0.01), sonnet (~$0.05), opus (~$0.15)
  max_turns: 10
  timeout: 180
```

### `claude-code` (Lite Mode)
Runs a prompt through `claude --print` using your subscription. No tool access.
```yaml
- type: claude-code
  prompt_file: "SUMMARY.md"
  model: "sonnet"
  max_turns: 3
  timeout: 90
```

### `notify`
Sends output to Discord. Only fires if previous step produced output.
```yaml
- type: notify
  channel_id: "discord-channel-id"
  only_if_not: "NOTHING_TO_REPORT"
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

## Example Jobs

**Morning briefing** (Full Mode — reads your goals, calendar, tasks):
```yaml
morning-briefing:
  name: "Morning Briefing"
  schedule: "0 7 * * 1-5"
  timezone: "America/New_York"
  enabled: true
  steps:
    - type: sidecar
      prompt_file: "prompts/HEARTBEAT.md"
      model: "haiku"
      max_turns: 10
      timeout: 180
    - type: notify
      only_if_not: "NOTHING_TO_REPORT"
```

**Data digest** (Lite Mode — script fetches data, Claude summarizes):
```yaml
news-digest:
  name: "News Digest"
  schedule: "0 8 * * 1-5"
  timezone: "America/New_York"
  enabled: true
  steps:
    - type: script
      run: "curl -s https://api.example.com/headlines | jq '.articles[:5]'"
      timeout: 30
    - type: claude-code
      prompt: "Summarize these headlines in 3 bullets. Be concise."
      model: "haiku"
      timeout: 60
    - type: notify
```

## Budget Controls (Full Mode)

The sidecar tracks daily spend automatically:
- Default daily cap: **$5.00**
- Per-job defaults configured in `sidecar/config.py`
- Budget state saved to `.claude/automation/sidecar-budget.json`
- When the cap is hit, sidecar jobs return `BUDGET_EXCEEDED` and skip

Edit `sidecar/config.py` to adjust:
```python
DAILY_BUDGET_CAP = 5.00

BUDGET_DEFAULTS = {
    "heartbeat": 0.25,    # per-run cap for this job
    "default": 0.50,      # fallback for unlisted jobs
}
```

## Files

| File | Purpose |
|------|---------|
| `daemon.ts` | Main daemon — reads jobs.yaml, dispatches steps |
| `jobs.yaml` | Job definitions — schedules, steps, config |
| `prompts/` | Prompt files for sidecar and claude-code steps |
| `sidecar/` | Agent SDK wrapper (Full Mode) |
| `run-sidecar.py` | Entry point for sidecar |
| `runs/` | Auto-generated — JSONL logs per job |
| `.state.json` | Auto-generated — tracks last run time |
| `sidecar-budget.json` | Auto-generated — daily spend tracking |
