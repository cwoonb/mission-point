import type { Guardian, GuardianReport, ReportSnapshot, StudentGuardian, User } from '../types';
import type { DemoScenarioSeed } from './demoScenarios';

export const GUARDIAN_DEMO_USER_ID = 'demo-study-room-guardian-user';

const daysAgo = (days: number) => new Date(Date.now() - days * 86400000).toISOString();

function snapshotFor(seed: DemoScenarioSeed, student: User, reportOffset: number): ReportSnapshot {
  const studentMissions = seed.missions.filter((mission) => mission.assigneeId === student.id);
  const missionIds = new Set(studentMissions.map((mission) => mission.id));
  const submissions = seed.submissions
    .filter((submission) => submission.userId === student.id && missionIds.has(submission.missionId))
    .sort((a, b) => Date.parse(b.submittedAt) - Date.parse(a.submittedAt));
  const title = (missionId: string) => studentMissions.find((mission) => mission.id === missionId)?.title ?? '활동 미션';
  const feedback = seed.reviewLogs
    .filter((log) => missionIds.has(log.missionId) && log.action === 'APPROVED' && (log.publicFeedback || log.reason))
    .slice(reportOffset, reportOffset + 4);
  const group = seed.groups.find((item) => item.id === student.groupId)?.name ?? '소속 반';
  const generatedAt = daysAgo(reportOffset * 14);
  return {
    version: 1,
    generatedAt,
    periodStart: daysAgo(reportOffset * 14 + 30),
    teacherName: seed.users[0].name,
    student: { name: student.name, group },
    recentActivities: submissions.slice(reportOffset, reportOffset + 5).map((submission) => ({
      title: title(submission.missionId),
      date: submission.submittedAt,
      comment: submission.message || '정해진 활동을 차분히 완료했습니다.',
    })),
    completedMissions: studentMissions.filter((mission) => mission.status === 'SUCCESS').slice(reportOffset, reportOffset + 5).map((mission) => ({ title: mission.title, date: mission.endDate })),
    ongoingMissions: studentMissions.filter((mission) => ['PENDING', 'IN_PROGRESS', 'REVIEWING', 'REJECTED'].includes(mission.status)).slice(0, 4).map((mission) => ({ title: mission.title, dueDate: mission.endDate, status: mission.status })),
    feedback: feedback.map((log) => ({ mission: title(log.missionId), text: log.publicFeedback || log.reason || '', date: log.createdAt, action: log.action })),
    photos: submissions.flatMap((submission) => submission.imageUrls?.length ? submission.imageUrls : submission.imageUrl ? [submission.imageUrl] : []).slice(reportOffset, reportOffset + 6),
    strengths: '활동 내용을 스스로 정리하고 피드백을 다음 제출에 반영하는 모습이 좋습니다.',
    nextGoal: '지금의 꾸준한 참여 흐름을 이어가며 마감 전 제출을 습관으로 만들어 보세요.',
    teacherMemo: '최근 활동을 성실하게 이어가고 있습니다. 가정에서도 과정 중심으로 격려해 주세요.',
  };
}

export function buildGuardianDemo(seed: DemoScenarioSeed, organizationId: string) {
  const students = seed.users.slice(1, 3);
  const currentUser: User = {
    id: GUARDIAN_DEMO_USER_ID,
    name: '정민준 보호자',
    role: 'PARENT',
    point: 0,
    avatar: '👩',
    email: 'guardian.demo@example.com',
    createdAt: daysAgo(90),
  };
  const guardian: Guardian = {
    id: 'demo-study-room-guardian-001',
    organizationId,
    authUserId: currentUser.id,
    name: currentUser.name,
    phone: '010-1234-5678',
    email: currentUser.email,
    notificationsEnabled: true,
    createdAt: currentUser.createdAt,
    updatedAt: daysAgo(1),
  };
  const links: StudentGuardian[] = students.map((student, index) => ({
    id: `demo-study-room-student-guardian-${index + 1}`,
    organizationId,
    studentId: student.id,
    guardianId: guardian.id,
    relationship: index === 0 ? '어머니' : '보호자',
    isPrimary: index === 0,
    status: 'ACTIVE',
    createdAt: daysAgo(60 - index),
  }));
  const reports: GuardianReport[] = students.flatMap((student, studentIndex) => [0, 1].map((offset) => ({
    id: `demo-study-room-guardian-report-${studentIndex + 1}-${offset + 1}`,
    organizationId,
    studentId: student.id,
    createdBy: seed.users[0].id,
    snapshot: snapshotFor(seed, student, offset),
    createdAt: daysAgo(offset * 14),
    updatedAt: daysAgo(offset * 14),
    lastViewedAt: offset === 1 ? daysAgo(10) : undefined,
  })));
  return { currentUser, guardian, links, reports, students };
}
