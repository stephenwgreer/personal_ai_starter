#!/usr/bin/env bun
/**
 * Calendar Sync — Fetches upcoming events from Google Calendar and writes to JSON.
 *
 * Runs headless via cron. No LLM needed.
 *
 * Usage:
 *   bun run calendar-sync.ts          # Fetch next 30 days
 *   bun run calendar-sync.ts --auth   # One-time OAuth setup
 *
 * Prerequisites:
 *   - bun add googleapis
 *   - OAuth client_secret.json in DATA_DIR
 *   - Run --auth once to generate token.json
 */

import { google, type calendar_v3 } from "googleapis";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { createServer } from "http";

// ── Configuration ───────────────────────────────────────────

const PROJECT_ROOT = join(dirname(new URL(import.meta.url).pathname), "..", "..");
const DATA_DIR = join(PROJECT_ROOT, "data", "calendar");
const CRED_PATH = join(DATA_DIR, "client_secret.json");
const TOKEN_PATH = join(DATA_DIR, "token.json");
const OUTPUT_PATH = join(DATA_DIR, "upcoming.json");
const STATE_PATH = join(DATA_DIR, "reminder-state.json");

const CONFIG = {
  // Add your calendar IDs here.
  // Share each calendar with your AI's Google account for access.
  calendars: [
    { id: "primary", label: "AI Calendar", access: "owner" as const },
    // { id: "you@gmail.com", label: "Personal", access: "writer" as const },
    // { id: "partner@gmail.com", label: "Partner", access: "reader" as const },
  ],
  timezone: "America/Denver",
  lookaheadDays: 30,
  scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
};

// ── Types ───────────────────────────────────────────────────

interface CalendarEvent {
  id: string;
  calendarId: string;
  calendarLabel: string;
  summary: string;
  description?: string;
  location?: string;
  start: string; // ISO date or datetime
  end: string;
  allDay: boolean;
  recurring: boolean;
  eventType: string;
  attendeeCount: number;
  importance: "birthday" | "travel" | "anniversary" | "normal";
}

interface SyncOutput {
  syncedAt: string;
  timezone: string;
  lookaheadDays: number;
  calendars: { id: string; label: string }[];
  events: CalendarEvent[];
}

// ── Auth ────────────────────────────────────────────────────

function loadCredentials() {
  if (!existsSync(CRED_PATH)) {
    console.error(`Missing credentials: ${CRED_PATH}`);
    console.error("Download OAuth client_secret.json from Google Cloud Console.");
    process.exit(1);
  }
  const creds = JSON.parse(readFileSync(CRED_PATH, "utf-8"));
  const { client_id, client_secret, redirect_uris } = creds.installed || creds.web;
  return new google.auth.OAuth2(client_id, client_secret, redirect_uris?.[0] || "http://localhost:3000/callback");
}

function loadToken(oauth2: InstanceType<typeof google.auth.OAuth2>) {
  if (!existsSync(TOKEN_PATH)) {
    console.error(`Missing token: ${TOKEN_PATH}`);
    console.error("Run: bun run calendar-sync.ts --auth");
    process.exit(1);
  }
  const token = JSON.parse(readFileSync(TOKEN_PATH, "utf-8"));
  oauth2.setCredentials(token);

  // Auto-refresh and save updated token
  oauth2.on("tokens", (newTokens) => {
    const merged = { ...token, ...newTokens };
    writeFileSync(TOKEN_PATH, JSON.stringify(merged, null, 2));
    console.log("Token refreshed and saved.");
  });
}

async function runAuthFlow() {
  const oauth2 = loadCredentials();
  const authUrl = oauth2.generateAuthUrl({
    access_type: "offline",
    scope: CONFIG.scopes,
    prompt: "consent",
  });

  console.log("\n  Open this URL in your browser:\n");
  console.log(`  ${authUrl}\n`);

  // Start a temporary local server to catch the callback
  return new Promise<void>((resolve) => {
    const server = createServer(async (req, res) => {
      const url = new URL(req.url!, `http://localhost:3000`);
      const code = url.searchParams.get("code");
      if (!code) {
        res.end("No code received. Try again.");
        return;
      }

      try {
        const { tokens } = await oauth2.getToken(code);
        mkdirSync(dirname(TOKEN_PATH), { recursive: true });
        writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
        res.end("Auth complete! You can close this tab.");
        console.log(`  Token saved to ${TOKEN_PATH}`);
        server.close();
        resolve();
      } catch (err) {
        res.end(`Error: ${err}`);
        console.error("Auth failed:", err);
        server.close();
        process.exit(1);
      }
    });

    server.listen(3000, () => {
      console.log("  Waiting for OAuth callback on http://localhost:3000 ...\n");
    });
  });
}

// ── Event Classification ────────────────────────────────────

function classifyImportance(event: calendar_v3.Schema$Event): CalendarEvent["importance"] {
  const summary = (event.summary || "").toLowerCase();
  const description = (event.description || "").toLowerCase();
  const combined = `${summary} ${description}`;

  if (/birthday|bday|b-day/.test(combined)) return "birthday";
  if (/anniversary|wedding/.test(combined)) return "anniversary";
  if (/flight|train|hotel|airbnb|stay at|reservation.*air|amtrak|departure|arrival/.test(combined)) return "travel";
  return "normal";
}

// ── Fetch Events ────────────────────────────────────────────

async function fetchCalendarEvents(
  calendar: (typeof CONFIG.calendars)[number],
  calendarApi: calendar_v3.Calendar
): Promise<CalendarEvent[]> {
  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() + CONFIG.lookaheadDays);

  try {
    const response = await calendarApi.events.list({
      calendarId: calendar.id,
      timeMin: now.toISOString(),
      timeMax: end.toISOString(),
      timeZone: CONFIG.timezone,
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 250,
    });

    return (response.data.items || []).map((event) => ({
      id: event.id || "",
      calendarId: calendar.id,
      calendarLabel: calendar.label,
      summary: event.summary || "(no title)",
      description: event.description,
      location: event.location,
      start: event.start?.dateTime || event.start?.date || "",
      end: event.end?.dateTime || event.end?.date || "",
      allDay: !!event.start?.date,
      recurring: !!event.recurringEventId,
      eventType: event.eventType || "default",
      attendeeCount: event.attendees?.length || 0,
      importance: classifyImportance(event),
    }));
  } catch (err: any) {
    console.error(`  Error fetching ${calendar.label} (${calendar.id}):`, err.message);
    return [];
  }
}

// ── Main ────────────────────────────────────────────────────

async function main() {
  // Handle --auth flag
  if (process.argv.includes("--auth")) {
    await runAuthFlow();
    return;
  }

  // Ensure data directory exists
  mkdirSync(DATA_DIR, { recursive: true });

  // Initialize reminder state if missing
  if (!existsSync(STATE_PATH)) {
    writeFileSync(STATE_PATH, JSON.stringify({ acknowledged: {} }, null, 2));
  }

  // Auth
  const oauth2 = loadCredentials();
  loadToken(oauth2);
  const calendarApi = google.calendar({ version: "v3", auth: oauth2 });

  console.log(`Calendar sync — fetching next ${CONFIG.lookaheadDays} days...`);

  // Fetch all calendars in parallel
  const results = await Promise.all(
    CONFIG.calendars.map((cal) => fetchCalendarEvents(cal, calendarApi))
  );

  const allEvents = results
    .flat()
    .sort((a, b) => a.start.localeCompare(b.start));

  // Deduplicate by event ID (same event might appear on multiple shared calendars)
  const seen = new Set<string>();
  const deduped = allEvents.filter((e) => {
    if (seen.has(e.id)) return false;
    seen.add(e.id);
    return true;
  });

  const output: SyncOutput = {
    syncedAt: new Date().toISOString(),
    timezone: CONFIG.timezone,
    lookaheadDays: CONFIG.lookaheadDays,
    calendars: CONFIG.calendars.map((c) => ({ id: c.id, label: c.label })),
    events: deduped,
  };

  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));

  // Summary
  const birthdays = deduped.filter((e) => e.importance === "birthday").length;
  const travel = deduped.filter((e) => e.importance === "travel").length;
  console.log(`  ${deduped.length} events synced (${birthdays} birthdays, ${travel} travel)`);
  console.log(`  Written to ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error("Calendar sync failed:", err);
  process.exit(1);
});
