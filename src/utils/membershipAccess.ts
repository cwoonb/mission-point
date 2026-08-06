import type { Membership, MembershipRole } from '../types';

export const isFacilitatorMembership = (role?: MembershipRole) => role === 'OWNER' || role === 'TEACHER';
export const isStudentMembership = (role?: MembershipRole) => role === 'STUDENT';
export const isGuardianMembership = (role?: MembershipRole) => role === 'GUARDIAN';
export const isStudentInOrganization = (memberships: Membership[], userId: string | undefined, organizationId: string | undefined) =>
  !!userId && !!organizationId && memberships.some((membership) => membership.userId === userId && membership.organizationId === organizationId && membership.role === 'STUDENT' && membership.status === 'ACTIVE');

export function membershipEntry(memberships: Membership[], activeMembershipId: string | null) {
  const active = memberships.find((membership) => membership.id === activeMembershipId && membership.status === 'ACTIVE');
  if (active) return { kind: 'ACTIVE' as const, membership: active };
  const available = memberships.filter((membership) => membership.status === 'ACTIVE');
  if (available.length === 1) return { kind: 'AUTO' as const, membership: available[0] };
  if (available.length > 1) return { kind: 'SELECT' as const };
  return { kind: 'EMPTY' as const };
}
