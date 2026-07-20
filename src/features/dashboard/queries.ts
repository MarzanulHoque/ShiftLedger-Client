import { useQuery } from '@tanstack/react-query';
import { getAdminDashboard } from '../../api/dashboard';
import { getBills } from '../../api/bills';
import { getJob, getJobs } from '../../api/jobs';
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
      const jobs = await Promise.all(paged.items.map((b) => getJob(b.serviceJobId)));
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
