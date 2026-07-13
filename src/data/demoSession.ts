import { useAuthStore } from '../store/authStore';
import { useGroupStore } from '../store/groupStore';
import { useMissionStore } from '../store/missionStore';
import { buildDemoScenario, getDemoScenario, type DemoScenarioId } from './demoScenarios';

const SCENARIO_KEY = 'mp-demo-scenario';

export function getSelectedDemoScenarioId(): DemoScenarioId {
  if (typeof localStorage === 'undefined') return 'large-academy';
  return getDemoScenario(localStorage.getItem(SCENARIO_KEY)).id;
}

export function getActiveDemoScenario() {
  return getDemoScenario(getSelectedDemoScenarioId());
}

export function startDemoScenario(id: DemoScenarioId) {
  const seed = buildDemoScenario(id);
  if (typeof localStorage !== 'undefined') localStorage.setItem(SCENARIO_KEY, id);
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
    missions: seed.missions,
    submissions: seed.submissions,
    reviewLogs: seed.reviewLogs,
    demoMode: true,
  });
  return seed;
}

export function startDemoSession(userId: string, force = false) {
  const auth = useAuthStore.getState();
  const missions = useMissionStore.getState();
  const existingUser = auth.users.find((user) => user.id === userId);
  if (!force && auth.isDemoMode && missions.demoMode && missions.missions.length > 0 && existingUser) {
    useAuthStore.setState({
      currentUser: existingUser,
      viewMode: existingUser.role === 'CHILD' ? 'PERFORMER' : 'FACILITATOR',
      isDemoMode: true,
    });
    return true;
  }
  startDemoScenario(getSelectedDemoScenarioId());
  return true;
}

export function resetDemoSession() {
  startDemoScenario(getSelectedDemoScenarioId());
}
