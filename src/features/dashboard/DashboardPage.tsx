import { useNavigate } from 'react-router-dom';
import { Avatar, Button, Grid, Group, Loader, Paper, SimpleGrid, Stack, Text, ThemeIcon, Title, Tooltip as MantineTooltip } from '@mantine/core';
import {
  IconArrowDownRight,
  IconArrowRight,
  IconArrowUpRight,
  IconCalendarEvent,
  IconClipboardList,
  IconCoin,
  IconReceipt2,
  IconReceiptOff,
  type IconProps,
} from '@tabler/icons-react';
import type { ComponentType, ReactNode } from 'react';
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
import { timeAgo } from '../../lib/date';
import { initials } from '../../lib/initials';
import { formatMoney } from '../../lib/money';
import { STATUS_META } from '../../lib/statusColors';
import { useOrgSettings } from '../orgSettings/queries';
import { useMechanics, useUsers } from '../users/queries';
import {
  useAdminDashboard,
  useDueSoonJobs,
  useRecentPayments,
  type RecentPaymentRow,
  useRevenueTrend,
  useTopUnpaidBills,
  useYesterdayDashboard,
} from './queries';

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
  danger: '#B03A3A',
};
const STATUS_CHART_COLOR: Record<(typeof BAR_STATUSES)[number], string> = {
  Received: CHART_COLORS.received,
  InProgress: CHART_COLORS.inProgress,
  Completed: CHART_COLORS.completed,
};

type GoodDirection = 'up' | 'down' | 'neutral';

function TrendBadge({
  current,
  previous,
  goodDirection = 'up',
}: {
  current: number;
  previous: number | undefined;
  goodDirection?: GoodDirection;
}) {
  if (previous === undefined) return null;
  if (previous === 0 && current === 0) return null;

  const diff = current - previous;
  const flat = diff === 0;
  const went = diff > 0 ? 'up' : 'down';
  const pct = previous !== 0 ? Math.round((diff / previous) * 100) : null;
  const label = flat ? 'No change' : pct === null ? `${diff > 0 ? '+' : ''}${diff}` : `${diff > 0 ? '+' : ''}${pct}%`;
  const isGood = flat || goodDirection === 'neutral' ? null : goodDirection === went;
  const color = isGood === null ? 'dimmed' : isGood ? 'success' : 'danger';
  const Icon = flat ? IconArrowRight : went === 'up' ? IconArrowUpRight : IconArrowDownRight;

  return (
    <Group gap={2} wrap="nowrap" mt={2}>
      <Icon size={12} color={`var(--mantine-color-${color === 'dimmed' ? 'gray-6' : `${color}-6`})`} />
      <Text size="xs" c={color} fw={600} className="tabular-nums">
        {label}
      </Text>
      <Text size="xs" c="dimmed">
        vs yesterday
      </Text>
    </Group>
  );
}

function StatTile({
  icon: Icon,
  color,
  label,
  value,
  sub,
  trend,
}: {
  icon: ComponentType<IconProps>;
  color: string;
  label: string;
  value: string;
  sub?: string;
  trend?: ReactNode;
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
      {trend}
    </Paper>
  );
}

function PaymentRow({ payment, money, onClick }: { payment: RecentPaymentRow; money: (n: number) => string; onClick: () => void }) {
  const clickable = !payment.jobDeleted;
  return (
    <Group
      gap="sm"
      wrap="nowrap"
      align="flex-start"
      style={{ cursor: clickable ? 'pointer' : 'default' }}
      onClick={clickable ? onClick : undefined}
    >
      <ThemeIcon variant="light" color="success" size={28} radius="xl">
        <IconReceipt2 size={14} />
      </ThemeIcon>
      <div style={{ flex: 1, minWidth: 0 }}>
        <Text size="xs" lineClamp={1} c={payment.jobDeleted ? 'dimmed' : undefined}>
          {payment.title} <Text span c="dimmed">{payment.bikeModel}</Text>
        </Text>
        <Text size="xs" c="dimmed">
          {timeAgo(payment.paidAtUtc)}
        </Text>
      </div>
      <Text size="xs" fw={700} c="success" className="tabular-nums">
        {money(payment.total)}
      </Text>
    </Group>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { data: orgSettings } = useOrgSettings();
  const { data: dashboard, isLoading } = useAdminDashboard();
  const { data: yesterday } = useYesterdayDashboard();
  const { data: unpaidBills } = useTopUnpaidBills(3);
  const { data: dueSoon } = useDueSoonJobs(5);
  const { data: revenueTrend } = useRevenueTrend(14);
  const { data: recentPayments } = useRecentPayments(6);
  const { data: mechanics } = useMechanics();
  const { data: users } = useUsers();

  if (isLoading || !dashboard) return <Loader />;

  const openJobs = dashboard.jobsByStatus
    .filter((s) => s.status !== 'Delivered')
    .reduce((sum, s) => sum + s.count, 0);
  const yesterdayOpenJobs = yesterday?.jobsByStatus
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
          trend={<TrendBadge current={dashboard.jobsReceivedToday} previous={yesterday?.jobsReceivedToday} goodDirection="up" />}
        />
        <StatTile
          icon={IconClipboardList}
          color="brand"
          label="Open jobs"
          value={String(openJobs)}
          trend={<TrendBadge current={openJobs} previous={yesterdayOpenJobs} goodDirection="neutral" />}
        />
        <StatTile
          icon={IconReceiptOff}
          color="danger"
          label="Unpaid bills"
          value={String(dashboard.unpaidBills)}
          sub={`${money(dashboard.unpaidTotal)} outstanding`}
          trend={<TrendBadge current={dashboard.unpaidBills} previous={yesterday?.unpaidBills} goodDirection="down" />}
        />
        <StatTile
          icon={IconReceipt2}
          color="success"
          label="Bills paid today"
          value={String(dashboard.billsPaidToday)}
          trend={<TrendBadge current={dashboard.billsPaidToday} previous={yesterday?.billsPaidToday} goodDirection="up" />}
        />
        <StatTile
          icon={IconCoin}
          color="brand"
          label="Revenue today"
          value={money(dashboard.revenueToday)}
          trend={<TrendBadge current={dashboard.revenueToday} previous={yesterday?.revenueToday} goodDirection="up" />}
        />
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

      <Grid>
        <Grid.Col span={{ base: 12, md: 4 }}>
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
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper p="md" shadow="sm" h="100%">
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
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper p="md" shadow="sm" h="100%">
            <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="sm">
              Recent payments
            </Text>
            <Stack gap="sm">
              {recentPayments?.map((payment) => (
                <PaymentRow key={payment.billId} payment={payment} money={money} onClick={() => navigate(`/jobs/${payment.jobId}`)} />
              ))}
              {recentPayments?.length === 0 && (
                <Text size="xs" c="dimmed">
                  No payments yet.
                </Text>
              )}
            </Stack>
          </Paper>
        </Grid.Col>
      </Grid>

      <Paper p="md" shadow="sm">
        <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="sm">
          Due soon
        </Text>
        <Stack gap="xs">
          {dueSoon?.map((job) => {
            const chip = dueChip(job.dueDate);
            const mechanic = mechanics?.find((m) => m.id === job.assignedMechanicId);
            return (
              <Group key={job.id} justify="space-between" wrap="nowrap" style={{ cursor: 'pointer' }} onClick={() => navigate(`/jobs/${job.id}`)}>
                <Group gap="xs" wrap="nowrap">
                  {mechanic && (
                    <MantineTooltip label={mechanic.fullName}>
                      <Avatar size={20} radius="xl" color="steel">
                        <Text fz={9} fw={700}>
                          {initials(mechanic.fullName)}
                        </Text>
                      </Avatar>
                    </MantineTooltip>
                  )}
                  <Text size="xs">
                    {job.title}{' '}
                    <Text span c="dimmed">
                      {job.bikeModel}
                    </Text>
                  </Text>
                </Group>
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
