# Application Tracking Workflow

## Trigger
User asks about application status, wants to update an application, or requests a report.

## Status Lifecycle
`discovered` → `reviewing` → `applied` → `screening` → `interviewing` → `offer` → `accepted` / `rejected`

## Steps

1. **Load data**: Read `data/applications.csv`.
2. **Action**: Based on user request:
   - **Status update**: Change status, add notes, update date
   - **Report**: Show all active applications grouped by status
   - **Follow-up**: Flag applications that need follow-up (applied > 7 days ago, no response)
3. **Save**: Write updated CSV back to `data/applications.csv`.

## CSV Schema
```
company,role,status,date_applied,date_updated,link,notes
```
