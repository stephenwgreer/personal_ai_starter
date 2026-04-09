"""Sidecar runner — thin wrapper around Agent SDK query().

Uses setting_sources=["user", "project"] to inherit CLAUDE.md, skills,
and MCP servers from the project. Returns a simple StepResult.
"""

import sys
from dataclasses import dataclass

from claude_agent_sdk import (
    ClaudeSDKClient,
    ClaudeAgentOptions,
    AssistantMessage,
    ResultMessage,
    TextBlock,
)

from .config import MODELS, BUDGET_DEFAULTS, PROJECT_ROOT


@dataclass
class StepResult:
    text: str
    cost_usd: float = 0.0
    turns: int = 0
    session_id: str = ""


async def run_step(
    prompt: str,
    system_prompt: str | None = None,
    model: str = "haiku",
    allowed_tools: list[str] | None = None,
    max_turns: int = 10,
    max_budget_usd: float | None = None,
    job_id: str = "default",
    cwd: str | None = None,
) -> StepResult:
    """Run a single agent step with full project context."""
    resolved_model = MODELS.get(model, model)
    budget = max_budget_usd or BUDGET_DEFAULTS.get(job_id, BUDGET_DEFAULTS["default"])
    work_dir = cwd or str(PROJECT_ROOT)

    options = ClaudeAgentOptions(
        model=resolved_model,
        permission_mode="bypassPermissions",
        max_turns=max_turns,
        max_budget_usd=budget,
        cwd=work_dir,
        setting_sources=["user", "project"],
        **({"system_prompt": system_prompt} if system_prompt else {}),
        **({"allowed_tools": allowed_tools} if allowed_tools is not None else {}),
    )

    text = ""
    session_id = ""
    total_cost = 0.0
    num_turns = 0

    try:
        async with ClaudeSDKClient(options=options) as client:
            await client.query(prompt)

            async for message in client.receive_response():
                if isinstance(message, AssistantMessage):
                    for block in message.content:
                        if isinstance(block, TextBlock):
                            text += block.text

                elif isinstance(message, ResultMessage):
                    session_id = getattr(message, "session_id", "") or ""
                    total_cost = getattr(message, "total_cost_usd", 0.0) or 0.0
                    num_turns = getattr(message, "num_turns", 0) or 0

    except KeyboardInterrupt:
        raise
    except Exception as e:
        print(f"[sidecar error: {e}]", file=sys.stderr)
        raise

    return StepResult(
        text=text,
        cost_usd=total_cost,
        turns=num_turns,
        session_id=session_id,
    )
