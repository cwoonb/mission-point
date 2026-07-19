import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Membership, MembershipRole, Organization, PerformerGroup, User } from '../types';
import { useAuthStore } from './authStore';
import { useGroupStore } from './groupStore';
import { supabase } from '../lib/supabase';

const now = () => new Date().toISOString();
const id = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const legacyRole = (role: User['role']): MembershipRole => role === 'CHILD' ? 'STUDENT' : role === 'PARENT' ? 'OWNER' : 'TEACHER';
const userRole = (role: MembershipRole): User['role'] => role === 'STUDENT' ? 'CHILD' : 'TEACHER';

interface MembershipState {
  organizations: Organization[];
  memberships: Membership[];
  activeMembershipId: string | null;
  initializeData: (userId: string) => Promise<void>;
  ensureLegacyMemberships: (users: User[], groups: PerformerGroup[]) => void;
  replaceDemoMemberships: (organizations: Organization[], memberships: Membership[], activeId: string) => void;
  selectMembership: (membershipId: string) => boolean;
  clearActiveMembership: () => void;
  createOrganization: (userId: string, name: string, role?: MembershipRole, groupName?: string) => Promise<Membership>;
  joinOrganization: (userId: string, inviteCode: string) => Promise<Membership | null>;
  getActiveMembership: () => Membership | undefined;
}

export const useMembershipStore = create<MembershipState>()(persist((set, get) => ({
  organizations: [],
  memberships: [],
  activeMembershipId: null,

  initializeData: async (userId) => {
    const { data: membershipRows, error } = await supabase.from('memberships').select('*').eq('user_id', userId);
    if (error || !membershipRows?.length) return;
    const organizationIds=[...new Set(membershipRows.map((row)=>row.organization_id as string))];
    const { data: organizationRows }=await supabase.from('organizations').select('*').in('id',organizationIds);
    const remoteMemberships:Membership[]=membershipRows.map((row)=>({id:row.id,userId:row.user_id,organizationId:row.organization_id,role:row.role,groupId:row.group_id??undefined,status:row.status,createdAt:row.created_at}));
    const remoteOrganizations:Organization[]=(organizationRows??[]).map((row)=>({id:row.id,name:row.name,type:row.type,ownerUserId:row.owner_user_id,inviteCode:row.invite_code??undefined,createdAt:row.created_at}));
    set((state)=>({organizations:[...state.organizations.filter((item)=>!remoteOrganizations.some((remote)=>remote.id===item.id)),...remoteOrganizations],memberships:[...state.memberships.filter((item)=>item.userId!==userId),...remoteMemberships]}));
  },

  ensureLegacyMemberships: (users, groups) => set((state) => {
    const organizations = [...state.organizations];
    const memberships = [...state.memberships];
    for (const user of users) {
      if (memberships.some((membership) => membership.userId === user.id)) continue;
      const facilitatorId = user.role === 'CHILD' ? user.facilitatorId : user.id;
      const organizationId = `legacy-org-${facilitatorId ?? user.id}`;
      if (!organizations.some((organization) => organization.id === organizationId)) {
        const owner = users.find((candidate) => candidate.id === facilitatorId) ?? user;
        organizations.push({ id: organizationId, name: `${owner.name}의 소속`, type: 'EDUCATION', ownerUserId: owner.id, inviteCode: owner.code, createdAt: owner.createdAt });
      }
      memberships.push({ id: `legacy-membership-${user.id}`, userId: user.id, organizationId, role: legacyRole(user.role), groupId: user.groupId, status: 'ACTIVE', createdAt: user.createdAt });
    }
    return { organizations, memberships };
  }),

  replaceDemoMemberships: (organizations, memberships, activeMembershipId) => {
    set((state)=>({
      organizations: [...state.organizations.filter((organization)=>!organization.id.startsWith('demo-org-')), ...organizations],
      memberships: [...state.memberships.filter((membership)=>!membership.id.startsWith('demo-membership-')), ...memberships],
      activeMembershipId,
    }));
    get().selectMembership(activeMembershipId);
  },

  selectMembership: (membershipId) => {
    const membership = get().memberships.find((item) => item.id === membershipId && item.status === 'ACTIVE');
    if (!membership) return false;
    const auth = useAuthStore.getState();
    const baseUser = auth.users.find((user) => user.id === membership.userId) ?? auth.currentUser;
    if (!baseUser) return false;
    useAuthStore.setState({
      currentUser: { ...baseUser, role: userRole(membership.role), groupId: membership.groupId ?? baseUser.groupId },
      viewMode: membership.role === 'STUDENT' ? 'PERFORMER' : 'FACILITATOR',
    });
    set({ activeMembershipId: membershipId });
    return true;
  },

  clearActiveMembership: () => set({ activeMembershipId: null }),

  createOrganization: async (userId, name, role = 'OWNER', groupName) => {
    const organization: Organization = { id: id('org'), name: name.trim(), type: 'EDUCATION', ownerUserId: userId, inviteCode: Math.random().toString(36).slice(2, 8).toUpperCase(), createdAt: now() };
    const membership: Membership = { id: id('membership'), userId, organizationId: organization.id, role, status: 'ACTIVE', createdAt: now() };
    if (!userId.startsWith('demo-')) {
      const { error: organizationError } = await supabase.from('organizations').insert({ id: organization.id, name: organization.name, type: organization.type, owner_user_id: organization.ownerUserId, invite_code: organization.inviteCode, created_at: organization.createdAt });
      if (organizationError) throw new Error(organizationError.message);
      const { error: membershipError } = await supabase.from('memberships').insert({ id: membership.id, user_id: membership.userId, organization_id: membership.organizationId, role: membership.role, group_id: null, status: membership.status, created_at: membership.createdAt });
      if (membershipError) {
        await supabase.from('organizations').delete().eq('id', organization.id);
        throw new Error(membershipError.message);
      }
    }
    set((state) => ({ organizations: [...state.organizations, organization], memberships: [...state.memberships, membership] }));
    if (groupName?.trim()) useGroupStore.getState().createGroup({ name: groupName.trim(), emoji: '', facilitatorId: userId });
    return membership;
  },

  joinOrganization: async (userId, inviteCode) => {
    const normalized = inviteCode.trim().toUpperCase();
    let organization = get().organizations.find((item) => item.inviteCode?.toUpperCase() === normalized);
    if (!organization && !userId.startsWith('demo-')) {
      const { data, error } = await supabase.from('organizations').select('*').eq('invite_code', normalized).maybeSingle();
      if (error) throw new Error(error.message);
      if (data) organization = { id: data.id, name: data.name, type: data.type, ownerUserId: data.owner_user_id, inviteCode: data.invite_code ?? undefined, createdAt: data.created_at };
    }
    if (!organization) return null;
    const existing = get().memberships.find((item) => item.userId === userId && item.organizationId === organization!.id && item.role === 'STUDENT' && item.status === 'ACTIVE');
    if (existing) return existing;
    const membership: Membership = { id: id('membership'), userId, organizationId: organization.id, role: 'STUDENT', status: 'ACTIVE', createdAt: now() };
    if (!userId.startsWith('demo-')) {
      const { error } = await supabase.from('memberships').insert({ id: membership.id, user_id: membership.userId, organization_id: membership.organizationId, role: membership.role, group_id: null, status: membership.status, created_at: membership.createdAt });
      if (error) throw new Error(error.message);
    }
    set((state) => ({ organizations: state.organizations.some((item)=>item.id===organization!.id) ? state.organizations : [...state.organizations, organization!], memberships: [...state.memberships, membership] }));
    return membership;
  },

  getActiveMembership: () => get().memberships.find((membership) => membership.id === get().activeMembershipId),
}), { name: 'mp-memberships' }));

export const membershipViewMode = (role?: MembershipRole) => role === 'STUDENT' ? 'PERFORMER' : 'FACILITATOR';
