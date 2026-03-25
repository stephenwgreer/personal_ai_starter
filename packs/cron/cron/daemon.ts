#!/usr/bin/env bun
/**
 * Cron Daemon — Background Job Scheduler
 *
 * Reads jobs.yaml every minute, checks if any job is due to run,
 * executes steps in order, and logs results.
 *
 * Usage:
 *   bun run .claude/cron/daemon.ts
 *
 * Jobs are defined in jobs.yaml with cron schedules.
 * State is tracked in .state.json (last run time per job).
 * Run logs are written to runs/ as JSONL.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, resolve } from "path";
import { execSync } from "child_process";

const CRON_DIR = import.meta.dir;
const CLAUDE_DIR = resolve(CRON_DIR, "..");
const REPO_ROOT = resolve(CLAUDE_DIR, "..");
const STATE_FILE = join(CRON_DIR, ".state.json");
const RUNS_DIR = join(CRON_DIR, "runs");

// ── Load Environment ─────────────────────────────────────

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

// ── YAML Parser (minimal — supports jobs.yaml format) ────

interface JobStep {
  type: "script" | "claude-code" | "notify";
  run?: string;
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
}

function parseJobsYaml(): Record<string, Job> {
  const yamlPath = join(CRON_DIR, "jobs.yaml");
  if (!existsSync(yamlPath)) return {};

  const content = readFileSync(yamlPath, "utf-8");
  const jobs: Record<string, Job> = {};

  // Simple YAML parser — handles the jobs.yaml format
  // For production use, consider a proper YAML library
  let currentJob: string | null = null;
  let currentStep: Partial<JobStep> | null = null;
  const lines = content.split("\n");

  for (const line of lines) {
    // Skip comments and empty lines
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

// ── Cron Schedule Matching ───────────────────────────────

function matchesCron(schedule: string, now: Date): boolean {
  const parts = schedule.split(/\s+/);
  if (parts.length !== 5) return false;

  const [minPat, hourPat, domPat, monPat, dowPat] = parts;
  const minute = now.getMinutes();
  const hour = now.getHours();
  const dom = now.getDate();
  const month = now.getMonth() + 1;
  const dow = now.getDay();

  return (
    matchField(minPat, minute) &&
    matchField(hourPat, hour) &&
    matchField(domPat, dom) &&
    matchField(monPat, month) &&
    matchField(dowPat, dow)
  );
}

function matchField(pattern: string, value: number): boolean {
  if (pattern === "*") return true;

  // Handle step values: */5
  if (pattern.startsWith("*/")) {
    const step = parseInt(pattern.slice(2));
    return value % step === 0;
  }

  // Handle ranges: 1-5
  if (pattern.includes("-")) {
    const [start, end] = pattern.split("-").map(Number);
    return value >= start && value <= end;
  }

  // Handle lists: 9,17
  if (pattern.includes(",")) {
    return pattern.split(",").map(Number).includes(value);
  }

  return parseInt(pattern) === value;
}

// ── State Management ─────────────────────────────────────

function loadState(): Record<string, string> {
  try {
    return JSON.parse(readFileSync(STATE_FILE, "utf-8"));
  } catch {
    return {};
  }
}

function saveState(state: Record<string, string>): void {
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// ── Step Execution ───────────────────────────────────────

function executeScript(step: JobStep): string {
  const timeout = (step.timeout || 60) * 1000;
  try {
    const output = execSync(step.run!, { timeout, cwd: REPO_ROOT, encoding: "utf-8" });
    return output.trim();
  } catch (e: any) {
    return `ERROR: ${e.message?.slice(0, 500) || "Script failed"}`;
  }
}

async function sendNotification(content: string, channelId?: string): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl || !content) return;

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: content.slice(0, 2000) }),
    });
  } catch { /* non-fatal */ }
}

// ── Log Run ──────────────────────────────────────────────

function logRun(jobId: string, status: string, output: string, durationMs: number): void {
  mkdirSync(RUNS_DIR, { recursive: true });
  const date = new Date().toISOString().slice(0, 10);
  const logFile = join(RUNS_DIR, `${date}.jsonl`);
  const entry = JSON.stringify({
    job: jobId,
    time: new Date().toISOString(),
    status,
    duration_ms: durationMs,
    output: output.slice(0, 1000),
  });
  writeFileSync(logFile, entry + "\n", { flag: "a" });
}

// ── Main Loop ────────────────────────────────────────────

async function tick(): Promise<void> {
  const jobs = parseJobsYaml();
  const state = loadState();
  const now = new Date();
  const nowKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}T${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  for (const [jobId, job] of Object.entries(jobs)) {
    if (!job.enabled) continue;
    if (!matchesCron(job.schedule, now)) continue;

    // Dedup: don't run same job twice in the same minute
    if (state[jobId] === nowKey) continue;

    console.log(`[${now.toISOString()}] Running: ${job.name}`);
    const start = Date.now();
    let lastOutput = "";

    for (const step of job.steps) {
      if (step.type === "script") {
        lastOutput = executeScript(step);
      } else if (step.type === "claude-code") {
        // Claude Code execution requires the CLI — run as subprocess
        const promptPath = step.prompt_file ? join(CRON_DIR, step.prompt_file) : null;
        if (promptPath && existsSync(promptPath)) {
          const prompt = readFileSync(promptPath, "utf-8");
          try {
            lastOutput = execSync(
              `claude --print -m ${step.model || "sonnet"} --max-turns ${step.max_turns || 5} "${prompt.slice(0, 2000).replace(/"/g, '\\"')}"`,
              { timeout: (step.timeout || 90) * 1000, cwd: REPO_ROOT, encoding: "utf-8" }
            );
          } catch (e: any) {
            lastOutput = `ERROR: ${e.message?.slice(0, 500) || "Claude failed"}`;
          }
        }
      } else if (step.type === "notify") {
        // Only notify if output doesn't match suppression string
        if (step.only_if_not && lastOutput.includes(step.only_if_not)) continue;
        await sendNotification(`**${job.name}**\n${lastOutput}`, step.channel_id);
      }
    }

    const duration = Date.now() - start;
    logRun(jobId, "ok", lastOutput, duration);
    state[jobId] = nowKey;
    saveState(state);
  }
}

// ── Entry Point ──────────────────────────────────────────

loadEnv();
console.log(`Cron daemon started at ${new Date().toISOString()}`);
console.log(`Repo root: ${REPO_ROOT}`);

// Run immediately, then every 60 seconds
tick();
setInterval(tick, 60_000);
