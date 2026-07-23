import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, Group, SegmentedControl, Select, Stack, Title } from '@mantine/core';
import type { JobPriority, JobStatus } from '../../api/types';
import { useAuthStore } from '../../auth/store';
import { dueChip } from '../../lib/dueChip';
import { useDepartments } from '../departments/queries';
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
  const [departmentId, setDepartmentId] = useState<string | null>(null);
  const [priority, setPriority] = useState<JobPriority | null>(null);
  const [dueFilter, setDueFilter] = useState<'overdue' | 'soon' | null>(null);
  const [status, setStatus] = useState<JobStatus | null>(null);
  const [page, setPage] = useState(1);

  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = user?.role === 'SuperAdmin';
  const { data: mechanics } = useMechanics();
  const { data: departments } = useDepartments();
  const { data: boardJobs, isLoading: boardLoading } = useJobBoard(mechanicId ?? undefined, departmentId ?? undefined);
  // Client-side: the board already pulls the caller's full (department-scoped) job set in one
  // page, so these filter dimensions don't need their own backend query params.
  let boardItems = boardJobs?.items;
  if (priority) boardItems = boardItems?.filter((j) => j.priority === priority);
  if (dueFilter) {
    boardItems = boardItems?.filter((j) => {
      const chip = dueChip(j.dueDate);
      return dueFilter === 'overdue' ? chip.overdue : chip.soon;
    });
  }

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
          <Group gap="sm">
            {isSuperAdmin && (
              <Select
                placeholder="Department: All"
                clearable
                data={departments?.map((d) => ({ value: d.id, label: d.name })) ?? []}
                value={departmentId}
                onChange={setDepartmentId}
                w={200}
              />
            )}
            <Select
              placeholder="Priority: All"
              clearable
              data={['Low', 'Medium', 'High']}
              value={priority}
              onChange={(value) => setPriority(value as JobPriority | null)}
              w={160}
            />
            <Select
              placeholder="Due: All"
              clearable
              data={[
                { value: 'overdue', label: 'Overdue' },
                { value: 'soon', label: 'Due soon' },
              ]}
              value={dueFilter}
              onChange={(value) => setDueFilter(value as 'overdue' | 'soon' | null)}
              w={160}
            />
            <Select
              placeholder="Mechanic: All"
              clearable
              data={mechanics?.map((m) => ({ value: m.id, label: m.fullName })) ?? []}
              value={mechanicId}
              onChange={setMechanicId}
              w={200}
            />
          </Group>
        )}
      </Group>

      {view === 'board' ? (
        !boardLoading && <JobsBoard jobs={boardItems ?? []} />
      ) : (
        <JobsList
          status={status}
          mechanicId={mechanicId}
          departmentId={departmentId}
          onStatusChange={setStatus}
          onMechanicChange={setMechanicId}
          onDepartmentChange={setDepartmentId}
          page={page}
          onPageChange={setPage}
        />
      )}

      <CreateJobModal opened={createOpened} onClose={() => setCreateOpened(false)} />
    </Stack>
  );
}
