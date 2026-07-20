import { apiClient } from './client';
import type { BillDto, BillSummaryDto, LineItemType, PagedResult } from './types';

export interface GetBillsParams {
  isPaid?: boolean;
  page?: number;
  pageSize?: number;
}

export function getBills(params: GetBillsParams = {}) {
  return apiClient.get<PagedResult<BillSummaryDto>>('/bills', { params }).then((r) => r.data);
}

export function getJobBill(jobId: string) {
  return apiClient.get<BillDto>(`/jobs/${jobId}/bill`).then((r) => r.data);
}

export function createBill(jobId: string) {
  return apiClient.post<string>(`/jobs/${jobId}/bill`).then((r) => r.data);
}

export interface LineItemRequest {
  type: LineItemType;
  description: string;
  quantity: number;
  unitPrice: number;
}

export function addLineItem(billId: string, request: LineItemRequest) {
  return apiClient.post<string>(`/bills/${billId}/line-items`, request).then((r) => r.data);
}

export function updateLineItem(billId: string, lineId: string, request: LineItemRequest) {
  return apiClient.put(`/bills/${billId}/line-items/${lineId}`, request);
}

export function deleteLineItem(billId: string, lineId: string) {
  return apiClient.delete(`/bills/${billId}/line-items/${lineId}`);
}

export function setBillPaid(billId: string, isPaid: boolean) {
  return apiClient.patch(`/bills/${billId}/pay`, { isPaid });
}

export async function downloadInvoice(billId: string) {
  const response = await apiClient.get(`/bills/${billId}/invoice`, { responseType: 'blob' });
  const url = URL.createObjectURL(response.data as Blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `invoice-${billId.slice(0, 8)}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}
