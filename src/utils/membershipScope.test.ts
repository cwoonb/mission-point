import { describe, expect, it } from 'vitest';
import type { Mission } from '../types';
import { missionInOrganization } from './membershipScope';

const mission={id:'m',title:'미션',description:'',rewardPoint:0,creatorId:'u',assigneeId:'s',status:'IN_PROGRESS' as const,submissionType:'TEXT' as const,startDate:'2026-01-01',endDate:'2026-01-02',createdAt:'2026-01-01'} satisfies Mission;
describe('membership data scope',()=>{it('keeps legacy missions compatible and isolates newly scoped missions',()=>{expect(missionInOrganization(mission,'art')).toBe(true);expect(missionInOrganization({...mission,organizationId:'art'},'art')).toBe(true);expect(missionInOrganization({...mission,organizationId:'english'},'art')).toBe(false);});});
