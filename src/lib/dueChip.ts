import dayjs from 'dayjs';

export interface DueChip {
  label: string;
  overdue: boolean;
  // Due today through 6 days out — the same window as the "Due <weekday>" label below.
  soon: boolean;
}

export function dueChip(dueDate: string | null | undefined): DueChip {
  if (!dueDate) return { label: '—', overdue: false, soon: false };

  const today = dayjs().startOf('day');
  const due = dayjs(dueDate).startOf('day');
  const diffDays = due.diff(today, 'day');

  if (diffDays < 0) return { label: `Overdue ${Math.abs(diffDays)}d`, overdue: true, soon: false };
  if (diffDays === 0) return { label: 'Due today', overdue: false, soon: true };
  if (diffDays <= 6) return { label: `Due ${due.format('ddd')}`, overdue: false, soon: true };
  return { label: `Due ${due.format('MMM D')}`, overdue: false, soon: false };
}
