import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, Group, SegmentedControl, Select, Stack, Title } from '@mantine/core';
import type { JobStatus } from '../../api/types';
import { useMechanics } from '../users/queries';
import { useJobBoard } from './queries';
import { JobsBoard } from './JobsBoard';
import { JobsList } from './JobsList';
import { CreateJobModal } from './CreateJobModal';

type View = 'board' | 'list';

export function JobsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = useState<View>('board');
  const [createOpened, setCreateOpened] = useState(false);
  const [mechanicId, setMechanicId] = useState<string | null>(null);
  const [status, setStatus] = useState<JobStatus | null>(null);
  const [page, setPage] = useState(1);

  const { data: mechanics } = useMechanics();
  const { data: boardJobs, isLoading: boardLoading } = useJobBoard(mechanicId ?? undefined);

  // Deep link from the dashboard's "+ New job" quick action (/jobs?new=1).
  useEffect(() => {
    if (searchParams.has('new')) {
      setCreateOpened(true);
      setSearchParams((params) => {
        params.delete('new');
        return params;
      }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={3}>Jobs</Title>
        <Button onClick={() => setCreateOpened(true)}>+ New job</Button>
      </Group>

      <Group justify="space-between">
        <SegmentedControl
          value={view}
          onChange={(value) => setView(value as View)}
          data={[
            { value: 'board', label: 'Board' },
            { value: 'list', label: 'List' },
          ]}
        />
        {view === 'board' && (
          <Select
            placeholder="Mechanic: All"
            clearable
            data={mechanics?.map((m) => ({ value: m.id, label: m.fullName })) ?? []}
            value={mechanicId}
            onChange={setMechanicId}
            w={200}
          />
        )}
      </Group>

      {view === 'board' ? (
        !boardLoading && <JobsBoard jobs={boardJobs?.items ?? []} />
      ) : (
        <JobsList
          status={status}
          mechanicId={mechanicId}
          onStatusChange={setStatus}
          onMechanicChange={setMechanicId}
          page={page}
          onPageChange={setPage}
        />
      )}

      <CreateJobModal opened={createOpened} onClose={() => setCreateOpened(false)} />
    </Stack>
  );
}
