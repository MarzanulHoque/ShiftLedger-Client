import { useDraggable } from '@dnd-kit/core';
import { ActionIcon, Avatar, Badge, Card, Group, Text, Tooltip } from '@mantine/core';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import type { JobDto } from '../../api/types';
import { dueChip } from '../../lib/dueChip';
import { initials } from '../../lib/initials';
import { adjacentStatuses } from '../../lib/jobStatusFlow';
import { useMechanics } from '../users/queries';
import { useChangeJobStatus } from './mutations';
import { PRIORITY_META } from '../../lib/statusColors';

export function JobCard({ job }: { job: JobDto }) {
  const { data: mechanics } = useMechanics();
  const changeStatus = useChangeJobStatus(job.id);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: job.id });
  const { back, forward } = adjacentStatuses(job.status);
  const mechanic = mechanics?.find((m) => m.id === job.assignedMechanicId);
  const due = dueChip(job.dueDate);
  const priorityColor = PRIORITY_META[job.priority].color;

  return (
    <Card
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      withBorder
      padding="sm"
      component={Link}
      to={`/jobs/${job.id}`}
      style={{
        textDecoration: 'none',
        touchAction: 'none',
        cursor: 'grab',
        opacity: isDragging ? 0.4 : 1,
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        zIndex: isDragging ? 1 : undefined,
        position: 'relative',
      }}
    >
      <Group justify="space-between" wrap="nowrap" mb={4}>
        <Text fw={600} size="sm" c="var(--mantine-color-text)" lineClamp={1}>
          {job.title}
        </Text>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            flexShrink: 0,
            background: job.priority === 'High' ? `var(--mantine-color-${priorityColor}-6)` : 'transparent',
            border: job.priority !== 'High' ? `1px solid var(--mantine-color-${priorityColor}-6)` : 'none',
          }}
        />
      </Group>
      <Text size="xs" c="dimmed" mb={6}>
        {job.bikeModel}
      </Text>
      <Group justify="space-between" align="center">
        <Badge size="xs" variant="outline" color={due.overdue ? 'danger' : 'gray'}>
          {due.label}
        </Badge>
        {mechanic && (
          <Tooltip label={mechanic.fullName}>
            <Avatar size={20} radius="xl" color="steel">
              <Text fz={9} fw={700}>
                {initials(mechanic.fullName)}
              </Text>
            </Avatar>
          </Tooltip>
        )}
      </Group>
      {(back || forward) && (
        <Group justify="space-between" mt={6}>
          <ActionIcon
            variant="subtle"
            size="sm"
            disabled={!back}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.preventDefault();
              if (back) changeStatus.mutate(back);
            }}
            aria-label="Move back one status"
          >
            <IconChevronLeft size={14} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            size="sm"
            disabled={!forward}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.preventDefault();
              if (forward) changeStatus.mutate(forward);
            }}
            aria-label="Advance to next status"
          >
            <IconChevronRight size={14} />
          </ActionIcon>
        </Group>
      )}
    </Card>
  );
}
