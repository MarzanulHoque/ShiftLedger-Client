import { useQuery } from '@tanstack/react-query';
import { getReport } from '../../api/reports';
import type { ReportFilters, ReportType } from '../../api/types';

export function useReport(type: ReportType, filters: ReportFilters) {
  return useQuery({
    queryKey: ['reports', type, filters],
    queryFn: () => getReport(type, filters),
  });
}
