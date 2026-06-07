import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AnimatePresence } from 'framer-motion';
import { useAuthStore } from './store/authStore';
import { useMissionStore } from './store/missionStore';
import { useShopStore } from './store/shopStore';
import { useGroupStore } from './store/groupStore';
import { useTemplateStore } from './store/templateStore';
import { checkNaverCallback, checkKakaoCallback } from './lib/socialAuth';

import AppLayout from './components/layout/AppLayout';
import SplashPage from './pages/SplashPage';
import LoginPage from './pages/LoginPage';
import RoleSelectionPage from './pages/RoleSelectionPage';
import HomePage from './pages/HomePage';
import MissionListPage from './pages/MissionListPage';
import MissionDetailPage from './pages/MissionDetailPage';
import MissionCreatePage from './pages/MissionCreatePage';
import MissionEditPage from './pages/MissionEditPage';
import MissionSubmitPage from './pages/MissionSubmitPage';
import ApprovalPage from './pages/ApprovalPage';
import PerformerListPage from './pages/PerformerListPage';
import PerformerDetailPage from './pages/PerformerDetailPage';
import ShopPage from './pages/ShopPage';
import CouponDetailPage from './pages/CouponDetailPage';
import PointHistoryPage from './pages/PointHistoryPage';
import ProfilePage from './pages/ProfilePage';
import StatusSettingsPage from './pages/StatusSettingsPage';
import StudentDetailPage from './pages/StudentDetailPage';
import ParentReportPage from './pages/ParentReportPage';
import RankingPage from './pages/RankingPage';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

function AuthenticatedRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="missions" element={<MissionListPage />} />
        <Route path="missions/create" element={<MissionCreatePage />} />
        <Route path="missions/:id/edit" element={<MissionEditPage />} />
        <Route path="missions/:id" element={<MissionDetailPage />} />
        <Route path="missions/:id/submit" element={<MissionSubmitPage />} />
        <Route path="approvals" element={<ApprovalPage />} />
        <Route path="performers" element={<PerformerListPage />} />
        <Route path="performers/:id" element={<PerformerDetailPage />} />
        <Route path="students/:id" element={<StudentDetailPage />} />
        <Route path="students/:id/report" element={<ParentReportPage />} />
        <Route path="ranking" element={<RankingPage />} />
        <Route path="shop" element={<ShopPage />} />
        <Route path="shop/:id" element={<CouponDetailPage />} />
        <Route path="points" element={<PointHistoryPage />} />
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
  const { currentUser, pendingSocialProfile, socialLogin, initializeData: initAuth } = useAuthStore();
  const { initializeData: initMissions, autoGenerateRepeatMissions } = useMissionStore();
  const { initializeData: initShop } = useShopStore();
  const { initializeData: initGroups } = useGroupStore();
  const { initializeData: initTemplates } = useTemplateStore();

  useEffect(() => {
    (async () => {
      // users 시드가 끝나야 missions 등의 외래키 참조가 안전하게 시드됨
      await initAuth();
      await initMissions();
      initShop();
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
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}
