# Hooks

Hooks are scripts that run automatically at specific points in the Claude Code lifecycle. They extend the system without requiring manual intervention.

## How Hooks Work

Claude Code fires hooks at defined events. Each hook receives a JSON payload via **stdin** and must exit cleanly:

- **Exit 0** → success (or "allow" for PreToolUse)
- **Exit 2** → block the action (PreToolUse only)
- **Any error** → hooks should fail silently, never blocking the user

Hooks are configured in `.claude/settings.json` under the `hooks` key.

## Hook Types

### SessionStart
**When**: Every time a Claude Code session begins.
**Use for**: Loading environment variables, printing a welcome banner, checking prerequisites.
**Receives**: `{ "session_id": "...", "cwd": "..." }`

### SessionEnd
**When**: Session terminates (user exits, clears, or times out).
**Use for**: Capturing session summaries, updating memory, sending notifications.
**Receives**: `{ "session_id": "...", "transcript_path": "...", "reason": "...", "cwd": "..." }`
**Timeout**: 30 seconds (set in settings.json).

### PreToolUse
**When**: Before any tool executes (Bash, Write, Edit, etc.).
**Use for**: Security validation, blocking dangerous commands, audit logging.
**Receives**: `{ "session_id": "...", "tool_name": "...", "tool_input": { ... } }`
**Exit 2**: Blocks the tool from executing.

### Stop
**When**: User presses /stop during a long-running operation.
**Use for**: Cleanup, saving partial progress, notifications.
**Timeout**: 30 seconds.

## Design Principles

1. **Fail silently.** A broken hook should never prevent Claude from starting or stopping. Wrap everything in try/catch.
2. **Be fast.** SessionStart hooks delay the session. Keep them under 2 seconds.
3. **No side effects on read.** PreToolUse validators should only inspect — never modify the command.
4. **Derive paths from script location.** Use `import.meta.dir` (Bun) to find the project root. Never hardcode absolute paths.

## Included Hooks

| File | Type | Purpose |
|------|------|---------|
| `session-start.ts` | SessionStart | Loads .env, prints ready banner |
| `session-end.ts` | SessionEnd | Captures session summary to history/sessions/ |
| `security-validator.ts` | PreToolUse | Blocks dangerous Bash commands |

## Writing Your Own Hook

```typescript
#!/usr/bin/env bun
// my-hook.ts — runs on SessionStart

import { resolve } from "path";

const HOOK_DIR = import.meta.dir;
const CLAUDE_DIR = resolve(HOOK_DIR, "..");
const REPO_ROOT = resolve(CLAUDE_DIR, "..");

try {
  const payload = JSON.parse(await Bun.stdin.text());

  // Your logic here
  console.log("Hook fired for session:", payload.session_id);

} catch {
  // Always fail silently
}

process.exit(0);
```

Then register it in `.claude/settings.json`:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "type": "command",
        "command": "bun run .claude/hooks/my-hook.ts",
        "timeout": 10000
      }
    ]
  }
}
```

## Ideas for Custom Hooks

- **SessionStart**: Check for overdue reminders, load today's calendar, verify API keys
- **SessionEnd**: Post session summary to Slack/Discord, update a Notion database, trigger a backup
- **PreToolUse**: Block writes to certain directories, log all file modifications, enforce naming conventions
- **Stop**: Send a "task paused" notification, save current progress to scratchpad
