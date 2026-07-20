import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { getAdminDashboard } from '../../api/dashboard';
import { getBills } from '../../api/bills';
import { getJobs, getJobSummary } from '../../api/jobs';
import { getReport } from '../../api/reports';
import type { JobDto } from '../../api/types';

export function useAdminDashboard() {
  return useQuery({ queryKey: ['dashboard', 'admin'], queryFn: () => getAdminDashboard() });
}

// Yesterday's snapshot, for "vs yesterday" trend deltas on the stat tiles — GetAdminDashboardQuery
// already takes an arbitrary `date`, so no new endpoint is needed for this comparison.
export function useYesterdayDashboard() {
  const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
  return useQuery({
    queryKey: ['dashboard', 'admin', yesterday],
    queryFn: () => getAdminDashboard(yesterday),
  });
}

export interface UnpaidBillRow {
  billId: string;
  jobId: string;
  title: string;
  bikeModel: string;
  total: number;
  jobDeleted: boolean;
}

export function useTopUnpaidBills(limit = 3) {
  return useQuery({
    queryKey: ['dashboard', 'top-unpaid-bills', limit],
    queryFn: async () => {
      const paged = await getBills({ isPaid: false, page: 1, pageSize: limit });
      const jobs = await Promise.all(paged.items.map((b) => getJobSummary(b.serviceJobId)));
      const rows: UnpaidBillRow[] = paged.items.map((b, i) => ({
        billId: b.id,
        jobId: b.serviceJobId,
        title: jobs[i].title,
        bikeModel: jobs[i].bikeModel,
        total: b.total,
        jobDeleted: jobs[i].deleted,
      }));
      return { rows, totalCount: paged.totalCount };
    },
  });
}

export interface RevenueTrendPoint {
  date: string;
  revenue: number;
}

// The Revenue report gives day-by-day figures for any date range — reusing it here instead of
// inventing a new endpoint. AdminDashboardDto only ever carries "today"; a trend needs history.
export function useRevenueTrend(days = 14) {
  const to = dayjs().format('YYYY-MM-DD');
  const from = dayjs().subtract(days - 1, 'day').format('YYYY-MM-DD');

  return useQuery({
    queryKey: ['dashboard', 'revenue-trend', from, to],
    queryFn: async () => {
      const report = await getReport('Revenue', { from, to });
      const byDate = new Map(report.rows.map((row) => [String(row[0]), Number(row[2]) || 0]));

      const points: RevenueTrendPoint[] = [];
      for (let i = 0; i < days; i++) {
        const date = dayjs(from).add(i, 'day').format('YYYY-MM-DD');
        points.push({ date, revenue: byDate.get(date) ?? 0 });
      }
      return points;
    },
  });
}

export interface RecentPaymentRow {
  billId: string;
  jobId: string;
  title: string;
  bikeModel: string;
  total: number;
  paidAtUtc: string;
  jobDeleted: boolean;
}

// A "recent activity" feed sourced from notifications would always be empty here: the backend
// only ever notifies a job's assigned *mechanic* (JobAssigned/JobStatusChanged/BillPaid), never
// the Admin who's looking at this dashboard. Recent payments (real paidAtUtc timestamps, already
// available via the bills endpoint) is the closest genuinely-informative cross-job feed the
// Admin's own data actually supports.
export function useRecentPayments(limit = 6) {
  return useQuery({
    queryKey: ['dashboard', 'recent-payments', limit],
    queryFn: async () => {
      const paged = await getBills({ isPaid: true, page: 1, pageSize: 20 });
      const sorted = [...paged.items]
        .filter((b): b is typeof b & { paidAtUtc: string } => b.paidAtUtc !== null)
        .sort((a, b) => (a.paidAtUtc < b.paidAtUtc ? 1 : -1))
        .slice(0, limit);
      const jobs = await Promise.all(sorted.map((b) => getJobSummary(b.serviceJobId)));
      const rows: RecentPaymentRow[] = sorted.map((b, i) => ({
        billId: b.id,
        jobId: b.serviceJobId,
        title: jobs[i].title,
        bikeModel: jobs[i].bikeModel,
        total: b.total,
        paidAtUtc: b.paidAtUtc,
        jobDeleted: jobs[i].deleted,
      }));
      return rows;
    },
  });
}

export function useDueSoonJobs(limit = 5) {
  return useQuery({
    queryKey: ['dashboard', 'due-soon', limit],
    queryFn: async () => {
      const paged = await getJobs({ pageSize: 100 });
      return paged.items
        .filter((j): j is JobDto & { dueDate: string } => j.status !== 'Delivered' && j.dueDate !== null)
        .sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1))
        .slice(0, limit);
    },
  });
}
