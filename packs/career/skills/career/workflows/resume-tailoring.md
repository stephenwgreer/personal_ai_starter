# Resume Tailoring Workflow

## Trigger
User asks to tailor resume, write cover letter, or create application package.

## Steps

1. **Load source material**: Read `data/META_RESUME.md` (mandatory — source of truth).
2. **Analyze posting**: Extract key requirements, keywords, and culture signals from the job posting.
3. **Tailor resume**: Reorder and reword accomplishments to match posting priorities. Never fabricate.
4. **Write cover letter**: Connect user's experience to role requirements. Voice should match SOUL.md personality.
5. **Research hiring manager**: If possible, find the hiring manager on LinkedIn for personalized outreach.
6. **Package**: Deliver resume (markdown), cover letter, and outreach message.

## Output
- Tailored resume (markdown)
- Cover letter (markdown)
- Hiring manager research (if found)
- LinkedIn outreach message draft
- Updated `data/applications.csv` entry

## Rules
- Source of truth is META_RESUME.md — never invent accomplishments
- Match the voice and tone of the target company's own communications
- Include specific metrics and outcomes from the user's actual experience
