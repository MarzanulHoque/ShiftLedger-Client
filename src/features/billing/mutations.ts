import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  addLineItem,
  createBill,
  deleteLineItem,
  setBillPaid,
  updateLineItem,
  type LineItemRequest,
} from '../../api/bills';

function useInvalidateBill(jobId: string) {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ['bill', jobId] });
    void queryClient.invalidateQueries({ queryKey: ['bills'] });
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };
}

export function useCreateBill(jobId: string) {
  const invalidate = useInvalidateBill(jobId);
  return useMutation({ mutationFn: () => createBill(jobId), onSuccess: invalidate });
}

export function useAddLineItem(jobId: string, billId: string) {
  const invalidate = useInvalidateBill(jobId);
  return useMutation({
    mutationFn: (request: LineItemRequest) => addLineItem(billId, request),
    onSuccess: invalidate,
  });
}

export function useUpdateLineItem(jobId: string, billId: string) {
  const invalidate = useInvalidateBill(jobId);
  return useMutation({
    mutationFn: ({ lineId, request }: { lineId: string; request: LineItemRequest }) =>
      updateLineItem(billId, lineId, request),
    onSuccess: invalidate,
  });
}

export function useDeleteLineItem(jobId: string, billId: string) {
  const invalidate = useInvalidateBill(jobId);
  return useMutation({
    mutationFn: (lineId: string) => deleteLineItem(billId, lineId),
    onSuccess: invalidate,
  });
}

export function useSetBillPaid(jobId: string, billId: string) {
  const invalidate = useInvalidateBill(jobId);
  return useMutation({
    mutationFn: (isPaid: boolean) => setBillPaid(billId, isPaid),
    onSuccess: invalidate,
  });
}
