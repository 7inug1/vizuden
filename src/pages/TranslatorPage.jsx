import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import SiteHeader from '../components/SiteHeader';
import { ISG_QUESTIONS, ISG_TOTAL } from '../data/isgQuestions';
import { useAuth } from '../context/AuthContext';
import { useNickname } from '../context/NicknameContext';
import { ensureGuestSessionId } from '../lib/storage';
import { supabase } from '../lib/supabaseClient';

const slideVariants = {
  enter: (dir) => ({ opacity: 0, x: dir > 0 ? 28 : -28 }),
  center: { opacity: 1, x: 0 },
  exit:  (dir) => ({ opacity: 0, x: dir > 0 ? -28 : 28 }),
};

const CREAM = '#F5F2ED';
const DARK  = '#1c1917';

const DRAFT_KEY = 'vizuden_translator_draft';

// 테스트용 샘플 페르소나 — 인덱스는 ISG_QUESTIONS 순서와 일치
const SAMPLE_ANSWERS = [
  '개발자·엔지니어',                                                   // 0: role
  ['카페에서 혼자 시간 보내기', '전시·공연·영화 보러 가기'],              // 1: lifestyle
  '스티브 잡스요 — 심플함으로 복잡함을 덮는 사람이라서요. 그리고 코엔 형제 영화 속 인물들 — 말은 없는데 공간을 채우는 느낌이 있어서 끌렸어요.', // 2: admiration
  ['과시적인·로고를 내세우는', '너무 꾸민 것 같은·작위적인'],             // 3: rejection
  ['미니멀하고 모던한 공간', '도시적이고 세련된 분위기'],                 // 4: taste
  { height: '178', weight: '70', types: ['보통 체형'] },               // 5: body
  '30~50만원',                                                         // 6: budget
];

function loadDraft() {
  try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null'); } catch { return null; }
}
function saveDraft(answers, step) {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ answers, step })); } catch {}
}
function clearDraft() {
  localStorage.removeItem(DRAFT_KEY);
}

const EMPTY_BODY = { height: '', weight: '', types: [] };

function initAnswers(prev = []) {
  return ISG_QUESTIONS.map((q, i) => {
    const existing = prev[i];
    if (q.type === 'multiselect') return Array.isArray(existing) ? existing : [];
    if (q.type === 'body') return (existing && typeof existing === 'object' && !Array.isArray(existing)) ? existing : { ...EMPTY_BODY };
    return typeof existing === 'string' ? existing : '';
  });
}

export default function TranslatorPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { nickname } = useNickname();

  const draft = loadDraft();
  const [step, setStep]       = useState(draft?.step ?? -1);
  const [answers, setAnswers] = useState(() => initAnswers(draft?.answers ?? []));
  const [dir, setDir]         = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (step > -1) saveDraft(answers, step);
  }, [answers, step]);

  const isIntro = step === -1;
  const isDone  = step >= ISG_TOTAL;
  const q       = !isIntro && !isDone ? ISG_QUESTIONS[step] : null;
  const progress = isDone ? 1 : isIntro ? 0 : (step + 1) / ISG_TOTAL;

  function canProceed() {
    if (isIntro || !q) return true;
    if (q.optional) return true;
    const ans = answers[step];
    if (q.type === 'multiselect') return Array.isArray(ans) && ans.length > 0;
    if (ans === '기타') return false;
    return typeof ans === 'string' && ans.trim().length > 0;
  }

  function goNext() {
    setDir(1);
    setStep((s) => s + 1);
    setTimeout(() => textareaRef.current?.focus(), 120);
  }

  function goPrev() {
    setDir(-1);
    setStep((s) => Math.max(-1, s - 1));
    setTimeout(() => textareaRef.current?.focus(), 120);
  }

  function setAnswer(val) {
    setAnswers((prev) => { const next = [...prev]; next[step] = val; return next; });
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);

    try {
      const guestSessionId = ensureGuestSessionId();
      const payload = ISG_QUESTIONS.map((q, i) => {
        const ans = answers[i];
        let answer;
        if (q.type === 'body') {
          const parts = [];
          if (ans?.height) parts.push(`키 ${ans.height}cm`);
          if (ans?.weight) parts.push(`몸무게 ${ans.weight}kg`);
          if (ans?.types?.length) parts.push(ans.types.join(', '));
          answer = parts.join(' / ') || '(미입력)';
        } else {
          answer = Array.isArray(ans) ? ans.join(', ') : ans;
        }
        return { question: q.heading.replace(/\n/g, ' '), answer };
      });

      const headers = { 'Content-Type': 'application/json', 'x-guest-session-id': guestSessionId };
      if (user) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch('/api/translator', {
        method: 'POST',
        headers,
        body: JSON.stringify({ answers: payload, nickname, mode: 'isg' }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const { reportId, result, createdAt } = await res.json();
      clearDraft();
      navigate(`/translator/result/${reportId}`, { state: { result, createdAt } });
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div style={{ backgroundColor: CREAM, minHeight: '100vh' }}>
      <SiteHeader />

      {!isIntro && (
        <div style={{ height: 2, backgroundColor: '#e7e5e4' }}>
          <motion.div
            style={{ height: '100%', backgroundColor: DARK }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}

      <div style={{ padding: '48px 24px 80px', maxWidth: 480, margin: '0 auto' }}>
        <AnimatePresence mode="wait" custom={dir}>
          {loading && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <LoadingSlide />
            </motion.div>
          )}

          {!loading && isIntro && (
            <motion.div key="intro" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.22 }}>
              <Intro
                onStart={() => { setDir(1); setStep(0); }}
                onFill={() => {
                  setAnswers(SAMPLE_ANSWERS.map((a, i) => {
                    const q = ISG_QUESTIONS[i];
                    if (q.type === 'body') return { ...EMPTY_BODY, ...(typeof a === 'object' && !Array.isArray(a) ? a : {}) };
                    if (q.type === 'multiselect') return Array.isArray(a) ? a : [];
                    return typeof a === 'string' ? a : '';
                  }));
                  setDir(1);
                  setStep(0);
                }}
              />
            </motion.div>
          )}

          {!loading && q && (
            <motion.div key={`q-${step}`} custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.22 }}>
              <QuestionSlide
                q={q}
                idx={step}
                total={ISG_TOTAL}
                value={answers[step]}
                onChange={setAnswer}
                onNext={goNext}
                onPrev={goPrev}
                canProceed={canProceed()}
                textareaRef={textareaRef}
                isLast={step === ISG_TOTAL - 1}
                onSubmit={handleSubmit}
                loading={loading}
                error={error}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

const LOADING_STEPS = [
  '답변을 읽고 있어요',
  '정체성을 분석하고 있어요',
  '스타일 언어로 번역하고 있어요',
  '번역서를 완성하고 있어요',
];

function LoadingSlide() {
  const [stepIdx, setStepIdx] = useState(0);
  const [dots, setDots] = useState('');

  useEffect(() => {
    const stepTimer = setInterval(() => {
      setStepIdx((i) => Math.min(i + 1, LOADING_STEPS.length - 1));
    }, 5000);
    const dotTimer = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '.'));
    }, 500);
    return () => { clearInterval(stepTimer); clearInterval(dotTimer); };
  }, []);

  return (
    <div style={{ paddingTop: 40 }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 48 }}>
        <div style={{ position: 'relative', width: 88, height: 110 }}>
          <div style={{ position: 'absolute', top: 7, left: 7, width: 81, height: 103, borderRadius: 9, backgroundColor: '#D6CEC4', border: '1px solid #C0B9AF' }} />
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{ position: 'absolute', top: 0, left: 0, width: 81, height: 103, borderRadius: 9, backgroundColor: '#FAF8F5', border: '1px solid #D0C9BF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <svg width="50" height="60" viewBox="0 0 22 26" fill="none">
              <rect x="1" y="1" width="10" height="1.8" rx="0.9" fill="#6B5E52"/>
              <rect x="1" y="4.5" width="7" height="1.8" rx="0.9" fill="#6B5E52" opacity="0.45"/>
              <line x1="5" y1="13" x2="17" y2="13" stroke="#9C8E84" strokeWidth="1.2" strokeLinecap="round"/>
              <polyline points="14,10.2 17.2,13 14,15.8" stroke="#9C8E84" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <rect x="11" y="19.8" width="10" height="1.8" rx="0.9" fill="#6B5E52"/>
              <rect x="11" y="23.3" width="6" height="1.8" rx="0.9" fill="#6B5E52" opacity="0.45"/>
            </svg>
          </motion.div>
        </div>
      </div>

      <div style={{ marginBottom: 32 }}>
        {LOADING_STEPS.map((label, i) => {
          const done = i < stepIdx;
          const active = i === stepIdx;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: i <= stepIdx ? 1 : 0.25, x: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}
            >
              <div style={{
                width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                backgroundColor: done ? DARK : active ? DARK : '#d6d3d1',
                opacity: done ? 0.4 : active ? 1 : 0.3,
              }} />
              <p style={{
                fontSize: 15, color: done ? '#a8a29e' : active ? DARK : '#c4bfba',
                fontWeight: active ? 600 : 400,
              }}>
                {label}{active ? dots : done ? '' : ''}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function Intro({ onStart, onFill }) {
  const navigate = useNavigate();
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 40, marginTop: 8 }}>
        <div style={{ position: 'relative', width: 88, height: 110 }}>
          <div style={{
            position: 'absolute', top: 7, left: 7,
            width: 81, height: 103, borderRadius: 9,
            backgroundColor: '#D6CEC4', border: '1px solid #C0B9AF',
          }} />
          <div style={{
            position: 'absolute', top: 0, left: 0,
            width: 81, height: 103, borderRadius: 9,
            backgroundColor: '#FAF8F5', border: '1px solid #D0C9BF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="50" height="60" viewBox="0 0 22 26" fill="none">
              <rect x="1" y="1" width="10" height="1.8" rx="0.9" fill="#6B5E52"/>
              <rect x="1" y="4.5" width="7" height="1.8" rx="0.9" fill="#6B5E52" opacity="0.45"/>
              <line x1="5" y1="13" x2="17" y2="13" stroke="#9C8E84" strokeWidth="1.2" strokeLinecap="round"/>
              <polyline points="14,10.2 17.2,13 14,15.8" stroke="#9C8E84" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <rect x="11" y="19.8" width="10" height="1.8" rx="0.9" fill="#6B5E52"/>
              <rect x="11" y="23.3" width="6" height="1.8" rx="0.9" fill="#6B5E52" opacity="0.45"/>
            </svg>
          </div>
        </div>
      </div>

      <p style={{ fontSize: 11, letterSpacing: '0.12em', color: '#78716c', marginBottom: 16, textTransform: 'uppercase' }}>
        Style Translator
      </p>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: DARK, lineHeight: 1.3, marginBottom: 16 }}>
        스타일 번역서
      </h1>
      <p style={{ fontSize: 15, color: '#57534e', lineHeight: 1.7, marginBottom: 28 }}>
        당신이 어떤 사람인지 알려주세요.<br />
        그 정체성을 스타일 언어로 번역해드립니다.
      </p>
      <p style={{ fontSize: 13, color: '#a8a29e', marginBottom: 40 }}>
        약 3분 · 7개 질문
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          onClick={onStart}
          style={{
            width: '100%', padding: '16px', backgroundColor: DARK, color: CREAM,
            border: 'none', borderRadius: 4, fontSize: 15, fontWeight: 600, cursor: 'pointer',
            letterSpacing: '0.04em',
          }}
        >
          시작하기
        </button>
        <button
          onClick={() => navigate('/translators')}
          style={{
            width: '100%', padding: '14px', backgroundColor: 'transparent', color: '#78716c',
            border: '1px solid #d6d3d1', borderRadius: 4, fontSize: 14, cursor: 'pointer',
            letterSpacing: '0.02em', fontFamily: 'inherit',
          }}
        >
          샘플 보고서 보기
        </button>
        <button
          onClick={onFill}
          style={{
            width: '100%', padding: '10px', backgroundColor: 'transparent', color: '#a8a29e',
            border: 'none', borderRadius: 4, fontSize: 12, cursor: 'pointer',
            fontFamily: 'inherit', marginTop: 4,
          }}
        >
          샘플 인물로 채워서 시작하기
        </button>
      </div>
    </div>
  );
}

function QuestionSlide({ q, idx, total, value, onChange, onNext, onPrev, canProceed, textareaRef, isLast, onSubmit, loading, error }) {
  return (
    <div>
      <p style={{ fontSize: 12, color: '#a8a29e', marginBottom: 20 }}>
        {idx + 1} / {total}
      </p>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: DARK, lineHeight: 1.4, marginBottom: q.hint ? 8 : 24, whiteSpace: 'pre-line' }}>
        {q.heading}
      </h2>
      {q.hint && (
        <p style={{ fontSize: 13, color: '#a8a29e', marginBottom: 20 }}>{q.hint}</p>
      )}

      {q.type === 'text' && (
        <textarea
          ref={textareaRef}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && canProceed) onNext(); }}
          placeholder={q.placeholder}
          rows={4}
          style={{
            width: '100%', padding: '14px', fontSize: 15, lineHeight: 1.65,
            border: `1px solid ${typeof value === 'string' && value.trim() ? DARK : '#d6d3d1'}`,
            borderRadius: 4, backgroundColor: CREAM, color: DARK,
            resize: 'none', outline: 'none', boxSizing: 'border-box',
            transition: 'border-color 0.15s', fontFamily: 'inherit',
          }}
          autoFocus
        />
      )}

      {q.type === 'select' && (() => {
        const isOtherActive = value === '기타' || (value !== '' && !q.options.includes(value));
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {q.options.map((opt) => {
              const isOtherOpt = opt === '기타';
              const selected = isOtherOpt ? isOtherActive : value === opt;
              return (
                <button
                  key={opt}
                  onClick={() => onChange(isOtherOpt ? '기타' : opt)}
                  style={{
                    width: '100%', padding: '13px 16px', textAlign: 'left',
                    backgroundColor: selected ? DARK : 'transparent',
                    border: `1px solid ${selected ? DARK : '#d6d3d1'}`,
                    borderRadius: 4, fontSize: 15, color: selected ? CREAM : '#57534e',
                    cursor: 'pointer', transition: 'all 0.12s', fontFamily: 'inherit',
                  }}
                >
                  {opt}
                </button>
              );
            })}
            {isOtherActive && (
              <input
                autoFocus
                type="text"
                value={value === '기타' ? '' : value}
                onChange={(e) => onChange(e.target.value || '기타')}
                placeholder="직접 입력해주세요"
                style={{
                  width: '100%', padding: '13px 16px', fontSize: 15,
                  border: `1px solid ${value !== '기타' ? DARK : '#d6d3d1'}`,
                  borderRadius: 4, backgroundColor: CREAM, color: DARK,
                  outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
                  transition: 'border-color 0.15s',
                }}
              />
            )}
          </div>
        );
      })()}

      {q.type === 'multiselect' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {q.options.map((opt) => {
            const arr = Array.isArray(value) ? value : [];
            const selected = arr.includes(opt);
            const atMax = q.maxSelect && arr.length >= q.maxSelect && !selected;
            return (
              <button
                key={opt}
                onClick={() => {
                  if (atMax) return;
                  onChange(selected ? arr.filter((v) => v !== opt) : [...arr, opt]);
                }}
                style={{
                  padding: '10px 16px',
                  backgroundColor: selected ? DARK : 'transparent',
                  border: `1px solid ${selected ? DARK : '#d6d3d1'}`,
                  borderRadius: 4, fontSize: 14, color: selected ? CREAM : atMax ? '#c4bfba' : '#57534e',
                  cursor: atMax ? 'default' : 'pointer',
                  transition: 'all 0.12s', fontFamily: 'inherit',
                }}
              >
                {opt}
              </button>
            );
          })}
        </div>
      )}

      {q.type === 'body' && (() => {
        const val = (value && typeof value === 'object' && !Array.isArray(value)) ? value : { ...EMPTY_BODY };
        const inputStyle = {
          width: '100%', padding: '13px 40px 13px 14px', fontSize: 15,
          border: '1px solid #d6d3d1', borderRadius: 4,
          backgroundColor: CREAM, color: DARK, outline: 'none',
          boxSizing: 'border-box', fontFamily: 'inherit', appearance: 'none',
        };
        return (
          <div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              {[
                { label: '키', field: 'height', unit: 'cm', placeholder: '178' },
                { label: '몸무게', field: 'weight', unit: 'kg', placeholder: '70' },
              ].map(({ label, field, unit, placeholder }) => (
                <div key={field} style={{ flex: 1 }}>
                  <p style={{ fontSize: 12, color: '#a8a29e', marginBottom: 6 }}>{label}</p>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text" inputMode="numeric" pattern="[0-9]*"
                      value={val[field]}
                      onChange={(e) => onChange({ ...val, [field]: e.target.value.replace(/[^0-9]/g, '') })}
                      placeholder={placeholder}
                      style={inputStyle}
                    />
                    <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#a8a29e', pointerEvents: 'none' }}>
                      {unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 12, color: '#a8a29e', marginBottom: 10 }}>체형</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {q.bodyTypes.map((bt) => {
                const selected = val.types.includes(bt);
                return (
                  <button
                    key={bt}
                    onClick={() => onChange({ ...val, types: selected ? val.types.filter((t) => t !== bt) : [...val.types, bt] })}
                    style={{
                      padding: '10px 16px',
                      backgroundColor: selected ? DARK : 'transparent',
                      border: `1px solid ${selected ? DARK : '#d6d3d1'}`,
                      borderRadius: 4, fontSize: 14,
                      color: selected ? CREAM : '#57534e',
                      cursor: 'pointer', transition: 'all 0.12s', fontFamily: 'inherit',
                    }}
                  >
                    {bt}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })()}

      {error && isLast && (
        <p style={{ fontSize: 13, color: '#dc2626', marginTop: 20 }}>오류가 발생했어요: {error}</p>
      )}
      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        {idx > 0 && (
          <button
            onClick={onPrev}
            disabled={loading}
            style={{
              flex: 1, padding: '14px', backgroundColor: 'transparent',
              border: `1px solid #d6d3d1`, borderRadius: 4,
              fontSize: 15, color: '#78716c', cursor: 'pointer',
            }}
          >
            이전
          </button>
        )}
        <button
          onClick={isLast ? onSubmit : onNext}
          disabled={!canProceed || loading}
          style={{
            flex: 2, padding: '14px',
            backgroundColor: (!canProceed || loading) ? '#e7e5e4' : DARK,
            border: 'none', borderRadius: 4, fontSize: 15, fontWeight: 600,
            color: (!canProceed || loading) ? '#a8a29e' : CREAM,
            cursor: (!canProceed || loading) ? 'default' : 'pointer',
            transition: 'background-color 0.15s',
          }}
        >
          {isLast ? (loading ? '번역 중…' : '스타일 번역하기') : '다음'}
        </button>
      </div>
    </div>
  );
}

function ConfirmSlide({ onPrev, onSubmit, loading, error }) {
  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: DARK, marginBottom: 12 }}>
        번역을 시작할게요
      </h2>
      <p style={{ fontSize: 15, color: '#57534e', lineHeight: 1.7, marginBottom: 48 }}>
        작성하신 내용을 바탕으로<br />
        당신만의 번역서를 만들어드립니다.
      </p>

      {error && (
        <p style={{ fontSize: 13, color: '#dc2626', marginBottom: 16 }}>
          오류가 발생했어요: {error}
        </p>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={onPrev}
          disabled={loading}
          style={{
            flex: 1, padding: '14px', backgroundColor: 'transparent',
            border: `1px solid #d6d3d1`, borderRadius: 4,
            fontSize: 15, color: '#78716c', cursor: 'pointer',
          }}
        >
          돌아가기
        </button>
        <button
          onClick={onSubmit}
          disabled={loading}
          style={{
            flex: 2, padding: '14px', backgroundColor: loading ? '#d6d3d1' : DARK,
            border: 'none', borderRadius: 4, fontSize: 15, fontWeight: 600,
            color: loading ? '#a8a29e' : CREAM, cursor: loading ? 'default' : 'pointer',
            transition: 'background-color 0.15s',
          }}
        >
          {loading ? '번역 중…' : '번역서 받기'}
        </button>
      </div>
    </div>
  );
}
