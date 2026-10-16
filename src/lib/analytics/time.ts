/**
 * Analytics buckets use UK time (Europe/London), the business's timezone, so
 * "Thursday 19:00" means the same thing all year round, including summer time.
 */
export const ANALYTICS_TZ = "Europe/London";

const parts = new Intl.DateTimeFormat("en-GB", {
  timeZone: ANALYTICS_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  weekday: "short",
  hourCycle: "h23",
});
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** UK date ("2026-10-16"), hour (0 to 23) and weekday (0 = Monday) of an instant. */
export function ukParts(date: Date): { day: string; hour: number; wd: number } {
  const p = Object.fromEntries(parts.formatToParts(date).map((x) => [x.type, x.value]));
  return { day: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour) % 24, wd: WEEKDAYS.indexOf(p.weekday ?? "Mon") };
}

/** Calendar maths on "YYYY-MM-DD" day keys (timezone independent). */
export const addDays = (day: string, n: number) => {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

export const daysBetween = (from: string, to: string) =>
  Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86_400_000);

export function dayRange(from: string, to: string): string[] {
  const out: string[] = [];
  for (let d = from; d <= to && out.length < 800; d = addDays(d, 1)) out.push(d);
  return out;
}
