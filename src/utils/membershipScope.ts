import type { Mission } from '../types';

export const missionInOrganization = (mission: Mission, organizationId?: string) => {
  if (mission.organizationId) return mission.organizationId === organizationId;
  if (!organizationId) return true;
  return organizationId === `legacy-org-${mission.creatorId}`;
};
