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
