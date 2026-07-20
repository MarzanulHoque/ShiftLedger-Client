import type { JobPriority, JobStatus } from '../api/types';

type BadgeVariant = 'light' | 'filled' | 'outline';

interface StatusMeta {
  label: string;
  color: string;
  variant: BadgeVariant;
}

// Received = queued (neutral) -> InProgress = active work (steel) -> Completed = done well
// (success green) -> Delivered = closed out (solid neutral). Same hue family throughout except
// the one moment (Completed) that's worth calling out in green.
export const STATUS_META: Record<JobStatus, StatusMeta> = {
  Received: { label: 'Received', color: 'gray', variant: 'light' },
  InProgress: { label: 'In Progress', color: 'steel', variant: 'filled' },
  Completed: { label: 'Completed', color: 'success', variant: 'filled' },
  Delivered: { label: 'Delivered', color: 'gray', variant: 'filled' },
};

// High = danger red (filled, unmissable) -> Medium = brand orange (light) -> Low = neutral outline.
export const PRIORITY_META: Record<JobPriority, StatusMeta> = {
  High: { label: 'High', color: 'danger', variant: 'filled' },
  Medium: { label: 'Medium', color: 'brand', variant: 'light' },
  Low: { label: 'Low', color: 'gray', variant: 'outline' },
};
