import { describe, expect, it } from 'vitest';
import { getBottomNavTabs } from './BottomNav';

describe('role navigation',()=>{
  it('shows operator navigation for OWNER and TEACHER',()=>{
    expect(getBottomNavTabs('OWNER').map(tab=>tab.label)).toEqual(['홈','미션','학생','내 정보']);
    expect(getBottomNavTabs('TEACHER').map(tab=>tab.label)).toEqual(['홈','미션','학생','내 정보']);
  });
  it('shows student-only navigation for STUDENT',()=>{
    expect(getBottomNavTabs('STUDENT').map(tab=>tab.label)).toEqual(['홈','미션','활동','내 정보']);
  });
  it('shows a focused navigation for personal TODO workspaces',()=>{
    expect(getBottomNavTabs('OWNER','학생',0,'PERSONAL').map(tab=>tab.label)).toEqual(['홈','TODO','내 정보']);
  });
});
