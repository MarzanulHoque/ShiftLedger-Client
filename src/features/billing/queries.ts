import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { getJobBill } from '../../api/bills';

export function useJobBill(jobId: string) {
  return useQuery({
    queryKey: ['bill', jobId],
    queryFn: async () => {
      try {
        return await getJobBill(jobId);
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    enabled: Boolean(jobId),
  });
}
