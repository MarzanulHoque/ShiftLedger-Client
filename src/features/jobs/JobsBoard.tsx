import { Grid, Group, Stack, Text } from '@mantine/core';
import type { JobDto, JobStatus } from '../../api/types';
import { STATUS_META } from '../../lib/statusColors';
import { JobCard } from './JobCard';

const COLUMNS: JobStatus[] = ['Received', 'InProgress', 'Completed', 'Delivered'];

export function JobsBoard({ jobs }: { jobs: JobDto[] }) {
  return (
    <Grid>
      {COLUMNS.map((status) => {
        const columnJobs = jobs.filter((j) => j.status === status);
        return (
          <Grid.Col key={status} span={{ base: 12, xs: 6, md: 3 }}>
            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                  {STATUS_META[status].label}
                </Text>
                <Text size="xs" c="dimmed">
                  {columnJobs.length}
                </Text>
              </Group>
              <Stack gap="xs" mih={80}>
                {columnJobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
                {columnJobs.length === 0 && (
                  <Text size="xs" c="dimmed" ta="center" py="md">
                    —
                  </Text>
                )}
              </Stack>
            </Stack>
          </Grid.Col>
        );
      })}
    </Grid>
  );
}
