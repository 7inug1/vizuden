import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import { NicknameProvider } from './context/NicknameContext';
import NoticeBar from './components/NoticeBar';
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
import AboutPage from './pages/AboutPage';
import TranslatorIntakePage from './pages/TranslatorIntakePage';
import TranslatorReportPage from './pages/TranslatorReportPage';
import TranslatorReportV2Demo from './pages/TranslatorReportV2Demo';
import AdminPage from './pages/AdminPage';
import AdminUserPage from './pages/AdminUserPage';
import AdminPrescriptionPage from './pages/AdminPrescriptionPage';
import SampleReportPage from './pages/SampleReportPage';
import LandingPage from './pages/LandingPage';
import TranslatorSamplesPage from './pages/TranslatorSamplesPage';
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

function RedirectHome() {
  return <Navigate to="/" replace />;
}

function TranslatorSampleRedirect() {
  const { personaId } = useParams();
  return <Navigate to={`/translator/${personaId}`} replace />;
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/auth/email" element={<AuthEmailPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/login" element={<RedirectHome />} />
        <Route path="/home" element={<RedirectHome />} />
        <Route path="/type" element={<RedirectHome />} />
        <Route path="/type/questions" element={<QuizPage />} />
        <Route path="/type/result/:code" element={<ResultPage />} />
        <Route path="/prescription" element={<PrescriptionPage />} />
        <Route path="/prescription/questions" element={<PrescriptionPage />} />
        <Route path="/prescription/result" element={<PrescriptionResultPage />} />
        <Route path="/prescription/result/:reportId" element={<PrescriptionResultPage />} />
        <Route path="/prescription/payment/success" element={<ProtectedRoute><PaymentSuccessPage /></ProtectedRoute>} />
        <Route path="/prescription/payment/fail" element={<ProtectedRoute><PaymentFailPage /></ProtectedRoute>} />
        <Route path="/translator/questions" element={<TranslatorIntakePage />} />
        <Route path="/translator/report/demo" element={<TranslatorReportV2Demo />} />
        <Route path="/translator/report/me" element={<TranslatorReportV2Demo persona="me" />} />
        <Route path="/translator/report/:intakeId" element={<TranslatorReportPage />} />
        <Route path="/translator/samples" element={<TranslatorSamplesPage />} />
        <Route path="/translator/sample/:personaId" element={<TranslatorSampleRedirect />} />
        <Route path="/translator/:personaId" element={<SampleReportPage />} />
        <Route path="/translator" element={<Navigate to="/translator/samples" replace />} />
        <Route path="/translators" element={<Navigate to="/translator/samples" replace />} />
        <Route path="/identity" element={<RedirectHome />} />
        <Route path="/identity/questions" element={<RedirectHome />} />
        <Route path="/identity/result/:reportId" element={<RedirectHome />} />
        <Route path="/coaching" element={<RedirectHome />} />
        <Route path="/consulting/questions" element={<Navigate to="/translator/questions" replace />} />
        <Route path="/consulting/report/:intakeId" element={<TranslatorReportPage />} />
        <Route path="/consulting/intakes/:intakeId" element={<RedirectHome />} />
        <Route path="/services" element={<RedirectHome />} />
        <Route path="/services/consulting" element={<RedirectHome />} />
        <Route path="/mypage" element={<MyPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/user/:userId" element={<AdminUserPage />} />
        <Route path="/admin/prescription/:reportId" element={<AdminPrescriptionPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="*" element={<RedirectHome />} />
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
