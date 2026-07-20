import { apiClient } from './client';
import type { OrgSettingsDto } from './types';

export function getOrgSettings() {
  return apiClient.get<OrgSettingsDto>('/org-settings').then((r) => r.data);
}
