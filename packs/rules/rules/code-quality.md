# Code Quality Rules

These apply whenever writing or modifying code in this repository.

## Language & Tooling
- TypeScript first. Python when domain-appropriate (data analysis, ML, scripts)
- Package managers: bun (JS/TS), uv (Python)
- SQL is always fine

## Patterns
- Functional patterns, explicit types, meaningful names
- Production-ready code, not prototypes or templates
- No over-engineering — minimum complexity for the current task
- Don't add features, abstractions, or error handling beyond what was asked
- Three similar lines of code is better than a premature abstraction
