import { useNavigate } from 'react-router-dom';
import { Avatar, Button, Grid, Group, Loader, Paper, SimpleGrid, Stack, Table, Text, ThemeIcon, Title } from '@mantine/core';
import {
  IconActivity,
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
import { useQuery } from '@tanstack/react-query';
import {
  Area,
  AreaChart,
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
import { getNotifications } from '../../api/notifications';
import { useAuthStore } from '../../auth/store';
import { CHART_COLORS, STATUS_CHART_COLOR } from '../../lib/chartColors';
import { dueChip } from '../../lib/dueChip';
import { timeAgo } from '../../lib/date';
import { initials } from '../../lib/initials';
import { formatMoney } from '../../lib/money';
import { STATUS_META } from '../../lib/statusColors';
import { useOrgSettings } from '../orgSettings/queries';
import { useMechanics, useUsers } from '../users/queries';
import {
  useAdminDashboard,
  useDashboardComparison,
  useDueSoonJobs,
  useRecentPayments,
  useRevenueTrend,
  useTopUnpaidBills,
  useYesterdayDashboard,
} from './queries';

// Bars/donut always show these three in this order, even at zero — GetAdminDashboardQuery only
// returns rows for statuses that actually have jobs, so a quiet day would otherwise render an
// empty panel instead of a real (if flat) chart. Delivered is a footnote, not a segment,
// matching the wireframe ("+N delivered, out of the active view above").
const BAR_STATUSES = ['Received', 'InProgress', 'Completed'] as const;

// Cycled by index across however many departments a tenant has — unlike job status, departments
// have no fixed identity/color of their own, so this is just a pleasant, distinct rotation of the
// existing chart palette rather than a semantic mapping.
const DEPARTMENT_COLORS = [
  CHART_COLORS.steel,
  CHART_COLORS.brand,
  CHART_COLORS.success,
  CHART_COLORS.danger,
  CHART_COLORS.slate,
  CHART_COLORS.slateDark,
];

// Section header used above every panel — one size/weight so the eye learns a single landmark
// pattern instead of re-parsing each panel's hierarchy from scratch.
function PanelHeading({ children }: { children: ReactNode }) {
  return (
    <Text size="sm" fw={700} tt="uppercase" c="dimmed" mb="sm" style={{ letterSpacing: '0.03em' }}>
      {children}
    </Text>
  );
}

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

export function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { data: orgSettings } = useOrgSettings();
  const { data: dashboard, isLoading } = useAdminDashboard();
  const { data: yesterday } = useYesterdayDashboard();
  const { data: unpaidBills } = useTopUnpaidBills(6);
  const { data: dueSoon } = useDueSoonJobs(5);
  const { data: revenueTrend } = useRevenueTrend(14);
  const { data: recentPayments } = useRecentPayments(6);
  const { data: mechanics } = useMechanics();
  const { data: users } = useUsers();
  const isSuperAdmin = user?.role === 'SuperAdmin';
  const { data: comparison } = useDashboardComparison();
  // Same query key + args as NotificationBell, so both share one cache entry and one live
  // SignalR-triggered refetch (see useNotificationsSocket.ts) instead of racing two separate ones.
  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => getNotifications({ unreadOnly: false, pageSize: 10 }),
  });

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
            <PanelHeading>Revenue — last 14 days</PanelHeading>
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
                  tick={{ fontSize: 12, fill: 'var(--mantine-color-dimmed)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v: number) => money(v)}
                  width={64}
                  tick={{ fontSize: 12, fill: 'var(--mantine-color-dimmed)' }}
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
            <PanelHeading>Jobs by status</PanelHeading>
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
            <Text size="sm" fw={600} c="brand" style={{ cursor: 'pointer' }} onClick={() => navigate('/jobs')}>
              View board →
            </Text>
          </Paper>
        </Grid.Col>
      </Grid>

      {isSuperAdmin && comparison && comparison.length > 0 && (
        <>
          <Title order={4} mt="sm">
            Department comparison
          </Title>
          <Grid>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper p="md" shadow="sm" h="100%">
                <PanelHeading>Jobs by department</PanelHeading>
                {comparison.some((d) => d.openJobs > 0) ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={comparison.map((d) => ({ name: d.departmentName, value: d.openJobs }))}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={46}
                        outerRadius={72}
                        paddingAngle={3}
                      >
                        {comparison.map((d, i) => (
                          <Cell key={d.departmentId} fill={DEPARTMENT_COLORS[i % DEPARTMENT_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => `${v} open`} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Text size="sm" c="dimmed" ta="center" py="xl">
                    No open jobs.
                  </Text>
                )}
                <Text size="xs" c="dimmed" mt="xs" ta="center">
                  {comparison.reduce((sum, d) => sum + d.jobsReceivedToday, 0)} received today across departments
                </Text>
              </Paper>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper p="md" shadow="sm" h="100%">
                <PanelHeading>Revenue by department</PanelHeading>
                {comparison.some((d) => d.revenueToday > 0) ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={comparison.map((d) => ({ name: d.departmentName, value: d.revenueToday }))}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={46}
                        outerRadius={72}
                        paddingAngle={3}
                      >
                        {comparison.map((d, i) => (
                          <Cell key={d.departmentId} fill={DEPARTMENT_COLORS[i % DEPARTMENT_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => money(Number(v) || 0)} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Text size="sm" c="dimmed" ta="center" py="xl">
                    No revenue today.
                  </Text>
                )}
                <Text size="xs" c="dimmed" mt="xs" ta="center">
                  {money(comparison.reduce((sum, d) => sum + d.unpaidTotal, 0))} unpaid across departments
                </Text>
              </Paper>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper p="md" shadow="sm" h="100%">
                <PanelHeading>Throughput — completed, last 7 days</PanelHeading>
                {comparison.some((d) => d.throughputLast7Days > 0) ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={comparison.map((d) => ({ name: d.departmentName, value: d.throughputLast7Days }))}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={46}
                        outerRadius={72}
                        paddingAngle={3}
                      >
                        {comparison.map((d, i) => (
                          <Cell key={d.departmentId} fill={DEPARTMENT_COLORS[i % DEPARTMENT_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => `${v} completed`} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Text size="sm" c="dimmed" ta="center" py="xl">
                    Nothing completed in the last 7 days.
                  </Text>
                )}
              </Paper>
            </Grid.Col>
          </Grid>
        </>
      )}

      <Paper p="md" shadow="sm">
        <PanelHeading>Mechanic workload</PanelHeading>
        {dashboard.mechanicWorkload.length > 0 ? (
          <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 5 }} spacing="sm">
            {dashboard.mechanicWorkload
              .slice()
              .sort((a, b) => b.openJobs - a.openJobs)
              .map((mechanic) => (
                <Paper key={mechanic.mechanicId} p="sm" withBorder radius="md" style={{ borderTop: '3px solid var(--mantine-color-steel-6)' }}>
                  <Group gap={8} wrap="nowrap" mb={6}>
                    <Avatar size={24} radius="xl" color="steel">
                      <Text fz={10} fw={700}>
                        {initials(mechanic.mechanicName)}
                      </Text>
                    </Avatar>
                    <Text size="sm" fw={500} lineClamp={1}>
                      {mechanic.mechanicName}
                    </Text>
                  </Group>
                  <Text fz="1.4rem" fw={700} className="tabular-nums">
                    {mechanic.openJobs}
                  </Text>
                  <Text size="xs" c="dimmed">
                    open jobs
                  </Text>
                </Paper>
              ))}
          </SimpleGrid>
        ) : (
          <Text size="sm" c="dimmed">
            No mechanics assigned yet.
          </Text>
        )}
      </Paper>

      <Title order={4} mt="sm">
        Details
      </Title>

      <Paper p="md" shadow="sm">
        <PanelHeading>Due soon</PanelHeading>
        <Table.ScrollContainer minWidth={420}>
          <Table verticalSpacing="xs" highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Job</Table.Th>
                <Table.Th>Mechanic</Table.Th>
                <Table.Th style={{ textAlign: 'right' }}>Due</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {dueSoon?.map((job) => {
                const chip = dueChip(job.dueDate);
                const mechanic = mechanics?.find((m) => m.id === job.assignedMechanicId);
                return (
                  <Table.Tr key={job.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/jobs/${job.id}`)}>
                    <Table.Td>
                      <Text size="sm">
                        {job.title} <Text span c="dimmed" size="sm">{job.bikeModel}</Text>
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      {mechanic ? (
                        <Group gap={6} wrap="nowrap">
                          <Avatar size={20} radius="xl" color="steel">
                            <Text fz={9} fw={700}>
                              {initials(mechanic.fullName)}
                            </Text>
                          </Avatar>
                          <Text size="sm">{mechanic.fullName}</Text>
                        </Group>
                      ) : (
                        <Text size="sm" c="dimmed">
                          Unassigned
                        </Text>
                      )}
                    </Table.Td>
                    <Table.Td style={{ textAlign: 'right' }}>
                      <Text size="sm" fw={600} c={chip.overdue ? 'danger' : 'dimmed'}>
                        {chip.label}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
              {dueSoon?.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={3}>
                    <Text size="sm" c="dimmed">
                      Nothing due soon.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Paper>

      <Grid>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper p="md" shadow="sm" h="100%" style={{ display: 'flex', flexDirection: 'column' }}>
            <PanelHeading>Unpaid bills — top {unpaidBills?.rows.length ?? 0}</PanelHeading>
            <Table verticalSpacing="xs" highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Job</Table.Th>
                  <Table.Th style={{ textAlign: 'right' }}>Amount</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {unpaidBills?.rows.map((row) => (
                  <Table.Tr key={row.billId}>
                    <Table.Td>
                      <Text size="sm" lineClamp={1}>
                        {row.title} <Text span c="dimmed" size="sm">{row.bikeModel}</Text>
                      </Text>
                    </Table.Td>
                    <Table.Td style={{ textAlign: 'right' }}>
                      <Text size="sm" fw={700} c="danger" className="tabular-nums">
                        {money(row.total)}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
                {unpaidBills?.rows.length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={2}>
                      <Text size="sm" c="dimmed">
                        No unpaid bills.
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
            <Text size="sm" fw={600} c="brand" mt="auto" pt="sm" style={{ cursor: 'pointer' }} onClick={() => navigate('/bills')}>
              View all {unpaidBills?.totalCount ?? 0} →
            </Text>
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper p="md" shadow="sm" h="100%" style={{ display: 'flex', flexDirection: 'column' }}>
            <PanelHeading>Recent payments</PanelHeading>
            <Table verticalSpacing="xs" highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Job</Table.Th>
                  <Table.Th>Paid</Table.Th>
                  <Table.Th style={{ textAlign: 'right' }}>Amount</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {recentPayments?.map((payment) => {
                  const clickable = !payment.jobDeleted;
                  return (
                    <Table.Tr
                      key={payment.billId}
                      style={{ cursor: clickable ? 'pointer' : 'default' }}
                      onClick={clickable ? () => navigate(`/jobs/${payment.jobId}`) : undefined}
                    >
                      <Table.Td>
                        <Text size="sm" lineClamp={1} c={payment.jobDeleted ? 'dimmed' : undefined}>
                          {payment.title} <Text span c="dimmed" size="sm">{payment.bikeModel}</Text>
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="xs" c="dimmed">
                          {timeAgo(payment.paidAtUtc)}
                        </Text>
                      </Table.Td>
                      <Table.Td style={{ textAlign: 'right' }}>
                        <Text size="sm" fw={700} c="success" className="tabular-nums">
                          {money(payment.total)}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
                {recentPayments?.length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={3}>
                      <Text size="sm" c="dimmed">
                        No payments yet.
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Paper>
        </Grid.Col>
      </Grid>

      {isSuperAdmin && comparison && comparison.length > 0 && (
        <Paper p="md" shadow="sm">
          <Group gap={6} mb="sm">
            <IconActivity size={15} style={{ color: 'var(--mantine-color-dimmed)' }} />
            <PanelHeading>Live activity — all departments</PanelHeading>
          </Group>
          <Table verticalSpacing="xs" highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Message</Table.Th>
                <Table.Th style={{ textAlign: 'right' }}>When</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {notifications?.items.map((n) => (
                <Table.Tr key={n.id}>
                  <Table.Td>
                    <Text size="sm" lineClamp={1}>
                      {n.message}
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ textAlign: 'right' }}>
                    <Text size="xs" c="dimmed">
                      {timeAgo(n.createdAtUtc)}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ))}
              {notifications?.items.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={2}>
                    <Text size="sm" c="dimmed">
                      No recent activity.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Paper>
      )}
    </Stack>
  );
}
