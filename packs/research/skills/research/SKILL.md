---
name: research
description: Multi-source research and synthesis. Deep dives, competitive intelligence, technology analysis, and structured reports.
version: 1.0.0
---

# Research Skill

**Auto-loads when**: User says "research [topic]", "find information about", "investigate", or "do a deep dive on".

## Research Modes

### Quick Research
- Single-pass web search + synthesis
- 2-3 sources, 1-page summary
- Use for: fact-checking, quick answers, "what is X?"

### Standard Research (default)
- Multiple search queries from different angles
- 5-10 sources, structured report with citations
- Use for: most research requests

### Deep Dive
- Parallel research agents, extensive source gathering
- 10+ sources, comprehensive analysis, competing viewpoints
- Use for: major decisions, competitive analysis, thorough investigation

## Workflow

1. **Clarify scope**: What specifically does the user want to know? What decisions will this inform?
2. **Research**: Use WebSearch and WebFetch to gather information from multiple sources.
3. **Synthesize**: Combine findings into a structured report.
4. **Save**: Write to `history/research/YYYY-MM/YYYY-MM-DD_[topic].md`.

## Output Format

```markdown
# Research: [Topic]
_Date: YYYY-MM-DD | Mode: quick/standard/deep_

## Executive Summary
[2-3 sentences — the bottom line]

## Key Findings
- [Finding 1] — [source]
- [Finding 2] — [source]

## Analysis
[Detailed discussion]

## Open Questions
[What couldn't be answered]

## Sources
1. [URL] — [what it contributed]
```

## Rules
- Always cite sources — no unsourced claims
- Distinguish between facts and opinions
- Flag when sources disagree
- Note confidence levels (high/medium/low) for key findings
- Save all research to `history/research/` for future reference
