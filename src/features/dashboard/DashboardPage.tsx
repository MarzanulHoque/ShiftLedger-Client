import { useNavigate } from 'react-router-dom';
import { Button, Grid, Group, Loader, Paper, SimpleGrid, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import {
  IconCalendarEvent,
  IconClipboardList,
  IconCoin,
  IconReceipt2,
  IconReceiptOff,
  type IconProps,
} from '@tabler/icons-react';
import type { ComponentType } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import dayjs from 'dayjs';
import { useAuthStore } from '../../auth/store';
import { dueChip } from '../../lib/dueChip';
import { formatMoney } from '../../lib/money';
import { STATUS_META } from '../../lib/statusColors';
import { useOrgSettings } from '../orgSettings/queries';
import { useMechanics, useUsers } from '../users/queries';
import { useAdminDashboard, useDueSoonJobs, useRevenueTrend, useTopUnpaidBills } from './queries';

// Bars/donut always show these three in this order, even at zero — GetAdminDashboardQuery only
// returns rows for statuses that actually have jobs, so a quiet day would otherwise render an
// empty panel instead of a real (if flat) chart. Delivered is a footnote, not a segment,
// matching the wireframe ("+N delivered, out of the active view above").
const BAR_STATUSES = ['Received', 'InProgress', 'Completed'] as const;

// Resolved hex values for theme.ts's brand/steel/success shade-6 — Recharts' `fill`/`stroke`
// props are plain SVG attributes, not CSS, so a `var(--mantine-color-*)` string can't be relied
// on to resolve there. Keep these in sync with theme.ts if that palette ever changes.
const CHART_COLORS = {
  received: '#667884',
  inProgress: '#3B7CAF',
  completed: '#4E9D5F',
  brand: '#BF5A2C',
};
const STATUS_CHART_COLOR: Record<(typeof BAR_STATUSES)[number], string> = {
  Received: CHART_COLORS.received,
  InProgress: CHART_COLORS.inProgress,
  Completed: CHART_COLORS.completed,
};

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
  const { data: revenueTrend } = useRevenueTrend(14);
  const { data: mechanics } = useMechanics();
  const { data: users } = useUsers();

  if (isLoading || !dashboard) return <Loader />;

  const openJobs = dashboard.jobsByStatus
    .filter((s) => s.status !== 'Delivered')
    .reduce((sum, s) => sum + s.count, 0);
  const statusRows = BAR_STATUSES.map((status) => ({
    status,
    count: dashboard.jobsByStatus.find((s) => s.status === status)?.count ?? 0,
  }));
  const deliveredCount = dashboard.jobsByStatus.find((s) => s.status === 'Delivered')?.count ?? 0;
  const hasOpenJobs = statusRows.some((row) => row.count > 0);
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

      <Grid>
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Paper p="md" shadow="sm" h="100%">
            <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="sm">
              Revenue — last 14 days
            </Text>
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart data={revenueTrend} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS.brand} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={CHART_COLORS.brand} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--mantine-color-gray-2)" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d: string) => dayjs(d).format('MMM D')}
                  tick={{ fontSize: 11, fill: 'var(--mantine-color-dimmed)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v: number) => money(v)}
                  width={64}
                  tick={{ fontSize: 11, fill: 'var(--mantine-color-dimmed)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value) => money(Number(value) || 0)}
                  labelFormatter={(d) => (d ? dayjs(String(d)).format('MMM D, YYYY') : '')}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke={CHART_COLORS.brand}
                  strokeWidth={2}
                  fill="url(#revenueFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper p="md" shadow="sm" h="100%">
            <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="sm">
              Jobs by status
            </Text>
            {hasOpenJobs ? (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={statusRows.map((row) => ({ name: STATUS_META[row.status].label, value: row.count, status: row.status }))}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={46}
                    outerRadius={72}
                    paddingAngle={3}
                  >
                    {statusRows.map((row) => (
                      <Cell key={row.status} fill={STATUS_CHART_COLOR[row.status]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Text size="sm" c="dimmed" ta="center" py="xl">
                No open jobs.
              </Text>
            )}
            <Text size="xs" c="dimmed" mt="xs">
              + {deliveredCount} delivered (out of the active view above)
            </Text>
            <Text size="xs" c="dimmed" style={{ cursor: 'pointer' }} onClick={() => navigate('/jobs')}>
              View board →
            </Text>
          </Paper>
        </Grid.Col>
      </Grid>

      <SimpleGrid cols={{ base: 1, md: 2 }}>
        <Paper p="md" shadow="sm">
          <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="sm">
            Mechanic workload
          </Text>
          {dashboard.mechanicWorkload.length > 0 ? (
            <ResponsiveContainer width="100%" height={Math.max(120, dashboard.mechanicWorkload.length * 44)}>
              <BarChart data={dashboard.mechanicWorkload} layout="vertical" margin={{ left: 0, right: 16 }}>
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="mechanicName"
                  width={90}
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip />
                <Bar dataKey="openJobs" name="Open jobs" fill={CHART_COLORS.inProgress} radius={[0, 4, 4, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Text size="xs" c="dimmed">
              No mechanics assigned yet.
            </Text>
          )}
        </Paper>

        <Paper p="md" shadow="sm">
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
          <Text size="xs" c="dimmed" mt="sm" style={{ cursor: 'pointer' }} onClick={() => navigate('/bills')}>
            View all {unpaidBills?.totalCount ?? 0} →
          </Text>
        </Paper>
      </SimpleGrid>

      <Paper p="md" shadow="sm">
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
