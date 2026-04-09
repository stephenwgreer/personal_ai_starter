"""Sidecar configuration — model routing, budget defaults."""

from pathlib import Path

# Project root is two levels up from sidecar/ (.claude/automation/sidecar/)
AUTOMATION_DIR = Path(__file__).parent.parent
CLAUDE_DIR = AUTOMATION_DIR.parent
PROJECT_ROOT = CLAUDE_DIR.parent

MODELS = {
    "haiku": "claude-haiku-4-5-20251001",
    "sonnet": "claude-sonnet-4-6-20250514",
    "opus": "claude-opus-4-6-20250514",
}

# Per-run budget caps by job ID. If a job isn't listed, "default" applies.
BUDGET_DEFAULTS: dict[str, float] = {
    "heartbeat": 0.25,
    "default": 0.50,
}

# Daily budget cap across all sidecar runs. When hit, jobs return BUDGET_EXCEEDED.
DAILY_BUDGET_CAP = 5.00

BUDGET_FILE = AUTOMATION_DIR / "sidecar-budget.json"
