import { useState, useEffect, useRef, Fragment, createContext, useContext } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageUp, Info } from 'lucide-react';
import SiteHeader from '../components/SiteHeader';
import Tooltip from '../components/Tooltip';
import { types } from '../data/types';
import { QUESTIONS, CHAPTERS, PRESCRIPTION_TOTAL } from '../data/prescriptionQuestions';
import { useNickname } from '../context/NicknameContext';
import { NicknameModal } from './HubPage';
import { useAuth } from '../context/AuthContext';
import { useReportStatus } from '../hooks/useReportStatus';
import { ensureGuestSessionId } from '../lib/storage';
import { readPrescriptionHistory, writePrescriptionHistory, writePrescriptionSaved } from '../lib/prescriptionStorage';
import { resetPrescriptionStream, setPrescriptionStream, tryExtractSections } from '../lib/prescriptionStream';

const slideVariants = {
  enter: (dir) => ({ opacity: 0, x: dir > 0 ? 28 : -28 }),
  center: { opacity: 1, x: 0 },
  exit:  (dir) => ({ opacity: 0, x: dir > 0 ? -28 : 28 }),
};

// ── 챕터 내비게이션 컨텍스트 ──────────────────────────────────
const ChapterNavContext = createContext({
  onJumpToChapter: null,
  onOpenReview: null,
  onBackToReview: null,
  chapterAnswerState: {},
});

// ── 챕터 기반 진행률 ──────────────────────────────────────────
function ChapterProgress({ chapterId }) {
  const { onJumpToChapter, onOpenReview, onBackToReview, chapterAnswerState } = useContext(ChapterNavContext);
  const idx = CHAPTERS.findIndex((c) => c.id === chapterId);

  return (
    <div className="mb-8">
      <div className="flex items-start">
        {CHAPTERS.map((ch, i) => {
          // chapterAnswerState 우선 사용, 없으면 인덱스 기반 폴백
          const st = chapterAnswerState?.[ch.id] ?? (i < idx ? 'done' : i === idx ? 'current' : 'future');
          const isCurrent    = st === 'current';
          const isDone       = st === 'done';
          const isIncomplete = st === 'incomplete';
          const isFuture     = st === 'future';

          const color =
            isIncomplete ? '#d97706' :   // 미완료 필수 — 앰버
            isDone       ? '#b8b0aa' :   // 완료 — 뮤트
            isCurrent    ? '#1c1917' :   // 현재 — 다크
                           '#d6d3d1';    // 미래 — 라이트
          const lineColor = (isDone || isIncomplete) ? '#b8b0aa' : '#e7e5e4';
          const symbol =
            isIncomplete ? '!' :
            isDone       ? '✓' :
            isCurrent    ? '●' : '○';

          return (
            <Fragment key={ch.id}>
              {/* 챕터 노드 — 클릭 시 해당 챕터 첫 질문으로 이동 */}
              <button
                type="button"
                onClick={() => onJumpToChapter?.(ch.id)}
                className="flex flex-col items-center"
                style={{ gap: 2, flexShrink: 0, background: 'none', border: 'none', padding: '0 2px', cursor: onJumpToChapter ? 'pointer' : 'default' }}
                aria-label={`${ch.label} 챕터로 이동`}
              >
                <span style={{ fontSize: 8, color, lineHeight: 1, height: 9 }}>{symbol}</span>
                <span
                  style={{
                    fontSize: 10,
                    color,
                    fontWeight: isCurrent ? 600 : 400,
                    letterSpacing: '0.02em',
                    textAlign: 'center',
                    lineHeight: 1.2,
                  }}
                >
                  {ch.label}
                </span>
              </button>
              {/* 연결선 (마지막 챕터 제외) */}
              {i < CHAPTERS.length - 1 && (
                <div style={{ flex: 1, height: 1, backgroundColor: lineColor, marginTop: 4, flexShrink: 1 }} />
              )}
            </Fragment>
          );
        })}
      </div>
      {/* 하단 버튼 행 — ← 목차로 (좌) / 목차 → (우) */}
      {(onBackToReview || onOpenReview) && (
        <div className="flex justify-between mt-1">
          {onBackToReview ? (
            <button
              type="button"
              onClick={onBackToReview}
              className="text-[10px] text-stone-500 hover:text-stone-700 transition-colors"
            >
              ← 목차로
            </button>
          ) : <span />}
          {onOpenReview && (
            <button
              type="button"
              onClick={onOpenReview}
              className="text-[10px] text-stone-400 hover:text-stone-600 transition-colors"
            >
              목차 →
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Checkbox 아이콘 ───────────────────────────────────────────
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

// ── 체크박스 · 라디오 공통 옵션 버튼 ─────────────────────────
function OptionButton({ label, sub, info, selected, onToggle, disabled, isInfoOpen, onInfoToggle, flashing }) {
  return (
    <motion.button
      onClick={onToggle}
      disabled={disabled}
      role="checkbox"
      aria-checked={selected}
      animate={flashing ? { opacity: [1, 0.3, 1, 0.3, 1] } : { opacity: 1 }}
      transition={flashing ? { duration: 0.55, ease: 'easeInOut' } : { duration: 0 }}
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
        {sub && <span className="block text-xs opacity-60 mt-0.5">{sub}</span>}
      </span>
      {info && (
        <Tooltip content={info} forceOpen={isInfoOpen} onClose={onInfoToggle}
          position="top" align="right" suppressHover>
          <span
            role="button"
            onClick={(e) => { e.stopPropagation(); onInfoToggle(); }}
            className="shrink-0 w-5 h-5 flex items-center justify-center text-xs rounded-full border transition-colors duration-150"
            style={{
              borderColor: selected ? 'rgba(250,250,249,0.3)' : '#d6d3d1',
              color: selected ? 'rgba(250,250,249,0.6)' : '#a8a29e',
            }}
          >
            ?
          </span>
        </Tooltip>
      )}
    </motion.button>
  );
}

// ── 선택형 질문 (checkbox / radio) ───────────────────────────
function SelectQuestion({ question, stepIdx, answer, onToggle, onOtherChange, onNext, onBack, direction, canProceed, isLast }) {
  const isRadio = question.type === 'radio';
  const max = question.max;
  const selected = answer.selectedIds;
  const otherSelected = selected.includes('other');
  const [openInfoId, setOpenInfoId] = useState(null);
  const [flashId, setFlashId] = useState(null);

  function toggleInfo(id) { setOpenInfoId((prev) => (prev === id ? null : id)); }
  function isDisabled(id) {
    if (isRadio) return false;
    if (!max) return false;
    return selected.length >= max && !selected.includes(id);
  }
  function handleOptionToggle(id) {
    if (isRadio && id !== 'other' && !selected.includes(id)) {
      setFlashId(id);
      setTimeout(() => setFlashId(null), 650);
    }
    onToggle(id);
  }

  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={stepIdx}
        custom={direction}
        variants={slideVariants}
        initial="enter" animate="center" exit="exit"
        transition={{ duration: 0.22, ease: 'easeInOut' }}
        className="flex-1 flex flex-col justify-center py-8"
      >
        <ChapterProgress chapterId={question.chapter} />
        <h2 className="text-xl font-light text-stone-900 leading-snug mb-2"
          style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.01em' }}>
          {question.heading.split('\n').map((l, i, a) => (
            <span key={i}>{l}{i < a.length - 1 && <br />}</span>
          ))}
        </h2>
        <p className="text-xs text-stone-400 mb-6 leading-relaxed">{question.hint}</p>

        <div className="flex flex-col gap-2">
          {question.options.map((opt) => (
            <OptionButton key={opt.id} label={opt.label} sub={opt.sub} info={opt.info}
              selected={selected.includes(opt.id)} onToggle={() => handleOptionToggle(opt.id)}
              disabled={isDisabled(opt.id)} isInfoOpen={openInfoId === opt.id}
              onInfoToggle={() => toggleInfo(opt.id)}
              flashing={flashId === opt.id} />
          ))}
        </div>

        {question.hasOther && otherSelected && (
          <input type="text" value={answer.otherText} onChange={(e) => onOtherChange(e.target.value)}
            placeholder="직접 입력해주세요" autoFocus
            className="mt-3 w-full bg-transparent border-b border-stone-300 text-sm text-stone-800
              py-2 placeholder:text-stone-300 focus:outline-none focus:border-stone-700 transition-colors duration-150" />
        )}

        <div className="mt-8 flex flex-col gap-3">
          <button onClick={onNext} disabled={!canProceed}
            className="w-full py-4 bg-stone-900 text-stone-50 text-sm tracking-widest uppercase
              disabled:opacity-30 disabled:cursor-not-allowed transition-opacity duration-150">
            {isLast ? '처방받기' : '다음'}
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

// ── 텍스트 질문 ───────────────────────────────────────────────
function TextQuestion({ question, stepIdx, value, onChange, onNext, onBack, direction, canProceed, isLast, gender }) {
  const suggestions = (question.suggestions ?? []).filter(s => !s.gender || s.gender === gender);
  const textareaRef = useRef(null);
  const [activeLabel, setActiveLabel] = useState(null);
  const [openInfoLabel, setOpenInfoLabel] = useState(null);

  function handleSuggestion(s) {
    if (activeLabel === s.label && value === s.fill) {
      // 토글 off — 선택 해제 + 내용 비움
      onChange('');
      setActiveLabel(null);
    } else {
      onChange(s.fill);
      setActiveLabel(s.label);
      // 선택 후 textarea로 포커스 이동 (수정 유도)
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
  }

  function handleTextChange(v) {
    onChange(v);
    // 직접 수정하면 선택 연결 해제
    if (activeLabel !== null) setActiveLabel(null);
  }

  const hasSuggestions = suggestions.length > 0;

  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={stepIdx}
        custom={direction}
        variants={slideVariants}
        initial="enter" animate="center" exit="exit"
        transition={{ duration: 0.22, ease: 'easeInOut' }}
        className="flex-1 flex flex-col justify-center py-8"
      >
        <ChapterProgress chapterId={question.chapter} />
        <h2 className="text-xl font-light text-stone-900 leading-snug mb-2"
          style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.01em' }}>
          {question.heading.split('\n').map((l, i, a) => (
            <span key={i}>{l}{i < a.length - 1 && <br />}</span>
          ))}
        </h2>
        <p className="text-xs text-stone-400 mb-5 leading-relaxed">{question.hint}</p>

        {question.inputType === 'number' ? (
          /* ── 숫자 입력 ── */
          <div className="flex items-baseline gap-3 border-b border-stone-300 focus-within:border-stone-700 transition-colors duration-150 pb-2">
            <input type="text" inputMode="numeric" pattern="[0-9]*" value={value}
              onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ''))}
              onKeyDown={(e) => {
                const allowed = ['Backspace','Delete','Tab','Enter','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'];
                if (!/^\d$/.test(e.key) && !allowed.includes(e.key) && !e.metaKey && !e.ctrlKey) e.preventDefault();
              }}
              placeholder={question.placeholder} autoFocus
              className="flex-1 bg-transparent text-2xl text-stone-800 font-light placeholder:text-stone-300 focus:outline-none" />
            <span className="text-sm text-stone-400 shrink-0">{question.unit}</span>
          </div>
        ) : hasSuggestions ? (
          /* ── 칩 제안 + textarea ── */
          <div>
            {/* textarea */}
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder={question.placeholder}
              rows={2}
              autoFocus
              className="w-full resize-none bg-transparent border-b border-stone-300 text-sm text-stone-700
                leading-relaxed py-3 placeholder:text-stone-300 focus:outline-none focus:border-stone-700
                transition-colors duration-150"
              style={{ fontFamily: 'inherit', display: 'block' }}
            />
            {/* 구분선 + 예시 라벨 */}
            <div className="mt-5 mb-3 flex items-center gap-3">
              <span className="text-[10px] text-stone-400 shrink-0">이런 인물도 골라볼 수 있어요</span>
              <div className="flex-1 h-px bg-stone-100" />
            </div>
            {/* 칩 */}
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => {
                const isActive = activeLabel === s.label && value === s.fill;
                const infoOpen = openInfoLabel === s.label;
                return (
                  <div key={s.label} className="relative">
                    <div
                      className="flex items-center border transition-colors duration-150"
                      style={{
                        borderColor: isActive ? '#1c1917' : '#d6d3d1',
                        borderRadius: 3,
                        backgroundColor: isActive ? '#1c1917' : 'transparent',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => { handleSuggestion(s); setOpenInfoLabel(null); }}
                        className="pl-3 pr-2 py-1.5 text-xs leading-none transition-colors duration-150"
                        style={{ color: isActive ? '#fafaf9' : '#78716c' }}
                      >
                        {s.label}
                      </button>
                      {s.info && (
                        <button
                          type="button"
                          onClick={() => setOpenInfoLabel(infoOpen ? null : s.label)}
                          className="pr-2.5 pl-0.5 py-1.5 flex items-center transition-colors duration-150"
                          style={{ color: isActive ? 'rgba(250,250,249,0.45)' : infoOpen ? '#57534e' : '#c4bdb8' }}
                        >
                          <Info size={13} />
                        </button>
                      )}
                    </div>
                    {/* 툴팁 */}
                    {s.info && infoOpen && (
                      <div className="absolute bottom-full mb-2 left-0 z-50 w-56 px-3 py-2.5
                        bg-stone-900 text-xs text-stone-200 leading-relaxed shadow-lg"
                        style={{ borderRadius: 2 }}>
                        {s.info}
                        <span className="absolute top-full left-3"
                          style={{ borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '5px solid #1c1917' }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* ── 일반 textarea (제안 없음) ── */
          <textarea value={value} onChange={(e) => handleTextChange(e.target.value)}
            placeholder={question.placeholder} rows={4} autoFocus
            className="w-full resize-none bg-transparent border-b border-stone-300 text-sm text-stone-800
              leading-relaxed py-3 placeholder:text-stone-300 focus:outline-none focus:border-stone-700
              transition-colors duration-150"
            style={{ fontFamily: 'inherit' }} />
        )}

        {question.optional && !question.hint?.includes('선택 사항') && (
          <p className="text-xs text-stone-400 mt-2">건너뛰어도 됩니다</p>
        )}
        <div className="mt-8 flex flex-col gap-3">
          <button onClick={onNext} disabled={!canProceed}
            className="w-full py-4 bg-stone-900 text-stone-50 text-sm tracking-widest uppercase
              disabled:opacity-30 disabled:cursor-not-allowed transition-opacity duration-150">
            {isLast ? '처방받기' : '다음'}
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

// ── FitPic 질문 ───────────────────────────────────────────────
function FitPicQuestion({ question, stepIdx, files, previews, onSelectFiles, onRemoveFile, onNext, onBack, direction, canProceed, isLast }) {
  const [isDragging, setIsDragging] = useState(false);
  const maxFiles = question.maxFiles ?? 3;
  const isFull = previews.length >= maxFiles;

  function handleFiles(nextFiles) {
    const imageFiles = nextFiles.filter((file) => file.type?.startsWith('image/'));
    onSelectFiles(imageFiles, maxFiles);
  }

  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={stepIdx} custom={direction} variants={slideVariants}
        initial="enter" animate="center" exit="exit"
        transition={{ duration: 0.22, ease: 'easeInOut' }}
        className="flex-1 flex flex-col justify-center py-8"
      >
        <ChapterProgress chapterId={question.chapter} />
        <h2 className="text-xl font-light text-stone-900 leading-snug mb-2"
          style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.01em' }}>
          {question.heading.split('\n').map((l, i, a) => (
            <span key={i}>{l}{i < a.length - 1 && <br />}</span>
          ))}
        </h2>
        <p className="text-xs text-stone-400 mb-6 leading-relaxed">{question.hint}</p>

        {isFull ? (
          <div
            className="w-full border border-dashed px-4 py-5 text-center"
            style={{ borderColor: '#e7e5e4' }}
          >
            <p className="text-sm text-stone-400">사진을 삭제해야 추가할 수 있습니다</p>
          </div>
        ) : (
          <label
            onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); if (!isDragging) setIsDragging(true); }}
            onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); if (e.currentTarget.contains(e.relatedTarget)) return; setIsDragging(false); }}
            onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); handleFiles(Array.from(e.dataTransfer.files ?? [])); }}
            className="block w-full border border-dashed px-4 py-5 text-center cursor-pointer transition-colors duration-150"
            style={{ borderColor: isDragging ? '#57534e' : '#d6d3d1', backgroundColor: isDragging ? '#fafaf9' : 'transparent' }}
          >
            <input type="file" accept="image/*" multiple className="hidden"
              onChange={(e) => { handleFiles(Array.from(e.target.files ?? [])); e.target.value = ''; }} />
            <div className="flex flex-col items-center gap-3">
              <ImageUp className="w-5 h-5 text-stone-400" />
              <p className="text-sm text-stone-700">
                {isDragging ? '여기에 사진을 놓아주세요' : '사진을 추가하려면 클릭하거나 끌어다 놓으세요'}
              </p>
              <p className="text-xs text-stone-400">최대 {maxFiles}장</p>
            </div>
          </label>
        )}

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
                  <button type="button" onClick={() => onRemoveFile(index)}
                    className="text-[10px] text-stone-500 hover:text-stone-900 transition-colors">삭제</button>
                </div>
              </div>
            ))}
          </div>
        )}
        {question.optional && (
          <p className="text-xs text-stone-400 mt-3 leading-relaxed">선택 사항 — 건너뛰어도 됩니다</p>
        )}
        <div className="mt-8 flex flex-col gap-3">
          <button onClick={onNext} disabled={!canProceed}
            className="w-full py-4 bg-stone-900 text-stone-50 text-sm tracking-widest uppercase
              disabled:opacity-30 disabled:cursor-not-allowed transition-opacity duration-150">
            {isLast ? '처방받기' : '다음'}
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

// ── 생년월일 질문 ─────────────────────────────────────────────
function BirthdateQuestion({ question, stepIdx, value, onChange, onNext, onBack, direction }) {
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
        key={stepIdx} custom={direction} variants={slideVariants}
        initial="enter" animate="center" exit="exit"
        transition={{ duration: 0.22, ease: 'easeInOut' }}
        className="flex-1 flex flex-col justify-center py-8"
      >
        <ChapterProgress chapterId={question.chapter} />
        <h2 className="text-xl font-light text-stone-900 leading-snug mb-2"
          style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.01em' }}>
          {question.heading.split('\n').map((l, i, a) => (
            <span key={i}>{l}{i < a.length - 1 && <br />}</span>
          ))}
        </h2>
        <p className="text-xs text-stone-400 mb-6 leading-relaxed">{question.hint}</p>
        <div className="flex gap-4 items-end">
          <div className="flex flex-col gap-1 flex-1">
            <span className="text-xs text-stone-400">년도</span>
            <div className="flex items-baseline gap-1 border-b border-stone-300 focus-within:border-stone-700 transition-colors duration-150 pb-1.5">
              <input type="text" inputMode="numeric" maxLength={4} value={year}
                onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g, ''); update('year', v); if (v.length === 4) monthRef.current?.focus(); }}
                placeholder="1990" autoFocus
                className="w-full bg-transparent text-xl text-stone-800 font-light placeholder:text-stone-300 focus:outline-none" />
              <span className="text-xs text-stone-400 shrink-0">년</span>
            </div>
          </div>
          <div className="flex flex-col gap-1" style={{ width: 56 }}>
            <span className="text-xs text-stone-400">월 <span className="text-stone-300">(선택)</span></span>
            <div className="flex items-baseline gap-1 border-b border-stone-300 focus-within:border-stone-700 pb-1.5">
              <input ref={monthRef} type="text" inputMode="numeric" maxLength={2} value={month}
                onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g, ''); update('month', v); if (v.length === 2) dayRef.current?.focus(); }}
                placeholder="01"
                className="w-full bg-transparent text-xl text-stone-800 font-light placeholder:text-stone-300 focus:outline-none" />
              <span className="text-xs text-stone-400 shrink-0">월</span>
            </div>
          </div>
          <div className="flex flex-col gap-1" style={{ width: 56 }}>
            <span className="text-xs text-stone-400">일 <span className="text-stone-300">(선택)</span></span>
            <div className="flex items-baseline gap-1 border-b border-stone-300 focus-within:border-stone-700 pb-1.5">
              <input ref={dayRef} type="text" inputMode="numeric" maxLength={2} value={day}
                onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g, ''); update('day', v); }}
                placeholder="01"
                className="w-full bg-transparent text-xl text-stone-800 font-light placeholder:text-stone-300 focus:outline-none" />
              <span className="text-xs text-stone-400 shrink-0">일</span>
            </div>
          </div>
        </div>
        <p className="text-xs text-stone-400 mt-3 leading-relaxed">
          월·일 입력 시 추후 생일 관련 혜택을 제공해드릴 수 있습니다. (선택 사항)
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <button onClick={onNext} disabled={!canProceed}
            className="w-full py-4 bg-stone-900 text-stone-50 text-sm tracking-widest uppercase
              disabled:opacity-30 disabled:cursor-not-allowed transition-opacity duration-150">
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

// ── 동적 체크박스 질문 ────────────────────────────────────────
function DynamicCheckboxQuestion({ question, stepIdx, answer, sourceSelectedIds, suboptions, onToggle, onOtherChange, onNext, onBack, direction, canProceed }) {
  const dynamicOptions = (sourceSelectedIds ?? []).flatMap((id) => (suboptions ?? {})[id] ?? []);
  const selected = answer.selectedIds;
  const otherSelected = selected.includes('other');
  const [openInfoId, setOpenInfoId] = useState(null);
  function isDisabled(id) {
    if (!question.max) return false;
    return selected.length >= question.max && !selected.includes(id);
  }

  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={stepIdx} custom={direction} variants={slideVariants}
        initial="enter" animate="center" exit="exit"
        transition={{ duration: 0.22, ease: 'easeInOut' }}
        className="flex-1 flex flex-col justify-center py-8"
      >
        <ChapterProgress chapterId={question.chapter} />
        <h2 className="text-xl font-light text-stone-900 leading-snug mb-2"
          style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.01em' }}>
          {question.heading.split('\n').map((l, i, a) => (
            <span key={i}>{l}{i < a.length - 1 && <br />}</span>
          ))}
        </h2>
        <p className="text-xs text-stone-400 mb-6 leading-relaxed">{question.hint}</p>
        <div className="flex flex-col gap-2">
          {dynamicOptions.map((opt) => (
            <OptionButton key={opt.id} label={opt.label} sub={opt.sub}
              selected={selected.includes(opt.id)} onToggle={() => onToggle(opt.id)}
              disabled={isDisabled(opt.id)} isInfoOpen={openInfoId === opt.id}
              onInfoToggle={() => setOpenInfoId((p) => (p === opt.id ? null : opt.id))} />
          ))}
          {question.hasOther && (
            <OptionButton label="기타" selected={otherSelected} onToggle={() => onToggle('other')}
              disabled={isDisabled('other')} />
          )}
        </div>
        {question.hasOther && otherSelected && (
          <input type="text" value={answer.otherText} onChange={(e) => onOtherChange(e.target.value)}
            placeholder="직접 입력해주세요" autoFocus
            className="mt-3 w-full bg-transparent border-b border-stone-300 text-sm text-stone-800
              py-2 placeholder:text-stone-300 focus:outline-none focus:border-stone-700 transition-colors duration-150" />
        )}
        {question.optional && (
          <p className="text-xs text-stone-400 mt-3">선택 사항 — 건너뛰어도 됩니다</p>
        )}
        <div className="mt-8 flex flex-col gap-3">
          <button onClick={onNext}
            className="w-full py-4 bg-stone-900 text-stone-50 text-sm tracking-widest uppercase">
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

// ── 멀티 질문 화면 (2개 합쳐서 한 스크린) ─────────────────────
function MultiQuestionScreen({
  primaryQ, primaryIdx, companionQ, companionIdx,
  stepIdx, answers, textAnswers,
  onPrimaryToggle, onPrimaryOtherText, onPrimaryTextChange,
  onCompanionToggle, onCompanionOtherText, onCompanionTextChange,
  onNext, onBack, direction, canProceed, isLast,
}) {
  const primaryAnswer = answers[primaryIdx] ?? { selectedIds: [], otherText: '' };
  const companionAnswer = answers[companionIdx] ?? { selectedIds: [], otherText: '' };
  const isDoubleNumber = primaryQ.inputType === 'number' && companionQ.inputType === 'number';

  function renderInlineSelect(q, qIdx, answer, onToggle, onOtherText) {
    const selected = answer.selectedIds;
    const otherSelected = selected.includes('other');
    return (
      <div>
        <div className="flex flex-col gap-2">
          {q.options.map((opt) => (
            <OptionButton key={opt.id} label={opt.label} sub={opt.sub}
              selected={selected.includes(opt.id)}
              onToggle={() => onToggle(opt.id)}
              disabled={false} />
          ))}
        </div>
        {q.hasOther && otherSelected && (
          <input type="text" value={answer.otherText} onChange={(e) => onOtherText(e.target.value)}
            placeholder="직접 입력해주세요"
            className="mt-3 w-full bg-transparent border-b border-stone-300 text-sm text-stone-800
              py-2 placeholder:text-stone-300 focus:outline-none focus:border-stone-700 transition-colors duration-150" />
        )}
      </div>
    );
  }

  function renderInlineText(q, qIdx, textVal, onTextChange) {
    return (
      <div>
        {q.inputType === 'number' ? (
          <div className="flex items-baseline gap-3 border-b border-stone-300 focus-within:border-stone-700 transition-colors duration-150 pb-2">
            <input type="text" inputMode="numeric" value={textVal}
              onChange={(e) => onTextChange(e.target.value.replace(/[^0-9]/g, ''))}
              onKeyDown={(e) => {
                const allowed = ['Backspace','Delete','Tab','Enter','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'];
                if (!/^\d$/.test(e.key) && !allowed.includes(e.key) && !e.metaKey && !e.ctrlKey) e.preventDefault();
              }}
              placeholder={q.placeholder}
              className="flex-1 bg-transparent text-2xl text-stone-800 font-light placeholder:text-stone-300 focus:outline-none" />
            <span className="text-sm text-stone-400 shrink-0">{q.unit}</span>
          </div>
        ) : (
          <textarea value={textVal} onChange={(e) => onTextChange(e.target.value)}
            placeholder={q.placeholder} rows={3}
            className="w-full resize-none bg-transparent border-b border-stone-300 text-sm text-stone-800
              leading-relaxed py-3 placeholder:text-stone-300 focus:outline-none focus:border-stone-700 transition-colors duration-150"
            style={{ fontFamily: 'inherit' }} />
        )}
        {q.optional && (
          <p className="text-xs text-stone-400 mt-2">선택 사항 — 건너뛰어도 됩니다</p>
        )}
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={stepIdx} custom={direction} variants={slideVariants}
        initial="enter" animate="center" exit="exit"
        transition={{ duration: 0.22, ease: 'easeInOut' }}
        className="flex-1 flex flex-col justify-center py-8"
      >
        <ChapterProgress chapterId={primaryQ.chapter} />

        {/* PRIMARY */}
        <h2 className="text-xl font-light text-stone-900 leading-snug mb-2"
          style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.01em' }}>
          {primaryQ.heading.split('\n').map((l, i, a) => (
            <span key={i}>{l}{i < a.length - 1 && <br />}</span>
          ))}
        </h2>
        {primaryQ.hint && <p className="text-xs text-stone-400 mb-5 leading-relaxed">{primaryQ.hint}</p>}

        {/* 키 + 몸무게 세로 배치 */}
        {isDoubleNumber ? (
          <div className="flex flex-col gap-6">
            <div>
              <p className="text-xs text-stone-400 mb-2">키</p>
              {renderInlineText(primaryQ, primaryIdx, textAnswers[primaryIdx] ?? '', onPrimaryTextChange)}
            </div>
            <div>
              <p className="text-xs text-stone-400 mb-2">몸무게</p>
              {renderInlineText(companionQ, companionIdx, textAnswers[companionIdx] ?? '', onCompanionTextChange)}
            </div>
          </div>
        ) : (
          <>
            {/* Primary content */}
            {(primaryQ.type === 'radio' || primaryQ.type === 'checkbox') &&
              renderInlineSelect(primaryQ, primaryIdx, primaryAnswer, onPrimaryToggle, onPrimaryOtherText)}
            {primaryQ.type === 'text' &&
              renderInlineText(primaryQ, primaryIdx, textAnswers[primaryIdx] ?? '', onPrimaryTextChange)}

            {/* Divider + companion heading */}
            <div className="mt-6 mb-4 flex items-center gap-3">
              <div className="flex-1 h-px bg-stone-200" />
              <p className="text-xs text-stone-500 shrink-0">
                {companionQ.heading.split('\n').join(' ')}
              </p>
              <div className="flex-1 h-px bg-stone-200" />
            </div>
            {companionQ.hint && <p className="text-xs text-stone-400 mb-4 leading-relaxed">{companionQ.hint}</p>}

            {/* Companion content */}
            {(companionQ.type === 'radio' || companionQ.type === 'checkbox') &&
              renderInlineSelect(companionQ, companionIdx, companionAnswer, onCompanionToggle, onCompanionOtherText)}
            {companionQ.type === 'text' &&
              renderInlineText(companionQ, companionIdx, textAnswers[companionIdx] ?? '', onCompanionTextChange)}
          </>
        )}

        <div className="mt-8 flex flex-col gap-3">
          <button onClick={onNext} disabled={!canProceed}
            className="w-full py-4 bg-stone-900 text-stone-50 text-sm tracking-widest uppercase
              disabled:opacity-30 disabled:cursor-not-allowed transition-opacity duration-150">
            {isLast ? '처방받기' : '다음'}
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

// ── 트랙 선택 화면 ────────────────────────────────────────────
function TrackSelectScreen({ onSelect }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex-1 flex flex-col justify-center py-8"
    >
      <p className="text-xs tracking-widest text-stone-400 uppercase mb-6">Style Prescription</p>
      <h2 className="text-2xl font-light text-stone-900 leading-snug mb-2"
        style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.02em' }}>
        얼마나 자세히<br />알려주실 수 있나요?
      </h2>
      <p className="text-sm text-stone-400 leading-relaxed mb-10">
        답이 많을수록 처방이 정확해집니다.
      </p>
      <div className="flex flex-col gap-3">
        <button onClick={() => onSelect('full')}
          className="w-full text-left p-5 border border-stone-800 bg-stone-900 text-stone-50
            transition-all duration-150 active:scale-[0.99]">
          <p className="text-sm font-medium mb-0.5 tracking-wide">자세히</p>
          <p className="text-xs opacity-50">정확한 처방 · 약 12분 · 29문항</p>
        </button>
        <button onClick={() => onSelect('fast')}
          className="w-full text-left p-5 border border-stone-200 text-stone-700
            transition-all duration-150 hover:border-stone-400 active:scale-[0.99]">
          <p className="text-sm font-medium mb-0.5 tracking-wide">빠르게</p>
          <p className="text-xs text-stone-400">핵심만 · 약 5분 · 16문항</p>
        </button>
      </div>
    </motion.div>
  );
}

// ── 헬퍼 함수 ─────────────────────────────────────────────────
function findQuestionIndex(questionId) {
  return QUESTIONS.findIndex((q) => q.id === questionId);
}

function shouldShowQuestion(question, answers) {
  if (!question.dependsOn) return true;
  const parentIndex = findQuestionIndex(question.dependsOn.questionId);
  if (parentIndex === -1) return false; // 부모 질문이 없으면 숨김
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
  if (question.hasOther && !seen.has('other')) options.push({ id: 'other', label: '기타' });
  return { ...question, options };
}

const ANALYSIS_STEPS = [
  '라이프스타일·직장 맥락 분석 중',
  '현재 모습과 원하는 인상 대조 중',
  '절대 건드리지 않을 요소 확인 중',
  '체형·핏 기준 설계 중',
  '나만의 스타일 기준 정립 중',
  '헤어·컬러·그루밍 처방 중',
  '쇼핑 기준서·처방전 완성 중',
];
const STEP_INTERVAL_MS = 2000;

// ── 로딩 화면 ─────────────────────────────────────────────────
export function LoadingScreen({ done, onDone, onAllMessagesShown }) {
  const [pct, setPct] = useState(0);
  const [transitionMs, setTransitionMs] = useState(STEP_INTERVAL_MS - 200);
  const doneTimerRef = useRef(null);
  const [stepIdx, setStepIdx] = useState(0);
  const allShownRef = useRef(false);

  // 메시지를 고정 간격으로 순차 표시 — 마지막 도달 시 콜백
  useEffect(() => {
    let current = 0;
    const t = setInterval(() => {
      current++;
      if (current >= ANALYSIS_STEPS.length) {
        clearInterval(t);
        setStepIdx(ANALYSIS_STEPS.length - 1);
        if (!allShownRef.current) {
          allShownRef.current = true;
          onAllMessagesShown?.();
        }
      } else {
        setStepIdx(current);
      }
    }, STEP_INTERVAL_MS);
    return () => clearInterval(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 바 진행 — 각 스텝 간격 전체를 부드럽게 채움
  useEffect(() => {
    const target = Math.round((stepIdx + 1) / ANALYSIS_STEPS.length * 95);
    setTransitionMs(STEP_INTERVAL_MS - 200);
    setPct(target);
  }, [stepIdx]);

  // 완료 시 빠르게 100%로
  useEffect(() => {
    if (!done) return;
    setTransitionMs(500);
    setPct(100);
    doneTimerRef.current = setTimeout(() => onDone?.(), 700);
    return () => clearTimeout(doneTimerRef.current);
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
      className="flex-1 flex flex-col justify-center py-8">
      <p className="text-xs tracking-widest text-stone-400 uppercase mb-6">스타일 처방전 작성 중</p>
      <h2 className="text-2xl font-light text-stone-900 leading-snug mb-8"
        style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.02em' }}>
        지금 답변을 바탕으로<br />스타일 처방전을 만들고 있습니다
      </h2>
      <div className="overflow-hidden mb-10" style={{ height: 20 }}>
        <AnimatePresence mode="wait">
          <motion.p key={stepIdx} initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            exit={{ y: -12, opacity: 0 }} transition={{ duration: 0.35 }}
            className="text-xs text-stone-500 tracking-wide">
            {ANALYSIS_STEPS[stepIdx]}...
          </motion.p>
        </AnimatePresence>
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-stone-400 tracking-wider">진행률</span>
          <span className="text-xs font-mono text-stone-700">{pct}%</span>
        </div>
        <div className="w-full h-px bg-stone-200 overflow-hidden">
          <div className="h-px bg-stone-800" style={{ width: `${pct}%`, transition: `width ${transitionMs}ms linear` }} />
        </div>
      </div>
    </motion.div>
  );
}

// ── 할당량 초과 모달 ──────────────────────────────────────────
function QuotaModal({ value, onChange, onSubmit, error, onClose }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ backgroundColor: 'rgba(28,25,23,0.45)' }}
      onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }} transition={{ duration: 0.22 }}
        className="w-full max-w-sm rounded-3xl p-7 relative"
        style={{ backgroundColor: '#F5F2ED' }}
        onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-5 right-5 text-stone-400 hover:text-stone-700 transition-colors" aria-label="닫기">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <line x1="4" y1="4" x2="20" y2="20" /><line x1="20" y1="4" x2="4" y2="20" />
          </svg>
        </button>
        <p className="text-[10px] tracking-[0.28em] text-stone-400 uppercase mb-4">Style Prescription</p>
        <h2 className="text-[22px] font-light text-stone-900 leading-tight mb-2"
          style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.02em' }}>
          오늘 처방 인원이<br />마감됐어요
        </h2>
        <p className="text-sm text-stone-500 leading-relaxed mb-7">초대 코드가 있으시면 지금 바로 시작할 수 있어요.</p>
        <input type="text" value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
          placeholder="초대 코드 입력" autoFocus autoCapitalize="characters"
          className="w-full bg-transparent border-b border-stone-300 focus:border-stone-900
            text-base text-stone-900 text-center pb-2 mb-2 focus:outline-none
            transition-colors duration-150 placeholder:text-stone-300 tracking-[0.2em]" />
        {error ? (
          <p className="text-xs text-red-500 text-center mb-5">{error}</p>
        ) : <div className="mb-5" />}
        <button onClick={onSubmit} disabled={!value.trim()}
          className="w-full py-3.5 rounded-2xl bg-stone-900 text-stone-50 text-sm tracking-widest uppercase
            hover:bg-stone-800 active:bg-stone-700 transition-colors duration-200
            disabled:opacity-30 disabled:cursor-not-allowed">
          코드로 시작하기
        </button>
        <p className="text-xs text-stone-400 text-center mt-4">초대 코드가 없으시면 내일 다시 오세요</p>
      </motion.div>
    </motion.div>
  );
}

// ── 에러 화면 ─────────────────────────────────────────────────
function ErrorScreen({ onRetry }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
      className="flex-1 flex flex-col justify-center py-8">
      <p className="text-xs tracking-widest text-stone-400 uppercase mb-6">오류</p>
      <h2 className="text-2xl font-light text-stone-900 leading-snug mb-4"
        style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.02em' }}>
        보고서를 생성하지<br />못했습니다
      </h2>
      <p className="text-sm text-stone-500 leading-relaxed mb-10">일시적인 오류가 발생했습니다.<br />잠시 후 다시 시도해주세요.</p>
      <button onClick={onRetry}
        className="w-full py-4 bg-stone-900 text-stone-50 text-xs tracking-widest uppercase">
        다시 시도하기
      </button>
    </motion.div>
  );
}

// ── Dev 빠른 채우기 프리셋 (DEV + ?fill=1·2 전용) ───────────────
// ※ 이 상수들은 런타임에 한 번만 계산됩니다 (QUESTIONS 참조)

function _makeFillAnswers(selections) {
  const base = Array(QUESTIONS.length).fill(null).map(() => ({ selectedIds: [], otherText: '' }));
  selections.forEach(([id, selectedIds]) => {
    const i = QUESTIONS.findIndex((q) => q.id === id);
    if (i !== -1) base[i] = { selectedIds, otherText: '' };
  });
  return base;
}
function _makeFillTexts(entries) {
  const base = Array(QUESTIONS.length).fill('');
  entries.forEach(([id, val]) => {
    const i = QUESTIONS.findIndex((q) => q.id === id);
    if (i !== -1) base[i] = val;
  });
  return base;
}

// fill=1 — 사무직, 클린·트러스티, 쿨톤, 178/73
const _DEV_FILL_ANSWERS_BASE = _makeFillAnswers([
  ['direction',         ['clean_trusty', 'effortless_stylish']],
  ['selfPerception',    ['basic_no_impact']],
  ['reference',         ['celebrity', 'saved_mood']],
  ['lifestyle',         ['work', 'weekend', 'date']],
  ['job',               ['office']],
  ['workDressCode',     ['smart_casual']],
  ['lifePeriod',        ['career', 'daily']],
  ['blockers',          ['shopping', 'coord']],
  ['desiredChange',     ['easy_coord', 'shopping_rule']],
  ['fashionMotivation', ['need_change']],
  ['colorPref',         ['refine_current']],
  ['skinTone',          ['cool']],
  ['shopWhere',         ['domestic_platform', 'offline']],
  ['shopWhereDetail',   ['musinsa', 'select_shop']],
  ['bodyType',          ['athletic']],
  ['bodyConcern',       ['none']],
  ['hairStyle',         ['two_block']],
  ['hairWant',          ['refine']],
  ['grooming',          ['skincare', 'beard']],
  ['openOutfit',        ['refine']],
  ['budget',            ['30_50']],
]);
const _DEV_FILL_TEXT_BASE = _makeFillTexts([
  ['referenceDetail', '다니엘 크레이그처럼 단단하고 정제된 분위기'],
  ['brands',          '유니클로, 무신사 스탠다드, COS'],
  ['shopWhereReason', '할인이 자주 있고 내 취향에 맞는 브랜드가 많아서'],
  ['height',          '178'],
  ['weight',          '73'],
  ['birthdate',       JSON.stringify({ year: '1993', month: '', day: '' })],
  ['finalNote',       '출근할 때 너무 힘줘 보이지 않았으면 좋겠어요'],
]);

// fill=2 — 크리에이티브직, 자신감·지적, 웜톤, 173/60, 마른 체형, 스타일 전환기
const _DEV_FILL_ANSWERS_2 = _makeFillAnswers([
  ['direction',         ['confident_strong', 'intellectual_refined']],
  ['selfPerception',    ['no_style']],
  ['reference',         ['brand_lookbook', 'vague_vibe']],
  ['lifestyle',         ['daily', 'date', 'workout']],
  ['job',               ['creative']],
  ['workDressCode',     ['free']],
  ['lifePeriod',        ['daily', 'date']],
  ['blockers',          ['gap', 'body']],
  ['desiredChange',     ['identity', 'impression']],
  ['fashionMotivation', ['outdated']],
  ['colorPref',         ['add_color']],
  ['skinTone',          ['warm']],
  ['shopWhere',         ['domestic_platform', 'brand_direct']],
  ['shopWhereDetail',   ['musinsa', 'wconcept']],
  ['bodyType',          ['slim']],
  ['bodyConcern',       ['narrow_shoulder', 'leg_length']],
  ['hairStyle',         ['growing']],
  ['hairWant',          ['unsure']],
  ['grooming',          ['hair_styling', 'fragrance']],
  ['openOutfit',        ['full']],
  ['budget',            ['50_100']],
]);
const _DEV_FILL_TEXT_2 = _makeFillTexts([
  ['referenceDetail', '지드래곤처럼 세련되고 아이코닉한 느낌, 단 너무 튀지 않게'],
  ['brands',          '스투시, 아더에러, 무신사 스탠다드'],
  ['shopWhereReason', '가격 대비 감각 있는 아이템이 많아서'],
  ['height',          '173'],
  ['weight',          '60'],
  ['birthdate',       JSON.stringify({ year: '1997', month: '', day: '' })],
  ['finalNote',       '마른 체형이라 옷이 잘 안 맞는 게 항상 고민이에요. 감각 있는 스타일로 바꾸고 싶어요'],
]);

// ── 답변 확인(Review) 화면 ────────────────────────────────────
function ReviewScreen({ visibleQuestions, allQuestions, answers, textAnswers, fitPics,
  getCompanionOf, onJumpTo, onSubmit, onBack }) {

  // 질문 답변 텍스트 변환
  function fmtAnswer(q, qIdx) {
    if (!q) return '';
    if (q.type === 'fitpic') return fitPics.length ? `사진 ${fitPics.length}장` : '';
    if (q.type === 'text' || q.type === 'influencer') return (textAnswers[qIdx] ?? '').trim();
    if (q.type === 'birthdate') {
      try {
        const { year, month, day } = JSON.parse(textAnswers[qIdx] || '{}');
        return [year, month && `${month}월`, day && `${day}일`].filter(Boolean).join(' ');
      } catch { return ''; }
    }
    const sel = answers[qIdx]?.selectedIds ?? [];
    // optionGroups 질문은 부모 선택값으로 options를 동적 조합
    let resolvedOptions = q.options ?? [];
    if (q.optionGroups && q.dependsOn?.questionId) {
      const parentIdx = allQuestions.findIndex((x) => x.id === q.dependsOn.questionId);
      const parentSel = parentIdx !== -1 ? (answers[parentIdx]?.selectedIds ?? []) : [];
      const seen = new Set();
      const opts = [];
      parentSel.forEach((sid) => {
        (q.optionGroups[sid] ?? []).forEach((opt) => {
          if (!seen.has(opt.id)) { seen.add(opt.id); opts.push(opt); }
        });
      });
      if (q.hasOther && !seen.has('other')) opts.push({ id: 'other', label: '기타' });
      resolvedOptions = opts;
    }
    return sel.map((id) => {
      if (id === 'other') return answers[qIdx]?.otherText || '기타';
      return resolvedOptions.find((o) => o.id === id)?.label ?? null;
    }).filter(Boolean).join(', ');
  }

  function isRequired(q, qIdx) {
    if (q.optional) return false;
    if (q.type === 'fitpic') return false;
    return true;
  }
  function isAnswered(q, qIdx) {
    const txt = fmtAnswer(q, qIdx);
    return txt.length > 0;
  }

  // 챕터별 그룹핑
  const byChapter = CHAPTERS.map((ch) => ({
    ...ch,
    items: visibleQuestions.map((q, visIdx) => {
      const qIdx = allQuestions.findIndex((x) => x.id === q.id);
      const cq = getCompanionOf(q);
      const cqIdx = cq ? allQuestions.findIndex((x) => x.id === cq.id) : -1;
      return { q, qIdx, cq, cqIdx, visIdx };
    }).filter(({ q }) => q.chapter === ch.id),
  })).filter((ch) => ch.items.length > 0);

  const missingRequired = visibleQuestions.filter((q) => {
    const qIdx = allQuestions.findIndex((x) => x.id === q.id);
    return isRequired(q, qIdx) && !isAnswered(q, qIdx);
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex-1 flex flex-col py-8"
    >
      <button
        onClick={onBack}
        className="text-xs text-stone-400 hover:text-stone-700 transition-colors duration-150 mb-6 self-start"
      >
        ← 돌아가기
      </button>
      <p className="text-xs tracking-widest text-stone-400 uppercase mb-2">답변 확인</p>
      <h2
        className="text-2xl font-light text-stone-900 leading-snug mb-1"
        style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.02em' }}
      >
        내용을 확인하고<br />수정하세요
      </h2>
      <p className="text-sm text-stone-400 mb-8">항목을 누르면 해당 질문으로 이동합니다</p>

      <div className="flex flex-col gap-6 mb-10">
        {byChapter.map((ch) => (
          <div key={ch.id}>
            <p className="text-xs text-stone-400 tracking-widest uppercase mb-2">{ch.label}</p>
            <div className="flex flex-col gap-px">
              {ch.items.map(({ q, qIdx, cq, cqIdx, visIdx }) => {
                const primAns  = fmtAnswer(q, qIdx);
                const compAns  = cq ? fmtAnswer(cq, cqIdx) : '';
                const displayAns = [primAns, compAns].filter(Boolean).join(' · ');
                const required = isRequired(q, qIdx) || (cq && isRequired(cq, cqIdx));
                const answered = primAns || (cq ? compAns : true); // optional companion은 무시
                const empty    = !primAns && !(cq && compAns);
                return (
                  <button
                    key={q.id}
                    onClick={() => onJumpTo(visIdx)}
                    className="w-full text-left py-3 px-4 border transition-all duration-150
                      hover:border-stone-500 active:scale-[0.99] flex items-start justify-between gap-3"
                    style={{ borderColor: required && empty ? '#fca5a5' : '#e7e5e4' }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-stone-400 mb-0.5 leading-snug">
                        {q.heading?.replace(/\n/g, ' ')}
                        {cq && <span className="opacity-60"> + {cq.heading?.replace(/\n/g, ' ')}</span>}
                      </p>
                      <p className={`text-sm truncate ${empty ? 'text-stone-300 italic' : 'text-stone-800'}`}>
                        {displayAns || (q.optional ? '건너뜀 (선택)' : '—')}
                      </p>
                    </div>
                    {required && empty && (
                      <span className="shrink-0 text-xs text-red-400 mt-0.5">필수</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {missingRequired.length > 0 && (
        <p className="text-xs text-red-400 text-center mb-4">
          {missingRequired.length}개 필수 항목을 채워주세요
        </p>
      )}

      <button
        onClick={onSubmit}
        disabled={missingRequired.length > 0}
        className="w-full py-4 bg-stone-900 text-stone-50 text-sm tracking-widest uppercase
          disabled:opacity-30 disabled:cursor-not-allowed transition-opacity duration-150 mb-3"
      >
        처방받기
      </button>
      <button
        onClick={onBack}
        className="text-xs text-stone-400 text-center py-1 hover:text-stone-700 transition-colors duration-150"
      >
        ← 돌아가기
      </button>
    </motion.div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────
function emptyAnswer() {
  return { selectedIds: [], otherText: '' };
}

export default function PrescriptionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { nickname, setNickname } = useNickname();
  const { session } = useAuth();
  const { prescription } = useReportStatus();

  // DEV 환경에서만 ?fill=1·2 동작
  const devFillParam = import.meta.env.DEV ? searchParams.get('fill') : null;
  const devFill = devFillParam === '1' || devFillParam === '2';

  const fromType = location.state?.type ?? (() => {
    try { const saved = JSON.parse(localStorage.getItem('vizuden_type')); return saved?.code ?? null; } catch { return null; }
  })();

  const [phase, setPhase] = useState(() => devFill ? 'review' : 'questions');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [inviteCodeError, setInviteCodeError] = useState('');
  const [stepIdx, setStepIdx] = useState(0);
  const [answers, setAnswers] = useState(() => {
    if (!devFill) return Array(PRESCRIPTION_TOTAL).fill(null).map(emptyAnswer);
    const preset = devFillParam === '2' ? _DEV_FILL_ANSWERS_2 : _DEV_FILL_ANSWERS_BASE;
    return preset.map((a) => ({ ...a, selectedIds: [...a.selectedIds] }));
  });
  const handleNextRef = useRef(null);
  const [textAnswers, setTextAnswers] = useState(() => {
    if (!devFill) return Array(PRESCRIPTION_TOTAL).fill('');
    return [...(devFillParam === '2' ? _DEV_FILL_TEXT_2 : _DEV_FILL_TEXT_BASE)];
  });
  const [fitPics, setFitPics] = useState([]);
  const [fitPicPreviews, setFitPicPreviews] = useState([]);
  const [direction, setDirection] = useState(1);
  const [returnToReview, setReturnToReview] = useState(false);

  useEffect(() => {
    if (location.state?.showQuota) {
      setPhase('quota');
      navigate(location.pathname, { replace: true, state: {} });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (location.pathname === '/prescription/questions' && prescription.done && prescription.reportId) {
      navigate(`/prescription/result/${prescription.reportId}`, { replace: true });
    }
  }, [prescription.done, prescription.reportId, location.pathname, navigate]);

  useEffect(() => {
    return () => { fitPicPreviews.forEach((p) => { if (p?.url) URL.revokeObjectURL(p.url); }); };
  }, [fitPicPreviews]);

  // 트랙 + 조건에 맞는 질문만 (companion 제외 — companion은 primary와 함께 렌더링)
  const visibleQuestions = QUESTIONS.filter((q) => {
    if (q.isCompanion) return false;
    if (!shouldShowQuestion(q, answers)) return false;
    return true;
  });

  const totalSteps = visibleQuestions.length;
  const currentQ = visibleQuestions[stepIdx] ? resolveQuestion(visibleQuestions[stepIdx], answers) : null;
  const currentQuestionIndex = currentQ ? findQuestionIndex(currentQ.id) : -1;

  // companion 질문 (현재 트랙+visibility 체크)
  function getCompanionQ(q) {
    if (!q?.companion) return null;
    const cq = QUESTIONS.find((x) => x.id === q.companion);
    if (!cq) return null;
    if (!shouldShowQuestion(cq, answers)) return null;
    return resolveQuestion(cq, answers);
  }

  useEffect(() => {
    if (stepIdx > 0 && stepIdx >= visibleQuestions.length) {
      setStepIdx(Math.max(visibleQuestions.length - 1, 0));
    }
  }, [stepIdx, visibleQuestions.length]);

  // 챕터별 답변 완료 상태 (✓ / ! / ● / ○)
  const chapterAnswerState = (() => {
    if (!currentQ) return {};
    const currentChapterIdx = CHAPTERS.findIndex((c) => c.id === currentQ.chapter);
    // 안전장치: chapter id가 CHAPTERS에 없으면 전부 'future' 처리
    if (currentChapterIdx < 0) return {};
    const state = {};

    CHAPTERS.forEach((ch, chIdx) => {
      if (chIdx === currentChapterIdx) { state[ch.id] = 'current'; return; }

      const chapterVisibleQs = visibleQuestions.filter((q) => q.chapter === ch.id);

      // 챕터의 visible 문항이 없는 경우
      if (chapterVisibleQs.length === 0) {
        // 지나온 챕터면 done, 아직 안 온 미래면 future
        state[ch.id] = chIdx < currentChapterIdx ? 'done' : 'future';
        return;
      }

      // 미래 챕터인지 확인 — 하지만 이미 답변이 있으면 done/incomplete로 표시
      if (chIdx > currentChapterIdx) {
        const hasAnyAnswer = chapterVisibleQs.some((q) => {
          if (q.isCompanion) return false;
          const qIdx = QUESTIONS.findIndex((x) => x.id === q.id);
          if (qIdx < 0) return false;
          if (q.type === 'text' || q.type === 'influencer') return (textAnswers[qIdx] ?? '').trim().length > 0;
          if (q.type === 'birthdate') {
            try { return /^\d{4}$/.test(JSON.parse(textAnswers[qIdx] || '{}').year); } catch { return false; }
          }
          if (q.type === 'fitpic') return fitPics.length > 0;
          return (answers[qIdx]?.selectedIds ?? []).length > 0;
        });
        if (!hasAnyAnswer) { state[ch.id] = 'future'; return; }
      }

      // 지나온 챕터 or 답변 있는 미래 챕터 — 필수 항목 미답 여부 확인
      const hasGap = chapterVisibleQs.some((q) => {
        if (q.optional) return false;
        if (q.isCompanion) return false;
        const qIdx = QUESTIONS.findIndex((x) => x.id === q.id);
        if (qIdx < 0) return false;
        if (q.type === 'text' || q.type === 'influencer') return (textAnswers[qIdx] ?? '').trim().length === 0;
        if (q.type === 'birthdate') {
          try { return !/^\d{4}$/.test(JSON.parse(textAnswers[qIdx] || '{}').year); } catch { return true; }
        }
        if (q.type === 'fitpic') return false;
        return (answers[qIdx]?.selectedIds ?? []).length === 0;
      });
      state[ch.id] = hasGap ? 'incomplete' : 'done';
    });
    return state;
  })();

  // canProceed: primary + companion 모두 체크
  function questionCanProceed(q, qIdx) {
    if (!q) return false;
    if (q.optional) return true;
    if (q.type === 'text' || q.type === 'influencer') return (textAnswers[qIdx] ?? '').trim().length > 0;
    if (q.type === 'birthdate') {
      try { return /^\d{4}$/.test(JSON.parse(textAnswers[qIdx] || '{}').year); } catch { return false; }
    }
    if (q.type === 'fitpic') return fitPics.length > 0;
    return (answers[qIdx]?.selectedIds ?? []).length > 0;
  }

  function canProceed() {
    if (!currentQ || currentQuestionIndex === -1) return false;
    const primaryOk = questionCanProceed(currentQ, currentQuestionIndex);
    const cq = getCompanionQ(currentQ);
    if (!cq) return primaryOk;
    const cqIdx = findQuestionIndex(cq.id);
    return primaryOk && questionCanProceed(cq, cqIdx);
  }

  async function callPrescriptionAPI(useInviteCode = null, immediateNavigate = true) {
    function resolveLabels(q, selectedIds) {
      return (selectedIds ?? []).map((id) => {
        if (id === 'other') return null;
        const opt = q.options?.find((o) => o.id === id);
        return opt?.label || id;
      }).filter(Boolean);
    }

    const formattedAnswers = QUESTIONS.map((q, i) => {
      if (!shouldShowQuestion(q, answers)) return null;
      if (q.type === 'text') return { question: q.heading, answer: textAnswers[i] };
      if (q.type === 'birthdate') {
        try {
          const { year, month, day } = JSON.parse(textAnswers[i] || '{}');
          const parts = [year, month ? `${month}월` : null, day ? `${day}일` : null].filter(Boolean);
          return { question: q.heading, answer: parts.length ? parts.join(' ') : '' };
        } catch { return { question: q.heading, answer: '' }; }
      }
      if (q.type === 'fitpic') return { question: q.heading, answer: fitPics.length ? `사진 ${fitPics.length}장 첨부` : '' };
      const resolvedQ = resolveQuestion(q, answers);
      return { question: q.heading, selected: resolveLabels(resolvedQ, answers[i].selectedIds), other: answers[i].otherText };
    }).filter(Boolean);

    try {
      // immediateNavigate 경로: 업로드 전에 결과 페이지로 즉시 이동
      if (immediateNavigate) {
        resetPrescriptionStream();
        setPrescriptionStream({ status: 'loading', fromType: fromType || null, fitPics: [] });
        navigate('/prescription/result');
      }

      const uploadedFitPics = await uploadFitPics();
      if (immediateNavigate && uploadedFitPics.length) {
        setPrescriptionStream({ fitPics: uploadedFitPics });
      }

      const response = await fetch('/api/prescription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-guest-session-id': ensureGuestSessionId(),
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          typeCode: fromType || null,
          typeInfo: fromType ? types[fromType] : null,
          answers: formattedAnswers,
          fitPics: uploadedFitPics,
          nickname: nickname || null,
          ...(useInviteCode ? { inviteCode: useInviteCode } : {}),
        }),
      });

      if (response.status === 429) {
        if (immediateNavigate) {
          setPrescriptionStream({ status: 'error', errorCode: 'quota' });
        } else {
          setIsSubmitting(false); setPhase('quota');
        }
        return;
      }
      if (response.status === 403) {
        if (immediateNavigate) {
          setPrescriptionStream({ status: 'error', errorCode: 'invite_invalid' });
        } else {
          setIsSubmitting(false); setInviteCodeError('유효하지 않은 초대 코드예요.'); setPhase('quota');
        }
        return;
      }
      // 기타 non-2xx (404, 500 등) — SSE 스트림이 아니므로 별도 처리
      if (!response.ok) {
        if (immediateNavigate) {
          setPrescriptionStream({ status: 'error', errorCode: response.status >= 500 ? 'server' : 'client' });
        } else {
          setIsSubmitting(false); setPhase('error');
        }
        return;
      }

      // immediateNavigate=false (초대코드 경로): 200 OK 확인 후 navigate
      if (!immediateNavigate) {
        resetPrescriptionStream();
        setPrescriptionStream({ status: 'loading', fromType: fromType || null, fitPics: uploadedFitPics });
        navigate('/prescription/result');
      }

      // SSE 스트림 읽기
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulated = '';
      let streamingStarted = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? '';

        for (const part of parts) {
          if (!part.startsWith('data: ')) continue;
          let data;
          try { data = JSON.parse(part.slice(6)); } catch { continue; }

          if (data.type === 'delta') {
            accumulated += (data.text ?? '');
            const sections = tryExtractSections(accumulated);
            if (Object.keys(sections).length) {
              if (!streamingStarted && sections.title !== undefined) {
                streamingStarted = true;
                setPrescriptionStream({ status: 'streaming', ...sections });
              } else {
                setPrescriptionStream(sections);
              }
            }

          } else if (data.type === 'done') {
            const { report, reportId, title } = data;
            if (!report || !reportId) { setPrescriptionStream({ status: 'error' }); return; }

            const tz = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || null; } catch { return null; } })();
            const saveData = {
              fromType: fromType || null, report, reportId, title: title || null,
              preview: typeof report?.direction === 'string' ? report.direction : null,
              savedAt: Date.now(), timeZone: tz, gender: 'male',
            };
            try {
              writePrescriptionSaved(saveData);
              writePrescriptionHistory([saveData, ...readPrescriptionHistory()]);
            } catch {}
            setPrescriptionStream({
              status: 'done',
              reportId,
              title: title || null,
              direction: report.direction,
              direction_label: report.direction_label ?? null,
              criteria: report.criteria,
              bodyGuide: report.bodyGuide,
              stylingFormula: report.stylingFormula,
              shopping_criteria: report.shopping_criteria,
              hair_grooming: report.hair_grooming,
              color_guide: report.color_guide,
              styling_snapshot: report.styling_snapshot,
              closing: report.closing ?? null,
              closing_label: report.closing_label ?? null,
            });

          } else if (data.type === 'error') {
            setPrescriptionStream({ status: 'error' });
            return;
          }
        }
      }
    } catch {
      setPrescriptionStream({ status: 'error' });
      if (!immediateNavigate) { setIsSubmitting(false); setPhase('error'); }
    }
  }

  async function handleInviteCodeSubmit() {
    const trimmed = inviteCode.trim();
    if (!trimmed) return;
    setInviteCodeError('');
    setIsSubmitting(true);
    setPhase('loading');
    await callPrescriptionAPI(trimmed, false); // 초대코드: 응답 확인 후 navigate
    setIsSubmitting(false);
  }

  function handleToggle(id) {
    const q = currentQ;
    if (!q || currentQuestionIndex === -1) return;
    const wasSelected = answers[currentQuestionIndex]?.selectedIds.includes(id);
    setAnswers((prev) => {
      const next = prev.map((a) => ({ ...a, selectedIds: [...a.selectedIds] }));
      if (q.type === 'radio') {
        next[currentQuestionIndex].selectedIds = next[currentQuestionIndex].selectedIds.includes(id) ? [] : [id];
      } else {
        next[currentQuestionIndex].selectedIds = next[currentQuestionIndex].selectedIds.includes(id)
          ? next[currentQuestionIndex].selectedIds.filter((x) => x !== id)
          : [...next[currentQuestionIndex].selectedIds, id];
      }
      return next;
    });
    // 단일선택(radio): companion이 없고, 기타가 아닐 때 자동 진행
    if (q.type === 'radio' && id !== 'other' && !wasSelected) {
      const cq = getCompanionQ(q);
      if (!cq) {
        setTimeout(() => { handleNextRef.current?.(); }, 600);
      }
    }
  }

  function handleCompanionToggle(id, cq, cqIdx) {
    const wasSelected = answers[cqIdx]?.selectedIds.includes(id);
    setAnswers((prev) => {
      const next = prev.map((a) => ({ ...a, selectedIds: [...a.selectedIds] }));
      if (cq.type === 'radio') {
        next[cqIdx].selectedIds = next[cqIdx].selectedIds.includes(id) ? [] : [id];
      } else {
        next[cqIdx].selectedIds = next[cqIdx].selectedIds.includes(id)
          ? next[cqIdx].selectedIds.filter((x) => x !== id)
          : [...next[cqIdx].selectedIds, id];
      }
      return next;
    });
    // companion radio: primary도 answered면, 기타가 아닐 때 자동 진행
    if (cq.type === 'radio' && id !== 'other' && !wasSelected) {
      const primaryOk = (answers[currentQuestionIndex]?.selectedIds ?? []).length > 0 || currentQ.optional;
      if (primaryOk) {
        setTimeout(() => { handleNextRef.current?.(); }, 600);
      }
    }
  }

  function handleOtherText(val) {
    if (currentQuestionIndex === -1) return;
    setAnswers((prev) => { const next = prev.map((a) => ({ ...a })); next[currentQuestionIndex].otherText = val; return next; });
  }

  function handleCompanionOtherText(val, cqIdx) {
    setAnswers((prev) => { const next = prev.map((a) => ({ ...a })); next[cqIdx].otherText = val; return next; });
  }

  function handleTextChange(val) {
    if (currentQuestionIndex === -1) return;
    const next = [...textAnswers]; next[currentQuestionIndex] = val; setTextAnswers(next);
  }

  function handleCompanionTextChange(val, cqIdx) {
    const next = [...textAnswers]; next[cqIdx] = val; setTextAnswers(next);
  }

  function handleFitPicSelect(files, maxFiles) {
    const allowed = Math.max(0, maxFiles - fitPics.length);
    const next = files.slice(0, allowed);
    if (next.length === 0) return;
    setFitPics((prev) => [...prev, ...next]);
    setFitPicPreviews((prev) => [
      ...prev,
      ...next.map((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID?.() ?? Math.random()}`,
        name: file.name, size: file.size, url: URL.createObjectURL(file),
      })),
    ]);
  }

  function handleFitPicRemove(removeIdx) {
    setFitPics((prev) => prev.filter((_, i) => i !== removeIdx));
    setFitPicPreviews((prev) => {
      const target = prev[removeIdx];
      if (target?.url) URL.revokeObjectURL(target.url);
      return prev.filter((_, i) => i !== removeIdx);
    });
  }

  async function uploadFitPics() {
    if (!fitPics.length) return [];
    const response = await fetch('/api/identity-fitpic-upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}) },
      body: JSON.stringify({ files: fitPics.map((file) => ({ name: sanitizeFilename(file.name), contentType: file.type || 'image/jpeg' })) }),
    });
    if (!response.ok) throw new Error('fitpic upload session creation failed');
    const payload = await response.json();
    if (!Array.isArray(payload?.uploads) || payload.uploads.length !== fitPics.length) throw new Error('fitpic upload session payload is invalid');
    const uploaded = [];
    for (let idx = 0; idx < payload.uploads.length; idx++) {
      const upload = payload.uploads[idx];
      const file = fitPics[idx];
      const putResponse = await fetch(upload.signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'image/jpeg', 'x-upsert': 'false' },
        body: file,
      });
      if (!putResponse.ok) throw new Error(`fitpic upload failed for ${file.name}`);
      uploaded.push({ bucket: upload.bucket, path: upload.path, name: file.name, contentType: file.type || 'image/jpeg', size: file.size });
    }
    return uploaded;
  }

  function handleNext() {
    if (!canProceed()) return;
    setReturnToReview(false); // 앞으로 이동 시 목차 복귀 해제
    window.scrollTo(0, 0);
    if (stepIdx < totalSteps - 1) {
      setDirection(1); setStepIdx(stepIdx + 1);
    } else {
      // 마지막 질문 → 바로 처방 시작 (로딩 화면 없이 즉시 결과 페이지로)
      (async () => { await callPrescriptionAPI(null, true); })();
    }
  }

  handleNextRef.current = handleNext;

  function handleSubmitFromReview() {
    (async () => { await callPrescriptionAPI(null, true); })();
  }


  // 챕터 첫 질문으로 점프
  function handleJumpToChapter(chapterId) {
    const firstIdx = visibleQuestions.findIndex((q) => q.chapter === chapterId);
    if (firstIdx === -1) return;
    setDirection(firstIdx > stepIdx ? 1 : -1);
    setStepIdx(firstIdx);
    setPhase('questions');
    window.scrollTo(0, 0);
  }

  // 목차(review) 열기 — 현재 stepIdx 유지
  function handleOpenReview() {
    setPhase('review');
    window.scrollTo(0, 0);
  }

  function handleBack() {
    window.scrollTo(0, 0);
    if (phase === 'review') {
      setPhase('questions');
    } else if (returnToReview) {
      // 목차에서 점프해 온 경우 → 목차로 복귀
      setReturnToReview(false);
      setPhase('review');
    } else if (stepIdx === 0) {
      navigate('/');
    } else {
      setDirection(-1); setStepIdx(stepIdx - 1);
    }
  }

  // 현재 companion 정보
  const companionQ = currentQ ? getCompanionQ(currentQ) : null;
  const companionIdx = companionQ ? findQuestionIndex(companionQ.id) : -1;
  const isLastStep = stepIdx === totalSteps - 1;
  const proceed = canProceed();

  return (
    <ChapterNavContext.Provider value={{
      onJumpToChapter: handleJumpToChapter,
      onOpenReview: phase === 'questions' ? handleOpenReview : null,
      onBackToReview: phase === 'questions' && returnToReview ? handleBack : null,
      chapterAnswerState,
    }}>
    <div className="min-h-screen flex flex-col items-center px-6" style={{ backgroundColor: '#F5F2ED' }}>
      <AnimatePresence>
        {!nickname && !devFill && (
          <NicknameModal
            key="nickname-gate"
            onSave={(name) => setNickname(name)}
          />
        )}
        {phase === 'quota' && (
          <QuotaModal
            value={inviteCode}
            onChange={(v) => { setInviteCode(v); setInviteCodeError(''); }}
            onSubmit={handleInviteCodeSubmit}
            error={inviteCodeError}
            onClose={() => setPhase('questions')}
          />
        )}
      </AnimatePresence>

      <div className="w-full max-w-sm flex flex-col" style={{ minHeight: '100svh' }}>
        <SiteHeader onLogoClick={() => navigate('/')} />

        {/* 질문 — companion 있을 때: MultiQuestionScreen */}
        {phase === 'questions' && currentQ && companionQ && (
          <MultiQuestionScreen
            primaryQ={currentQ} primaryIdx={currentQuestionIndex}
            companionQ={companionQ} companionIdx={companionIdx}
            stepIdx={stepIdx} answers={answers} textAnswers={textAnswers}
            onPrimaryToggle={handleToggle}
            onPrimaryOtherText={handleOtherText}
            onPrimaryTextChange={handleTextChange}
            onCompanionToggle={(id) => handleCompanionToggle(id, companionQ, companionIdx)}
            onCompanionOtherText={(val) => handleCompanionOtherText(val, companionIdx)}
            onCompanionTextChange={(val) => handleCompanionTextChange(val, companionIdx)}
            onNext={handleNext} onBack={handleBack}
            direction={direction} canProceed={proceed} isLast={isLastStep}
          />
        )}

        {/* 질문 — companion 없을 때: 기존 단일 질문 컴포넌트 */}
        {phase === 'questions' && currentQ && !companionQ && (
          <>
            {(currentQ.type === 'checkbox' || currentQ.type === 'radio') && !currentQ.optionGroups && (
              <SelectQuestion
                question={currentQ} stepIdx={stepIdx}
                answer={answers[currentQuestionIndex] ?? emptyAnswer()}
                onToggle={handleToggle} onOtherChange={handleOtherText}
                onNext={handleNext} onBack={handleBack}
                direction={direction} canProceed={proceed} isLast={isLastStep}
              />
            )}
            {currentQ.type === 'text' && (
              <TextQuestion
                question={currentQ} stepIdx={stepIdx}
                value={textAnswers[currentQuestionIndex] ?? ''}
                onChange={handleTextChange}
                onNext={handleNext} onBack={handleBack}
                direction={direction} canProceed={proceed} isLast={isLastStep}
                gender="male"
              />
            )}
            {currentQ.type === 'birthdate' && (
              <BirthdateQuestion
                question={currentQ} stepIdx={stepIdx}
                value={textAnswers[currentQuestionIndex] ?? ''}
                onChange={handleTextChange}
                onNext={handleNext} onBack={handleBack} direction={direction}
              />
            )}
            {currentQ.type === 'fitpic' && (
              <FitPicQuestion
                question={currentQ} stepIdx={stepIdx}
                files={fitPics} previews={fitPicPreviews}
                onSelectFiles={handleFitPicSelect} onRemoveFile={handleFitPicRemove}
                onNext={handleNext} onBack={handleBack}
                direction={direction} canProceed={proceed} isLast={isLastStep}
              />
            )}
            {currentQ.type === 'checkbox' && currentQ.optionGroups && (
              <DynamicCheckboxQuestion
                question={currentQ} stepIdx={stepIdx}
                answer={answers[currentQuestionIndex] ?? emptyAnswer()}
                sourceSelectedIds={answers[findQuestionIndex(currentQ.dependsOn?.questionId)]?.selectedIds}
                suboptions={currentQ.optionGroups}
                onToggle={handleToggle} onOtherChange={handleOtherText}
                onNext={handleNext} onBack={handleBack}
                direction={direction} canProceed={proceed}
              />
            )}
          </>
        )}

        {/* 답변 확인 화면 */}
        {phase === 'review' && (
          <ReviewScreen
            visibleQuestions={visibleQuestions}
            allQuestions={QUESTIONS}
            answers={answers}
            textAnswers={textAnswers}
            fitPics={fitPics}
            getCompanionOf={getCompanionQ}
            onJumpTo={(visIdx) => { setReturnToReview(true); setStepIdx(visIdx); setPhase('questions'); window.scrollTo(0, 0); }}
            onSubmit={handleSubmitFromReview}
            onBack={handleBack}
          />
        )}

        {phase === 'loading' && (
          <LoadingScreen done={false} onDone={() => {}} />
        )}

        {phase === 'error' && (
          <ErrorScreen onRetry={() => {
            setPhase('loading');
            (async () => { await callPrescriptionAPI(null); })();
          }} />
        )}

        <div className="text-center py-8 mt-auto">
          <p className="text-xs text-stone-400 tracking-widest uppercase">
            &copy; {new Date().getFullYear()} VIZUDEN
          </p>
        </div>
      </div>
    </div>
    </ChapterNavContext.Provider>
  );
}
