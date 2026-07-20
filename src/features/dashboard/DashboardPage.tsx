import { useNavigate } from 'react-router-dom';
import { Button, Group, Loader, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';

import dayjs from 'dayjs';
import { useAuthStore } from '../../auth/store';
import { dueChip } from '../../lib/dueChip';
import { formatMoney } from '../../lib/money';
import { useOrgSettings } from '../orgSettings/queries';
import { useMechanics } from '../users/queries';
import { useAdminDashboard, useDueSoonJobs, useTopUnpaidBills } from './queries';

function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Paper withBorder p="sm">
      <Text size="xl" fw={700} className="tabular-nums">
        {value}
      </Text>
      <Text size="xs" tt="uppercase" c="dimmed">
        {label}
      </Text>
      {sub && (
        <Text size="xs" c="success" className="tabular-nums">
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

  if (isLoading || !dashboard) return <Loader />;

  const openJobs = dashboard.jobsByStatus
    .filter((s) => s.status !== 'Delivered')
    .reduce((sum, s) => sum + s.count, 0);
  const maxStatusCount = Math.max(1, ...dashboard.jobsByStatus.map((s) => s.count));
  const maxWorkload = Math.max(1, ...dashboard.mechanicWorkload.map((w) => w.openJobs));
  const money = (amount: number) => formatMoney(amount, orgSettings?.currencyCode);

  return (
    <Stack gap="md">
      <Title order={3}>Dashboard</Title>
      <Group justify="space-between" wrap="wrap">
        <Text size="sm" c="dimmed">
          {dayjs().format('dddd, MMMM D')} — good morning, {user?.email.split('@')[0]}
        </Text>
        <Group>
          <Button variant="default" onClick={() => navigate('/reports')}>
            View reports
          </Button>
          <Button onClick={() => navigate('/jobs')}>+ New job</Button>
        </Group>
      </Group>

      <SimpleGrid cols={{ base: 2, sm: 3, md: 5 }}>
        <StatTile label="Jobs received today" value={String(dashboard.jobsReceivedToday)} />
        <StatTile label="Open jobs" value={String(openJobs)} />
        <StatTile
          label="Unpaid bills"
          value={String(dashboard.unpaidBills)}
          sub={`${money(dashboard.unpaidTotal)} outstanding`}
        />
        <StatTile label="Bills paid today" value={String(dashboard.billsPaidToday)} />
        <StatTile label="Revenue today" value={money(dashboard.revenueToday)} />
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, md: 3 }}>
        <Paper withBorder p="md">
          <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="sm">
            Jobs by status
          </Text>
          <Stack gap="xs">
            {dashboard.jobsByStatus.map((row) => (
              <Group key={row.status} gap="xs" wrap="nowrap">
                <Text size="xs" w={90}>
                  {row.status}
                </Text>
                <div style={{ flex: 1, height: 6, background: 'var(--mantine-color-gray-2)' }}>
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
          <Text
            size="xs"
            c="dimmed"
            mt="sm"
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
                <div style={{ flex: 1, height: 6, background: 'var(--mantine-color-gray-2)' }}>
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
