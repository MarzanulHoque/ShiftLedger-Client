import { apiClient } from './client';
import type { ReportData, ReportFilters, ReportType } from './types';

export function getReport(type: ReportType, filters: ReportFilters = {}) {
  return apiClient
    .get<ReportData>(`/reports/${type}`, { params: { ...filters, format: 'json' } })
    .then((r) => r.data);
}

export async function downloadReport(type: ReportType, format: 'pdf' | 'excel', filters: ReportFilters = {}) {
  const response = await apiClient.get(`/reports/${type}`, {
    params: { ...filters, format },
    responseType: 'blob',
  });
  const extension = format === 'pdf' ? 'pdf' : 'xlsx';
  const url = URL.createObjectURL(response.data as Blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${type}.${extension}`;
  link.click();
  URL.revokeObjectURL(url);
}
