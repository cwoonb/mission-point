import { useAuthStore } from '../store/authStore';
import { useGroupStore } from '../store/groupStore';
import { useMissionStore } from '../store/missionStore';
import { useMembershipStore } from '../store/membershipStore';
import { buildDemoScenario, getDemoScenario, type DemoScenarioId } from './demoScenarios';
import { buildStudentDemo, STUDENT_DEMO_TEACHER_ID, STUDENT_DEMO_USER_ID } from './studentDemo';
import { useReportContentStore } from '../store/reportContentStore';

const SCENARIO_KEY = 'mp-demo-scenario';
const DEMO_KIND_KEY = 'mp-demo-kind';
const STUDENT_STATE_KEY = 'mp-student-demo-state';
export type DemoKind = 'facilitator' | 'student';

export function getDemoKind(): DemoKind {
  if (typeof localStorage === 'undefined') return 'facilitator';
  return localStorage.getItem(DEMO_KIND_KEY) === 'student' ? 'student' : 'facilitator';
}

export const isStudentDemo = () => getDemoKind() === 'student';

export function getSelectedDemoScenarioId(): DemoScenarioId {
  if (typeof localStorage === 'undefined') return 'large-academy';
  return getDemoScenario(localStorage.getItem(SCENARIO_KEY)).id;
}

export function getActiveDemoScenario() {
  return getDemoScenario(getSelectedDemoScenarioId());
}

export function startDemoScenario(id: DemoScenarioId) {
  const seed = buildDemoScenario(id);
  const organizationId = `demo-org-${id}`;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(SCENARIO_KEY, id);
    localStorage.setItem(DEMO_KIND_KEY, 'facilitator');
  }
  const facilitator = seed.users[0];
  useAuthStore.setState({
    users: seed.users,
    currentUser: facilitator,
    viewMode: 'FACILITATOR',
    isDemoMode: true,
    teacherNotes: seed.teacherNotes,
  });
  useGroupStore.setState({ groups: seed.groups, demoMode: true });
  useMissionStore.setState({
    missions: seed.missions.map((mission)=>({ ...mission, organizationId })),
    submissions: seed.submissions,
    reviewLogs: seed.reviewLogs,
    demoMode: true,
  });
  useReportContentStore.getState().seedDemoMemos(organizationId, seed.reportMemos);
  const membershipId = `demo-membership-${id}-operator`;
  useMembershipStore.getState().replaceDemoMemberships(
    [{ id: organizationId, name: seed.config.name, type: 'EDUCATION', ownerUserId: facilitator.id, inviteCode: facilitator.code, createdAt: facilitator.createdAt }],
    [{ id: membershipId, userId: facilitator.id, organizationId, role: seed.config.facilitatorRole === 'PARENT' ? 'OWNER' : 'TEACHER', status: 'ACTIVE', createdAt: facilitator.createdAt }],
    membershipId,
  );
  return seed;
}

type StudentDemoSnapshot = ReturnType<typeof buildStudentDemo>;

function saveStudentDemoState() {
  if (typeof localStorage === 'undefined' || getDemoKind() !== 'student') return;
  const auth = useAuthStore.getState();
  const groups = useGroupStore.getState();
  const missions = useMissionStore.getState();
  if (auth.currentUser?.id !== STUDENT_DEMO_USER_ID) return;
  const snapshot: StudentDemoSnapshot = { users: auth.users, groups: groups.groups, missions: missions.missions, submissions: missions.submissions, reviewLogs: missions.reviewLogs, teacherNotes: {} };
  localStorage.setItem(STUDENT_STATE_KEY, JSON.stringify(snapshot));
}

let studentPersistenceInstalled = false;
function installStudentDemoPersistence() {
  if (studentPersistenceInstalled || typeof localStorage === 'undefined') return;
  studentPersistenceInstalled = true;
  useAuthStore.subscribe(saveStudentDemoState);
  useGroupStore.subscribe(saveStudentDemoState);
  useMissionStore.subscribe(saveStudentDemoState);
}

export function startStudentDemo(reset = false) {
  installStudentDemoPersistence();
  let seed = buildStudentDemo();
  if (!reset && typeof localStorage !== 'undefined') {
    try {
      const stored = localStorage.getItem(STUDENT_STATE_KEY);
      if (stored) seed = JSON.parse(stored) as StudentDemoSnapshot;
    } catch { localStorage.removeItem(STUDENT_STATE_KEY); }
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(DEMO_KIND_KEY, 'student');
    localStorage.setItem(SCENARIO_KEY, 'art');
  }
  const student = seed.users.find((user) => user.id === STUDENT_DEMO_USER_ID)!;
  const organizationId = 'demo-org-art-student';
  useAuthStore.setState({ users: seed.users, currentUser: student, viewMode: 'PERFORMER', isDemoMode: true, teacherNotes: {} });
  useGroupStore.setState({ groups: seed.groups, demoMode: true });
  useMissionStore.setState({ missions: seed.missions.map((mission)=>({ ...mission, organizationId })), submissions: seed.submissions, reviewLogs: seed.reviewLogs, demoMode: true });
  const membershipId = 'demo-membership-art-student';
  useMembershipStore.getState().replaceDemoMemberships(
    [{ id: organizationId, name: '미술 학원', type: 'ACADEMY', ownerUserId: STUDENT_DEMO_TEACHER_ID, inviteCode: 'ART100', createdAt: seed.users[0].createdAt }],
    [{ id: membershipId, userId: student.id, organizationId, role: 'STUDENT', groupId: student.groupId, status: 'ACTIVE', createdAt: student.createdAt }],
    membershipId,
  );
  saveStudentDemoState();
  return seed;
}

export function startDemoSession(userId: string, force = false) {
  installStudentDemoPersistence();
  const auth = useAuthStore.getState();
  const missions = useMissionStore.getState();
  if (getDemoKind() === 'student') {
    const ready = auth.isDemoMode && missions.demoMode && auth.currentUser?.id === STUDENT_DEMO_USER_ID && missions.missions.some((mission) => mission.id.startsWith('demo-student-art-'));
    if (!force && ready) return true;
    startStudentDemo();
    return true;
  }
  const selectedScenarioId = getSelectedDemoScenarioId();
  const existingUser = auth.users.find((user) => user.id === userId);
  const matchesSelectedScenario = userId.startsWith(`demo-${selectedScenarioId}-`)
    && missions.missions.every((mission) => mission.id.startsWith(`demo-${selectedScenarioId}-`));
  if (!force && matchesSelectedScenario && auth.isDemoMode && missions.demoMode && missions.missions.length > 0 && existingUser) {
    useAuthStore.setState({
      currentUser: existingUser,
      viewMode: existingUser.role === 'CHILD' ? 'PERFORMER' : 'FACILITATOR',
      isDemoMode: true,
    });
    return true;
  }
  startDemoScenario(selectedScenarioId);
  return true;
}

export function resetDemoSession() {
  if (getDemoKind() === 'student') startStudentDemo(true);
  else {
    const id = getSelectedDemoScenarioId();
    useReportContentStore.getState().resetDemo(`demo-org-${id}`);
    startDemoScenario(id);
  }
}
