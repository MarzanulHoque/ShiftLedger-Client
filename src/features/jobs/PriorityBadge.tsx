import { Badge } from '@mantine/core';
import type { JobPriority } from '../../api/types';
import { PRIORITY_META } from '../../lib/statusColors';

export function PriorityBadge({ priority }: { priority: JobPriority }) {
  const meta = PRIORITY_META[priority];
  return (
    <Badge color={meta.color} variant={meta.variant} size="sm">
      {meta.label}
    </Badge>
  );
}
