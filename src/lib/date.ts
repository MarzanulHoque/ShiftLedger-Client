import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const browserZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

/** Renders a UTC instant (e.g. createdAtUtc, paidAtUtc) in the viewer's own browser zone. */
export function formatDateTime(utcIso: string | null | undefined, pattern = 'MMM D, YYYY h:mm A'): string {
  if (!utcIso) return '—';
  return dayjs.utc(utcIso).tz(browserZone).format(pattern);
}

/** Renders a DateOnly field (receivedDate, dueDate) — calendar date, no zone conversion. */
export function formatDate(dateOnly: string | null | undefined, pattern = 'MMM D, YYYY'): string {
  if (!dateOnly) return '—';
  return dayjs(dateOnly).format(pattern);
}

/** Converts a local date/time input value to a UTC ISO instant before sending to the API. */
export function localDateTimeToUtcIso(localValue: Date): string {
  return dayjs(localValue).utc().toISOString();
}

export function todayDateOnly(): string {
  return dayjs().format('YYYY-MM-DD');
}

export function isOverdue(dueDate: string | null | undefined): boolean {
  if (!dueDate) return false;
  return dayjs(dueDate).isBefore(dayjs(todayDateOnly()));
}

/** Short relative time for activity feeds ("5m ago", "3h ago", "2d ago"). */
export function timeAgo(utcIso: string): string {
  const diffMin = dayjs().diff(dayjs.utc(utcIso), 'minute');
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}
