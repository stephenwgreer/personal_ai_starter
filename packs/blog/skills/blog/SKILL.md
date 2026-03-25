---
name: blog
description: Content creation pipeline. Idea capture, development, drafting with voice consistency, and quality review.
version: 1.0.0
---

# Blog / Content Skill

**Auto-loads when**: User mentions blog, article, "write about", content creation, or "capture idea".

## Workflows

### Capture
- "Blog note: [idea]" / "Capture this idea"
- Quick capture with frontmatter + 2-3 angles to develop
- Saves to `ideas/YYYY-MM-DD-[slug].md`

### Develop
- "Develop [idea]" / "Flesh out [topic]"
- Expands a captured idea: hook, thesis, key points, title options
- Updates the idea file in `ideas/`

### Draft
- "Write article about [topic]" / "Draft blog post"
- Full article from outline to complete draft
- If `data/voice-profile.md` exists, match the user's writing voice
- Saves to `history/blog/drafts/`

### Quality Review
- "Review my draft" / "Edit this post"
- Three-stage review:
  1. **Clarity**: Is every sentence necessary? Cut filler.
  2. **Voice**: Does it sound like the user, not like AI?
  3. **Structure**: Does it flow? Is the argument clear?

## Data Files (gitignored)

| File | Purpose |
|------|---------|
| `data/voice-profile.md` | Writing samples and voice characteristics |
| `ideas/` | Working idea files (captured, in development) |

## Output Locations
- Ideas: `ideas/YYYY-MM-DD-[slug].md`
- Drafts: `history/blog/drafts/`
- Published: `history/blog/[category]/`

## Rules
- Voice consistency: match the user's actual writing style, not generic AI prose
- Quality over speed: a shorter, tighter piece beats a longer, fluffier one
- Always present drafts for review — never publish directly
