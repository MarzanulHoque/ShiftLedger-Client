import { useQuery } from '@tanstack/react-query';
import { getBills } from '../../api/bills';
import { getJobSummary } from '../../api/jobs';

export interface BillRow {
  billId: string;
  billNumber: number;
  jobId: string;
  jobNumber: number;
  title: string;
  bikeModel: string;
  total: number;
  isPaid: boolean;
  paidAtUtc: string | null;
  jobDeleted: boolean;
}

const PAGE_SIZE = 20;

export function useAllBills(isPaid: boolean | undefined, page: number) {
  return useQuery({
    queryKey: ['bills', 'all', isPaid, page],
    queryFn: async () => {
      const paged = await getBills({ isPaid, page, pageSize: PAGE_SIZE });
      const jobs = await Promise.all(paged.items.map((b) => getJobSummary(b.serviceJobId)));
      const rows: BillRow[] = paged.items.map((b, i) => ({
        billId: b.id,
        billNumber: b.billNumber,
        jobId: b.serviceJobId,
        jobNumber: jobs[i].jobNumber,
        title: jobs[i].title,
        bikeModel: jobs[i].bikeModel,
        total: b.total,
        isPaid: b.isPaid,
        paidAtUtc: b.paidAtUtc,
        jobDeleted: jobs[i].deleted,
      }));
      return { rows, totalCount: paged.totalCount };
    },
  });
}

export { PAGE_SIZE };
