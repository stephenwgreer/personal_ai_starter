#!/usr/bin/env bun
/**
 * Automation Daemon — Background Job Scheduler
 *
 * Reads jobs.yaml every minute, checks if any job is due,
 * executes steps in order, logs results.
 *
 * Supports two AI step types:
 *   - sidecar:     Full Mode (API key) — Agent SDK with full tool/skill/MCP access
 *   - claude-code:  Lite Mode (subscription) — claude --print, no tools
 *
 * Usage:
 *   bun run .claude/automation/daemon.ts
 */

import { readFileSync, writeFileSync, appendFileSync, mkdirSync, existsSync } from "fs";
import { join, resolve } from "path";
import { execSync, spawnSync } from "child_process";

// ── Paths ───────────────────────────────────────────────

const AUTOMATION_DIR = import.meta.dir;
const CLAUDE_DIR = resolve(AUTOMATION_DIR, "..");
const PROJECT_ROOT = resolve(CLAUDE_DIR, "..");
const STATE_FILE = join(AUTOMATION_DIR, ".state.json");
const RUNS_DIR = join(AUTOMATION_DIR, "runs");
const JOBS_FILE = join(AUTOMATION_DIR, "jobs.yaml");

// ── Load Environment ────────────────────────────────────

function loadEnv(): void {
  const envPath = join(CLAUDE_DIR, ".env");
  try {
    if (!existsSync(envPath)) return;
    let content = readFileSync(envPath, "utf-8");
    if (content.charCodeAt(0) === 0xfeff) content = content.slice(1);
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  } catch { /* non-fatal */ }
}

// ── YAML Parser (minimal — handles jobs.yaml format) ────

interface JobStep {
  type: "script" | "sidecar" | "claude-code" | "notify";
  run?: string;
  prompt?: string;
  prompt_file?: string;
  system_prompt?: string;
  model?: string;
  timeout?: number;
  max_turns?: number;
  allowed_tools?: string[];
  channel_id?: string;
  only_if_not?: string;
}

interface Job {
  name: string;
  schedule: string;
  timezone: string;
  enabled: boolean;
  steps: JobStep[];
  on_error?: string;
}

function parseJobsYaml(): Record<string, Job> {
  if (!existsSync(JOBS_FILE)) return {};

  const content = readFileSync(JOBS_FILE, "utf-8");
  const jobs: Record<string, Job> = {};

  let currentJob: string | null = null;
  let currentStep: Partial<JobStep> | null = null;
  const lines = content.split("\n");

  for (const line of lines) {
    if (line.trim().startsWith("#") || !line.trim()) continue;

    const indent = line.search(/\S/);

    // Job ID (2-space indent under "jobs:")
    if (indent === 2 && line.includes(":") && !line.trim().startsWith("-")) {
      currentJob = line.trim().replace(":", "");
      jobs[currentJob] = { name: "", schedule: "", timezone: "", enabled: false, steps: [] };
      currentStep = null;
      continue;
    }

    if (!currentJob || !jobs[currentJob]) continue;

    const trimmed = line.trim();

    // Job properties (4-space indent)
    if (indent === 4 && !trimmed.startsWith("-")) {
      const [key, ...valParts] = trimmed.split(":");
      const val = valParts.join(":").trim().replace(/^["']|["']$/g, "");

      if (key === "name") jobs[currentJob].name = val;
      if (key === "schedule") jobs[currentJob].schedule = val;
      if (key === "timezone") jobs[currentJob].timezone = val;
      if (key === "enabled") jobs[currentJob].enabled = val === "true";
      if (key === "on_error") jobs[currentJob].on_error = val;
    }

    // Steps array
    if (indent === 6 && trimmed.startsWith("- type:")) {
      currentStep = { type: trimmed.replace("- type:", "").trim() as JobStep["type"] };
      jobs[currentJob].steps.push(currentStep as JobStep);
      continue;
    }

    // Step properties (8-space indent)
    if (indent === 8 && currentStep) {
      const [key, ...valParts] = trimmed.split(":");
      const val = valParts.join(":").trim().replace(/^["']|["']$/g, "");

      if (key === "run") currentStep.run = val;
      if (key === "prompt") currentStep.prompt = val;
      if (key === "prompt_file") currentStep.prompt_file = val;
      if (key === "system_prompt") currentStep.system_prompt = val;
      if (key === "model") currentStep.model = val;
      if (key === "timeout") currentStep.timeout = parseInt(val);
      if (key === "max_turns") currentStep.max_turns = parseInt(val);
      if (key === "channel_id") currentStep.channel_id = val;
      if (key === "only_if_not") currentStep.only_if_not = val;
    }
  }

  return jobs;
}

// ── Cron Schedule Matching ──────────────────────────────

function parseCronField(field: string, min: number, max: number): number[] {
  const values: number[] = [];
  for (const part of field.split(",")) {
    if (part === "*") {
      for (let i = min; i <= max; i++) values.push(i);
    } else if (part.includes("/")) {
      const [range, stepStr] = part.split("/");
      const step = parseInt(stepStr);
      const start = range === "*" ? min : parseInt(range);
      for (let i = start; i <= max; i += step) values.push(i);
    } else if (part.includes("-")) {
      const [lo, hi] = part.split("-").map(Number);
      for (let i = lo; i <= hi; i++) values.push(i);
    } else {
      values.push(parseInt(part));
    }
  }
  return values;
}

function shouldRunNow(schedule: string, timezone: string, lastRun: string | null): boolean {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: timezone }));
  const [minF, hourF, domF, monF, dowF] = schedule.split(" ");

  const minutes = parseCronField(minF, 0, 59);
  const hours = parseCronField(hourF, 0, 23);
  const doms = parseCronField(domF, 1, 31);
  const months = parseCronField(monF, 1, 12);
  const dows = parseCronField(dowF, 0, 7).map((d) => (d === 7 ? 0 : d));

  const matches =
    minutes.includes(now.getMinutes()) &&
    hours.includes(now.getHours()) &&
    doms.includes(now.getDate()) &&
    months.includes(now.getMonth() + 1) &&
    dows.includes(now.getDay());

  if (!matches) return false;

  // Don't run twice in the same minute
  if (lastRun) {
    const lastRunLocal = new Date(new Date(lastRun).toLocaleString("en-US", { timeZone: timezone }));
    if (
      lastRunLocal.getFullYear() === now.getFullYear() &&
      lastRunLocal.getMonth() === now.getMonth() &&
      lastRunLocal.getDate() === now.getDate() &&
      lastRunLocal.getHours() === now.getHours() &&
      lastRunLocal.getMinutes() === now.getMinutes()
    ) {
      return false;
    }
  }

  return true;
}

// ── State Management ────────────────────────────────────

interface State {
  [jobId: string]: { last_run: string };
}

function loadState(): State {
  try {
    return JSON.parse(readFileSync(STATE_FILE, "utf-8"));
  } catch {
    return {};
  }
}

function saveState(state: State): void {
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// ── Logging ─────────────────────────────────────────────

function logRun(jobId: string, status: "ok" | "error", summary: string, durationMs: number): void {
  mkdirSync(RUNS_DIR, { recursive: true });
  const entry = JSON.stringify({
    ts: Date.now(),
    job_id: jobId,
    status,
    summary: summary.slice(0, 500),
    duration_ms: durationMs,
  });
  appendFileSync(join(RUNS_DIR, `${jobId}.jsonl`), entry + "\n");
}

// ── Step Executors ──────────────────────────────────────

function executeScript(step: JobStep): { success: boolean; output: string } {
  try {
    const output = execSync(step.run!, {
      timeout: (step.timeout || 300) * 1000,
      encoding: "utf-8",
      cwd: PROJECT_ROOT,
      stdio: ["pipe", "pipe", "pipe"],
    });
    return { success: true, output: output.trim() };
  } catch (e: any) {
    return { success: false, output: e.stderr || e.message || String(e) };
  }
}

function executeSidecar(step: JobStep, jobId: string): { success: boolean; output: string } {
  // Full Mode — Agent SDK with full project context
  const sidecarScript = join(AUTOMATION_DIR, "run-sidecar.py");
  const args: string[] = [
    "run", "--project", join(AUTOMATION_DIR, "sidecar"),
    "python", sidecarScript,
  ];

  if (step.prompt_file) {
    args.push("--prompt-file", join(AUTOMATION_DIR, step.prompt_file));
  } else if (step.prompt) {
    args.push("--prompt", step.prompt);
  }

  if (step.system_prompt) args.push("--system-prompt", step.system_prompt);
  if (step.model) args.push("--model", step.model);
  if (step.max_turns) args.push("--max-turns", String(step.max_turns));
  if (step.allowed_tools?.length) args.push("--allowed-tools", step.allowed_tools.join(","));
  args.push("--job-id", jobId);

  try {
    const env = { ...process.env };
    delete (env as any).CLAUDECODE;

    const result = spawnSync("uv", args, {
      timeout: (step.timeout || 180) * 1000,
      encoding: "utf-8",
      cwd: PROJECT_ROOT,
      stdio: ["pipe", "pipe", "pipe"],
      env,
    });

    if (result.status !== 0) {
      return { success: false, output: result.stderr || result.stdout || `Exit code: ${result.status}` };
    }

    return { success: true, output: result.stdout || "" };
  } catch (e: any) {
    return { success: false, output: `Sidecar error: ${e.message}` };
  }
}

function executeClaudeCode(step: JobStep): { success: boolean; output: string } {
  // Lite Mode — claude --print, uses subscription, no tools
  let prompt = "";

  if (step.prompt_file) {
    const promptPath = join(AUTOMATION_DIR, step.prompt_file);
    if (existsSync(promptPath)) {
      prompt = readFileSync(promptPath, "utf-8");
    } else {
      return { success: false, output: `Prompt file not found: ${step.prompt_file}` };
    }
  } else if (step.prompt) {
    prompt = step.prompt;
  } else {
    return { success: false, output: "No prompt or prompt_file specified" };
  }

  try {
    const output = execSync(
      `claude --print -m ${step.model || "haiku"} --max-turns ${step.max_turns || 3} "${prompt.slice(0, 2000).replace(/"/g, '\\"')}"`,
      {
        timeout: (step.timeout || 90) * 1000,
        cwd: PROJECT_ROOT,
        encoding: "utf-8",
      }
    );
    return { success: true, output: output.trim() };
  } catch (e: any) {
    return { success: false, output: `Claude CLI error: ${e.message?.slice(0, 500)}` };
  }
}

function executeNotify(step: JobStep, previousOutput: string | null): { success: boolean; output: string } {
  // Check suppression
  if (step.only_if_not && previousOutput?.includes(step.only_if_not)) {
    return { success: true, output: `Skipped (matched '${step.only_if_not}')` };
  }

  const message = previousOutput || "No output";

  // Try Discord bot token first, fall back to webhook
  const botToken = process.env.DISCORD_BOT_TOKEN;
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (botToken && step.channel_id) {
    return sendDiscordBot(step.channel_id, message, botToken);
  } else if (webhookUrl) {
    return sendDiscordWebhook(message, webhookUrl);
  }

  return { success: false, output: "No Discord bot token or webhook URL configured" };
}

function sendDiscordBot(channelId: string, content: string, token: string): { success: boolean; output: string } {
  const chunks: string[] = [];
  for (let i = 0; i < content.length; i += 1900) {
    chunks.push(content.slice(i, i + 1900));
  }

  for (const chunk of chunks) {
    const result = spawnSync("curl", [
      "-s", "-X", "POST",
      "-H", "Content-Type: application/json",
      "-H", `Authorization: Bot ${token}`,
      "-d", JSON.stringify({ content: chunk }),
      `https://discord.com/api/v10/channels/${channelId}/messages`,
    ], { encoding: "utf-8", timeout: 15000 });

    if (result.status !== 0) {
      return { success: false, output: `Discord API error: ${result.stderr}` };
    }
  }

  return { success: true, output: `Sent to Discord (${chunks.length} chunk(s))` };
}

function sendDiscordWebhook(content: string, webhookUrl: string): { success: boolean; output: string } {
  const result = spawnSync("curl", [
    "-s", "-X", "POST",
    "-H", "Content-Type: application/json",
    "-d", JSON.stringify({ content: content.slice(0, 2000) }),
    webhookUrl,
  ], { encoding: "utf-8", timeout: 15000 });

  if (result.status !== 0) {
    return { success: false, output: `Webhook error: ${result.stderr}` };
  }

  return { success: true, output: "Sent via webhook" };
}

// ── Main Loop ───────────────────────────────────────────

function tick(): void {
  const jobs = parseJobsYaml();
  const state = loadState();

  for (const [jobId, job] of Object.entries(jobs)) {
    if (!job.enabled) continue;

    const lastRun = state[jobId]?.last_run || null;
    if (!shouldRunNow(job.schedule, job.timezone, lastRun)) continue;

    console.log(`[${new Date().toISOString()}] Running: ${job.name} (${jobId})`);
    const start = performance.now();
    let output: string | null = null;
    let failed = false;

    for (let i = 0; i < job.steps.length; i++) {
      const step = job.steps[i];
      let result: { success: boolean; output: string };

      switch (step.type) {
        case "script":
          result = executeScript(step);
          break;
        case "sidecar":
          result = executeSidecar(step, jobId);
          break;
        case "claude-code":
          result = executeClaudeCode(step);
          break;
        case "notify":
          result = executeNotify(step, output);
          break;
        default:
          result = { success: false, output: `Unknown step type: ${step.type}` };
      }

      output = result.output;

      if (!result.success) {
        const duration = Math.round(performance.now() - start);
        logRun(jobId, "error", `Step ${i} (${step.type}) failed: ${output}`, duration);
        console.error(`[${new Date().toISOString()}] FAILED: ${jobId} step ${i}: ${output.slice(0, 200)}`);
        failed = true;
        break;
      }
    }

    if (!failed) {
      const duration = Math.round(performance.now() - start);
      logRun(jobId, "ok", (output || "").slice(0, 500), duration);
      console.log(`[${new Date().toISOString()}] Completed: ${jobId} (${duration}ms)`);
    }

    // Update state regardless of success/failure
    state[jobId] = { last_run: new Date().toISOString() };
    saveState(state);
  }
}

// ── Entry Point ─────────────────────────────────────────

loadEnv();
console.log(`Automation daemon started at ${new Date().toISOString()}`);
console.log(`Project root: ${PROJECT_ROOT}`);

// Run immediately, then every 60 seconds
tick();
setInterval(tick, 60_000);
