import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AnimatePresence } from 'framer-motion';
import { useAuthStore } from './store/authStore';
import { useMissionStore } from './store/missionStore';
import { useGroupStore } from './store/groupStore';
import { useTemplateStore } from './store/templateStore';
import { checkNaverCallback, checkKakaoCallback } from './lib/socialAuth';
import { startDemoSession } from './data/demoSession';

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
const RankingPage = lazy(() => import('./pages/RankingPage'));
const StudentsPage = lazy(() => import('./pages/StudentsPage'));
const MissionClassPage = lazy(() => import('./pages/MissionClassPage'));
const HomeworkDetailPage = lazy(() => import('./pages/HomeworkDetailPage'));

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

function AuthenticatedRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="missions" element={<MissionListPage />} />
        <Route path="missions/create" element={<MissionCreatePage />} />
        <Route path="missions/class/:classId" element={<MissionClassPage />} />
        <Route path="missions/homework/:homeworkId" element={<HomeworkDetailPage />} />
        <Route path="missions/:id/edit" element={<MissionEditPage />} />
        <Route path="missions/:id" element={<MissionDetailPage />} />
        <Route path="missions/:id/submit" element={<MissionSubmitPage />} />
        <Route path="approvals" element={<Navigate to="/missions?tab=pending" replace />} />
        <Route path="approval" element={<Navigate to="/missions?tab=pending" replace />} />
        <Route path="performers" element={<Navigate to="/students" replace />} />
        <Route path="performers/:id" element={<Navigate to="/students" replace />} />
        <Route path="students/:id" element={<StudentDetailPage />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="students/:id/report" element={<ParentReportPage />} />
        <Route path="ranking" element={<RankingPage />} />
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
        <Route path="profile/status-settings" element={<StatusSettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function PublicRoutes() {
  return (
    <Routes>
      <Route path="/splash" element={<SplashPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RoleSelectionPage />} />
      <Route path="*" element={<Navigate to="/splash" replace />} />
    </Routes>
  );
}

function AppContent() {
  const { currentUser, pendingSocialProfile, socialLogin, initializeData: initAuth, isDemoMode } = useAuthStore();
  const { initializeData: initMissions, autoGenerateRepeatMissions } = useMissionStore();
  const { initializeData: initGroups } = useGroupStore();
  const { initializeData: initTemplates } = useTemplateStore();

  useEffect(() => {
    (async () => {
      // users 시드가 끝나야 missions 등의 외래키 참조가 안전하게 시드됨
      await initAuth();
      const auth = useAuthStore.getState();
      if (auth.isDemoMode && auth.currentUser) startDemoSession(auth.currentUser.id);
      await initMissions();
      initGroups();
      initTemplates();
      autoGenerateRepeatMissions();
    })();

    // Handle Kakao OAuth callback (access_token in URL hash)
    checkKakaoCallback().then((profile) => {
      if (!profile) return;
      socialLogin(profile);
    });

    // Handle Naver OAuth callback (token in URL hash)
    checkNaverCallback().then((profile) => {
      if (!profile) return;
      socialLogin(profile);
    });
  }, []);

  useEffect(() => {
    if (!currentUser || isDemoMode || !useMissionStore.getState().demoMode) return;
    useMissionStore.setState({ missions: [], submissions: [], reviewLogs: [], demoMode: false });
    useGroupStore.setState({ groups: [], demoMode: false });
    void initMissions();
    initGroups();
  }, [currentUser?.id, isDemoMode]);

  const showRegister = !currentUser && !!pendingSocialProfile;

  return (
    <div className="min-h-screen flex justify-center bg-gradient-to-br from-violet-100 via-purple-50 to-sky-100">
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
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID ?? 'placeholder-client-id'}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Suspense fallback={<div className="flex min-h-screen w-full items-center justify-center text-sm font-bold text-purple-600">화면을 불러오는 중...</div>}>
          <AppContent />
        </Suspense>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}
