import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Group, Pagination, SegmentedControl, Stack, Table, Text, Title } from '@mantine/core';
import { formatDateTime } from '../../lib/date';
import { useOrgSettings } from '../orgSettings/queries';
import { formatMoney } from '../../lib/money';
import { PAGE_SIZE, useAllBills } from './useAllBills';

type Filter = 'all' | 'unpaid' | 'paid';

export function BillsPage() {
  const [filter, setFilter] = useState<Filter>('all');
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const { data: orgSettings } = useOrgSettings();

  const isPaid = filter === 'all' ? undefined : filter === 'paid';
  const { data, isLoading } = useAllBills(isPaid, page);
  const totalPages = data ? Math.max(1, Math.ceil(data.totalCount / PAGE_SIZE)) : 1;

  return (
    <Stack gap="md">
      <Title order={3}>Billing — All Bills</Title>

      <SegmentedControl
        value={filter}
        onChange={(value) => {
          setFilter(value as Filter);
          setPage(1);
        }}
        data={[
          { value: 'all', label: 'All' },
          { value: 'unpaid', label: 'Unpaid' },
          { value: 'paid', label: 'Paid' },
        ]}
      />

      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Job</Table.Th>
            <Table.Th>Bike model</Table.Th>
            <Table.Th>Total</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Paid at</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {data?.rows.map((row) => (
            <Table.Tr
              key={row.billId}
              onClick={row.jobDeleted ? undefined : () => navigate(`/jobs/${row.jobId}`)}
              style={{ cursor: row.jobDeleted ? 'default' : 'pointer' }}
            >
              <Table.Td c={row.jobDeleted ? 'dimmed' : undefined}>{row.title}</Table.Td>
              <Table.Td>{row.bikeModel}</Table.Td>
              <Table.Td className="tabular-nums">{formatMoney(row.total, orgSettings?.currencyCode)}</Table.Td>
              <Table.Td>
                <Badge color={row.isPaid ? 'success' : 'gray'} variant={row.isPaid ? 'filled' : 'light'}>
                  {row.isPaid ? 'Paid' : 'Unpaid'}
                </Badge>
              </Table.Td>
              <Table.Td className="tabular-nums">{row.paidAtUtc ? formatDateTime(row.paidAtUtc) : '—'}</Table.Td>
            </Table.Tr>
          ))}
          {!isLoading && data?.rows.length === 0 && (
            <Table.Tr>
              <Table.Td colSpan={5}>
                <Text c="dimmed" ta="center" py="md">
                  No bills match this filter.
                </Text>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>

      {totalPages > 1 && (
        <Group justify="center">
          <Pagination value={page} onChange={setPage} total={totalPages} />
        </Group>
      )}
    </Stack>
  );
}
