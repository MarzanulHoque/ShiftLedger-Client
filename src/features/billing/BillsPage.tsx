import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Badge,
  Group,
  Pagination,
  Paper,
  Select,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Table,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { IconFileInvoice, IconReceipt2, IconReceiptOff } from '@tabler/icons-react';
import { useAuthStore } from '../../auth/store';
import { formatDateTime } from '../../lib/date';
import { formatBillNumber, formatJobNumber } from '../../lib/identifiers';
import { useDepartments } from '../departments/queries';
import { useOrgSettings } from '../orgSettings/queries';
import { formatMoney } from '../../lib/money';
import { PAGE_SIZE, useAllBills, useBillingSummary } from './useAllBills';

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
  const [departmentId, setDepartmentId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);
  const isSuperAdmin = currentUser?.role === 'SuperAdmin';
  const { data: orgSettings } = useOrgSettings();
  const { data: departments } = useDepartments();
  const { data: summary } = useBillingSummary();

  const isPaid = filter === 'all' ? undefined : filter === 'paid';
  const { data, isLoading } = useAllBills(isPaid, departmentId ?? undefined, page);
  const totalPages = data ? Math.max(1, Math.ceil(data.totalCount / PAGE_SIZE)) : 1;
  const money = (amount: number) => formatMoney(amount, orgSettings?.currencyCode);
  const departmentName = (id: string) => departments?.find((d) => d.id === id)?.name ?? '—';

  // Rule BL2: the top tiles always come from the department roll-up (not a global dashboard
  // query), so they can never drift from the department scope the bill list itself honors —
  // narrowed to the selected department when one is picked, summed across all otherwise.
  const scopedSummary = departmentId ? summary?.filter((d) => d.departmentId === departmentId) : summary;
  const unpaidTotal = scopedSummary?.reduce((sum, d) => sum + d.unpaidTotal, 0) ?? 0;
  const paidTotal = scopedSummary?.reduce((sum, d) => sum + d.paidTotal, 0) ?? 0;

  return (
    <Stack gap="md">
      <Group justify="space-between" wrap="wrap">
        <Title order={3}>Billing — All Bills</Title>
        {isSuperAdmin && (
          <Select
            placeholder="All departments"
            clearable
            data={departments?.map((d) => ({ value: d.id, label: d.name })) ?? []}
            value={departmentId}
            onChange={(value) => {
              setDepartmentId(value);
              setPage(1);
            }}
            w={220}
          />
        )}
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 3 }}>
        <SummaryTile icon={IconFileInvoice} color="steel" label={`${filter === 'all' ? 'Total' : filter === 'paid' ? 'Paid' : 'Unpaid'} bills`} value={String(data?.totalCount ?? 0)} />
        <SummaryTile icon={IconReceiptOff} color="danger" label="Unpaid outstanding" value={money(unpaidTotal)} />
        <SummaryTile icon={IconReceipt2} color="success" label="Paid total" value={money(paidTotal)} />
      </SimpleGrid>

      {isSuperAdmin && summary && summary.length > 0 && (
        <Paper shadow="sm" radius="md" style={{ overflow: 'hidden' }}>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Department</Table.Th>
                <Table.Th>Bills</Table.Th>
                <Table.Th>Unpaid</Table.Th>
                <Table.Th>Paid</Table.Th>
                <Table.Th>Total</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {summary.map((d) => (
                <Table.Tr key={d.departmentId}>
                  <Table.Td>{d.departmentName}</Table.Td>
                  <Table.Td className="tabular-nums">{d.totalCount}</Table.Td>
                  <Table.Td className="tabular-nums">{money(d.unpaidTotal)}</Table.Td>
                  <Table.Td className="tabular-nums">{money(d.paidTotal)}</Table.Td>
                  <Table.Td className="tabular-nums">{money(d.grandTotal)}</Table.Td>
                </Table.Tr>
              ))}
              <Table.Tr>
                <Table.Td fw={700}>Consolidated</Table.Td>
                <Table.Td className="tabular-nums" fw={700}>{summary.reduce((sum, d) => sum + d.totalCount, 0)}</Table.Td>
                <Table.Td className="tabular-nums" fw={700}>{money(summary.reduce((sum, d) => sum + d.unpaidTotal, 0))}</Table.Td>
                <Table.Td className="tabular-nums" fw={700}>{money(summary.reduce((sum, d) => sum + d.paidTotal, 0))}</Table.Td>
                <Table.Td className="tabular-nums" fw={700}>{money(summary.reduce((sum, d) => sum + d.grandTotal, 0))}</Table.Td>
              </Table.Tr>
            </Table.Tbody>
          </Table>
        </Paper>
      )}

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
              {isSuperAdmin && <Table.Th>Department</Table.Th>}
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
                {isSuperAdmin && <Table.Td>{departmentName(row.departmentId)}</Table.Td>}
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
                <Table.Td colSpan={isSuperAdmin ? 7 : 6}>
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
