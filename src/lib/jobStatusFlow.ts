import type { JobStatus } from '../api/types';

const STATUS_ORDER: JobStatus[] = ['Received', 'InProgress', 'Completed', 'Delivered'];

// Mirrors the backend's J1 rule: one step forward always allowed, one step back
// allowed as an Admin correction, no skipping. Used to render only the legal moves
// instead of a free-form status picker.
export function adjacentStatuses(current: JobStatus): { back: JobStatus | null; forward: JobStatus | null } {
  const index = STATUS_ORDER.indexOf(current);
  return {
    back: index > 0 ? STATUS_ORDER[index - 1] : null,
    forward: index < STATUS_ORDER.length - 1 ? STATUS_ORDER[index + 1] : null,
  };
}
