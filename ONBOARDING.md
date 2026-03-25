# Personal AI System — Onboarding Guide

_Open this project in Claude Code and say: "Run the onboarding." That's it._

---

## Instructions for Claude

You are setting up a personal AI system for a new user. This repo is their project directory — all files get created here.

**Rules:**
- Follow these phases in order.
- Ask questions one at a time. Wait for answers before proceeding.
- Never skip ahead. Never assume — always ask.
- Create files yourself using the Write/Edit tools. The user should never have to edit a file manually.
- After creating a file, briefly confirm what you wrote. Offer to revise.
- Keep the tone conversational. This should feel like a setup wizard, not a form.

---

### Phase 0: Environment Check

Run these checks silently (don't ask the user — just verify and report):

1. Check if `bun` is available: `bun --version`
2. Check if `jq` is available: `jq --version`
3. Check if `.claude/.env` exists (if not, copy from `.claude/.env.example`)
4. Create any missing directories: `.claude/data`, `history/sessions`, `history/learnings`, `scratchpad`

If anything critical is missing (bun, especially), tell the user what to install and how. Otherwise, just say "Environment looks good" and move on.

---

### Phase 1: Identity

**Step 1: Meet the human.**

Ask these questions one at a time. Be conversational — don't dump them all at once.

1. "What's your name and what do you do?"
2. "What city are you based in?"
3. "In one sentence, what's the main thing you're working on right now?"
4. "Anything else you're actively focused on — side projects, goals, interests?"

**Step 2: Name the AI.**

Ask: "What would you like to name your AI? This is the name I'll go by. It can be anything — a human name, a reference, an acronym, or just 'Assistant' if you prefer."

After they choose, immediately:
- Create `.claude/.env` (or update it) with `AI_NAME=TheirChoice`
- Update `.claude/settings.json` with the name in `env.AI_NAME`

**Step 3: Personality calibration.**

Ask the user to rate each trait on a 1-5 scale. Present this as a quick calibration — not a quiz:

"I'm going to calibrate how I communicate with you. Rate each of these 1-5:"

| Trait | 1 | 5 |
|-------|---|---|
| Communication style | Warm and encouraging | Direct and blunt |
| Detail level | Concise, essentials only | Thorough and comprehensive |
| Initiative | Wait for instructions | Proactively suggest and push back |
| Formality | Casual and conversational | Professional and structured |
| Risk tolerance | Conservative, safe suggestions | Bold, challenge my assumptions |

Then ask:
- "Anything you want me to NEVER do?"
- "Anything you want me to ALWAYS do?"

**Step 4: Create identity files.**

Using everything gathered, create these two files:

1. **`CLAUDE.md`** (overwrite the template) — Under 100 lines. Include:
   - Identity section with their name, role, location, focus
   - Response preferences derived from their personality scores
   - Stack preferences (ask: "Do you code? If so, what languages and tools do you use?" — if they don't code, skip this section)
   - Skill routing table (leave placeholder rows — populated in Phase 3)
   - Values derived from personality calibration
   - Standard constraints
   - Current context section

2. **`.claude/SOUL.md`** (overwrite the template) — Under 50 lines. The AI's character:
   - What it is (calibrated to their personality preferences)
   - How it operates (behavioral principles)
   - What it won't do
   - Memory acknowledgment

Show both files to the user. Ask: "How does this feel? Anything to adjust?"

---

### Phase 2: Profile

**Step 5: Mission.**

Ask: "Forget job titles and money for a second. If you're looking back on your life in 10 years and feeling proud — what did you actually do? What matters to you beyond work?"

Follow up with 2-3 probing questions based on their answer. Go deeper. Then create:
- **`.claude/PROFILE/MISSION.md`** — Under 30 lines. Vision, why now, what drives them.

Show the draft. Ask them to refine. This is personal — get it right.

**Step 6: Goals.**

Ask: "What are the 3-5 main things you're trying to accomplish right now? For each one, what's the rough timeframe?"

Create:
- **`.claude/PROFILE/GOALS.md`** — Numbered goals (G1, G2...) with timeframes and outcomes.

**Step 7: Challenges.**

Ask: "What gets in the way? What patterns do you fall into that work against you? Be honest — this stays in your local files, and I need to know in order to actually help."

Create:
- **`.claude/PROFILE/CHALLENGES.md`** — Numbered challenges (C1, C2...) linked to which goals they block.

**Step 8: Strategies.**

Based on their goals and challenges, draft strategies yourself. Present them: "Here's how I'd approach your challenges. What would you change?"

Create:
- **`.claude/PROFILE/STRATEGIES.md`** — Numbered strategies linked to challenges.

**Step 9: Scoreboard.**

Create:
- **`.claude/PROFILE/SCOREBOARD.md`** — Initialize with any projects mentioned during setup.

---

### Phase 3: Skills & Packs

**Step 10: Choose capabilities.**

Ask: "What are the main areas you want AI help with? For example: career, writing, research, learning, meetings, decision-making, daily planning, contact management — or something else entirely."

Based on their answer, map to available packs. Read each pack's `pack.json` from the `packs/` directory to get descriptions.

Present their matches like this:

"Based on what you told me, here's what I'd install:"

```
✓ career     — Job search, resume tailoring, application tracking
✓ learning   — Guided learning through hands-on projects
✓ boardroom  — 19 advisors deliberate on your big decisions
  research   — Multi-source research and synthesis (skipping for now)
```

Ask: "Look right? Anything to add or remove?"

**Step 11: Install packs.**

For each confirmed pack, install it yourself by:

1. Reading the `pack.json` from `packs/<name>/pack.json`
2. Copying each file listed in `files` to `.claude/<path>` (create parent directories as needed)
3. Creating each directory listed in `directories` under `.claude/`
4. If the pack has a `route` entry, adding it to the routing table in `CLAUDE.md` (insert before the "Everything else" row)

After installing all packs, show the user what was installed:
"Installed 4 packs: career, learning, boardroom, morning-briefing. Your routing table is updated."

**Step 12: Populate skill data.**

For each installed skill pack, walk the user through initial data:

**Career** (if installed):
- "Can you paste or describe your resume? I'll create your master resume file."
  → Create `.claude/skills/career/data/META_RESUME.md`
- "What companies or types of roles are you targeting?"
  → Create `.claude/skills/career/data/job-targets.json`
- Initialize empty `data/applications.csv` with headers

**Blog** (if installed):
- "Share 2-3 examples of your writing — blog posts, emails, anything in your voice."
  → Create `.claude/skills/blog/data/voice-profile.md`

**Meetings** (if installed):
- Initialize empty `data/meetings.jsonl` and `data/action-items.jsonl`

For other packs, just confirm installation — data gets populated through use.

---

### Phase 4: Automation (Optional)

**Step 13: Hooks check.**

The hooks are already in place. Run these tests silently:

```bash
echo '{"session_id":"test","cwd":"."}' | bun run .claude/hooks/session-start.ts
echo '{"session_id":"test","tool_name":"Bash","tool_input":{"command":"ls"}}' | bun run .claude/hooks/security-validator.ts
```

If they work, say: "Hooks are working — I'll capture session summaries automatically and block dangerous commands."

If they fail, troubleshoot (usually a bun path issue).

**Step 14: Background automation.**

Ask: "Do you want me to do things in the background — like morning briefings, deadline reminders, or price alerts? This requires the cron pack and optionally a Discord webhook for notifications."

If yes:
1. Install the cron pack (same process as Step 11)
2. Ask if they have a Discord webhook URL → add to `.claude/.env`
3. Help them configure 1-2 starter jobs in `.claude/cron/jobs.yaml`
4. Explain how to start the daemon: `nohup bun run .claude/cron/daemon.ts &`

If no, skip entirely.

---

### Phase 5: Verification

**Step 15: Summary.**

Present a summary of everything that was set up:

```
Your AI: [Name]
Personality: [brief description from calibration]
Goals: G1, G2, G3...
Packs installed: career, learning, boardroom...
Hooks: active (session capture + security)
Cron: [active/not set up]
```

Then say:

"That's the foundation. Start a fresh session (type /clear) and I'll come back knowing who you are, what you're working on, and how to help. The system grows from here — every session I learn more, and you can add packs anytime by running `./install-pack.sh --list`."

**Step 16: First test.**

Ask: "Want to try something? Ask me to help with one of the domains you set up — like 'help me with my resume' or 'what should I focus on today?' — and I'll show you how routing works."

---

## Design Principles

1. **CLAUDE.md is the spine.** It loads every session for free. Keep it lean.
2. **PROFILE is about the human.** Mission, goals, challenges — referenced by skills.
3. **SOUL is about the AI.** Personality, values, boundaries.
4. **Skills are capabilities.** They do work. They're not identity or context.
5. **Data is always gitignored.** Personal data never touches version control.
6. **Hooks fail silently.** Infrastructure never blocks the user.
7. **Ask, don't assume.** Every personal document gets validated before finalizing.
8. **Packs are modular.** Install only what you need. Add more later.

---

_This framework is open for anyone to use and adapt._
_Inspired by [Darin](https://www.stephenwgreer.com/darin) — a personal AI architecture by Stephen Greer._
