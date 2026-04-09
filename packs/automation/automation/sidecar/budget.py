"""Daily budget tracking for sidecar runs.

Tracks cumulative spend per day with per-job breakdown.
Auto-resets on new calendar day.
"""

from datetime import date

from .config import BUDGET_FILE, DAILY_BUDGET_CAP
from .state import load_state, save_state


def _today() -> str:
    return date.today().isoformat()


def check_budget() -> bool:
    """Return True if daily spend is under the cap."""
    data = load_state(BUDGET_FILE)
    if data.get("date") != _today():
        return True
    return data.get("spent_usd", 0.0) < DAILY_BUDGET_CAP


def record_spend(job_id: str, cost_usd: float) -> None:
    """Record cost for a run. Resets on new day."""
    data = load_state(BUDGET_FILE)
    today = _today()

    if data.get("date") != today:
        data = {"date": today, "spent_usd": 0.0, "runs": 0, "by_job": {}}

    data["spent_usd"] = data.get("spent_usd", 0.0) + cost_usd
    data["runs"] = data.get("runs", 0) + 1

    by_job = data.get("by_job", {})
    by_job[job_id] = by_job.get(job_id, 0.0) + cost_usd
    data["by_job"] = by_job

    save_state(BUDGET_FILE, data)
