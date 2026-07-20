import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { Card, Grid, Group, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import type { JobDto, JobStatus } from '../../api/types';
import { adjacentStatuses } from '../../lib/jobStatusFlow';
import { STATUS_META } from '../../lib/statusColors';
import { JobCard } from './JobCard';
import { useChangeAnyJobStatus } from './mutations';

const COLUMNS: JobStatus[] = ['Received', 'InProgress', 'Completed', 'Delivered'];

function Column({ status, jobs }: { status: JobStatus; jobs: JobDto[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <Stack
      ref={setNodeRef}
      gap="xs"
      mih={80}
      p={4}
      style={{
        borderRadius: 4,
        outline: isOver ? '2px dashed var(--mantine-color-brand-5)' : undefined,
        outlineOffset: 2,
        transition: 'outline-color 100ms ease',
      }}
    >
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
      {jobs.length === 0 && (
        <Text size="xs" c="dimmed" ta="center" py="md">
          —
        </Text>
      )}
    </Stack>
  );
}

export function JobsBoard({ jobs }: { jobs: JobDto[] }) {
  const [activeJob, setActiveJob] = useState<JobDto | null>(null);
  const changeStatus = useChangeAnyJobStatus();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  function handleDragStart(event: DragStartEvent) {
    setActiveJob(jobs.find((j) => j.id === event.active.id) ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveJob(null);
    const { active, over } = event;
    if (!over) return;

    const job = jobs.find((j) => j.id === active.id);
    const targetStatus = over.id as JobStatus;
    if (!job || targetStatus === job.status) return;

    const { back, forward } = adjacentStatuses(job.status);
    if (targetStatus !== back && targetStatus !== forward) {
      notifications.show({
        color: 'danger',
        title: 'Not allowed',
        message: `A job moves one status at a time — drop it on ${STATUS_META[job.status].label}'s neighboring column.`,
      });
      return;
    }

    changeStatus.mutate({ id: job.id, newStatus: targetStatus });
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <Grid>
        {COLUMNS.map((status) => {
          const columnJobs = jobs.filter((j) => j.status === status);
          return (
            <Grid.Col key={status} span={{ base: 12, xs: 6, md: 3 }}>
              <Group justify="space-between" mb="xs">
                <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                  {STATUS_META[status].label}
                </Text>
                <Text size="xs" c="dimmed">
                  {columnJobs.length}
                </Text>
              </Group>
              <Column status={status} jobs={columnJobs} />
            </Grid.Col>
          );
        })}
      </Grid>

      <DragOverlay>
        {activeJob && (
          <Card withBorder padding="sm" shadow="md">
            <Text fw={600} size="sm">
              {activeJob.title}
            </Text>
            <Text size="xs" c="dimmed">
              {activeJob.bikeModel}
            </Text>
          </Card>
        )}
      </DragOverlay>
    </DndContext>
  );
}
