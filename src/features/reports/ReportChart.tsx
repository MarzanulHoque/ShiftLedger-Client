import type { ReactNode } from 'react';
import dayjs from 'dayjs';
import { Paper, Text } from '@mantine/core';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { JobStatus, ReportData, ReportType } from '../../api/types';
import { CHART_COLORS, STATUS_CHART_COLOR } from '../../lib/chartColors';
import { formatMoney } from '../../lib/money';
import { STATUS_META } from '../../lib/statusColors';

const JOB_STATUS_ORDER: JobStatus[] = ['Received', 'InProgress', 'Completed', 'Delivered'];

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Paper p="md" shadow="sm">
      <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="sm">
        {title}
      </Text>
      {children}
    </Paper>
  );
}

// Jobs report: one bar per status. Two of the four status hues (Received/Delivered) are
// deliberately desaturated neutrals shared with badges/kanban elsewhere in the app — the x-axis
// tick already names every bar, so identity never depends on telling those two apart by color.
function JobsByStatusChart({ report }: { report: ReportData }) {
  const data = JOB_STATUS_ORDER.map((status) => ({
    status,
    label: STATUS_META[status].label,
    count: report.rows.filter((r) => r[2] === status).length,
  }));

  return (
    <ChartCard title="Jobs by status">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 16, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--mantine-color-gray-2)" />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'var(--mantine-color-dimmed)' }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--mantine-color-dimmed)' }} axisLine={false} tickLine={false} width={32} />
          <Tooltip />
          <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={56}>
            {data.map((row) => (
              <Cell key={row.status} fill={STATUS_CHART_COLOR[row.status]} />
            ))}
            <LabelList dataKey="count" position="top" style={{ fontSize: 12, fill: 'var(--mantine-color-text)' }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// Revenue report: same visual language as the dashboard's 14-day trend, just driven by whatever
// date range the report filters resolve to instead of a fixed window.
function RevenueChart({ report, money }: { report: ReportData; money: (amount: number) => string }) {
  const data = report.rows.map((row) => ({ date: String(row[0]), revenue: Number(row[2]) || 0 }));

  return (
    <ChartCard title="Revenue by day">
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="reportRevenueFill" x1="0" y1="0" x2="0" y2="1">
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
          <Tooltip formatter={(value) => money(Number(value) || 0)} labelFormatter={(d) => (d ? dayjs(String(d)).format('MMM D, YYYY') : '')} />
          <Area type="monotone" dataKey="revenue" stroke={CHART_COLORS.brand} strokeWidth={2} fill="url(#reportRevenueFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// Unpaid bills report: magnitude ranking, one hue (danger — money owed), sorted high to low.
// Capped at the top 10 so the chart stays readable; the full list is always in the table below.
function UnpaidBillsChart({ report, money }: { report: ReportData; money: (amount: number) => string }) {
  const all = report.rows
    .map((row) => ({ job: String(row[0]), outstanding: Number(row[3]) || 0 }))
    .sort((a, b) => b.outstanding - a.outstanding);
  const data = all.slice(0, 10);

  return (
    <ChartCard title={all.length > 10 ? `Outstanding by job — top 10 of ${all.length}` : 'Outstanding by job'}>
      <ResponsiveContainer width="100%" height={Math.max(160, data.length * 34)}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 64, left: 0, bottom: 0 }}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="job" width={140} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip formatter={(value) => money(Number(value) || 0)} />
          <Bar dataKey="outstanding" fill={CHART_COLORS.danger} radius={[0, 4, 4, 0]} barSize={18}>
            <LabelList dataKey="outstanding" position="right" formatter={(v) => money(Number(v) || 0)} style={{ fontSize: 11, fill: 'var(--mantine-color-dimmed)' }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// Billing history report: billed total per day, split paid vs unpaid. Only the outer (Paid)
// segment gets rounded corners — the mark spec's "rounded free end, square baseline" applied to a
// stack means just the topmost segment gets the rounded cap, not every internal boundary.
function BillingHistoryChart({ report, money }: { report: ReportData; money: (amount: number) => string }) {
  const byDate = new Map<string, { date: string; paid: number; unpaid: number }>();
  for (const row of report.rows) {
    const date = String(row[2]);
    const total = Number(row[3]) || 0;
    const entry = byDate.get(date) ?? { date, paid: 0, unpaid: 0 };
    if (row[4] === 'Paid') entry.paid += total;
    else entry.unpaid += total;
    byDate.set(date, entry);
  }
  const data = [...byDate.values()].sort((a, b) => (a.date < b.date ? -1 : 1));

  return (
    <ChartCard title="Billed per day — paid vs unpaid">
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
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
          <Tooltip formatter={(value) => money(Number(value) || 0)} labelFormatter={(d) => (d ? dayjs(String(d)).format('MMM D, YYYY') : '')} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="unpaid" name="Unpaid" stackId="billing" fill={CHART_COLORS.danger} maxBarSize={40} />
          <Bar dataKey="paid" name="Paid" stackId="billing" fill={CHART_COLORS.success} radius={[4, 4, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// Mechanic productivity report: per-mechanic stacked bar (Open -> Completed -> Delivered reads as
// a progression, ending capped on the "fully done" segment). Horizontal, matching the dashboard's
// mechanic workload chart, since mechanic names don't fit comfortably on a vertical axis.
function MechanicProductivityChart({ report }: { report: ReportData }) {
  const data = report.rows.map((row) => ({
    mechanic: String(row[0]),
    open: Number(row[4]) || 0,
    completed: Number(row[2]) || 0,
    delivered: Number(row[3]) || 0,
  }));

  return (
    <ChartCard title="Mechanic productivity">
      <ResponsiveContainer width="100%" height={Math.max(140, data.length * 44)}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
          <XAxis type="number" allowDecimals={false} hide />
          <YAxis type="category" dataKey="mechanic" width={90} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="open" name="Open" stackId="productivity" fill={CHART_COLORS.steel} barSize={18} />
          <Bar dataKey="completed" name="Completed" stackId="productivity" fill={CHART_COLORS.success} barSize={18} />
          <Bar dataKey="delivered" name="Delivered" stackId="productivity" fill={CHART_COLORS.slateDark} barSize={18} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function ReportChart({ type, report, currencyCode }: { type: ReportType; report: ReportData; currencyCode?: string }) {
  if (report.rows.length === 0) return null;
  const money = (amount: number) => formatMoney(amount, currencyCode);

  switch (type) {
    case 'Jobs':
      return <JobsByStatusChart report={report} />;
    case 'Revenue':
      return <RevenueChart report={report} money={money} />;
    case 'UnpaidBills':
      return <UnpaidBillsChart report={report} money={money} />;
    case 'BillingHistory':
      return <BillingHistoryChart report={report} money={money} />;
    case 'MechanicProductivity':
      return <MechanicProductivityChart report={report} />;
    default:
      return null;
  }
}
