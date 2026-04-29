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
  return <Navigate to="/auth" replace state={{ nextPath }} />;
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/auth/email" element={<AuthEmailPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/login" element={<Navigate to="/auth" replace />} />
        <Route path="/home" element={<ProtectedRoute><HubPage /></ProtectedRoute>} />
        <Route path="/type" element={<ProtectedRoute><Navigate to="/home" replace /></ProtectedRoute>} />
        <Route path="/type/questions" element={<ProtectedRoute><QuizPage /></ProtectedRoute>} />
        <Route path="/type/result/:code" element={<ProtectedRoute><ResultPage /></ProtectedRoute>} />
        <Route path="/prescription" element={<ProtectedRoute><PrescriptionPage /></ProtectedRoute>} />
        <Route path="/prescription/questions" element={<ProtectedRoute><PrescriptionPage /></ProtectedRoute>} />
        <Route path="/prescription/result/:reportId" element={<ProtectedRoute><PrescriptionResultPage /></ProtectedRoute>} />
        <Route path="/prescription/payment/success" element={<ProtectedRoute><PaymentSuccessPage /></ProtectedRoute>} />
        <Route path="/prescription/payment/fail" element={<ProtectedRoute><PaymentFailPage /></ProtectedRoute>} />
        <Route path="/identity" element={<Navigate to="/home" replace />} />
        <Route path="/identity/questions" element={<Navigate to="/home" replace />} />
        <Route path="/identity/result/:reportId" element={<Navigate to="/home" replace />} />
        <Route path="/coaching" element={<Navigate to="/home" replace />} />
        <Route path="/consulting/questions" element={<ProtectedRoute><ConsultingIntakePage /></ProtectedRoute>} />
        <Route path="/consulting/intakes/:intakeId" element={<ProtectedRoute><ConsultingIntakeDetailPage /></ProtectedRoute>} />
        <Route path="/services" element={<ProtectedRoute><ServicesPage /></ProtectedRoute>} />
        <Route path="/mypage" element={<ProtectedRoute><MyPage /></ProtectedRoute>} />
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
          <NoticeBar />
          <AnimatedRoutes />
          <FloatingFeedbackButton />
        </NicknameProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
