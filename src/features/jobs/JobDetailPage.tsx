import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Grid,
  Group,
  Loader,
  Paper,
  Select,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { modals } from '@mantine/modals';
import { formatDate } from '../../lib/date';
import { adjacentStatuses } from '../../lib/jobStatusFlow';
import { STATUS_META } from '../../lib/statusColors';
import { useMechanics } from '../users/queries';
import { BillPanel } from '../billing/BillPanel';
import { useJob } from './queries';
import { useAssignMechanic, useChangeJobStatus, useDeleteJob } from './mutations';
import { JobStatusBadge } from './JobStatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { EditJobModal } from './EditJobModal';
import { JobComments } from './JobComments';
import { JobHistory } from './JobHistory';

export function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: job, isLoading } = useJob(id ?? '');
  const { data: mechanics } = useMechanics();
  const changeStatus = useChangeJobStatus(id ?? '');
  const assignMechanic = useAssignMechanic(id ?? '');
  const deleteJob = useDeleteJob();
  const [editOpened, setEditOpened] = useState(false);

  if (isLoading) return <Loader />;
  if (!job) return <Text c="dimmed">Job not found.</Text>;

  const { back, forward } = adjacentStatuses(job.status);

  function confirmDelete() {
    modals.openConfirmModal({
      title: 'Delete job',
      children: <Text size="sm">Delete "{job!.title}"? This cannot be undone.</Text>,
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'danger' },
      onConfirm: async () => {
        await deleteJob.mutateAsync(job!.id);
        navigate('/jobs');
      },
    });
  }

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-start">
        <div>
          <Title order={3}>
            {job.title} <Text span c="dimmed" fw={400} fz="lg">— {job.bikeModel}</Text>
          </Title>
          <Group gap="xs" mt={4}>
            <JobStatusBadge status={job.status} />
            <PriorityBadge priority={job.priority} />
          </Group>
        </div>
        <Group>
          <Button variant="default" onClick={() => setEditOpened(true)}>
            Edit
          </Button>
          <Button variant="outline" color="danger" onClick={confirmDelete}>
            Delete
          </Button>
        </Group>
      </Group>

      <Grid>
        <Grid.Col span={{ base: 12, md: 7 }}>
          <Stack gap="md">
            <Paper withBorder p="md">
              <Title order={5} mb="sm">
                Job
              </Title>
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    Status
                  </Text>
                  <Group gap="xs">
                    <Button size="xs" variant="default" disabled={!back} onClick={() => back && changeStatus.mutate(back)}>
                      ← {back ? STATUS_META[back].label : ''}
                    </Button>
                    <Button size="xs" disabled={!forward} onClick={() => forward && changeStatus.mutate(forward)}>
                      {forward ? STATUS_META[forward].label : ''} →
                    </Button>
                  </Group>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    Mechanic
                  </Text>
                  <Select
                    placeholder="Unassigned"
                    data={mechanics?.map((m) => ({ value: m.id, label: m.fullName })) ?? []}
                    value={job.assignedMechanicId}
                    onChange={(value) => value && assignMechanic.mutate(value)}
                    w={200}
                  />
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    Received / Due
                  </Text>
                  <Text size="sm" className="tabular-nums">
                    {formatDate(job.receivedDate)} / {formatDate(job.dueDate)}
                  </Text>
                </Group>
                {job.description && (
                  <Text size="sm" mt="xs">
                    {job.description}
                  </Text>
                )}
              </Stack>
            </Paper>

            <JobComments jobId={job.id} />
            <JobHistory jobId={job.id} />
          </Stack>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 5 }}>
          <BillPanel jobId={job.id} />
        </Grid.Col>
      </Grid>

      <EditJobModal opened={editOpened} onClose={() => setEditOpened(false)} job={job} />
    </Stack>
  );
}
