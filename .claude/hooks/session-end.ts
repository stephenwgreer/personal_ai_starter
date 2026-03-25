#!/usr/bin/env bun
/**
 * Session End Hook — Boilerplate
 *
 * Captures a summary of each session and saves it to history/sessions/.
 * Uses the Anthropic API (Haiku) to generate a structured summary from
 * the conversation transcript.
 *
 * Requirements:
 * - ANTHROPIC_API_KEY in .claude/.env (or ~/.claude/api-keys.env)
 * - history/sessions/ directory exists
 *
 * Without an API key, this hook does nothing (fails silently).
 *
 * Extend this hook to:
 * - Send session summaries to Discord/Slack
 * - Update a Notion database with session metadata
 * - Promote key learnings to a persistent memory file
 * - Track tool usage patterns over time
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, resolve } from "path";

const HOOK_DIR = import.meta.dir;
const CLAUDE_DIR = resolve(HOOK_DIR, "..");
const REPO_ROOT = resolve(CLAUDE_DIR, "..");
const SESSIONS_DIR = join(REPO_ROOT, "history", "sessions");

// ── Environment ──────────────────────────────────────────

function loadEnvFile(path: string): void {
  try {
    let content = readFileSync(path, "utf-8");
    if (content.charCodeAt(0) === 0xfeff) content = content.slice(1);
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex <= 0) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      const value = trimmed.slice(eqIndex + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // File not found — skip silently
  }
}

function loadEnv(): void {
  loadEnvFile(join(CLAUDE_DIR, ".env"));
  const home = process.env.HOME || "";
  if (home) loadEnvFile(join(home, ".claude", "api-keys.env"));
}

// ── Types ────────────────────────────────────────────────

interface SessionEndPayload {
  session_id: string;
  transcript_path?: string;
  reason?: string;
  cwd?: string;
}

interface TranscriptEntry {
  type: string;
  message?: { role?: string; content?: unknown };
  tool_name?: string;
}

// ── Transcript Parsing ───────────────────────────────────

function parseTranscript(path: string): { messages: string[]; toolsUsed: string[] } {
  const messages: string[] = [];
  const toolsUsed: Set<string> = new Set();

  try {
    const content = readFileSync(path, "utf-8");
    for (const line of content.split("\n")) {
      if (!line.trim()) continue;
      try {
        const entry: TranscriptEntry = JSON.parse(line);

        // Extract user messages
        if (entry.type === "human" || entry.message?.role === "human") {
          const text =
            typeof entry.message?.content === "string"
              ? entry.message.content
              : JSON.stringify(entry.message?.content || "");
          if (text.length > 5) messages.push(text.slice(0, 500));
        }

        // Track tool usage
        if (entry.tool_name) toolsUsed.add(entry.tool_name);
      } catch {
        // Skip malformed lines
      }
    }
  } catch {
    // Transcript not found or unreadable
  }

  return { messages, toolsUsed: [...toolsUsed] };
}

// ── LLM Summary ──────────────────────────────────────────

async function generateSummary(messages: string[]): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const prompt = `Summarize this AI assistant session in structured markdown. Include:
- **Title**: A short descriptive title (one line)
- **Summary**: 2-3 sentences on what was accomplished
- **Decisions**: Any decisions made (bulleted list, or "None")
- **Learnings**: Insights or patterns worth remembering (bulleted list, or "None")
- **Next Steps**: Open items or follow-ups (bulleted list, or "None")

User messages from the session:
${messages.slice(0, 20).join("\n---\n")}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) return null;
    const data = (await response.json()) as any;
    return data.content?.[0]?.text || null;
  } catch {
    return null;
  }
}

// ── Main ─────────────────────────────────────────────────

try {
  loadEnv();

  const stdinData = await Bun.stdin.text();
  if (!stdinData.trim()) process.exit(0);

  const payload: SessionEndPayload = JSON.parse(stdinData);

  // Parse transcript if available
  const transcript = payload.transcript_path
    ? parseTranscript(payload.transcript_path)
    : { messages: [], toolsUsed: [] };

  // Noise gate: skip trivial sessions (2 or fewer messages)
  if (transcript.messages.length <= 2) process.exit(0);

  // Generate summary via LLM
  const summary = await generateSummary(transcript.messages);
  if (!summary) process.exit(0);

  // Write to history/sessions/
  mkdirSync(SESSIONS_DIR, { recursive: true });
  const date = new Date().toISOString().slice(0, 10);
  const slug = summary
    .split("\n")[0]
    ?.replace(/^#*\s*\**Title\**:?\s*/i, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .slice(0, 40)
    .toLowerCase()
    .replace(/-+$/, "") || "session";

  const filename = `${date}_${slug}.md`;
  const filepath = join(SESSIONS_DIR, filename);

  const content = `---
date: ${date}
session_id: ${payload.session_id}
tools: [${transcript.toolsUsed.join(", ")}]
messages: ${transcript.messages.length}
---

${summary}
`;

  writeFileSync(filepath, content);
} catch {
  // Never crash — session end must always succeed
}

process.exit(0);
