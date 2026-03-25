#!/usr/bin/env bun
/**
 * Security Validator — PreToolUse hook for Bash commands
 *
 * Validates commands against dangerous patterns before execution.
 * Self-contained (no imports) to avoid module resolution failures.
 *
 * Exit 0 = allow, Exit 2 = block.
 */

interface PreToolUsePayload {
  session_id: string;
  tool_name: string;
  tool_input: Record<string, unknown>;
}

const ATTACK_PATTERNS = {
  // Catastrophic deletions — always block
  catastrophic: {
    patterns: [
      /rm\s+(-rf?|--recursive)\s+[\/~]/i,
      /rm\s+(-rf?|--recursive)\s+\*/i,
      />\s*\/dev\/sd[a-z]/i,
      /mkfs\./i,
      /dd\s+if=.*of=\/dev/i,
    ],
    message: "BLOCKED: Catastrophic deletion/destruction detected",
  },

  // Reverse shells — always block
  reverseShell: {
    patterns: [
      /bash\s+-i\s+>&\s*\/dev\/tcp/i,
      /nc\s+(-e|--exec)\s+\/bin\/(ba)?sh/i,
      /python.*socket.*connect/i,
      /socat.*exec/i,
      /\|\s*\/bin\/(ba)?sh/i,
    ],
    message: "BLOCKED: Reverse shell pattern detected",
  },

  // Remote code execution — always block
  remotExec: {
    patterns: [
      /curl.*\|\s*(ba)?sh/i,
      /wget.*\|\s*(ba)?sh/i,
      /base64\s+-d.*\|\s*(ba)?sh/i,
    ],
    message: "BLOCKED: Remote code execution pattern detected",
  },

  // Infrastructure protection — always block
  infraProtection: {
    patterns: [
      /\brm\b.*\.claude/i,
    ],
    message: "BLOCKED: Infrastructure protection triggered",
  },
};

function validateCommand(command: string): { allowed: boolean; message?: string } {
  if (!command || command.length < 3) return { allowed: true };

  for (const tier of Object.values(ATTACK_PATTERNS)) {
    for (const pattern of tier.patterns) {
      if (pattern.test(command)) {
        return { allowed: false, message: tier.message };
      }
    }
  }

  return { allowed: true };
}

try {
  const stdinData = await Bun.stdin.text();
  if (!stdinData.trim()) process.exit(0);

  const payload: PreToolUsePayload = JSON.parse(stdinData);
  if (payload.tool_name !== "Bash") process.exit(0);

  const command = payload.tool_input?.command as string;
  if (!command) process.exit(0);

  const result = validateCommand(command);
  if (!result.allowed) {
    console.error(result.message);
    console.error(`Command: ${command.substring(0, 100)}`);
    process.exit(2);
  }
} catch {
  // Never crash — allow command on error
}

process.exit(0);
