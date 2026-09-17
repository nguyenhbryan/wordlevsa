export function mondayFor(date = new Date()) {
  const value = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = value.getUTCDay() || 7;
  value.setUTCDate(value.getUTCDate() - day + 1);
  return value;
}
export function isoDate(date: Date) { return date.toISOString().slice(0, 10); }
export function nextMonday(date = new Date()) { const monday = mondayFor(date); monday.setUTCDate(monday.getUTCDate() + 7); return monday; }
export function endOfWeek(startsOn: string) { const end = new Date(`${startsOn}T00:00:00Z`); end.setUTCDate(end.getUTCDate() + 6); return end; }
export function weekNumber(date: Date) {
  const value = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  value.setUTCDate(value.getUTCDate() + 4 - (value.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(value.getUTCFullYear(), 0, 1));
  return Math.ceil((((value.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}
export function formatWeek(startsOn: string) {
  const start = new Date(`${startsOn}T00:00:00Z`); const end = endOfWeek(startsOn);
  const month = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" });
  if (start.getUTCMonth() === end.getUTCMonth()) return `${month.format(start)} ${start.getUTCDate()}–${end.getUTCDate()}`.toUpperCase();
  return `${month.format(start)} ${start.getUTCDate()}–${month.format(end)} ${end.getUTCDate()}`.toUpperCase();
}
