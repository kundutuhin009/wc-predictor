import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

export const IST = "Asia/Kolkata";
export const LOCK_LEAD_MINUTES = 15;

// "14 Jun, 9:30 PM IST"
export function formatKickoffIST(iso: string): string {
  return formatInTimeZone(new Date(iso), IST, "d MMM, h:mm a") + " IST";
}

// "9:15 PM IST" — the moment predictions close (kickoff − 15 min).
export function formatCloseTimeIST(iso: string): string {
  const close = new Date(new Date(iso).getTime() - LOCK_LEAD_MINUTES * 60_000);
  return formatInTimeZone(close, IST, "h:mm a") + " IST";
}

// The instant predictions close, as epoch ms.
export function closeTimeMs(iso: string): number {
  return new Date(iso).getTime() - LOCK_LEAD_MINUTES * 60_000;
}

// Whether the window is still open, relative to the given reference time (ms).
// Server passes Date.now(); client passes its own clock for display only.
export function isWindowOpen(iso: string, nowMs: number): boolean {
  return closeTimeMs(iso) > nowMs;
}

// For datetime-local <-> UTC conversion in /admin (input is interpreted as IST).
// Returns "YYYY-MM-DDTHH:mm" representing the IST wall-clock of a UTC instant.
export function utcToISTLocalInput(iso: string): string {
  return formatInTimeZone(new Date(iso), IST, "yyyy-MM-dd'T'HH:mm");
}

// Inverse: a datetime-local string ("2026-06-14T21:30") typed by an admin is
// interpreted as IST wall-clock; return the corresponding UTC ISO string.
export function istLocalInputToUTC(local: string): string {
  return fromZonedTime(local, IST).toISOString();
}
