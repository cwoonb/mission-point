import type { Mission, MissionReviewLog, MissionSubmission, PerformerGroup, User } from '../types';
import type { TeacherNote } from '../store/authStore';

export const STUDENT_DEMO_USER_ID = 'demo-student-art-member';
export const STUDENT_DEMO_TEACHER_ID = 'demo-student-art-teacher';
export const STUDENT_DEMO_GROUP_ID = 'demo-student-art-group';

const at = (offsetDays: number, hour = 12) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
};

export function getStudentDemoImage(label = '수정한 작품 사진') {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="720" viewBox="0 0 960 720"><rect width="960" height="720" fill="#f2eadf"/><rect x="92" y="78" width="776" height="564" rx="22" fill="#fffdf9" stroke="#c6a66e" stroke-width="8"/><circle cx="360" cy="320" r="115" fill="#d9a86c" opacity=".72"/><path d="M220 520c130-190 245-250 500-280" fill="none" stroke="#314d67" stroke-width="26" stroke-linecap="round"/><path d="M430 180c95 80 165 195 220 340" fill="none" stroke="#87956c" stroke-width="20" stroke-linecap="round"/><text x="480" y="610" text-anchor="middle" font-family="sans-serif" font-size="30" fill="#14233b">${label}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export interface StudentDemoSeed {
  users: User[];
  groups: PerformerGroup[];
  missions: Mission[];
  submissions: MissionSubmission[];
  reviewLogs: MissionReviewLog[];
  teacherNotes: Record<string, TeacherNote[]>;
}

export function buildStudentDemo(): StudentDemoSeed {
  const student: User = { id: STUDENT_DEMO_USER_ID, name: '이서연', role: 'CHILD', point: 0, avatar: '이', createdAt: at(-120), facilitatorId: STUDENT_DEMO_TEACHER_ID, groupId: STUDENT_DEMO_GROUP_ID, code: 'ART725' };
  const teacher: User = { id: STUDENT_DEMO_TEACHER_ID, name: '김하늘', role: 'TEACHER', point: 0, avatar: '김', createdAt: at(-365), code: 'ART100' };
  const group: PerformerGroup = { id: STUDENT_DEMO_GROUP_ID, name: '드로잉 A반', emoji: '', facilitatorId: teacher.id, createdAt: at(-180) };
  const mission = (id: string, title: string, status: Mission['status'], submissionType: Mission['submissionType'], start: number, end: number, description: string): Mission => ({ id: `demo-student-art-${id}`, title, description, rewardPoint: 0, creatorId: teacher.id, assigneeId: student.id, status, submissionType, startDate: at(start, 9), endDate: at(end, 21), createdAt: at(Math.min(start - 2, -30), 10), missionType: 'OTHER', repeatType: 'ONCE', parentShare: 'NONE' });
  const missions = [
    mission('observation', '관찰 스케치', 'PENDING', 'TEXT', 1, 5, '교실의 정물을 관찰하고 형태와 특징을 세 문장으로 적어보세요.'),
    mission('watercolor', '수채화 채색 과정', 'IN_PROGRESS', 'TEXT', -2, 4, '사용한 색과 번짐 효과를 기록해 주세요.'),
    mission('finished-photo', '작품 완성 사진', 'IN_PROGRESS', 'IMAGE', -3, 0, '오늘 완성한 작품을 밝은 곳에서 촬영해 제출해 주세요.'),
    mission('value-study', '명암 단계 연습', 'IN_PROGRESS', 'TEXT', -5, 3, '5단계 명암을 연습하고 어려웠던 부분을 적어주세요.'),
    mission('material-check', '재료 준비 인증', 'IN_PROGRESS', 'IMAGE', -1, 2, '다음 수업에 사용할 붓, 팔레트, 물감 사진을 올려주세요.'),
    mission('color-mix', '색상 혼합 기록', 'REVIEWING', 'BOTH', -7, 1, '두 가지 색을 섞은 과정과 결과를 사진과 글로 남겨주세요.'),
    mission('portrait-fix', '인물 비례 수정', 'REJECTED', 'IMAGE', -12, 2, '인물 중심선과 눈 위치를 확인해 스케치를 수정해 주세요.'),
    mission('art-description', '작품 설명 작성', 'SUCCESS', 'BOTH', -18, -2, '완성 작품 사진과 작품 의도를 함께 제출해 주세요.'),
  ];
  const id = (suffix: string) => `demo-student-art-${suffix}`;
  const submissions: MissionSubmission[] = [
    { id: id('sub-color'), missionId: id('color-mix'), userId: student.id, message: '파랑과 노랑을 섞어 초록색의 변화를 기록했습니다.', imageUrl: getStudentDemoImage('색상 혼합 기록'), attemptNumber: 1, submittedAt: at(-1, 18) },
    { id: id('sub-portrait'), missionId: id('portrait-fix'), userId: student.id, message: '인물 스케치 초안을 제출합니다.', imageUrl: getStudentDemoImage('인물 스케치 초안'), attemptNumber: 1, submittedAt: at(-4, 17) },
    { id: id('sub-description-1'), missionId: id('art-description'), userId: student.id, message: '따뜻한 오후의 느낌을 표현했습니다.', imageUrl: getStudentDemoImage('작품 설명 초안'), attemptNumber: 1, submittedAt: at(-9, 16) },
    { id: id('sub-description-2'), missionId: id('art-description'), userId: student.id, message: '배경 색을 정리하고 작품 의도를 더 자세히 적었습니다.', imageUrl: getStudentDemoImage('수정한 완성 작품'), attemptNumber: 2, submittedAt: at(-6, 18) },
  ];
  const reviewLogs: MissionReviewLog[] = [
    { id: id('review-portrait'), missionId: id('portrait-fix'), submissionId: id('sub-portrait'), reviewerId: teacher.id, action: 'REJECTED', reason: '인물의 중심선과 눈 위치를 다시 확인해 주세요. 수정한 스케치 사진을 다시 제출해 주세요.', createdAt: at(-3, 14) },
    { id: id('review-description-reject'), missionId: id('art-description'), submissionId: id('sub-description-1'), reviewerId: teacher.id, action: 'REJECTED', reason: '배경과 중심 소재의 관계를 한 문장 더 설명해 주세요.', createdAt: at(-8, 13) },
    { id: id('review-description-approve'), missionId: id('art-description'), submissionId: id('sub-description-2'), reviewerId: teacher.id, action: 'APPROVED', reason: '수정한 설명이 작품의 분위기를 잘 전달합니다. 색의 선택도 좋습니다.', createdAt: at(-5, 15) },
  ];
  return { users: [teacher, student], groups: [group], missions, submissions, reviewLogs, teacherNotes: {} };
}
