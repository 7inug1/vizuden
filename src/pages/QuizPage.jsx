import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import SiteHeader from '../components/SiteHeader';
import TypeCodeDisplay from '../components/TypeCodeDisplay';
import Footer from '../components/Footer';
import { questions } from '../data/questions';
import { calculateType, getAxisScores, getPartialType } from '../data/scoring';
import { useAuth } from '../context/AuthContext';
import { ensureGuestSessionId, ensureTrackingSessionId } from '../lib/storage';

const STORAGE_KEY = 'vizuden_progress';
const TYPE_QUESTION_VERSION = 'type_questions.v1';
const TYPE_RESULT_VERSION = 'type_result.v1';

function PartialTypeDisplay({ answers }) {
  const parts = getPartialType(answers);
  return (
    <div className="mb-6 min-h-[56px] flex items-start">
      <TypeCodeDisplay parts={parts} size="md" showHint={parts.some(Boolean)} />
    </div>
  );
}

function ProgressBar({ current, total }) {
  const percent = (current / total) * 100;
  return (
    <div className="w-full">
      <div className="flex justify-end mb-2">
        <span className="text-xs text-stone-400">{current} / {total}</span>
      </div>
      <div className="w-full h-px bg-stone-200">
        <div
          className="h-px bg-stone-800 transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export default function QuizPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [direction, setDirection] = useState(1); // 1: 앞으로, -1: 뒤로
  const { session } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const startedAtRef = useRef(null);
  const sessionIdRef = useRef(null);

  if (!startedAtRef.current) startedAtRef.current = new Date().toISOString();
  if (!sessionIdRef.current) sessionIdRef.current = ensureTrackingSessionId();

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const { currentIndex: idx, answers: ans } = JSON.parse(saved);
        if (Array.isArray(ans) && typeof idx === 'number') {
          setCurrentIndex(idx);
          setAnswers(ans);
        }
      }
    } catch {
      // 파싱 실패 시 처음부터
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ currentIndex, answers }));
    } catch {
      // 저장 실패 무시
    }
  }, [currentIndex, answers]);

  const question = questions[currentIndex];
  const total = questions.length;

  function handleSelect(choice) {
    const nextAnswers = [...answers];
    nextAnswers[currentIndex] = choice;
    setAnswers(nextAnswers);
    setDirection(1);

    if (currentIndex < total - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      localStorage.removeItem(STORAGE_KEY);
      const { type, scores } = calculateType(nextAnswers);
      const axisScores = getAxisScores(scores);
      try {
        const tz = (() => {
          try { return Intl.DateTimeFormat().resolvedOptions().timeZone || null; } catch { return null; }
        })();
        const newEntry = { code: type, savedAt: Date.now(), timeZone: tz };
        localStorage.setItem('vizuden_type', JSON.stringify(newEntry));
        const prev = JSON.parse(localStorage.getItem('vizuden_type_history') || '[]');
        localStorage.setItem('vizuden_type_history', JSON.stringify([newEntry, ...prev]));
      } catch {}
      const durationSec = Math.max(0, Math.round((Date.now() - new Date(startedAtRef.current).getTime()) / 1000));
      fetch('/api/type-count', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          type_code: type,
          guest_session_id: ensureGuestSessionId(),
          session_id: sessionIdRef.current,
          source_path: '/type/questions',
          completed_from: location.state?.source || 'direct',
          duration_sec: durationSec,
          axis_scores: axisScores,
          question_version: TYPE_QUESTION_VERSION,
          result_version: TYPE_RESULT_VERSION,
          started_at: startedAtRef.current,
        }),
      }).catch(() => {});
      navigate(`/type/result/${type}`, {
        state: {
          axisScores,
          source: location.state?.source || 'direct',
        },
      });
    }
  }

  function handleBack() {
    if (currentIndex === 0) {
      navigate('/home');
      return;
    }
    setDirection(-1);
    setCurrentIndex(currentIndex - 1);
  }

  const slideVariants = {
    enter: (dir) => ({ opacity: 0, x: dir > 0 ? 32 : -32 }),
    center: { opacity: 1, x: 0 },
    exit: (dir) => ({ opacity: 0, x: dir > 0 ? -32 : 32 }),
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center px-6"
      style={{ backgroundColor: '#F5F2ED' }}
    >
      <div className="w-full max-w-sm flex flex-col" style={{ minHeight: '100svh' }}>
        <SiteHeader onLogoClick={() => navigate('/')} />
        <ProgressBar current={currentIndex + 1} total={total} />

        <div className="flex-1 flex flex-col justify-center py-8">
          <PartialTypeDisplay answers={answers} />

          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              className="min-h-[280px] flex flex-col"
            >
              <p className="text-xs tracking-widest text-stone-400 uppercase mb-4 min-h-[16px]">
                Q{currentIndex + 1}
              </p>

              <h2
                className="text-xl font-light text-stone-900 leading-snug mb-7 min-h-[72px]"
                style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.01em' }}
              >
                {question.text}
              </h2>

              <div className="flex flex-col gap-3 mb-4 min-h-[132px]">
                <button
                  onClick={() => handleSelect('A')}
                  className="w-full text-left px-5 py-4 bg-stone-900 text-sm text-stone-50 leading-relaxed"
                >
                  <span className="text-xs text-stone-500 mr-3 font-mono">A</span>
                  {question.optionA}
                </button>

                <button
                  onClick={() => handleSelect('B')}
                  className="w-full text-left px-5 py-4 bg-stone-900 text-sm text-stone-50 leading-relaxed"
                >
                  <span className="text-xs text-stone-500 mr-3 font-mono">B</span>
                  {question.optionB}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>

          <button
            onClick={handleBack}
            className="text-xs text-stone-400 hover:text-stone-700 transition-colors duration-150 text-left mt-2 min-h-[20px]"
          >
            ← {currentIndex === 0 ? '처음으로' : '이전 질문'}
          </button>
        </div>
        <Footer />
      </div>
    </div>
  );
}
