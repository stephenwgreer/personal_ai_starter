/**
 * Observability Library — Boilerplate
 *
 * Provides utility functions for hooks to send events to external services.
 * Extend this to integrate with Discord, Slack, dashboards, or logging systems.
 */

export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Send an event to a Discord webhook.
 * Fails silently if DISCORD_WEBHOOK_URL is not set.
 */
export async function sendDiscordMessage(content: string): Promise<void> {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) return;

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: content.slice(0, 2000) }),
    });
  } catch {
    // Notification failure is non-fatal
  }
}

/**
 * Generic event sender — extend for your observability stack.
 *
 * Ideas:
 * - Send to a local SQLite database for analytics
 * - Post to a Slack channel
 * - Write to a structured log file
 * - Push to a Notion database
 */
export async function sendEvent(
  eventType: string,
  data: Record<string, unknown>
): Promise<void> {
  // Default: send to Discord if available
  const summary = `**${eventType}**\n${JSON.stringify(data, null, 2).slice(0, 1800)}`;
  await sendDiscordMessage(summary);
}
