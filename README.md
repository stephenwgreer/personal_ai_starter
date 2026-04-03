# Personal AI Starter

Turn [Claude Code](https://claude.ai/claude-code) into a personal AI system that actually knows who you are.

## The Problem

Every AI conversation starts from zero. You re-explain your goals, your context, your preferences — every single time. Nothing connects. Nothing persists. Nothing works in the background.

## The Fix

Clone this repo. Open Claude Code. Say "Run the onboarding." Your AI walks you through everything — names itself, learns your goals, installs capabilities, and starts working for you. No configuration files to edit. No technical setup required.

## Quick Start

```powershell
PS C:\Users\stwgre> git clone https://github.com/stephenwgreer/personal_ai_starter.git Roma
Cloning into 'Roma'...
remote: Enumerating objects: 91, done.
remote: Counting objects: 100% (91/91), done.
remote: Compressing objects: 100% (76/76), done.
remote: Total 91 (delta 0), reused 91 (delta 0), pack-reused 0 (from 0)
Receiving objects: 100% (91/91), 46.24 KiB | 2.01 MiB/s, done.
PS C:\Users\stwgre>
```

Then say:

> Run the onboarding in ONBOARDING.md

Claude handles the rest. It will:
1. Ask your name, role, and what you're working on
2. Ask you to name your AI and calibrate its personality
3. Walk you through your mission, goals, and challenges
4. Install capability packs based on what you need
5. Verify everything works

Total time: ~20 minutes of conversation.

## What You Get

**Core** (included — always active):
- Persistent identity and memory across every session
- Session capture — every conversation summarized automatically
- Security hooks — dangerous commands blocked before they execute
- Your mission, goals, and challenges loaded into every conversation

**Packs** (installed during onboarding or anytime after):

| Pack | Type | What It Does |
|------|------|-------------|
| **career** | skill | Job search, resume tailoring, application tracking |
| **meetings** | skill | Live capture, action items, standup review |
| **learning** | skill | Guided learning through hands-on projects |
| **research** | skill | Multi-source research and synthesis |
| **blog** | skill | Idea capture, voice-matched drafting, quality review |
| **boardroom** | command | 19 world-class advisors deliberate on your decisions |
| **morning-briefing** | command | Daily planning tied to your goals |
| **contacts** | command | Professional contact management |
| **cron** | infra | Background job scheduler with Discord alerts |
| **rules** | infra | Context-specific behavior rules |

## Adding Packs Later

Claude installs packs during onboarding, but you can also add them anytime:

```bash
# See what's available
./install-pack.sh --list

# Install a pack
./install-pack.sh career

# Check what's installed
./install-pack.sh --installed
```

## The 6 Layers

The system builds up in layers. Start simple, add complexity as you need it.

| # | Layer | What | You Need |
|---|-------|------|----------|
| 1 | **Identity** | CLAUDE.md + SOUL.md | Onboarding (5 min) |
| 2 | **Context** | PROFILE/ — mission, goals, challenges | Onboarding (15 min) |
| 3 | **Skills** | Capability packs | Pick during onboarding |
| 4 | **Memory** | 3-tier persistence | Automatic (hooks) |
| 5 | **Automation** | Background cron jobs | Optional (cron pack) |
| 6 | **Integrations** | MCP servers, APIs | Advanced (add yourself) |

## Prerequisites

- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) installed and authenticated
- [Bun](https://bun.sh) runtime (for hooks and scripts)
- Git

## Inspired By

Built by [Stephen Greer](https://www.stephenwgreer.com/darin) as a personal AI system called Darin. This is a depersonalized starter kit anyone can use.

## License

MIT
