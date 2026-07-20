import dayjs from 'dayjs';

export interface DueChip {
  label: string;
  overdue: boolean;
}

export function dueChip(dueDate: string | null | undefined): DueChip {
  if (!dueDate) return { label: '—', overdue: false };

  const today = dayjs().startOf('day');
  const due = dayjs(dueDate).startOf('day');
  const diffDays = due.diff(today, 'day');

  if (diffDays < 0) return { label: `Overdue ${Math.abs(diffDays)}d`, overdue: true };
  if (diffDays === 0) return { label: 'Due today', overdue: false };
  if (diffDays <= 6) return { label: `Due ${due.format('ddd')}`, overdue: false };
  return { label: `Due ${due.format('MMM D')}`, overdue: false };
}
