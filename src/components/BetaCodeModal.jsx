import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

// 공용 베타 코드 입력 모달 — 랜딩·샘플 보고서 등에서 재사용.
// 코드 검증(/api/translator-intake) 통과 시 설문으로 이동.
export default function BetaCodeModal({ onClose, showSamplesLink = false }) {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    const trimmed = code.trim();
    if (!trimmed) { setError('코드를 입력해주세요.'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/translator-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: trimmed }),
      });
      const { valid } = await res.json().catch(() => ({ valid: false }));
      if (!valid) { setError('유효하지 않은 코드예요.'); return; }
      onClose?.();
      navigate(`/translator/questions?code=${encodeURIComponent(trimmed)}`);
    } catch {
      setError('코드 확인 중 오류가 발생했어요.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      key="code-modal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      onClick={() => onClose?.()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="w-full max-w-sm rounded-3xl px-6 pt-7 pb-8"
        style={{ backgroundColor: '#F5F2ED' }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xs tracking-[0.2em] text-stone-400 uppercase mb-1">Style Translator</p>
        <h2 className="text-xl font-semibold text-stone-900 mb-1" style={{ letterSpacing: '-0.02em' }}>
          베타 코드 입력
        </h2>
        <p className="text-sm text-stone-400 mb-5 leading-relaxed">
          초대받은 코드를 입력하면 설문이 시작돼요.
        </p>
        <input
          type="text"
          value={code}
          onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(''); }}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
          placeholder="베타 코드"
          autoFocus
          className="w-full px-4 py-3.5 rounded-xl border text-sm font-mono tracking-widest outline-none mb-2"
          style={{ backgroundColor: '#fff', borderColor: error ? '#ef4444' : '#e7e2da', color: '#1c1917' }}
        />
        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
        <button
          onClick={submit}
          disabled={loading}
          className="w-full py-4 text-sm font-medium tracking-wide text-white rounded-2xl mt-2 active:scale-[0.98] transition-transform disabled:opacity-50"
          style={{ backgroundColor: '#1c1917' }}
        >
          {loading ? '확인 중…' : '시작하기'}
        </button>
        {showSamplesLink && (
          <button
            onClick={() => { onClose?.(); navigate('/translator/samples'); }}
            className="w-full py-3 text-sm text-stone-400 mt-1"
          >
            샘플 번역서 먼저 보기
          </button>
        )}
      </motion.div>
    </motion.div>
  );
}
