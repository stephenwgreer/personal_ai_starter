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

Present each trait with its 1-5 spectrum. Tell the user they can just feed you the five numbers in sequence — no special formatting needed.

"I'm going to calibrate how I communicate with you. For each trait below, pick a number 1-5. You can just give me all five numbers in a row (e.g. '4 3 5 2 4')."

| Trait | 1 | 5 |
|-------|---|---|
| Communication style | Warm and encouraging | Direct and blunt |
| Detail level | Concise, essentials only | Thorough and comprehensive |
| Initiative | Wait for instructions | Proactively suggest and push back |
| Formality | Casual and conversational | Professional and structured |
| Risk tolerance | Conservative, safe suggestions | Bold, challenge my assumptions |

Then ask:
- "Is there anything you want me to NEVER do? For example: never sugarcoat bad news, never make changes to code without asking first, never send messages on my behalf without confirmation, never add emoji to responses, never over-explain things I already know."
- "Anything you want me to ALWAYS do? For example: always push back if you think I'm wrong, always show your reasoning before giving a recommendation, always check existing files before creating new ones, always ask before taking irreversible actions."

**Step 4: Tools and platforms.**

Ask: "If you code, what languages and tools do you use? If you don't code, what platforms do you typically use — for productivity, note-taking, email, calendar, project management, that kind of thing?"

Store their answer for two purposes:
1. Populating the Stack section of CLAUDE.md
2. Suggesting MCP server integrations in Phase 4 (Step 14)

**Step 5: Create identity files.**

Using everything gathered, create these two files:

1. **`CLAUDE.md`** (overwrite the template) — Under 100 lines. Include:
   - Identity section with their name, role, location, focus
   - Response preferences derived from their personality scores
   - Stack/tools preferences (from their answer about languages, tools, and platforms)
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

**Step 6: Mission.**

Ask: "Forget job titles and money for a second. If you're looking back on your life in 10 years and feeling proud — what did you actually do? What matters to you beyond work?"

Follow up with 2-3 probing questions based on their answer. Go deeper. Then create:
- **`.claude/PROFILE/MISSION.md`** — Under 30 lines. Vision, why now, what drives them.

Show the draft. Ask them to refine. This is personal — get it right.

**Step 7: Goals.**

Ask: "What are the 3-5 main things you're trying to accomplish right now? For each one, what's the rough timeframe? These can be work goals, personal goals, or a mix. For example:

- **Work**: Get promoted to senior engineer, launch a product by Q3, transition into management, land a new job in a different industry
- **Personal**: Get healthier, learn a new skill, build a side project, get better at managing your time, finally tackle a big goal you've been putting off

Don't overthink it — what are the things that, if you made real progress on them in the next few months, you'd feel great about?"

Create:
- **`.claude/PROFILE/GOALS.md`** — Numbered goals (G1, G2...) with timeframes and outcomes.

**Step 8: Challenges.**

Ask: "What gets in the way? What patterns do you fall into that work against you? Be honest — this stays in your local files, and I need to know in order to actually help.

Some common ones people share:
- Overcommitting and then dropping balls
- Spending too much time on low-priority tasks and avoiding the hard stuff
- Analysis paralysis — researching endlessly instead of starting
- Poor follow-through on plans that start strong
- Calendar chaos — meetings eat the day, no deep work blocks
- Procrastinating on things that feel ambiguous or uncomfortable
- Saying yes to everything and losing focus on what actually matters

Any of those hit? Or something else entirely?"

Create:
- **`.claude/PROFILE/CHALLENGES.md`** — Numbered challenges (C1, C2...) linked to which goals they block.

**Step 9: Strategies.**

Based on their goals and challenges, draft strategies yourself. Present them: "Here's how I'd approach your challenges. What would you change?"

Create:
- **`.claude/PROFILE/STRATEGIES.md`** — Numbered strategies linked to challenges.

**Step 10: Scoreboard.**

Create:
- **`.claude/PROFILE/SCOREBOARD.md`** — Initialize with any projects mentioned during setup.

---

### Phase 3: Skills & Packs

**Step 11: Choose capabilities.**

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

**Step 12: Install packs.**

For each confirmed pack, install it yourself by:

1. Reading the `pack.json` from `packs/<name>/pack.json`
2. Copying each file listed in `files` to `.claude/<path>` (create parent directories as needed)
3. Creating each directory listed in `directories` under `.claude/`
4. If the pack has a `route` entry, adding it to the routing table in `CLAUDE.md` (insert before the "Everything else" row)

After installing all packs, show the user what was installed:
"Installed 4 packs: career, learning, boardroom, morning-briefing. Your routing table is updated."

**Step 13: Populate skill data.**

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

**Step 14: Hooks check.**

The hooks are already in place. Run these tests silently:

```bash
echo '{"session_id":"test","cwd":"."}' | bun run .claude/hooks/session-start.ts
echo '{"session_id":"test","tool_name":"Bash","tool_input":{"command":"ls"}}' | bun run .claude/hooks/security-validator.ts
```

If they work, say: "Hooks are working — I'll capture session summaries automatically and block dangerous commands."

If they fail, troubleshoot (usually a bun path issue).

**Step 15: Background automation.**

Give a quick overview of what automation can do, with concrete examples:

"I'm really good at automating things you might want done in the background without having to ask. For example:

- **Morning briefings** — I review your calendar, goals, and open tasks and send you a focused daily plan before you start work
- **Job monitoring** — I check career pages at your target companies for new postings and alert you when something matches
- **Investment alerts** — I track price targets, momentum signals, or earnings dates and flag when something needs attention
- **Deadline reminders** — I watch your goals and projects and nudge you when something is due or slipping
- **Email/calendar digests** — I summarize what's coming up and what needs a response
- **Recurring research** — I check for news, updates, or changes on topics you care about on a schedule

This runs on a cron daemon — a background process that kicks off tasks on a schedule. It requires the cron pack and optionally a Discord bot or webhook for notifications so I can reach you outside this terminal."

If they're interested:
1. Install the cron pack (same process as Step 12)
2. Ask if they have a Discord webhook URL or bot token → add to `.claude/.env`
3. Help them configure 1-2 starter jobs in `.claude/cron/jobs.yaml`
4. Explain how to start the daemon: `nohup bun run .claude/cron/daemon.ts &`

**Step 16: MCP integrations.**

Based on the tools and platforms the user shared in Step 4, suggest relevant MCP (Model Context Protocol) server integrations. These let the AI read and write to external services directly.

Examples of what to suggest based on their answers:
- **Google Calendar / Gmail** → Google Calendar MCP, Gmail MCP
- **Notion** → Notion MCP
- **Slack / Discord** → Slack MCP, Discord MCP
- **GitHub** → GitHub MCP (or just `gh` CLI)
- **Linear / Jira** → respective MCP servers
- **Obsidian / markdown notes** → filesystem access is usually enough

For each suggested MCP:
1. Explain what it enables ("This would let me read your calendar and create events for you directly")
2. Provide setup instructions or link to the MCP server repo
3. Help them add the configuration to `.claude/settings.json` if they want to set it up now

Say: "You don't have to set these up now — you can always add them later. But connecting your key tools is what turns this from a chatbot into something that actually works for you."

If no, skip entirely.

---

### Phase 5: Verification

**Step 17: Summary.**

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

**Step 18: First test.**

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
