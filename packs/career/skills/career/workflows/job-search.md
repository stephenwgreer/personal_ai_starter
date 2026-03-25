# Job Search Workflow

## Trigger
User asks to find jobs, check career pages, or search for openings.

## Steps

1. **Load targets**: Read `data/job-targets.json` for target companies and keywords.
2. **Search**: For each target company, search their careers page for matching roles.
3. **Score**: Rate each posting against must-have and nice-to-have criteria.
4. **Dedup**: Check against `data/applications.csv` to skip already-applied roles.
5. **Present**: Show results sorted by match score, with direct links.

## Output Format

```
## New Matches

### [Company] — [Role Title] (Score: X/10)
**Location**: ...
**Match**: [must-have keywords found]
**Link**: [direct URL]
**Notes**: [why this is worth looking at]
```

## Notes
- Prioritize roles that match PROFILE/GOALS.md criteria
- Flag roles that are a stretch (missing 1-2 must-haves) separately
- Update `data/applications.csv` when user decides to apply
