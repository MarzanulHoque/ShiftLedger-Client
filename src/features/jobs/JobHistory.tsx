import { Paper, Stack, Text, Title } from '@mantine/core';
import { formatDateTime } from '../../lib/date';
import { useUsers } from '../users/queries';
import { useJobHistory } from './queries';

export function JobHistory({ jobId }: { jobId: string }) {
  const { data: history } = useJobHistory(jobId);
  const { data: users } = useUsers();

  return (
    <Paper withBorder p="md">
      <Title order={5} mb="sm">
        History
      </Title>
      <Stack gap={6}>
        {history?.length ? (
          history.map((entry, index) => (
            <Text size="xs" key={index} c="dimmed">
              <Text span fw={600} c="var(--mantine-color-text)">
                {entry.action}
              </Text>{' '}
              by {users?.find((u) => u.id === entry.changedById)?.fullName ?? 'System'} ·{' '}
              {formatDateTime(entry.changedAtUtc)}
            </Text>
          ))
        ) : (
          <Text size="sm" c="dimmed">
            No history yet.
          </Text>
        )}
      </Stack>
    </Paper>
  );
}
