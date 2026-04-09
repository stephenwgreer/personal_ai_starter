"""CLI entry point for the sidecar.

Called by daemon.ts via: uv run python run-sidecar.py [args]
Prints agent output to stdout, exits 0 on success / 1 on error.
"""

import argparse
import asyncio
import sys
from datetime import datetime
from pathlib import Path

from .runner import run_step
from .budget import check_budget, record_spend


def _render_prompt(prompt: str | None, prompt_file: str | None) -> str:
    """Load prompt from file if specified, apply {DATE}/{TIME} templates."""
    if prompt_file:
        text = Path(prompt_file).read_text()
    elif prompt:
        text = prompt
    else:
        print("Error: --prompt or --prompt-file required", file=sys.stderr)
        sys.exit(1)

    now = datetime.now()
    date_str = now.strftime("%A, %m/%d/%Y")
    time_str = now.strftime("%I:%M %p")
    return text.replace("{DATE}", date_str).replace("{TIME}", time_str)


def _parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="AI sidecar agent")
    p.add_argument("--prompt", help="Inline prompt text")
    p.add_argument("--prompt-file", help="Path to prompt markdown file")
    p.add_argument("--system-prompt", help="System prompt override")
    p.add_argument("--model", default="haiku", help="Model tier: haiku/sonnet/opus")
    p.add_argument("--max-turns", type=int, default=10)
    p.add_argument("--max-budget", type=float, default=None, help="Per-run budget cap in USD")
    p.add_argument("--allowed-tools", help="Comma-separated tool allowlist")
    p.add_argument("--job-id", default="default", help="Job identifier for budget tracking")
    return p.parse_args()


def main() -> None:
    args = _parse_args()

    if not check_budget():
        print("BUDGET_EXCEEDED", file=sys.stdout)
        print(f"Daily budget cap reached for job {args.job_id}", file=sys.stderr)
        sys.exit(1)

    prompt = _render_prompt(args.prompt, args.prompt_file)

    allowed_tools = None
    if args.allowed_tools:
        allowed_tools = [t.strip() for t in args.allowed_tools.split(",")]

    try:
        result = asyncio.run(
            run_step(
                prompt=prompt,
                system_prompt=args.system_prompt,
                model=args.model,
                allowed_tools=allowed_tools,
                max_turns=args.max_turns,
                max_budget_usd=args.max_budget,
                job_id=args.job_id,
            )
        )

        record_spend(args.job_id, result.cost_usd)
        print(result.text, end="")

    except Exception as e:
        print(f"Sidecar failed: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
