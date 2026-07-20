import { Group, Pagination, Paper, Select, Table, Text } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import type { JobStatus } from '../../api/types';
import { formatDate } from '../../lib/date';
import { STATUS_META } from '../../lib/statusColors';
import { useMechanics } from '../users/queries';
import { useJobsList } from './queries';
import { JobStatusBadge } from './JobStatusBadge';
import { PriorityBadge } from './PriorityBadge';

const PAGE_SIZE = 20;

export function JobsList({
  status,
  mechanicId,
  onStatusChange,
  onMechanicChange,
  page,
  onPageChange,
}: {
  status: JobStatus | null;
  mechanicId: string | null;
  onStatusChange: (value: JobStatus | null) => void;
  onMechanicChange: (value: string | null) => void;
  page: number;
  onPageChange: (page: number) => void;
}) {
  const navigate = useNavigate();
  const { data: mechanics } = useMechanics();
  const { data, isLoading } = useJobsList({
    status: status ?? undefined,
    mechanicId: mechanicId ?? undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.totalCount / PAGE_SIZE)) : 1;

  return (
    <>
      <Group mb="sm">
        <Select
          placeholder="Status: All"
          clearable
          data={Object.entries(STATUS_META).map(([value, meta]) => ({ value, label: meta.label }))}
          value={status}
          onChange={(value) => {
            onStatusChange(value as JobStatus | null);
            onPageChange(1);
          }}
          w={180}
        />
        <Select
          placeholder="Mechanic: All"
          clearable
          data={mechanics?.map((m) => ({ value: m.id, label: m.fullName })) ?? []}
          value={mechanicId}
          onChange={(value) => {
            onMechanicChange(value);
            onPageChange(1);
          }}
          w={200}
        />
      </Group>

      <Paper shadow="sm" radius="md" style={{ overflow: 'hidden' }}>
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Title</Table.Th>
              <Table.Th>Bike model</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Priority</Table.Th>
              <Table.Th>Mechanic</Table.Th>
              <Table.Th>Received</Table.Th>
              <Table.Th>Due</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {data?.items.map((job) => (
              <Table.Tr key={job.id} onClick={() => navigate(`/jobs/${job.id}`)} style={{ cursor: 'pointer' }}>
                <Table.Td>{job.title}</Table.Td>
                <Table.Td>{job.bikeModel}</Table.Td>
                <Table.Td>
                  <JobStatusBadge status={job.status} />
                </Table.Td>
                <Table.Td>
                  <PriorityBadge priority={job.priority} />
                </Table.Td>
                <Table.Td>{mechanics?.find((m) => m.id === job.assignedMechanicId)?.fullName ?? '—'}</Table.Td>
                <Table.Td className="tabular-nums">{formatDate(job.receivedDate)}</Table.Td>
                <Table.Td className="tabular-nums">{formatDate(job.dueDate)}</Table.Td>
              </Table.Tr>
            ))}
            {!isLoading && data?.items.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={7}>
                  <Text c="dimmed" ta="center" py="md">
                    No jobs match these filters.
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Paper>

      {totalPages > 1 && (
        <Group justify="center" mt="md">
          <Pagination value={page} onChange={onPageChange} total={totalPages} />
        </Group>
      )}
    </>
  );
}
