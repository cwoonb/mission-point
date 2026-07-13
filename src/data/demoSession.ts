import { initialGroups, initialMissions, initialUsers } from './mockData';
import { useAuthStore } from '../store/authStore';
import { useGroupStore } from '../store/groupStore';
import { useMissionStore } from '../store/missionStore';
import type { MissionReviewLog, MissionSubmission } from '../types';

const submissions: MissionSubmission[] = [
  { id: 'demo-sub-1', missionId: 'demo-m16', userId: 'user-child-5', message: '새싹이 자라는 모습을 3일 동안 관찰했습니다.', imageUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800', attemptNumber: 1, submittedAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 'demo-sub-2', missionId: 'demo-m17', userId: 'user-child-6', message: '오늘 배운 핵심은 규칙을 찾고 설명하는 것입니다.', attemptNumber: 2, submittedAt: new Date(Date.now() - 7200000).toISOString() },
  { id: 'demo-sub-3', missionId: 'demo-m18', userId: 'user-child-7', message: '주인공이 친구를 도와주는 장면이 가장 기억에 남았습니다.', attemptNumber: 1, submittedAt: new Date(Date.now() - 10800000).toISOString() },
];
const reviewLogs: MissionReviewLog[] = [
  { id: 'demo-review-1', missionId: 'demo-m20', submissionId: 'demo-sub-old', reviewerId: 'user-teacher-1', action: 'APPROVED', reason: '풀이 과정이 잘 정리되었습니다.', createdAt: new Date(Date.now() - 8 * 86400000).toISOString() },
];

export function startDemoSession(userId: string) {
  const user = initialUsers.find((item) => item.id === userId);
  if (!user) return false;
  useAuthStore.setState({
    users: initialUsers,
    currentUser: user,
    viewMode: user.role === 'CHILD' ? 'PERFORMER' : 'FACILITATOR',
    isDemoMode: true,
  });
  useGroupStore.setState({ groups: initialGroups, demoMode: true });
  useMissionStore.setState({ missions: initialMissions, submissions, reviewLogs, demoMode: true });
  return true;
}

export function resetDemoSession() {
  const current = useAuthStore.getState().currentUser;
  if (current) startDemoSession(current.id);
}
