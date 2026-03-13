import { processScheduledCampaigns } from "@/lib/scheduler";

const SCHEDULER_INTERVAL_MS = 60_000; // Check every minute

let started = false;

export function startScheduler() {
  if (started) return;
  started = true;

  console.log("[Scheduler] Started - checking every 60s");

  // Initial check
  processScheduledCampaigns().catch(console.error);

  // Periodic check
  setInterval(() => {
    processScheduledCampaigns().catch(console.error);
  }, SCHEDULER_INTERVAL_MS);
}
