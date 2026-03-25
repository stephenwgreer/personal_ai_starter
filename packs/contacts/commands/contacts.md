---
name: contacts
description: Contact management — add, search, update, and review your professional network.
allowed-tools: Read, Write, Edit, Glob, Grep, AskUserQuestion
---

# Contacts Manager

Manage your professional contact database stored in `.claude/data/contacts.jsonl`.

## Schema

Each contact is a JSON line:
```json
{
  "name": "Jane Smith",
  "email": "jane@company.com",
  "phone": "",
  "role": "VP Engineering",
  "company": "Acme Corp",
  "how_met": "Conference 2025",
  "last_contact": "2026-01-15",
  "tags": ["engineering", "hiring-manager", "networking"],
  "notes": "Interested in AI infrastructure. Mentioned opening on her team."
}
```

## Commands

| Input | Action |
|-------|--------|
| `/contacts add [name]` | Add a new contact (ask for details) |
| `/contacts find [query]` | Search by name, company, tag, or notes |
| `/contacts update [name]` | Update an existing contact |
| `/contacts list [tag]` | List contacts by tag |
| `/contacts stale` | Show contacts not reached in 30+ days |

## Rules
- Always confirm before overwriting existing contact data
- `last_contact` updates whenever the user mentions interacting with someone
- Suggest reaching out to stale contacts when relevant to current goals
