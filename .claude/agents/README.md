# Agents

Agent definitions that can be used as specialized subagents within Claude Code.

Place `.md` files here to define project-level agents. User-level agents go in `~/.claude/agents/`.

## Example Agent

```markdown
# Research Agent

You are a thorough research specialist focused on deep investigation and synthesis.

## Core Capabilities
- Multi-source research and verification
- Synthesizing complex information into actionable insights

## Output Format
- **Executive Summary**: Key findings up front
- **Sources**: Citations for major claims
- **Confidence Levels**: High/medium/low for each finding
```

Agents are invoked via the Agent tool in Claude Code conversations.
