# Rules

Rules are context-specific behavior guidelines that Claude Code loads automatically based on the files being edited or the current working context.

## How Rules Work

Rules files live in `.claude/rules/` and are loaded into Claude's context when relevant. They constrain behavior for specific domains — like ensuring every investment recommendation includes risk parameters, or that code follows specific patterns.

Rules are **always active** once loaded. They don't need to be explicitly invoked.

## When to Create a Rule

Create a rule when:
- A skill has hard constraints that must never be violated (e.g., "never fabricate resume accomplishments")
- A domain has specific output requirements (e.g., "every trade recommendation needs a stop-loss")
- You want to enforce code style or patterns across the project
- You have recurring mistakes you want to prevent

## Rule File Format

```markdown
# Rule Name

Brief description of when this rule applies and why it exists.

## Constraints
- Hard requirement 1
- Hard requirement 2

## Patterns
- Preferred approach for X
- Always do Y before Z
```

## Included Rules

| File | Scope | Purpose |
|------|-------|---------|
| `code-quality.md` | All code | Language preferences, patterns, tooling |
| `career-mode.md` | Career skill | Resume accuracy, application tracking |
| `writing-mode.md` | Blog/content | Voice consistency, quality standards |

## Examples of Custom Rules

**For a finance skill:**
```markdown
# Investment Mode
- Every recommendation MUST include: position size, entry price, exit criteria (profit target + stop-loss)
- Never recommend options strategies without defining max loss
- Always reference the user's risk tolerance from PROFILE
```

**For a coding project:**
```markdown
# API Development
- All endpoints must validate input with zod schemas
- Error responses follow RFC 7807 (Problem Details)
- Never expose internal error messages to clients
```

**For writing:**
```markdown
# Writing Voice
- Match the user's voice profile in data/voice-profile.md
- No AI-sounding phrases: "delve", "landscape", "synergy", "leverage"
- Shorter sentences beat longer ones. Active voice beats passive.
```
