import type {
  Mission,
  MissionReviewLog,
  MissionStatus,
  MissionSubmission,
  MissionType,
  PerformerGroup,
  User,
} from '../types';

export type DemoScenarioId =
  | 'large-academy'
  | 'study-room'
  | 'pt-center'
  | 'family'
  | 'piano'
  | 'art'
  | 'movement'
  | 'company'
  | 'rehab'
  | 'pet-care';

type StatusCounts = Partial<Record<MissionStatus, number>>;

export interface DemoScenarioConfig {
  id: DemoScenarioId;
  emoji: string;
  name: string;
  description: string;
  facilitatorName: string;
  facilitatorRole: 'TEACHER' | 'PARENT';
  memberLabel: string;
  groupLabel: string;
  groupNames: string[];
  memberCount: number;
  missionCount: number;
  statusCounts: StatusCounts;
  photoCount: number;
  feedbackCount: number;
  noteCount: number;
  missionTitles: string[];
  feedbacks: string[];
  notes: string[];
}

export interface DemoScenarioStats {
  members: number;
  missions: number;
  submissions: number;
  feedbacks: number;
  notes: number;
  photos: number;
  reports: number;
  pending: number;
  missing: number;
  completed: number;
}

export interface DemoScenarioSeed {
  config: DemoScenarioConfig;
  users: User[];
  groups: PerformerGroup[];
  missions: Mission[];
  submissions: MissionSubmission[];
  reviewLogs: MissionReviewLog[];
  teacherNotes: Record<string, Array<{ id: string; text: string; createdAt: string }>>;
  stats: DemoScenarioStats;
}

const COMMON_FEEDBACK = [
  '과정을 차분하게 기록해 변화가 잘 보입니다.',
  '안내받은 내용을 반영해 다시 제출한 점이 좋습니다.',
  '꾸준히 참여하고 있어 다음 단계로 이어가기 좋습니다.',
  '사진과 설명이 함께 있어 활동 내용을 확인하기 쉽습니다.',
  '다음에는 어려웠던 점도 한 줄 덧붙여 주세요.',
];

const COMMON_NOTES = [
  '최근 활동을 스스로 설명하는 힘이 좋아졌습니다.',
  '보호자와 다음 목표를 짧게 공유했습니다.',
  '제출 시간을 일정하게 잡아주면 도움이 됩니다.',
  '수정 안내를 빠르게 이해하고 다시 참여했습니다.',
  '이번 달 활동 사진을 리포트에 함께 전달했습니다.',
];

export const DEMO_SCENARIOS: DemoScenarioConfig[] = [
  {
    id: 'large-academy', emoji: '📚', name: '대형 학원', description: '7개 반 · 학생 72명 · 3개월 운영 데이터',
    facilitatorName: '김민수', facilitatorRole: 'TEACHER', memberLabel: '학생', groupLabel: '반',
    groupNames: ['중1 A', '중1 B', '중2 A', '중2 B', '중3', '고1', '고2'], memberCount: 72, missionCount: 180,
    statusCounts: { SUCCESS: 120, REVIEWING: 24, EXPIRED: 10, FAILED: 4, REJECTED: 8, IN_PROGRESS: 14 },
    photoCount: 112, feedbackCount: 82, noteCount: 60,
    missionTitles: ['수학 오답노트 정리', '영어 단어 테스트', '독서 기록장', '과학 탐구 보고서', '주간 학습 계획', '국어 지문 분석', '수업 복습 인증', '모의고사 해설 정리'],
    feedbacks: ['풀이 과정의 핵심이 잘 드러납니다.', '틀린 문제를 다시 설명한 점이 좋습니다.', '학습 계획을 구체적으로 작성했습니다.', ...COMMON_FEEDBACK], notes: ['다음 상담에서 진로 희망을 함께 확인하기로 했습니다.', ...COMMON_NOTES],
  },
  {
    id: 'study-room', emoji: '🏫', name: '소형 공부방', description: '2개 반 · 학생 12명 · 상담 중심 운영',
    facilitatorName: '박서연', facilitatorRole: 'TEACHER', memberLabel: '학생', groupLabel: '반',
    groupNames: ['초등 기초반', '중등 자기주도반'], memberCount: 12, missionCount: 36,
    statusCounts: { SUCCESS: 22, REVIEWING: 5, EXPIRED: 3, REJECTED: 2, IN_PROGRESS: 4 }, photoCount: 20, feedbackCount: 20, noteCount: 18,
    missionTitles: ['오늘 숙제 확인', '읽은 책 한 줄 기록', '연산 문제 복습', '영어 문장 소리내어 읽기', '책상 정리 인증', '주간 목표 적기'],
    feedbacks: ['집중해서 끝까지 풀어낸 점이 좋습니다.', ...COMMON_FEEDBACK], notes: ['보호자와 숙제 시간 조정을 상의했습니다.', ...COMMON_NOTES],
  },
  {
    id: 'pt-center', emoji: '💪', name: 'PT 센터', description: '회원 45명 · 운동·식단·인바디 기록',
    facilitatorName: '이준호', facilitatorRole: 'TEACHER', memberLabel: '회원', groupLabel: '그룹',
    groupNames: ['오전 회원', '퇴근 후 회원', '체형교정', '바디프로필'], memberCount: 45, missionCount: 110,
    statusCounts: { SUCCESS: 60, REVIEWING: 10, EXPIRED: 5, REJECTED: 5, IN_PROGRESS: 30 }, photoCount: 58, feedbackCount: 42, noteCount: 35,
    missionTitles: ['상체 운동 완료', '하체 운동 완료', '유산소 30분', '오늘 체중 기록', '식단 사진 인증', '전신 스트레칭', '물 2L 마시기', '인바디 기록'],
    feedbacks: ['가동 범위가 지난 기록보다 자연스러워졌습니다.', '식단 구성이 한결 안정적입니다.', ...COMMON_FEEDBACK], notes: ['무릎 불편감이 있어 하체 강도를 조정했습니다.', ...COMMON_NOTES],
  },
  {
    id: 'family', emoji: '👩', name: '부모 ↔ 아이', description: '아이 2명 · 생활습관과 가족 메모',
    facilitatorName: '정유진', facilitatorRole: 'PARENT', memberLabel: '아이', groupLabel: '가족',
    groupNames: ['우리 가족'], memberCount: 2, missionCount: 18,
    statusCounts: { SUCCESS: 11, REVIEWING: 2, EXPIRED: 1, REJECTED: 1, IN_PROGRESS: 3 }, photoCount: 9, feedbackCount: 8, noteCount: 8,
    missionTitles: ['아침·저녁 양치하기', '책 20분 읽기', '학교 숙제하기', '놀이방 정리정돈', '밤 10시 전에 자기', '가족과 운동하기', '스스로 가방 챙기기'],
    feedbacks: ['스스로 먼저 시작해서 더 멋졌어.', '정리한 뒤 사진까지 잘 남겼어.', ...COMMON_FEEDBACK], notes: ['이번 주에는 잠드는 시간을 20분 앞당겨 보기로 했습니다.', ...COMMON_NOTES],
  },
  {
    id: 'piano', emoji: '🎹', name: '피아노 학원', description: '수강생 18명 · 연습 영상과 곡별 피드백',
    facilitatorName: '최은지', facilitatorRole: 'TEACHER', memberLabel: '수강생', groupLabel: '클래스',
    groupNames: ['기초 바이엘', '체르니 100', '콩쿠르 준비'], memberCount: 18, missionCount: 54,
    statusCounts: { SUCCESS: 32, REVIEWING: 7, EXPIRED: 3, REJECTED: 4, IN_PROGRESS: 8 }, photoCount: 28, feedbackCount: 30, noteCount: 20,
    missionTitles: ['하농 1번 연습 영상', '새 곡 오른손 연습', '양손 느린 템포 연주', '손모양 가까이 촬영', '페달링 구간 연습', '이번 주 곡 완성 영상'],
    feedbacks: ['손목에 힘이 빠져 소리가 한결 부드러워졌습니다.', '왼손 박자를 조금 더 천천히 확인해 주세요.', ...COMMON_FEEDBACK], notes: ['다음 레슨에서 손가락 번호를 다시 확인할 예정입니다.', ...COMMON_NOTES],
  },
  {
    id: 'art', emoji: '🎨', name: '미술 학원', description: '수강생 16명 · 작품 과정 사진과 피드백',
    facilitatorName: '한소라', facilitatorRole: 'TEACHER', memberLabel: '수강생', groupLabel: '클래스',
    groupNames: ['창의 드로잉', '수채화', '입시 기초'], memberCount: 16, missionCount: 48,
    statusCounts: { SUCCESS: 28, REVIEWING: 7, EXPIRED: 3, REJECTED: 3, IN_PROGRESS: 7 }, photoCount: 36, feedbackCount: 28, noteCount: 18,
    missionTitles: ['관찰 스케치', '명암 단계 연습', '수채화 채색 과정', '인물 비례 수정', '작품 완성 사진', '아이디어 스케치 3안'],
    feedbacks: ['색의 겹침이 자연스럽고 화면이 풍부합니다.', '중심 형태의 비례를 한 번 더 확인해 주세요.', ...COMMON_FEEDBACK], notes: ['좋아하는 소재를 다음 작품 주제로 연결하기로 했습니다.', ...COMMON_NOTES],
  },
  {
    id: 'movement', emoji: '🥋', name: '태권도 / 발레', description: '수련생 28명 · 동작 영상과 단계별 평가',
    facilitatorName: '강태현', facilitatorRole: 'TEACHER', memberLabel: '수련생', groupLabel: '수련반',
    groupNames: ['유소년 기초', '품새 심화', '발레 초급', '발레 작품반'], memberCount: 28, missionCount: 72,
    statusCounts: { SUCCESS: 42, REVIEWING: 9, EXPIRED: 5, REJECTED: 4, IN_PROGRESS: 12 }, photoCount: 42, feedbackCount: 38, noteCount: 26,
    missionTitles: ['기본 품새 영상', '줄넘기 300회', '고관절 스트레칭', '발차기 자세 촬영', '턴 동작 연습', '센터 동작 연결 영상'],
    feedbacks: ['중심 이동이 안정되어 동작 연결이 좋아졌습니다.', '착지할 때 무릎 방향을 다시 확인해 주세요.', ...COMMON_FEEDBACK], notes: ['최근 유연성이 좋아져 다음 동작을 추가하기로 했습니다.', ...COMMON_NOTES],
  },
  {
    id: 'company', emoji: '🏢', name: '회사 교육', description: '직원 48명 · 교육·퀴즈·보고서·수료 관리',
    facilitatorName: '오지훈', facilitatorRole: 'TEACHER', memberLabel: '직원', groupLabel: '부서',
    groupNames: ['영업팀', '고객성공팀', '개발팀', '운영팀'], memberCount: 48, missionCount: 112,
    statusCounts: { SUCCESS: 68, REVIEWING: 12, EXPIRED: 6, REJECTED: 4, IN_PROGRESS: 22 }, photoCount: 45, feedbackCount: 44, noteCount: 32,
    missionTitles: ['정보보안 교육 수강', '제품 교육 퀴즈', '고객 응대 사례 보고서', '신규 기능 학습 기록', '안전 교육 확인', '월간 교육 회고', '온보딩 체크리스트'],
    feedbacks: ['실무 사례를 구체적으로 연결해 작성했습니다.', '보고서의 개선 행동을 더 명확히 적어 주세요.', ...COMMON_FEEDBACK], notes: ['다음 1:1에서 교육 내용을 업무에 적용한 사례를 확인합니다.', ...COMMON_NOTES],
  },
  {
    id: 'rehab', emoji: '🏥', name: '재활 / 치료', description: '이용자 24명 · 운동·복약·보호자 공유',
    facilitatorName: '윤가영', facilitatorRole: 'TEACHER', memberLabel: '이용자', groupLabel: '프로그램',
    groupNames: ['보행 재활', '어깨 회복', '생활 습관'], memberCount: 24, missionCount: 64,
    statusCounts: { SUCCESS: 38, REVIEWING: 8, EXPIRED: 4, REJECTED: 3, IN_PROGRESS: 11 }, photoCount: 34, feedbackCount: 34, noteCount: 28,
    missionTitles: ['20분 걷기', '관절 스트레칭', '약 복용 확인', '밴드 운동', '자세 사진 기록', '통증 정도 메모', '보호자와 운동 확인'],
    feedbacks: ['움직임 범위가 무리 없이 조금씩 늘고 있습니다.', '통증이 생기면 횟수를 줄이고 바로 알려 주세요.', ...COMMON_FEEDBACK], notes: ['보호자에게 이번 주 운동 범위와 주의점을 전달했습니다.', ...COMMON_NOTES],
  },
  {
    id: 'pet-care', emoji: '🐶', name: '반려동물 관리', description: '반려동물 14마리 · 산책·복약·건강 기록',
    facilitatorName: '서지아', facilitatorRole: 'PARENT', memberLabel: '반려동물', groupLabel: '관리 그룹',
    groupNames: ['강아지', '고양이', '노령 반려동물'], memberCount: 14, missionCount: 42,
    statusCounts: { SUCCESS: 25, REVIEWING: 5, EXPIRED: 3, REJECTED: 2, IN_PROGRESS: 7 }, photoCount: 30, feedbackCount: 22, noteCount: 20,
    missionTitles: ['아침 산책 기록', '약 복용 확인', '주간 몸무게 기록', '사료 급여 기록', '배변 상태 확인', '오늘 사진 남기기', '병원 상담 메모'],
    feedbacks: ['산책 후 컨디션이 편안해 보입니다.', '복약 시간과 식사 간격을 다시 확인해 주세요.', ...COMMON_FEEDBACK], notes: ['다음 진료 때 최근 체중 변화와 사진을 보여드릴 예정입니다.', ...COMMON_NOTES],
  },
];

const NAMES = [
  '김도윤', '이서연', '박지호', '최하윤', '정민준', '강지우', '조예준', '윤서아', '장현우', '임지민',
  '한유진', '오시우', '서채원', '신준서', '권나은', '황태윤', '안수빈', '송건우', '전아린', '홍재민',
  '유가은', '고은찬', '문서윤', '양주원', '손다인', '배성민', '백예린', '허우진', '남소율', '심도현',
  '노하린', '하승우', '곽유나', '성지환', '차민서', '주원준', '우세은', '민재윤', '진하은', '엄시온',
  '채윤호', '원서진', '천유빈', '방지안', '공태민', '변수아', '염준영', '여채린', '추민규', '도예원',
  '소준혁', '석지원', '선예성', '설아윤', '마지후', '길서현', '연도훈', '표지수', '명유찬', '기하율',
  '라민재', '왕예나', '옥정우', '육서희', '인태경', '맹가윤', '모준호', '제유리', '탁시현', '복은서',
  '피지훈', '구나연', '김서준', '이채아', '박현서', '최유주', '정지후', '강민아', '조하준', '윤가람',
];

const AVATARS = ['👦', '👧', '🧒', '👩', '🧑', '👨', '👱', '🧑‍🦱'];
const OFFSETS = [0, 1, 3, 7, 14, 21, 45, 70];
const TYPES: MissionType[] = ['HOMEWORK', 'VOCABULARY', 'READING', 'ATTENDANCE', 'REVIEW_NOTES', 'LIFESTYLE', 'OTHER'];

const iso = (days: number, hour = 18) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
};

const padded = (value: number) => String(value).padStart(3, '0');

export function getDemoScenario(id?: string | null) {
  return DEMO_SCENARIOS.find((scenario) => scenario.id === id) ?? DEMO_SCENARIOS[0];
}

export function getDemoFacilitatorLabel(id: DemoScenarioId) {
  if (id === 'pt-center') return '트레이너';
  if (id === 'company') return '교육 담당자';
  if (id === 'rehab') return '치료사';
  if (id === 'family' || id === 'pet-care') return '보호자';
  return '선생님';
}

export function buildDemoScenario(id: DemoScenarioId): DemoScenarioSeed {
  const config = getDemoScenario(id);
  const facilitatorId = `demo-${config.id}-leader`;
  const facilitator: User = {
    id: facilitatorId, name: config.facilitatorName, role: config.facilitatorRole, point: 0,
    avatar: config.facilitatorRole === 'PARENT' ? '👩' : '👩‍🏫', createdAt: iso(-240), code: `D${config.id.slice(0, 5).toUpperCase()}`,
  };
  const groups: PerformerGroup[] = config.groupNames.map((name, index) => ({
    id: `demo-${config.id}-group-${index + 1}`, name, emoji: config.emoji, facilitatorId, createdAt: iso(-220 + index),
  }));
  const members: User[] = Array.from({ length: config.memberCount }, (_, index) => ({
    id: `demo-${config.id}-member-${padded(index + 1)}`,
    name: NAMES[index % NAMES.length] + (index >= NAMES.length ? ` ${Math.floor(index / NAMES.length) + 1}` : ''),
    role: 'CHILD', point: 0, avatar: config.id === 'pet-care' ? ['🐶', '🐱', '🐕', '🐈'][index % 4] : AVATARS[index % AVATARS.length],
    createdAt: iso(-210 + (index % 30)), facilitatorId, groupId: groups[index % groups.length].id,
    code: `${config.id.slice(0, 2).toUpperCase()}${padded(index + 1)}`,
  }));

  const statuses: MissionStatus[] = [];
  for (const [status, count] of Object.entries(config.statusCounts) as Array<[MissionStatus, number]>) {
    statuses.push(...Array(count).fill(status));
  }
  if (statuses.length !== config.missionCount) throw new Error(`${config.id} mission count mismatch`);

  const missions: Mission[] = statuses.map((status, index) => {
    const member = members[index % members.length];
    const offset = OFFSETS[(index * 3 + Math.floor(index / members.length)) % OFFSETS.length];
    const isClosed = ['SUCCESS', 'FAILED', 'EXPIRED'].includes(status);
    const title = config.missionTitles[index % config.missionTitles.length];
    const cycle = Math.floor(index / config.missionTitles.length) % 4 + 1;
    return {
      id: `demo-${config.id}-mission-${padded(index + 1)}`,
      title: `${title} · ${cycle}회`,
      description: `${member.name}님의 ${title} 활동 과정과 결과를 확인합니다.`,
      rewardPoint: 0, creatorId: facilitatorId, assigneeId: member.id, status,
      submissionType: 'TEXT',
      startDate: iso(-Math.max(offset + 5, 5), 9),
      endDate: isClosed ? iso(-Math.max(offset, 1), 21) : iso((index % 7) + 1, 21),
      createdAt: iso(-offset, 9 + (index % 9)), missionType: TYPES[index % TYPES.length],
      missionGoal: index % 3 === 0 ? 'PARENT_REPORT' : index % 3 === 1 ? 'SUBMISSION_MGMT' : 'STUDY_HABIT',
      repeatType: index % 5 === 0 ? 'WEEKLY' : 'ONCE', parentShare: 'WEEKLY_REPORT',
    };
  });

  const submittedMissions = missions.filter((mission) => ['SUCCESS', 'REVIEWING', 'REJECTED'].includes(mission.status));
  const photoMissionIds = new Set(
    Array.from({ length: config.photoCount }, (_, index) => submittedMissions[Math.floor(index * submittedMissions.length / config.photoCount)]?.id)
      .filter((missionId): missionId is string => Boolean(missionId)),
  );
  missions.forEach((mission) => {
    if (photoMissionIds.has(mission.id)) mission.submissionType = 'BOTH';
  });
  const submissions: MissionSubmission[] = submittedMissions.map((mission, index) => ({
    id: `demo-${config.id}-submission-${padded(index + 1)}`, missionId: mission.id, userId: mission.assigneeId,
    message: index % 4 === 0 ? '처음 기록보다 내용을 보완해 다시 제출합니다.' : index % 4 === 1 ? '오늘 활동에서 달라진 점과 느낀 점을 함께 적었습니다.' : index % 4 === 2 ? '안내받은 순서대로 활동하고 결과를 확인했습니다.' : '활동을 마친 뒤 사진과 설명을 남겼습니다.',
    imageUrl: photoMissionIds.has(mission.id) ? `https://picsum.photos/seed/${config.id}-${index + 1}/800/600` : undefined,
    attemptNumber: mission.status === 'REJECTED' || index % 13 === 0 ? 2 : 1,
    submittedAt: iso(-OFFSETS[(index * 5) % OFFSETS.length], 10 + (index % 10)),
  }));

  const reviewable = submissions.filter((submission) => missions.find((mission) => mission.id === submission.missionId)?.status !== 'REVIEWING');
  const reviewLogs: MissionReviewLog[] = reviewable.slice(0, config.feedbackCount).map((submission, index) => {
    const mission = missions.find((item) => item.id === submission.missionId)!;
    return {
      id: `demo-${config.id}-review-${padded(index + 1)}`, missionId: mission.id, submissionId: submission.id,
      reviewerId: facilitatorId, action: mission.status === 'REJECTED' ? 'REJECTED' : 'APPROVED',
      reason: config.feedbacks[index % config.feedbacks.length], createdAt: iso(-OFFSETS[(index * 7) % OFFSETS.length], 11 + (index % 8)),
    };
  });

  const teacherNotes: DemoScenarioSeed['teacherNotes'] = {};
  Array.from({ length: config.noteCount }, (_, index) => {
    const member = members[index % members.length];
    const note = { id: `demo-${config.id}-note-${padded(index + 1)}`, text: config.notes[index % config.notes.length], createdAt: iso(-OFFSETS[(index * 3) % OFFSETS.length], 14) };
    teacherNotes[member.id] = [...(teacherNotes[member.id] ?? []), note];
  });

  const stats: DemoScenarioStats = {
    members: members.length, missions: missions.length, submissions: submissions.length,
    feedbacks: reviewLogs.length, notes: config.noteCount, photos: submissions.filter((submission) => submission.imageUrl).length,
    reports: members.length, pending: missions.filter((mission) => mission.status === 'REVIEWING').length,
    missing: missions.filter((mission) => ['FAILED', 'EXPIRED'].includes(mission.status)).length,
    completed: missions.filter((mission) => mission.status === 'SUCCESS').length,
  };
  return { config, users: [facilitator, ...members], groups, missions, submissions, reviewLogs, teacherNotes, stats };
}
