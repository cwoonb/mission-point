import { describe, expect, it } from 'vitest';
import type { Membership } from '../types';
import { isFacilitatorMembership, isGuardianMembership, isStudentInOrganization, isStudentMembership, membershipEntry } from './membershipAccess';

const membership=(id:string,role:Membership['role']):Membership=>({id,userId:'u1',organizationId:`org-${id}`,role,status:'ACTIVE',createdAt:'2026-01-01T00:00:00.000Z'});

describe('membership access',()=>{
  it('auto-selects one membership and asks when multiple exist',()=>{
    expect(membershipEntry([membership('one','STUDENT')],null).kind).toBe('AUTO');
    expect(membershipEntry([membership('one','OWNER'),membership('two','STUDENT')],null).kind).toBe('SELECT');
  });
  it('uses active membership role for route access',()=>{
    expect(isFacilitatorMembership('OWNER')).toBe(true);
    expect(isFacilitatorMembership('TEACHER')).toBe(true);
    expect(isFacilitatorMembership('STUDENT')).toBe(false);
    expect(isStudentMembership('STUDENT')).toBe(true);
    expect(isGuardianMembership('GUARDIAN')).toBe(true);
    expect(isFacilitatorMembership('GUARDIAN')).toBe(false);
    expect(isStudentMembership('GUARDIAN')).toBe(false);
  });
  it('keeps student detail access inside active organization',()=>{
    const student={...membership('student','STUDENT'),userId:'student-1',organizationId:'org-a'};
    expect(isStudentInOrganization([student],'student-1','org-a')).toBe(true);
    expect(isStudentInOrganization([student],'student-1','org-b')).toBe(false);
    expect(isStudentInOrganization([student],'student-2','org-a')).toBe(false);
  });
});
