import { lazy, Suspense, useEffect, type ReactElement } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuthStore } from './store/authStore';
import { useMissionStore } from './store/missionStore';
import { useGroupStore } from './store/groupStore';
import { useTemplateStore } from './store/templateStore';
import { startDemoSession } from './data/demoSession';
import { useMembershipStore } from './store/membershipStore';
import { isFacilitatorMembership, isStudentMembership, membershipEntry } from './utils/membershipAccess';
import { supabase } from './lib/supabase';

import AppLayout from './components/layout/AppLayout';
const SplashPage = lazy(() => import('./pages/SplashPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RoleSelectionPage = lazy(() => import('./pages/RoleSelectionPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const MissionListPage = lazy(() => import('./pages/MissionListPage'));
const MissionDetailPage = lazy(() => import('./pages/MissionDetailPage'));
const MissionCreatePage = lazy(() => import('./pages/MissionCreatePage'));
const MissionEditPage = lazy(() => import('./pages/MissionEditPage'));
const MissionSubmitPage = lazy(() => import('./pages/MissionSubmitPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const StatusSettingsPage = lazy(() => import('./pages/StatusSettingsPage'));
const StudentDetailPage = lazy(() => import('./pages/StudentDetailPage'));
const ParentReportPage = lazy(() => import('./pages/ParentReportPage'));
const ReportSharePage = lazy(() => import('./pages/ReportSharePage'));
const SubmissionReviewPage = lazy(() => import('./pages/SubmissionReviewPage'));
const StudentsPage = lazy(() => import('./pages/StudentsPage'));
const MissionClassPage = lazy(() => import('./pages/MissionClassPage'));
const HomeworkDetailPage = lazy(() => import('./pages/HomeworkDetailPage'));
const StudentActivityPage = lazy(() => import('./pages/StudentActivityPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const DemoPage = lazy(() => import('./pages/DemoPage'));
const MembershipSelectionPage = lazy(() => import('./pages/MembershipSelectionPage'));
const MembershipSetupPage = lazy(() => import('./pages/MembershipSetupPage'));
const PublicReportPage = lazy(() => import('./pages/PublicReportPage'));
const AuthCallbackPage = lazy(() => import('./pages/AuthCallbackPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));

function FacilitatorOnly({ children }: { children: ReactElement }) {
  const active = useMembershipStore((state) => state.memberships.find((membership) => membership.id === state.activeMembershipId));
  return isFacilitatorMembership(active?.role) ? children : <Navigate to="/" replace />;
}

function PerformerOnly({ children }: { children: ReactElement }) {
  const active = useMembershipStore((state) => state.memberships.find((membership) => membership.id === state.activeMembershipId));
  return isStudentMembership(active?.role) ? children : <Navigate to="/" replace />;
}

function AuthenticatedRoutes() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const { memberships, activeMembershipId, selectMembership, initializeData: initializeMemberships } = useMembershipStore();
  const mine = memberships.filter((membership) => membership.userId === currentUser?.id && membership.status === 'ACTIVE');
  const active = mine.find((membership) => membership.id === activeMembershipId);
  const entry = membershipEntry(mine, activeMembershipId);
  useEffect(() => {
    if (entry.kind === 'AUTO') selectMembership(entry.membership.id);
  }, [activeMembershipId, currentUser?.id, entry.kind]);
  useEffect(()=>{if(currentUser&&!currentUser.id.startsWith('demo-'))void initializeMemberships(currentUser.id);},[currentUser?.id]);
  if (!active) return <Routes><Route path="/memberships" element={<MembershipSelectionPage/>}/><Route path="/onboarding" element={<MembershipSetupPage/>}/><Route path="*" element={<Navigate to={mine.length?'/memberships':'/onboarding'} replace/>}/></Routes>;
  return (
    <Routes>
      <Route path="r/:token" element={<PublicReportPage />} />
      <Route path="auth/callback" element={<AuthCallbackPage />} />
      <Route path="reset-password" element={<ResetPasswordPage />} />
      <Route path="memberships" element={<MembershipSelectionPage />} />
      <Route path="onboarding" element={<MembershipSetupPage />} />
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="missions" element={<MissionListPage />} />
        <Route path="missions/create" element={<FacilitatorOnly><MissionCreatePage /></FacilitatorOnly>} />
        <Route path="missions/class/:classId" element={<FacilitatorOnly><MissionClassPage /></FacilitatorOnly>} />
        <Route path="missions/homework/:homeworkId" element={<FacilitatorOnly><HomeworkDetailPage /></FacilitatorOnly>} />
        <Route path="missions/:id/review" element={<FacilitatorOnly><SubmissionReviewPage /></FacilitatorOnly>} />
        <Route path="missions/:id/edit" element={<FacilitatorOnly><MissionEditPage /></FacilitatorOnly>} />
        <Route path="missions/:id" element={<MissionDetailPage />} />
        <Route path="missions/:id/submit" element={<PerformerOnly><MissionSubmitPage /></PerformerOnly>} />
        <Route path="approvals" element={<FacilitatorOnly><Navigate to="/missions?tab=pending" replace /></FacilitatorOnly>} />
        <Route path="approval" element={<FacilitatorOnly><Navigate to="/missions?tab=pending" replace /></FacilitatorOnly>} />
        <Route path="performers" element={<Navigate to="/students" replace />} />
        <Route path="performers/:id" element={<Navigate to="/students" replace />} />
        <Route path="students/:id" element={<FacilitatorOnly><StudentDetailPage /></FacilitatorOnly>} />
        <Route path="students" element={<FacilitatorOnly><StudentsPage /></FacilitatorOnly>} />
        <Route path="students/:id/report" element={<FacilitatorOnly><ParentReportPage /></FacilitatorOnly>} />
        <Route path="students/:id/report/share" element={<FacilitatorOnly><ReportSharePage /></FacilitatorOnly>} />
        <Route path="activity" element={<PerformerOnly><StudentActivityPage /></PerformerOnly>} />
        <Route path="ranking" element={<Navigate to="/" replace />} />
        <Route path="analytics" element={<Navigate to="/students?view=analysis" replace />} />
        <Route path="analysis" element={<Navigate to="/students?view=analysis" replace />} />
        <Route path="rewards" element={<Navigate to="/" replace />} />
        <Route path="reward-box" element={<Navigate to="/" replace />} />
        <Route path="shop" element={<Navigate to="/" replace />} />
        <Route path="pet" element={<Navigate to="/" replace />} />
        <Route path="pets" element={<Navigate to="/" replace />} />
        <Route path="room" element={<Navigate to="/" replace />} />
        <Route path="space" element={<Navigate to="/" replace />} />
        <Route path="village" element={<Navigate to="/" replace />} />
        <Route path="points" element={<Navigate to="/profile" replace />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="profile/status-settings" element={<FacilitatorOnly><StatusSettingsPage /></FacilitatorOnly>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function PublicRoutes() {
  return (
    <Routes>
      <Route path="/r/:token" element={<PublicReportPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="/" element={<SplashPage />} />
      <Route path="/start" element={<SplashPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/register" element={<RoleSelectionPage />} />
      <Route path="/demo" element={<DemoPage />} />
      <Route path="*" element={<Navigate to="/start" replace />} />
    </Routes>
  );
}

function AppContent() {
  const { currentUser, pendingSocialProfile, initializeData: initAuth, isDemoMode, authInitialized } = useAuthStore();
  const { initializeData: initMissions, autoGenerateRepeatMissions } = useMissionStore();
  const { initializeData: initGroups } = useGroupStore();
  const { initializeData: initTemplates } = useTemplateStore();

  useEffect(() => {
    (async () => {
      // users 시드가 끝나야 missions 등의 외래키 참조가 안전하게 시드됨
      await initAuth();
      const auth = useAuthStore.getState();
      if (auth.isDemoMode && auth.currentUser) startDemoSession(auth.currentUser.id);
      if (!auth.currentUser) return;
      await initMissions();
      await initGroups();
      useMembershipStore.getState().ensureLegacyMemberships(useAuthStore.getState().users, useGroupStore.getState().groups);
      initTemplates();
      autoGenerateRepeatMissions();
    })();

  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        useAuthStore.setState({ currentUser: null, users: [], teacherNotes: {}, isDemoMode: false, authInitialized: true });
        useMembershipStore.getState().clearActiveMembership();
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser || isDemoMode || !useMissionStore.getState().demoMode) return;
    useMissionStore.setState({ missions: [], submissions: [], reviewLogs: [], demoMode: false });
    useGroupStore.setState({ groups: [], demoMode: false });
    void initMissions();
    void initGroups();
  }, [currentUser?.id, isDemoMode]);

  const showRegister = !currentUser && !!pendingSocialProfile;

  if (!authInitialized) return <div className="flex min-h-screen w-full items-center justify-center text-sm font-semibold text-[#14233B]">로그인 상태를 확인하는 중...</div>;

  return (
    <div className="min-h-screen flex justify-center bg-[#F3EFE9]">
      <AnimatePresence mode="wait">
        {currentUser ? (
          <AuthenticatedRoutes />
        ) : showRegister ? (
          <Routes>
            <Route path="*" element={<RoleSelectionPage />} />
          </Routes>
        ) : (
          <PublicRoutes />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Suspense fallback={<div className="flex min-h-screen w-full items-center justify-center text-sm font-semibold text-[#14233B]">화면을 불러오는 중...</div>}>
        <AppContent />
      </Suspense>
    </BrowserRouter>
  );
}
