import { Badge } from '@mantine/core';
import type { JobStatus } from '../../api/types';
import { STATUS_META } from '../../lib/statusColors';

export function JobStatusBadge({ status }: { status: JobStatus }) {
  const meta = STATUS_META[status];
  return (
    <Badge color={meta.color} variant={meta.variant}>
      {meta.label}
    </Badge>
  );
}
