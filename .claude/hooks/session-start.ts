#!/usr/bin/env bun
/**
 * Session Start Hook
 *
 * Loads .env from .claude/ and prints a ready banner.
 * Paths derived from script location — works on any OS.
 *
 * Extend this hook to:
 * - Check for overdue tasks or reminders
 * - Verify API connectivity
 * - Print today's schedule
 */

import { readFileSync, existsSync } from "fs";
import { resolve, join } from "path";

const HOOK_DIR = import.meta.dir;
const CLAUDE_DIR = resolve(HOOK_DIR, "..");
const REPO_ROOT = resolve(CLAUDE_DIR, "..");
const envPath = join(CLAUDE_DIR, ".env");

// Load .env file
try {
  if (existsSync(envPath)) {
    let envFile = readFileSync(envPath, "utf-8");
    // Handle BOM (common on Windows)
    if (envFile.charCodeAt(0) === 0xfeff) envFile = envFile.slice(1);

    envFile.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const eqIndex = trimmed.indexOf("=");
        if (eqIndex > 0) {
          const key = trimmed.slice(0, eqIndex).trim();
          const value = trimmed.slice(eqIndex + 1).trim();
          if (!process.env[key]) process.env[key] = value;
        }
      }
    });
  }
} catch {
  // .env load failure is non-fatal
}

// Print ready banner
const aiName = process.env.AI_NAME || "AI";
console.log(`${aiName} ready`);
