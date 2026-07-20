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

export interface UnpaidBillRow {
  billId: string;
  jobId: string;
  title: string;
  bikeModel: string;
  total: number;
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
