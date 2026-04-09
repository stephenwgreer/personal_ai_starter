"""Cross-run state with atomic writes.

Temp file + rename prevents corruption from mid-write crashes.
"""

import json
import os
import tempfile
from pathlib import Path


def load_state(path: Path) -> dict:
    """Load JSON state, returning empty dict on missing/corrupt."""
    try:
        return json.loads(path.read_text())
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def save_state(path: Path, data: dict) -> None:
    """Atomic write: temp file in same directory + os.rename."""
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp_path = tempfile.mkstemp(dir=path.parent, suffix=".tmp")
    try:
        with os.fdopen(fd, "w") as f:
            json.dump(data, f, indent=2)
        os.rename(tmp_path, str(path))
    except Exception:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass
        raise
