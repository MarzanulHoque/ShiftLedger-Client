import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Badge,
  Group,
  Pagination,
  Paper,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Table,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { IconFileInvoice, IconReceipt2, IconReceiptOff } from '@tabler/icons-react';
import { formatDateTime } from '../../lib/date';
import { formatBillNumber, formatJobNumber } from '../../lib/identifiers';
import { useAdminDashboard } from '../dashboard/queries';
import { useOrgSettings } from '../orgSettings/queries';
import { formatMoney } from '../../lib/money';
import { PAGE_SIZE, useAllBills } from './useAllBills';

type Filter = 'all' | 'unpaid' | 'paid';

function SummaryTile({
  icon: Icon,
  color,
  label,
  value,
}: {
  icon: typeof IconReceipt2;
  color: string;
  label: string;
  value: string;
}) {
  return (
    <Paper p="md" shadow="sm" style={{ borderTop: `3px solid var(--mantine-color-${color}-6)` }}>
      <Group justify="space-between" wrap="nowrap">
        <div>
          <Text size="xs" tt="uppercase" fw={600} c="dimmed" style={{ letterSpacing: '0.02em' }}>
            {label}
          </Text>
          <Text fz="1.4rem" fw={700} className="tabular-nums">
            {value}
          </Text>
        </div>
        <ThemeIcon variant="light" color={color} size={34} radius="md">
          <Icon size={18} stroke={1.75} />
        </ThemeIcon>
      </Group>
    </Paper>
  );
}

export function BillsPage() {
  const [filter, setFilter] = useState<Filter>('all');
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const { data: orgSettings } = useOrgSettings();
  const { data: dashboard } = useAdminDashboard();

  const isPaid = filter === 'all' ? undefined : filter === 'paid';
  const { data, isLoading } = useAllBills(isPaid, page);
  const totalPages = data ? Math.max(1, Math.ceil(data.totalCount / PAGE_SIZE)) : 1;
  const money = (amount: number) => formatMoney(amount, orgSettings?.currencyCode);

  return (
    <Stack gap="md">
      <Title order={3}>Billing — All Bills</Title>

      <SimpleGrid cols={{ base: 1, sm: 3 }}>
        <SummaryTile icon={IconFileInvoice} color="steel" label={`${filter === 'all' ? 'Total' : filter === 'paid' ? 'Paid' : 'Unpaid'} bills`} value={String(data?.totalCount ?? 0)} />
        <SummaryTile icon={IconReceiptOff} color="danger" label="Unpaid outstanding" value={money(dashboard?.unpaidTotal ?? 0)} />
        <SummaryTile icon={IconReceipt2} color="success" label="Revenue today" value={money(dashboard?.revenueToday ?? 0)} />
      </SimpleGrid>

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

      <Paper shadow="sm" radius="md" style={{ overflow: 'hidden' }}>
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Invoice #</Table.Th>
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
                <Table.Td className="tabular-nums" ff="monospace" fz="xs" c="dimmed">
                  {formatBillNumber(row.billNumber)}
                </Table.Td>
                <Table.Td c={row.jobDeleted ? 'dimmed' : undefined}>
                  {row.title}
                  {!row.jobDeleted && (
                    <Text span c="dimmed" size="xs" ml={6} ff="monospace">
                      {formatJobNumber(row.jobNumber)}
                    </Text>
                  )}
                </Table.Td>
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
                <Table.Td colSpan={6}>
                  <Text c="dimmed" ta="center" py="md">
                    No bills match this filter.
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Paper>

      {totalPages > 1 && (
        <Group justify="center">
          <Pagination value={page} onChange={setPage} total={totalPages} />
        </Group>
      )}
    </Stack>
  );
}
