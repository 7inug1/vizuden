import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import { NicknameProvider } from './context/NicknameContext';
import NoticeBar from './components/NoticeBar';
import HubPage from './pages/HubPage';
import AuthPage from './pages/AuthPage';
import AuthEmailPage from './pages/AuthEmailPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import QuizPage from './pages/QuizPage';
import ResultPage from './pages/ResultPage';
import PrescriptionPage from './pages/PrescriptionPage';
import PrescriptionResultPage from './pages/PrescriptionResultPage';
import MyPage from './pages/MyPage';
import NotFoundPage from './pages/NotFoundPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import PaymentFailPage from './pages/PaymentFailPage';
import ServicesPage from './pages/ServicesPage';
import AboutPage from './pages/AboutPage';
import ConsultingIntakePage from './pages/ConsultingIntakePage';
import ConsultingIntakeDetailPage from './pages/ConsultingIntakeDetailPage';
import AdminPage from './pages/AdminPage';
import AdminUserPage from './pages/AdminUserPage';
import AdminPrescriptionPage from './pages/AdminPrescriptionPage';
import ConsultingDetailPage from './pages/ConsultingDetailPage';
import LandingPage from './pages/LandingPage';
import FloatingFeedbackButton from './components/FloatingFeedbackButton';

function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname]);

  return null;
}

function ProtectedRoute({ children }) {
  const location = useLocation();
  const { user, isGuest, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen" style={{ backgroundColor: '#F5F2ED' }} />;
  }

  if (user || isGuest) {
    return children;
  }

  const nextPath = `${location.pathname}${location.search}${location.hash}`;
  return <Navigate to="/auth/email" replace state={{ nextPath }} />;
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<Navigate to="/auth/email" replace />} />
        <Route path="/auth/email" element={<AuthEmailPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/login" element={<Navigate to="/auth/email" replace />} />
        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="/type" element={<Navigate to="/" replace />} />
        <Route path="/type/questions" element={<QuizPage />} />
        <Route path="/type/result/:code" element={<ResultPage />} />
        <Route path="/prescription" element={<PrescriptionPage />} />
        <Route path="/prescription/questions" element={<PrescriptionPage />} />
        <Route path="/prescription/result" element={<PrescriptionResultPage />} />
        <Route path="/prescription/result/:reportId" element={<PrescriptionResultPage />} />
        <Route path="/prescription/payment/success" element={<ProtectedRoute><PaymentSuccessPage /></ProtectedRoute>} />
        <Route path="/prescription/payment/fail" element={<ProtectedRoute><PaymentFailPage /></ProtectedRoute>} />
        <Route path="/identity" element={<Navigate to="/home" replace />} />
        <Route path="/identity/questions" element={<Navigate to="/home" replace />} />
        <Route path="/identity/result/:reportId" element={<Navigate to="/home" replace />} />
        <Route path="/coaching" element={<Navigate to="/home" replace />} />
        <Route path="/consulting/questions" element={<ConsultingIntakePage />} />
        <Route path="/consulting/intakes/:intakeId" element={<ProtectedRoute><ConsultingIntakeDetailPage /></ProtectedRoute>} />
        <Route path="/services" element={<Navigate to="/" replace />} />
        <Route path="/services/consulting" element={<ConsultingDetailPage />} />
        <Route path="/mypage" element={<MyPage />} />
        <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
        <Route path="/admin/user/:userId" element={<ProtectedRoute><AdminUserPage /></ProtectedRoute>} />
        <Route path="/admin/prescription/:reportId" element={<ProtectedRoute><AdminPrescriptionPage /></ProtectedRoute>} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="*" element={<ProtectedRoute><NotFoundPage /></ProtectedRoute>} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NicknameProvider>
          <ScrollToTop />
          {/* NoticeBar — 풀 스크린 너비 */}
          <NoticeBar />
          {/* 콘텐츠 컨테이너 — 모바일/태블릿/데스크탑 중앙 정렬 */}
          <div style={{ maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
            <AnimatedRoutes />
          </div>
          {/* 피드백 버튼 — fixed, 뷰포트 기준 */}
          <FloatingFeedbackButton />
        </NicknameProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
