import { useNavigate } from 'react-router-dom';
import { Button, Group, Loader, Paper, SimpleGrid, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import {
  IconCalendarEvent,
  IconClipboardList,
  IconCoin,
  IconReceipt2,
  IconReceiptOff,
  type IconProps,
} from '@tabler/icons-react';
import type { ComponentType } from 'react';

import dayjs from 'dayjs';
import { useAuthStore } from '../../auth/store';
import { dueChip } from '../../lib/dueChip';
import { formatMoney } from '../../lib/money';
import { STATUS_META } from '../../lib/statusColors';
import { useOrgSettings } from '../orgSettings/queries';
import { useMechanics, useUsers } from '../users/queries';
import { useAdminDashboard, useDueSoonJobs, useTopUnpaidBills } from './queries';

// Bars always show these three in this order, even at zero — GetAdminDashboardQuery only
// returns rows for statuses that actually have jobs, so a quiet day would otherwise render
// an empty panel instead of a real (if flat) chart. Delivered is a footnote, not a bar,
// matching the wireframe ("+N delivered, out of the active view above").
const BAR_STATUSES = ['Received', 'InProgress', 'Completed'] as const;

function StatTile({
  icon: Icon,
  color,
  label,
  value,
  sub,
}: {
  icon: ComponentType<IconProps>;
  color: string;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <Paper p="md" shadow="sm" style={{ borderTop: `3px solid var(--mantine-color-${color}-6)` }}>
      <Group justify="space-between" mb={8} wrap="nowrap">
        <Text size="xs" tt="uppercase" fw={600} c="dimmed" style={{ letterSpacing: '0.02em' }}>
          {label}
        </Text>
        <ThemeIcon variant="light" color={color} size={30} radius="md">
          <Icon size={16} stroke={1.75} />
        </ThemeIcon>
      </Group>
      <Text fz="1.6rem" fw={700} className="tabular-nums">
        {value}
      </Text>
      {sub && (
        <Text size="xs" c="success" fw={500} className="tabular-nums">
          {sub}
        </Text>
      )}
    </Paper>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { data: orgSettings } = useOrgSettings();
  const { data: dashboard, isLoading } = useAdminDashboard();
  const { data: unpaidBills } = useTopUnpaidBills(3);
  const { data: dueSoon } = useDueSoonJobs(5);
  const { data: mechanics } = useMechanics();
  const { data: users } = useUsers();

  if (isLoading || !dashboard) return <Loader />;

  const openJobs = dashboard.jobsByStatus
    .filter((s) => s.status !== 'Delivered')
    .reduce((sum, s) => sum + s.count, 0);
  const barRows = BAR_STATUSES.map((status) => ({
    status,
    count: dashboard.jobsByStatus.find((s) => s.status === status)?.count ?? 0,
  }));
  const deliveredCount = dashboard.jobsByStatus.find((s) => s.status === 'Delivered')?.count ?? 0;
  const maxStatusCount = Math.max(1, ...barRows.map((s) => s.count));
  const maxWorkload = Math.max(1, ...dashboard.mechanicWorkload.map((w) => w.openJobs));
  const money = (amount: number) => formatMoney(amount, orgSettings?.currencyCode);
  const greetingName = users?.find((u) => u.id === user?.id)?.fullName ?? user?.email.split('@')[0];

  return (
    <Stack gap="md">
      <Title order={3}>Dashboard</Title>
      <Group justify="space-between" wrap="wrap">
        <Text size="sm" c="dimmed">
          {dayjs().format('dddd, MMMM D')} — good morning, {greetingName}
        </Text>
        <Group>
          <Button variant="default" onClick={() => navigate('/reports')}>
            View reports
          </Button>
          <Button onClick={() => navigate('/jobs?new=1')}>+ New job</Button>
        </Group>
      </Group>

      <SimpleGrid cols={{ base: 2, sm: 3, md: 5 }}>
        <StatTile
          icon={IconCalendarEvent}
          color="steel"
          label="Jobs received today"
          value={String(dashboard.jobsReceivedToday)}
        />
        <StatTile icon={IconClipboardList} color="brand" label="Open jobs" value={String(openJobs)} />
        <StatTile
          icon={IconReceiptOff}
          color="danger"
          label="Unpaid bills"
          value={String(dashboard.unpaidBills)}
          sub={`${money(dashboard.unpaidTotal)} outstanding`}
        />
        <StatTile
          icon={IconReceipt2}
          color="success"
          label="Bills paid today"
          value={String(dashboard.billsPaidToday)}
        />
        <StatTile icon={IconCoin} color="brand" label="Revenue today" value={money(dashboard.revenueToday)} />
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, md: 3 }}>
        <Paper withBorder p="md">
          <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="sm">
            Jobs by status
          </Text>
          <Stack gap="xs">
            {barRows.map((row) => (
              <Group key={row.status} gap="xs" wrap="nowrap">
                <Text size="xs" w={90}>
                  {STATUS_META[row.status].label}
                </Text>
                <div
                  style={{ flex: 1, height: 8, borderRadius: 4, overflow: 'hidden', background: 'var(--mantine-color-gray-2)' }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${(row.count / maxStatusCount) * 100}%`,
                      background: 'var(--mantine-color-brand-6)',
                    }}
                  />
                </div>
                <Text size="xs" className="tabular-nums">
                  {row.count}
                </Text>
              </Group>
            ))}
          </Stack>
          <Text size="xs" c="dimmed" mt="sm">
            + {deliveredCount} delivered (out of the active view above)
          </Text>
          <Text
            size="xs"
            c="dimmed"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate('/jobs')}
          >
            View board →
          </Text>
        </Paper>

        <Paper withBorder p="md">
          <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="sm">
            Mechanic workload
          </Text>
          <Stack gap="xs">
            {dashboard.mechanicWorkload.map((row) => (
              <Group key={row.mechanicId} gap="xs" wrap="nowrap">
                <Text size="xs" w={90} lineClamp={1}>
                  {row.mechanicName}
                </Text>
                <div
                  style={{ flex: 1, height: 8, borderRadius: 4, overflow: 'hidden', background: 'var(--mantine-color-gray-2)' }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${(row.openJobs / maxWorkload) * 100}%`,
                      background: 'var(--mantine-color-steel-6)',
                    }}
                  />
                </div>
                <Text size="xs" className="tabular-nums">
                  {row.openJobs}
                </Text>
              </Group>
            ))}
            {dashboard.mechanicWorkload.length === 0 && (
              <Text size="xs" c="dimmed">
                No mechanics assigned yet.
              </Text>
            )}
          </Stack>
        </Paper>

        <Paper withBorder p="md">
          <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="sm">
            Unpaid bills — top {unpaidBills?.rows.length ?? 0}
          </Text>
          <Stack gap="xs">
            {unpaidBills?.rows.map((row) => (
              <Group key={row.billId} justify="space-between" wrap="nowrap">
                <Text size="xs" lineClamp={1}>
                  {row.title} <Text span c="dimmed">{row.bikeModel}</Text>
                </Text>
                <Text size="xs" fw={700} className="tabular-nums">
                  {money(row.total)}
                </Text>
              </Group>
            ))}
            {unpaidBills?.rows.length === 0 && (
              <Text size="xs" c="dimmed">
                No unpaid bills.
              </Text>
            )}
          </Stack>
          <Text
            size="xs"
            c="dimmed"
            mt="sm"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate('/bills')}
          >
            View all {unpaidBills?.totalCount ?? 0} →
          </Text>
        </Paper>
      </SimpleGrid>

      <Paper withBorder p="md">
        <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="sm">
          Due soon
        </Text>
        <Stack gap="xs">
          {dueSoon?.map((job) => {
            const chip = dueChip(job.dueDate);
            const mechanicName = mechanics?.find((m) => m.id === job.assignedMechanicId)?.fullName;
            return (
              <Group key={job.id} justify="space-between" wrap="nowrap" style={{ cursor: 'pointer' }} onClick={() => navigate(`/jobs/${job.id}`)}>
                <Text size="xs">
                  {job.title}{' '}
                  <Text span c="dimmed">
                    {job.bikeModel}
                    {mechanicName ? ` · ${mechanicName}` : ''}
                  </Text>
                </Text>
                <Text size="xs" c={chip.overdue ? 'danger' : 'dimmed'}>
                  {chip.label}
                </Text>
              </Group>
            );
          })}
          {dueSoon?.length === 0 && (
            <Text size="xs" c="dimmed">
              Nothing due soon.
            </Text>
          )}
        </Stack>
      </Paper>
    </Stack>
  );
}
