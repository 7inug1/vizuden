import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageUp } from 'lucide-react';
import SiteHeader from '../components/SiteHeader';
import LoginNudgeBlock from '../components/LoginNudgeBlock';
import { QUESTIONS, CONSULTING_INTAKE_TOTAL } from '../data/consultingIntakeQuestions';
import { useAuth } from '../context/AuthContext';
import { useReportStatus } from '../hooks/useReportStatus';
import { ensureGuestSessionId } from '../lib/storage';

const TOTAL = CONSULTING_INTAKE_TOTAL;
const AUTO_ADVANCE_UNTIL_STEP = 0;

const slideVariants = {
  enter: (dir) => ({ opacity: 0, x: dir > 0 ? 28 : -28 }),
  center: { opacity: 1, x: 0 },
  exit: (dir) => ({ opacity: 0, x: dir > 0 ? -28 : 28 }),
};

function ProgressBar({ stepIdx, total }) {
  return (
    <div className="mb-8">
      <p className="text-xs text-stone-400 tracking-wider mb-2">Step {stepIdx + 1} / {total}</p>
      <div className="w-full h-px bg-stone-200">
        <div className="h-px bg-stone-800 transition-all duration-500"
          style={{ width: `${((stepIdx + 1) / total) * 100}%` }} />
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
      <path d="M1 3.5L3.5 6L8 1" stroke="#1c1917" strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0B';
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function sanitizeFilename(name) {
  const dotIdx = name.lastIndexOf('.');
  const rawBase = dotIdx > 0 ? name.slice(0, dotIdx) : name;
  const rawExt = dotIdx > 0 ? name.slice(dotIdx + 1) : 'jpg';
  const base = rawBase.toLowerCase().replace(/[^a-z0-9-_]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'fitpic';
  const ext = rawExt.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 8) || 'jpg';
  return `${base}.${ext}`;
}

function CodeGateScreen({ value, onChange, onSubmit, error, loading, onNoCode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen flex flex-col items-center px-6"
      style={{ backgroundColor: '#F5F2ED' }}
    >
      <div className="w-full max-w-sm flex flex-col justify-center" style={{ minHeight: '100svh' }}>
        <p className="text-xs tracking-[0.28em] text-stone-400 uppercase mb-5">03 VISUAL CONSULTING</p>
        <h2
          className="text-2xl font-light text-stone-900 leading-tight mb-3"
          style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.02em' }}
        >
          컨설팅 준비 코드를<br />입력해주세요
        </h2>
        <p className="text-sm text-stone-500 leading-relaxed mb-10">
          사전 상담 또는 예약 안내를 받은 분만 시작할 수 있습니다.
          <br />
          코드를 모르셔도 아래에서 요청할 수 있습니다.
        </p>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && !loading && onSubmit()}
          placeholder="예) CONSULT-ADMIN-001"
          autoFocus
          autoCapitalize="characters"
          className="w-full bg-transparent border-b border-stone-300 focus:border-stone-900
            text-base text-stone-900 text-center pb-2 mb-2 focus:outline-none
            transition-colors duration-150 placeholder:text-stone-300 tracking-[0.2em]"
        />
        {error ? (
          <p className="text-xs text-red-500 text-center mb-6">{error}</p>
        ) : (
          <div className="mb-6" />
        )}
        <button
          onClick={onSubmit}
          disabled={!value.trim() || loading}
          className="w-full py-4 bg-stone-900 text-stone-50 text-sm tracking-widest uppercase
            hover:bg-stone-800 active:bg-stone-700 transition-colors duration-200
            disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {loading ? '확인 중...' : '확인'}
        </button>
        <button
          onClick={onNoCode}
          className="w-full mt-3 py-2 text-xs text-stone-400 tracking-wide hover:text-stone-700 transition-colors duration-150"
        >
          코드가 없어요
        </button>
      </div>
    </motion.div>
  );
}

function OptionButton({ label, sub, selected, onToggle, disabled }) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      role="checkbox"
      aria-checked={selected}
      className="w-full py-3 px-4 text-left text-sm tracking-wide border
        transition-colors duration-150 flex items-center gap-3
        disabled:opacity-30 disabled:cursor-not-allowed"
      style={{
        background: selected ? '#1c1917' : 'transparent',
        color: selected ? '#fafaf9' : '#44403c',
        borderColor: selected ? '#1c1917' : '#d6d3d1',
      }}
    >
      <span className="shrink-0 flex items-center justify-center"
        style={{
          width: 16, height: 16,
          border: `1.5px solid ${selected ? '#fafaf9' : '#a8a29e'}`,
          background: selected ? '#fafaf9' : 'transparent',
          borderRadius: 2,
        }}>
        {selected && <CheckIcon />}
      </span>
      <span className="flex-1">
        {label}
        {sub && <span className="block text-xs opacity-60 mt-0.5 leading-relaxed">{sub}</span>}
      </span>
    </button>
  );
}

function SelectQuestion({ question, stepIdx, total, answer, onToggle, onOtherChange, onNext, onBack, direction, isLast, autoAdvanceEnabled }) {
  const isRadio = question.type === 'radio';
  const max = question.max;
  const selected = answer.selectedIds;
  const otherSelected = selected.includes('other');
  const canProceed = question.optional ? true : selected.length > 0;
  const hideNext = isRadio && autoAdvanceEnabled;

  function isDisabled(id) {
    if (isRadio) return false;
    if (!max) return false;
    return selected.length >= max && !selected.includes(id);
  }

  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={stepIdx}
        custom={direction}
        variants={slideVariants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.22, ease: 'easeInOut' }}
        className="flex-1 flex flex-col justify-center py-8"
      >
        <ProgressBar stepIdx={stepIdx} total={total} />
        <h2
          className="text-xl font-light text-stone-900 leading-snug mb-2"
          style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.01em' }}
        >
          {question.heading.split('\n').map((l, i, a) => (
            <span key={i}>{l}{i < a.length - 1 && <br />}</span>
          ))}
        </h2>
        <p className="text-xs text-stone-400 mb-6 leading-relaxed">{question.hint}</p>

        <div className="flex flex-col gap-2">
          {question.options.map((opt) => (
            <OptionButton
              key={opt.id}
              label={opt.label}
              sub={opt.sub}
              selected={selected.includes(opt.id)}
              onToggle={() => onToggle(opt.id)}
              disabled={isDisabled(opt.id)}
            />
          ))}
        </div>

        {question.hasOther && otherSelected && (
          <input
            type="text"
            value={answer.otherText}
            onChange={(e) => onOtherChange(e.target.value)}
            placeholder="직접 입력해주세요"
            autoFocus
            className="mt-3 w-full bg-transparent border-b border-stone-300 text-sm text-stone-800
              py-2 placeholder:text-stone-300 focus:outline-none focus:border-stone-700
              transition-colors duration-150"
          />
        )}

        {question.optional && (
          <p className="text-xs text-stone-400 mt-3">선택 사항 — 건너뛰어도 됩니다</p>
        )}

        <div className="mt-8 flex flex-col gap-3">
          {!hideNext && (
            <button
              onClick={onNext}
              disabled={!canProceed}
              className="w-full py-4 bg-stone-900 text-stone-50 text-sm tracking-widest uppercase
                disabled:opacity-30 disabled:cursor-not-allowed transition-opacity duration-150"
            >
              다음
            </button>
          )}
          <button onClick={onBack}
            className="text-xs text-stone-400 text-center py-1 hover:text-stone-700 transition-colors duration-150">
            ← 이전
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function TextQuestion({ question, stepIdx, total, value, onChange, onNext, onBack, direction, isLast }) {
  const canProceed = question.optional || value.trim().length > 0;
  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={stepIdx}
        custom={direction}
        variants={slideVariants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.22, ease: 'easeInOut' }}
        className="flex-1 flex flex-col justify-center py-8"
      >
        <ProgressBar stepIdx={stepIdx} total={total} />
        <h2
          className="text-xl font-light text-stone-900 leading-snug mb-2"
          style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.01em' }}
        >
          {question.heading.split('\n').map((l, i, a) => (
            <span key={i}>{l}{i < a.length - 1 && <br />}</span>
          ))}
        </h2>
        <p className="text-xs text-stone-400 mb-6 leading-relaxed">{question.hint}</p>

        {question.inputType === 'number' ? (
          <div className="flex items-baseline gap-3 border-b border-stone-300 focus-within:border-stone-700 transition-colors duration-150 pb-2">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={value}
              onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ''))}
              onKeyDown={(e) => {
                const allowed = ['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
                if (!/^\d$/.test(e.key) && !allowed.includes(e.key) && !e.metaKey && !e.ctrlKey) {
                  e.preventDefault();
                }
              }}
              placeholder={question.placeholder}
              autoFocus
              className="flex-1 bg-transparent text-2xl text-stone-800 font-light
                placeholder:text-stone-300 focus:outline-none"
            />
            <span className="text-sm text-stone-400 shrink-0">{question.unit}</span>
          </div>
        ) : (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={question.placeholder}
            rows={4}
            className="w-full resize-none bg-transparent border-b border-stone-300
              text-sm text-stone-800 leading-relaxed py-3
              placeholder:text-stone-300 focus:outline-none focus:border-stone-700
              transition-colors duration-150"
            style={{ fontFamily: 'inherit' }}
            autoFocus
          />
        )}

        {question.optional && (
          <p className="text-xs text-stone-400 mt-2 leading-relaxed">선택 사항 — 건너뛰어도 됩니다</p>
        )}

        <div className="mt-8 flex flex-col gap-3">
          <button
            onClick={onNext}
            disabled={!canProceed}
            className="w-full py-4 bg-stone-900 text-stone-50 text-sm tracking-widest uppercase
              disabled:opacity-30 disabled:cursor-not-allowed transition-opacity duration-150"
          >
            다음
          </button>
          <button onClick={onBack}
            className="text-xs text-stone-400 text-center py-1 hover:text-stone-700 transition-colors duration-150">
            ← 이전
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function BirthdateQuestion({ question, stepIdx, total, value, onChange, onNext, onBack, direction }) {
  let parsed = { year: '', month: '', day: '' };
  try { if (value) parsed = { ...parsed, ...JSON.parse(value) }; } catch {}
  const { year, month, day } = parsed;
  const monthRef = useRef(null);
  const dayRef = useRef(null);
  function update(field, val) { onChange(JSON.stringify({ year, month, day, [field]: val })); }
  const canProceed = /^\d{4}$/.test(year);

  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={stepIdx}
        custom={direction}
        variants={slideVariants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.22, ease: 'easeInOut' }}
        className="flex-1 flex flex-col justify-center py-8"
      >
        <ProgressBar stepIdx={stepIdx} total={total} />
        <h2
          className="text-xl font-light text-stone-900 leading-snug mb-2"
          style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.01em' }}
        >
          {question.heading.split('\n').map((l, i, a) => (
            <span key={i}>{l}{i < a.length - 1 && <br />}</span>
          ))}
        </h2>
        <p className="text-xs text-stone-400 mb-6 leading-relaxed">{question.hint}</p>

        <div className="flex gap-4 items-end">
          <div className="flex flex-col gap-1 flex-1">
            <span className="text-xs text-stone-400">년도</span>
            <div className="flex items-baseline gap-1 border-b border-stone-300 focus-within:border-stone-700 transition-colors duration-150 pb-1.5">
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={year}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^0-9]/g, '');
                  update('year', v);
                  if (v.length === 4) monthRef.current?.focus();
                }}
                placeholder="1990"
                autoFocus
                className="w-full bg-transparent text-xl text-stone-800 font-light placeholder:text-stone-300 focus:outline-none"
              />
              <span className="text-xs text-stone-400 shrink-0">년</span>
            </div>
          </div>
          <div className="flex flex-col gap-1" style={{ width: 56 }}>
            <span className="text-xs text-stone-400">월 <span className="text-stone-300">(선택)</span></span>
            <div className="flex items-baseline gap-1 border-b border-stone-300 focus-within:border-stone-700 transition-colors duration-150 pb-1.5">
              <input
                ref={monthRef}
                type="text"
                inputMode="numeric"
                maxLength={2}
                value={month}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^0-9]/g, '');
                  update('month', v);
                  if (v.length === 2) dayRef.current?.focus();
                }}
                placeholder="01"
                className="w-full bg-transparent text-xl text-stone-800 font-light placeholder:text-stone-300 focus:outline-none"
              />
              <span className="text-xs text-stone-400 shrink-0">월</span>
            </div>
          </div>
          <div className="flex flex-col gap-1" style={{ width: 56 }}>
            <span className="text-xs text-stone-400">일 <span className="text-stone-300">(선택)</span></span>
            <div className="flex items-baseline gap-1 border-b border-stone-300 focus-within:border-stone-700 transition-colors duration-150 pb-1.5">
              <input
                ref={dayRef}
                type="text"
                inputMode="numeric"
                maxLength={2}
                value={day}
                onChange={(e) => { update('day', e.target.value.replace(/[^0-9]/g, '')); }}
                placeholder="01"
                className="w-full bg-transparent text-xl text-stone-800 font-light placeholder:text-stone-300 focus:outline-none"
              />
              <span className="text-xs text-stone-400 shrink-0">일</span>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <button
            onClick={onNext}
            disabled={!canProceed}
            className="w-full py-4 bg-stone-900 text-stone-50 text-sm tracking-widest uppercase
              disabled:opacity-30 disabled:cursor-not-allowed transition-opacity duration-150"
          >
            다음
          </button>
          <button onClick={onBack}
            className="text-xs text-stone-400 text-center py-1 hover:text-stone-700 transition-colors duration-150">
            ← 이전
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function FitPicQuestion({ question, stepIdx, total, files, previews, onSelectFiles, onRemoveFile, onNext, onBack, direction, isLast }) {
  const canProceed = question.optional || files.length > 0;
  const [isDragging, setIsDragging] = useState(false);

  function handleFiles(nextFiles) {
    const imageFiles = nextFiles.filter((file) => file.type?.startsWith('image/'));
    onSelectFiles(imageFiles, question.maxFiles ?? 3);
  }

  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={stepIdx}
        custom={direction}
        variants={slideVariants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.22, ease: 'easeInOut' }}
        className="flex-1 flex flex-col justify-center py-8"
      >
        <ProgressBar stepIdx={stepIdx} total={total} />
        <h2
          className="text-xl font-light text-stone-900 leading-snug mb-2"
          style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.01em' }}
        >
          {question.heading.split('\n').map((l, i, a) => (
            <span key={i}>{l}{i < a.length - 1 && <br />}</span>
          ))}
        </h2>
        <p className="text-xs text-stone-400 mb-6 leading-relaxed">{question.hint}</p>

        <label
          onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); if (!isDragging) setIsDragging(true); }}
          onDragLeave={(e) => {
            e.preventDefault(); e.stopPropagation();
            if (e.currentTarget.contains(e.relatedTarget)) return;
            setIsDragging(false);
          }}
          onDrop={(e) => {
            e.preventDefault(); e.stopPropagation();
            setIsDragging(false);
            handleFiles(Array.from(e.dataTransfer.files ?? []));
          }}
          className="block w-full border border-dashed px-4 py-5 text-center cursor-pointer transition-colors duration-150"
          style={{
            borderColor: isDragging ? '#57534e' : '#d6d3d1',
            backgroundColor: isDragging ? '#fafaf9' : 'transparent',
          }}
        >
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => { handleFiles(Array.from(e.target.files ?? [])); e.target.value = ''; }}
          />
          <div className="flex flex-col items-center gap-3">
            <ImageUp className="w-5 h-5 text-stone-400" />
            <p className="text-sm text-stone-700">
              {isDragging ? '여기에 사진을 놓아주세요' : '사진을 추가하려면 클릭하거나 끌어다 놓으세요'}
            </p>
            <p className="text-xs text-stone-400">최대 {question.maxFiles ?? 3}장</p>
          </div>
        </label>

        {previews.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-3">
            {previews.map((preview, index) => (
              <div key={preview.id} className="border border-stone-200 p-2">
                <div className="w-full h-24 bg-stone-50 flex items-center justify-center overflow-hidden mb-2">
                  <img src={preview.url} alt={preview.name} className="w-full h-full object-contain" />
                </div>
                <p className="text-[10px] text-stone-400 leading-snug break-all mb-1">{preview.name}</p>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] text-stone-300">{formatBytes(preview.size)}</span>
                  <button
                    type="button"
                    onClick={() => onRemoveFile(index)}
                    className="text-[10px] text-stone-500 hover:text-stone-900 transition-colors"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {question.optional && (
          <p className="text-xs text-stone-400 mt-3 leading-relaxed">선택 사항 — 건너뛰어도 됩니다</p>
        )}

        <div className="mt-8 flex flex-col gap-3">
          <button
            onClick={onNext}
            disabled={!canProceed}
            className="w-full py-4 bg-stone-900 text-stone-50 text-sm tracking-widest uppercase
              disabled:opacity-30 disabled:cursor-not-allowed transition-opacity duration-150"
          >
            다음
          </button>
          <button onClick={onBack}
            className="text-xs text-stone-400 text-center py-1 hover:text-stone-700 transition-colors duration-150">
            ← 이전
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function ConsentScreen({ consents, onToggle, onSubmit, onBack, stepIdx, total }) {
  const canSubmit = consents.recording && consents.photo;

  const items = [
    {
      key: 'recording',
      label: '프리세션 녹음',
      required: true,
      desc: '나눈 이야기를 빠짐없이 정리하기 위해 녹음합니다. 세션 준비 외 다른 용도로 쓰지 않아요.',
    },
    {
      key: 'photo',
      label: '쇼핑 당일 핏 사진',
      required: true,
      desc: '입어본 옷의 핏을 기록해두면 비교하거나 돌아볼 때 도움이 돼요. 원하시면 세션 후 바로 삭제해드립니다.',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex-1 flex flex-col justify-center py-8"
    >
      <ProgressBar stepIdx={stepIdx} total={total} />
      <p className="text-xs tracking-[0.28em] text-stone-400 uppercase mb-5">03 VISUAL CONSULTING</p>
      <h2
        className="text-2xl font-light text-stone-900 leading-tight mb-3"
        style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.02em' }}
      >
        마지막으로<br />한 가지만 확인할게요
      </h2>
      <p className="text-sm text-stone-500 leading-relaxed mb-8">
        세션에서 진행되는 내용입니다.
      </p>

      <div className="flex flex-col gap-3 mb-10">
        {items.map(({ key, label, required, desc }) => {
          const checked = consents[key];
          return (
            <button
              key={key}
              onClick={() => onToggle(key)}
              className="w-full text-left px-4 py-4 border transition-colors duration-150"
              style={{
                background: checked ? '#1c1917' : 'transparent',
                color: checked ? '#fafaf9' : '#44403c',
                borderColor: checked ? '#1c1917' : '#d6d3d1',
              }}
            >
              <div className="flex items-start gap-3">
                <span className="shrink-0 mt-0.5 flex items-center justify-center"
                  style={{
                    width: 16, height: 16,
                    border: `1.5px solid ${checked ? '#fafaf9' : '#a8a29e'}`,
                    background: checked ? '#fafaf9' : 'transparent',
                    borderRadius: 2,
                  }}>
                  {checked && (
                    <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                      <path d="M1 3.5L3.5 6L8 1" stroke="#1c1917" strokeWidth="1.5"
                        strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <span className="flex-1">
                  <span className="text-sm tracking-wide block mb-1">
                    {label}
                    {!required && (
                      <span className="ml-2 text-xs opacity-50">(선택)</span>
                    )}
                  </span>
                  <span className="text-xs leading-relaxed opacity-60 block">{desc}</span>
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3">
        <button
          onClick={onSubmit}
          disabled={!canSubmit}
          className="w-full py-4 bg-stone-900 text-stone-50 text-sm tracking-widest uppercase
            hover:bg-stone-800 active:bg-stone-700 transition-colors duration-200
            disabled:opacity-30 disabled:cursor-not-allowed"
        >
          신청하기
        </button>
        <button
          onClick={onBack}
          className="text-xs text-stone-400 text-center py-1 hover:text-stone-700 transition-colors duration-150"
        >
          ← 이전
        </button>
      </div>
    </motion.div>
  );
}

function DoneScreen({ onHome, onMyPage, user }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex-1 flex flex-col justify-center py-8"
    >
      <p className="text-xs tracking-[0.28em] text-stone-400 uppercase mb-5">03 VISUAL CONSULTING</p>
      <h2
        className="text-2xl font-light text-stone-900 leading-tight mb-4"
        style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.02em' }}
      >
        신청이 완료됐습니다
      </h2>
      <p className="text-sm text-stone-500 leading-relaxed mb-10">
        확인 후 개별 연락드립니다.
      </p>
      <div className="flex flex-col gap-3">
        {user ? (
          <button
            onClick={onMyPage}
            className="w-full py-4 bg-stone-900 text-stone-50 text-sm tracking-widest uppercase
              hover:bg-stone-800 active:bg-stone-700 transition-colors duration-200"
          >
            마이페이지에서 보기
          </button>
        ) : (
          <LoginNudgeBlock
            heading="신청 내역을 마이페이지에서 확인하세요"
            sub="로그인하면 언제든 다시 볼 수 있어요"
            nextPath="/mypage"
          />
        )}
        <button
          onClick={onHome}
          className="text-xs text-stone-400 text-center py-1 hover:text-stone-700 transition-colors duration-150"
        >
          홈으로 돌아가기
        </button>
      </div>
    </motion.div>
  );
}

function SubmittingScreen() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex-1 flex flex-col justify-center py-8"
    >
      <p className="text-xs tracking-widest text-stone-400 uppercase mb-6">신청 중</p>
      <h2
        className="text-2xl font-light text-stone-900 leading-snug mb-4"
        style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.02em' }}
      >
        잠시만 기다려주세요
      </h2>
      <p className="text-sm text-stone-500">답변을 저장하고 있습니다...</p>
    </motion.div>
  );
}

function ErrorScreen({ onRetry }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex-1 flex flex-col justify-center py-8"
    >
      <p className="text-xs tracking-widest text-stone-400 uppercase mb-6">오류</p>
      <h2
        className="text-2xl font-light text-stone-900 leading-snug mb-4"
        style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.02em' }}
      >
        신청에 실패했습니다
      </h2>
      <p className="text-sm text-stone-500 leading-relaxed mb-10">
        일시적인 오류가 발생했습니다.<br />잠시 후 다시 시도해주세요.
      </p>
      <button
        onClick={onRetry}
        className="w-full py-4 bg-stone-900 text-stone-50 text-xs tracking-widest uppercase"
      >
        다시 시도하기
      </button>
    </motion.div>
  );
}

function PrerequisiteScreen({ onGoPrescription, onGoServices }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex-1 flex flex-col justify-center py-8"
    >
      <p className="text-xs tracking-[0.28em] text-stone-400 uppercase mb-5">03 VISUAL CONSULTING</p>
      <h2
        className="text-2xl font-light text-stone-900 leading-tight mb-4"
        style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.02em' }}
      >
        컨설팅은 처방전 완료 후<br />진행할 수 있습니다
      </h2>
      <p className="text-sm text-stone-500 leading-relaxed mb-10">
        먼저 스타일 처방전에서 기준을 정리한 뒤,
        컨설팅에서 실제 실행으로 이어집니다.
      </p>
      <button
        onClick={onGoPrescription}
        className="w-full py-4 bg-stone-900 text-stone-50 text-sm tracking-widest uppercase
          hover:bg-stone-800 active:bg-stone-700 transition-colors duration-200 mb-3"
      >
        처방전 시작하기
      </button>
      <button
        onClick={onGoServices}
        className="w-full py-2 text-xs text-stone-400 tracking-wide hover:text-stone-700 transition-colors duration-150"
      >
        서비스 페이지로
      </button>
    </motion.div>
  );
}

function emptyAnswer() {
  return { selectedIds: [], otherText: '' };
}

function findQuestionIndex(questionId) {
  return QUESTIONS.findIndex((question) => question.id === questionId);
}

function shouldShowQuestion(question, answers, prescriptionDone) {
  if (!question.dependsOn) return true;
  const parentIndex = findQuestionIndex(question.dependsOn.questionId);
  if (parentIndex === -1) return true;
  const parentSelected = answers[parentIndex]?.selectedIds ?? [];
  if (question.dependsOn.anyOf?.length) {
    return question.dependsOn.anyOf.some((id) => parentSelected.includes(id));
  }
  return parentSelected.length > 0;
}

function resolveQuestion(question, answers) {
  if (!question.optionGroups) return question;

  const parentIndex = findQuestionIndex(question.dependsOn?.questionId);
  const parentSelected = parentIndex === -1 ? [] : (answers[parentIndex]?.selectedIds ?? []);
  const seen = new Set();
  const options = [];

  parentSelected.forEach((selectedId) => {
    (question.optionGroups[selectedId] ?? []).forEach((option) => {
      if (seen.has(option.id)) return;
      seen.add(option.id);
      options.push(option);
    });
  });

  if (question.hasOther && !seen.has('other')) {
    options.push({ id: 'other', label: '기타' });
  }

  return { ...question, options };
}

export default function ConsultingIntakePage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { prescription, loading: statusLoading } = useReportStatus();
  const guestSessionId = ensureGuestSessionId();
  const storedCode = (() => { try { return sessionStorage.getItem('vizuden_consulting_access_code') || ''; } catch { return ''; } })();

  const [phase, setPhase] = useState(storedCode ? 'questions' : 'code');
  const [accessCode, setAccessCode] = useState(storedCode);
  const [codeError, setCodeError] = useState('');
  const [stepIdx, setStepIdx] = useState(0);
  const [answers, setAnswers] = useState(Array(TOTAL).fill(null).map(emptyAnswer));
  const [textAnswers, setTextAnswers] = useState(Array(TOTAL).fill(''));
  const [fitPics, setFitPics] = useState([]);
  const [fitPicPreviews, setFitPicPreviews] = useState([]);
  const [direction, setDirection] = useState(1);
  const [consents, setConsents] = useState({ recording: false, photo: false });
  const handleNextRef = useRef(null);

  const visibleQuestions = QUESTIONS.filter((question) =>
    shouldShowQuestion(question, answers, prescription.done)
  );
  const totalSteps = visibleQuestions.length;
  const totalFlowSteps = totalSteps + 1;
  const currentQ = visibleQuestions[stepIdx] ? resolveQuestion(visibleQuestions[stepIdx], answers) : null;
  const currentQuestionIndex = currentQ ? findQuestionIndex(currentQ.id) : -1;
  const isBlocked = !statusLoading && !prescription.done;

  useEffect(() => {
    return () => {
      fitPicPreviews.forEach((p) => { if (p?.url) URL.revokeObjectURL(p.url); });
    };
  }, [fitPicPreviews]);

  async function handleCodeSubmit() {
    if (statusLoading) return;
    if (!prescription.done) {
      setCodeError('컨설팅은 처방전 완료 후 진행할 수 있습니다.');
      return;
    }
    const trimmed = accessCode.trim();
    if (!trimmed) return;
    setCodeError('');
    try {
      try { sessionStorage.setItem('vizuden_consulting_access_code', trimmed); } catch {}
      setAccessCode(trimmed);
      setPhase('questions');
    } catch {
      setCodeError('확인에 실패했습니다. 다시 시도해주세요.');
    }
  }

  useEffect(() => {
    if (stepIdx <= 0) return;
    if (stepIdx >= visibleQuestions.length) {
      setStepIdx(Math.max(visibleQuestions.length - 1, 0));
    }
  }, [stepIdx, visibleQuestions.length]);

  function handleToggle(id) {
    const q = currentQ;
    if (!q || currentQuestionIndex === -1) return;
    setAnswers((prev) => {
      const next = prev.map((a) => ({ ...a, selectedIds: [...a.selectedIds] }));
      const cur = next[currentQuestionIndex].selectedIds;
      if (q.type === 'radio') {
        next[currentQuestionIndex].selectedIds = cur.includes(id) ? [] : [id];
      } else {
        next[currentQuestionIndex].selectedIds = cur.includes(id)
          ? cur.filter((x) => x !== id)
          : [...cur, id];
      }
      return next;
    });
    if (q.type === 'radio' && q.autoAdvance && (stepIdx + 1) <= AUTO_ADVANCE_UNTIL_STEP) {
      setTimeout(() => handleNextRef.current?.(), 350);
    }
  }

  function handleOtherText(val) {
    if (currentQuestionIndex === -1) return;
    setAnswers((prev) => {
      const next = prev.map((a) => ({ ...a }));
      next[currentQuestionIndex].otherText = val;
      return next;
    });
  }

  function handleTextChange(val) {
    const next = [...textAnswers];
    next[currentQuestionIndex] = val;
    setTextAnswers(next);
  }

  function handleFitPicSelect(files, maxFiles) {
    const allowed = Math.max(0, maxFiles - fitPics.length);
    const nextFiles = files.slice(0, allowed);
    if (nextFiles.length === 0) return;
    setFitPics((prev) => [...prev, ...nextFiles]);
    setFitPicPreviews((prev) => [
      ...prev,
      ...nextFiles.map((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
        name: file.name,
        size: file.size,
        url: URL.createObjectURL(file),
      })),
    ]);
  }

  function handleFitPicRemove(removeIdx) {
    setFitPics((prev) => prev.filter((_, idx) => idx !== removeIdx));
    setFitPicPreviews((prev) => {
      const target = prev[removeIdx];
      if (target?.url) URL.revokeObjectURL(target.url);
      return prev.filter((_, idx) => idx !== removeIdx);
    });
  }

  async function uploadFitPics() {
    if (!fitPics.length) return [];

    const res = await fetch('/api/identity-fitpic-upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({
        files: fitPics.map((file) => ({
          name: sanitizeFilename(file.name),
          contentType: file.type || 'image/jpeg',
        })),
      }),
    });

    if (!res.ok) throw new Error('fitpic upload failed');
    const payload = await res.json();
    if (!Array.isArray(payload?.uploads) || payload.uploads.length !== fitPics.length) {
      throw new Error('invalid fitpic upload payload');
    }

    const uploaded = [];
    for (let i = 0; i < payload.uploads.length; i++) {
      const upload = payload.uploads[i];
      const file = fitPics[i];
      const putRes = await fetch(upload.signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'image/jpeg', 'x-upsert': 'false' },
        body: file,
      });
      if (!putRes.ok) throw new Error(`upload failed for ${file.name}`);
      uploaded.push({
        bucket: upload.bucket,
        path: upload.path,
        name: file.name,
        contentType: file.type || 'image/jpeg',
        size: file.size,
      });
    }
    return uploaded;
  }

  function canProceed() {
    const q = currentQ;
    if (!q || currentQuestionIndex === -1) return false;
    if (q.optional) return true;
    if (q.type === 'text') return textAnswers[currentQuestionIndex].trim().length > 0;
    if (q.type === 'birthdate') { try { const p = JSON.parse(textAnswers[currentQuestionIndex]); return /^\d{4}$/.test(p?.year); } catch { return false; } }
    if (q.type === 'fitpic') return fitPics.length > 0;
    return answers[currentQuestionIndex].selectedIds.length > 0;
  }

  function handleNext() {
    if (!canProceed()) return;
    window.scrollTo(0, 0);
    if (stepIdx < totalSteps - 1) {
      setDirection(1);
      setStepIdx(stepIdx + 1);
    } else {
      setPhase('consent');
    }
  }

  handleNextRef.current = handleNext;

  async function submitIntake() {
    setPhase('submitting');

    function resolveLabels(q, selectedIds) {
      return (selectedIds ?? [])
        .map((id) => {
          if (id === 'other') return null;
          const opt = q.options?.find((o) => o.id === id);
          return opt?.label || id;
        })
        .filter(Boolean);
    }

    const formattedAnswers = QUESTIONS.map((q, i) => {
      if (!shouldShowQuestion(q, answers, prescription.done)) return null;
      if (q.type === 'text' || q.type === 'birthdate') {
        return { id: q.id, question: q.heading.replace(/\n/g, ' '), answer: textAnswers[i] };
      }
      if (q.type === 'fitpic') {
        return { id: q.id, question: q.heading.replace(/\n/g, ' '), answer: fitPics.length ? `사진 ${fitPics.length}장 첨부` : '' };
      }
      const resolvedQuestion = resolveQuestion(q, answers);
      return {
        id: q.id,
        question: q.heading.replace(/\n/g, ' '),
        selected: resolveLabels(resolvedQuestion, answers[i].selectedIds),
        other: answers[i].otherText || '',
      };
    }).filter(Boolean);

    try {
      const uploadedFitPics = await uploadFitPics();
      const res = await fetch('/api/consulting-intake', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-guest-session-id': guestSessionId,
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          answers: formattedAnswers,
          fitPics: uploadedFitPics,
          code: accessCode.trim(),
          prescriptionReportId: prescription.reportId || null,
          consents,
        }),
      });
      if (res.status === 403) {
        const payload = await res.json().catch(() => ({}));
        if (payload?.error === 'prescription_required') {
          setPhase('questions');
          return;
        }
        setPhase('code');
        setCodeError('코드가 유효하지 않거나 이미 소진됐습니다.');
        return;
      }
      if (!res.ok) throw new Error('submit failed');
      setPhase('done');
    } catch {
      setPhase('error');
    }
  }

  function handleBack() {
    window.scrollTo(0, 0);
    if (stepIdx === 0) {
      navigate('/services');
    } else {
      setDirection(-1);
      setStepIdx(stepIdx - 1);
    }
  }

  const isLast = stepIdx === totalSteps - 1;
  const canRenderQuestions = phase === 'questions' && currentQ;

  return (
    <div className="min-h-screen flex flex-col items-center px-6" style={{ backgroundColor: '#F5F2ED' }}>
      {isBlocked ? (
        <div className="w-full max-w-sm flex flex-col" style={{ minHeight: '100svh' }}>
          <SiteHeader onLogoClick={() => navigate('/home')} />
          <PrerequisiteScreen
            onGoPrescription={() => navigate('/prescription/questions')}
            onGoServices={() => navigate('/services')}
          />
          <div className="text-center py-8 mt-auto">
            <p className="text-xs text-stone-400 tracking-widest uppercase">
              &copy; {new Date().getFullYear()} VIZUDEN
            </p>
          </div>
        </div>
      ) : phase === 'code' ? (
        <CodeGateScreen
          value={accessCode}
          onChange={setAccessCode}
          onSubmit={handleCodeSubmit}
          error={codeError}
          loading={false}
          onNoCode={() => navigate('/services')}
        />
      ) : (
        <div className="w-full max-w-sm flex flex-col" style={{ minHeight: '100svh' }}>
          <SiteHeader onLogoClick={() => navigate('/home')} />

          {statusLoading && (
            <div className="flex-1 flex flex-col justify-center py-8">
              <p className="text-sm text-stone-400">불러오는 중...</p>
            </div>
          )}

          {!statusLoading && (
            <>
              {canRenderQuestions && (currentQ.type === 'checkbox' || currentQ.type === 'radio') && (
                <SelectQuestion
                  question={currentQ}
                  stepIdx={stepIdx}
                  total={totalFlowSteps}
                  answer={answers[currentQuestionIndex]}
                  onToggle={handleToggle}
                  onOtherChange={handleOtherText}
                  onNext={handleNext}
                  onBack={handleBack}
                  direction={direction}
                  isLast={isLast}
                  autoAdvanceEnabled={Boolean(currentQ.type === 'radio' && currentQ.autoAdvance && (stepIdx + 1) <= AUTO_ADVANCE_UNTIL_STEP)}
                />
              )}

              {canRenderQuestions && currentQ.type === 'text' && (
                <TextQuestion
                  question={currentQ}
                  stepIdx={stepIdx}
                  total={totalFlowSteps}
                  value={textAnswers[currentQuestionIndex]}
                  onChange={handleTextChange}
                  onNext={handleNext}
                  onBack={handleBack}
                  direction={direction}
                  isLast={isLast}
                />
              )}

              {canRenderQuestions && currentQ.type === 'birthdate' && (
                <BirthdateQuestion
                  question={currentQ}
                  stepIdx={stepIdx}
                  total={totalFlowSteps}
                  value={textAnswers[currentQuestionIndex]}
                  onChange={handleTextChange}
                  onNext={handleNext}
                  onBack={handleBack}
                  direction={direction}
                />
              )}

              {canRenderQuestions && currentQ.type === 'fitpic' && (
                <FitPicQuestion
                  question={currentQ}
                  stepIdx={stepIdx}
                  total={totalFlowSteps}
                  files={fitPics}
                  previews={fitPicPreviews}
                  onSelectFiles={handleFitPicSelect}
                  onRemoveFile={handleFitPicRemove}
                  onNext={handleNext}
                  onBack={handleBack}
                  direction={direction}
                  isLast={isLast}
                />
              )}

              {phase === 'consent' && (
                <ConsentScreen
                  consents={consents}
                  onToggle={(key) => setConsents((prev) => ({ ...prev, [key]: !prev[key] }))}
                  onSubmit={submitIntake}
                  onBack={() => { setPhase('questions'); setDirection(-1); }}
                  stepIdx={totalSteps}
                  total={totalFlowSteps}
                />
              )}

              {phase === 'submitting' && <SubmittingScreen />}

              {phase === 'done' && (
                <DoneScreen
                  onHome={() => navigate('/home')}
                  onMyPage={() => navigate('/mypage')}
                  user={user}
                />
              )}

              {phase === 'error' && (
                <ErrorScreen onRetry={() => { setPhase('questions'); setStepIdx(Math.max(totalSteps - 1, 0)); }} />
              )}

              <div className="text-center py-8 mt-auto">
                <p className="text-xs text-stone-400 tracking-widest uppercase">
                  &copy; {new Date().getFullYear()} VIZUDEN
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
