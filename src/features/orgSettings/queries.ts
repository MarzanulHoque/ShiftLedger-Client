import { useQuery } from '@tanstack/react-query';
import { getOrgSettings } from '../../api/orgSettings';

export function useOrgSettings() {
  return useQuery({ queryKey: ['org-settings'], queryFn: getOrgSettings, staleTime: Infinity });
}
