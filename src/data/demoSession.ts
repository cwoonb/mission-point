import { initialGroups, initialMissions, initialUsers } from './mockData';
import { useAuthStore } from '../store/authStore';
import { useGroupStore } from '../store/groupStore';
import { useMissionStore } from '../store/missionStore';
import type { MissionReviewLog, MissionSubmission } from '../types';

const sampleSubmissions: MissionSubmission[] = [
  { id: 'demo-sub-1', missionId: 'demo-m16', userId: 'user-child-5', message: '새싹이 자라는 모습을 3일 동안 관찰했습니다.', imageUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800', attemptNumber: 1, submittedAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 'demo-sub-2', missionId: 'demo-m17', userId: 'user-child-6', message: '오늘 배운 핵심은 규칙을 찾고 설명하는 것입니다.', attemptNumber: 2, submittedAt: new Date(Date.now() - 7200000).toISOString() },
  { id: 'demo-sub-3', missionId: 'demo-m18', userId: 'user-child-7', message: '주인공이 친구를 도와주는 장면이 가장 기억에 남았습니다.', attemptNumber: 1, submittedAt: new Date(Date.now() - 10800000).toISOString() },
];
const reviewLogs: MissionReviewLog[] = [
  { id: 'demo-review-child-1', missionId: 'mission-3', submissionId: 'demo-sub-complete-1', reviewerId: 'user-teacher-1', action: 'APPROVED', reason: '틀린 이유와 다시 푼 과정을 차분하게 잘 정리했습니다.', createdAt: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: 'demo-review-1', missionId: 'demo-m20', submissionId: 'demo-sub-old', reviewerId: 'user-teacher-1', action: 'APPROVED', reason: '풀이 과정이 잘 정리되었습니다.', createdAt: new Date(Date.now() - 8 * 86400000).toISOString() },
];

function buildDemoSubmissions(): MissionSubmission[] {
  const byMission = new Map(sampleSubmissions.map((submission) => [submission.missionId, submission]));
  return initialMissions.filter((mission) => mission.status === 'REVIEWING').map((mission, index) => byMission.get(mission.id) ?? {
    id: `demo-sub-${mission.id}`,
    missionId: mission.id,
    userId: mission.assigneeId,
    message: index % 2 === 0 ? '미션을 마치고 확인한 내용을 정리해 제출합니다.' : '안내받은 내용을 확인하고 활동을 완료했습니다.',
    imageUrl: mission.submissionType === 'IMAGE' || mission.submissionType === 'BOTH' ? 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800' : undefined,
    attemptNumber: index === 0 ? 2 : 1,
    submittedAt: new Date(Date.now() - (index + 1) * 3600000).toISOString(),
  });
}

export function startDemoSession(userId: string, force = false) {
  const user = initialUsers.find((item) => item.id === userId);
  if (!user) return false;
  const missionState = useMissionStore.getState();
  const preserveSession = !force && missionState.demoMode && missionState.missions.length > 0;
  useAuthStore.setState({
    users: preserveSession ? useAuthStore.getState().users : initialUsers,
    currentUser: user,
    viewMode: user.role === 'CHILD' ? 'PERFORMER' : 'FACILITATOR',
    isDemoMode: true,
    teacherNotes: preserveSession ? useAuthStore.getState().teacherNotes : {
      'user-child-1': [{ id: 'demo-note-1', text: '최근 제출 내용을 스스로 설명하는 힘이 좋아졌습니다.', createdAt: new Date(Date.now() - 86400000).toISOString() }],
      'user-child-4': [{ id: 'demo-note-2', text: '미제출 활동부터 하나씩 완료하도록 가정과 함께 확인이 필요합니다.', createdAt: new Date(Date.now() - 2 * 86400000).toISOString() }],
    },
  });
  if (!preserveSession) {
    useGroupStore.setState({ groups: initialGroups, demoMode: true });
    useMissionStore.setState({ missions: initialMissions, submissions: buildDemoSubmissions(), reviewLogs, demoMode: true });
  }
  return true;
}

export function resetDemoSession() {
  const current = useAuthStore.getState().currentUser;
  if (current) startDemoSession(current.id, true);
}
