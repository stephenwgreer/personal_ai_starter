---
name: career
description: Job search automation, resume/cover letter generation, application tracking, and career strategy.
version: 1.0.0
---

# Career Management Skill

**Auto-loads when**: User mentions job search, resume, cover letter, application, interview, or career advice.

## Workflows

### Job Search & Discovery
- "Find jobs for me" / "Search for openings at [company]"
- "Check career pages" / "Any new roles?"
-> **Workflow**: workflows/job-search.md

### Resume & Cover Letter
- "Tailor my resume for [job]" / "Write a cover letter"
- "Create application package for [company]"
-> **Workflow**: workflows/resume-tailoring.md

### Application Tracking
- "Show my applications" / "Update status for [company]"
- "What applications are active?"
-> **Workflow**: workflows/application-tracking.md

### Career Strategy
- "Should I apply to [company]?" / "Career advice"
- "Help me decide between [options]"
-> Handle directly using PROFILE context

## Data Files (gitignored — create in data/)

| File | Purpose |
|------|---------|
| `data/applications.csv` | Application tracker (company, role, status, date, notes) |
| `data/job-targets.json` | Target companies, roles, keywords (must-have, nice-to-have, exclude) |
| `data/META_RESUME.md` | Master resume — source of truth for all tailoring |
| `data/META_ABOUT_ME.md` | Personal narrative, zone of genius, motivations |

## Rules

- Always check `data/applications.csv` before creating a new application (prevent duplicates)
- Reference `data/META_RESUME.md` as the source of truth — never fabricate accomplishments
- Include company-specific research in every application package
- Match resume language to job posting keywords without being dishonest
