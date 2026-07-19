import { beforeAll, describe, expect, it } from 'vitest';

class MemoryStorage implements Storage {
  private values=new Map<string,string>();
  get length(){return this.values.size;} clear(){this.values.clear();} getItem(key:string){return this.values.get(key)??null;} key(index:number){return [...this.values.keys()][index]??null;} removeItem(key:string){this.values.delete(key);} setItem(key:string,value:string){this.values.set(key,value);}
}

describe('membership store',()=>{
  beforeAll(()=>Object.defineProperty(globalThis,'localStorage',{value:new MemoryStorage(),configurable:true}));
  it('switches role without changing account id or persisting operational memberships',async()=>{
    const [{useMembershipStore},{useAuthStore}]=await Promise.all([import('./membershipStore'),import('./authStore')]);
    const user={id:'multi-user',name:'조원배',role:'TEACHER' as const,point:0,avatar:'조',createdAt:'2026-01-01T00:00:00.000Z'};
    useAuthStore.setState({users:[user],currentUser:user,viewMode:'FACILITATOR',isDemoMode:true});
    useMembershipStore.setState({organizations:[{id:'art',name:'미술 학원',type:'ACADEMY',ownerUserId:user.id,createdAt:user.createdAt},{id:'english',name:'영어 공부방',type:'STUDY_ROOM',ownerUserId:'teacher',createdAt:user.createdAt}],memberships:[{id:'operator',userId:user.id,organizationId:'art',role:'OWNER',status:'ACTIVE',createdAt:user.createdAt},{id:'student',userId:user.id,organizationId:'english',role:'STUDENT',groupId:'english-a',status:'ACTIVE',createdAt:user.createdAt}],activeMembershipId:null});
    expect(useMembershipStore.getState().selectMembership('operator')).toBe(true);
    expect(useAuthStore.getState().viewMode).toBe('FACILITATOR');
    expect(useMembershipStore.getState().selectMembership('student')).toBe(true);
    expect(useAuthStore.getState().currentUser?.id).toBe(user.id);
    expect(useAuthStore.getState().viewMode).toBe('PERFORMER');
    expect(localStorage.getItem('mp-memberships')).not.toContain('"id":"student"');
    useMembershipStore.getState().clearActiveMembership();
    expect(useMembershipStore.getState().activeMembershipId).toBeNull();
  });
});
