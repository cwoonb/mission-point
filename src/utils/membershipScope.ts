import type { Mission } from '../types';

export const missionInOrganization=(mission:Mission,organizationId?:string)=>!mission.organizationId||!organizationId||mission.organizationId===organizationId;
