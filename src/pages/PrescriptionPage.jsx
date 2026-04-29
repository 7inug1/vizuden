import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageUp } from 'lucide-react';
import SiteHeader from '../components/SiteHeader';
import Tooltip from '../components/Tooltip';
import { types } from '../data/types';
import { QUESTIONS, PRESCRIPTION_TOTAL } from '../data/prescriptionQuestions';
import { useNickname } from '../context/NicknameContext';
import { useAuth } from '../context/AuthContext';
import { useReportStatus } from '../hooks/useReportStatus';
import { ensureGuestSessionId } from '../lib/storage';
import { readPrescriptionHistory, writePrescriptionHistory, writePrescriptionSaved } from '../lib/prescriptionStorage';

const TOTAL = PRESCRIPTION_TOTAL;

const slideVariants = {
  enter: (dir) => ({ opacity: 0, x: dir > 0 ? 28 : -28 }),
  center: { opacity: 1, x: 0 },
  exit:  (dir) => ({ opacity: 0, x: dir > 0 ? -28 : 28 }),
};

// ── 공통 ProgressBar ──────────────────────────────────────────
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
function OptionButton({ label, sub, info, selected, onToggle, disabled, isInfoOpen, onInfoToggle }) {
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
    </button>
  );
}

// ── 선택형 질문 (checkbox / radio) ───────────────────────────
function SelectQuestion({ question, stepIdx, total, answer, onToggle, onOtherChange, onNext, onBack, direction }) {
  const isRadio = question.type === 'radio';
  const max = question.max;
  const selected = answer.selectedIds;
  const otherSelected = selected.includes('other');
  const canProceed = question.optional ? true : selected.length > 0;
  const [openInfoId, setOpenInfoId] = useState(null);

  function toggleInfo(id) {
    setOpenInfoId((prev) => (prev === id ? null : id));
  }

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
              info={opt.info}
              selected={selected.includes(opt.id)}
              onToggle={() => onToggle(opt.id)}
              disabled={isDisabled(opt.id)}
              isInfoOpen={openInfoId === opt.id}
              onInfoToggle={() => toggleInfo(opt.id)}
            />
          ))}
        </div>

        {/* 기타 텍스트 입력 */}
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

// ── 텍스트 질문 ───────────────────────────────────────────────
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
                const allowed = ['Backspace','Delete','Tab','Enter','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'];
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
          <p className="text-xs text-stone-400 mt-2 leading-relaxed">
            {question.motivational
              ? '선택 사항이지만, 구체적으로 적을수록 보고서 퀄리티가 올라갑니다'
              : '선택 사항 — 건너뛰어도 됩니다'}
          </p>
        )}
        <div className="mt-8 flex flex-col gap-3">
          <button
            onClick={onNext}
            disabled={!canProceed}
            className="w-full py-4 bg-stone-900 text-stone-50 text-sm tracking-widest uppercase
              disabled:opacity-30 disabled:cursor-not-allowed transition-opacity duration-150"
          >
            {isLast ? '분석 시작하기' : '다음'}
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
          onDragEnter={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setIsDragging(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            event.stopPropagation();
            if (!isDragging) setIsDragging(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            event.stopPropagation();
            if (event.currentTarget.contains(event.relatedTarget)) return;
            setIsDragging(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setIsDragging(false);
            handleFiles(Array.from(event.dataTransfer.files ?? []));
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
            onChange={(e) => {
              handleFiles(Array.from(e.target.files ?? []));
              e.target.value = '';
            }}
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
            {isLast ? '분석 시작하기' : '다음'}
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

// ── 레퍼런스 인물 질문 ────────────────────────────────────────
function InfluencerQuestion({ question, stepIdx, total, textValue, onTextChange, onNext, onBack, direction }) {

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

        {/* 이름 / 인스타 계정 입력 */}
        <input
          type="text"
          value={textValue}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder={question.placeholder}
          className="w-full bg-transparent border-b border-stone-300 text-sm text-stone-800
            py-2 placeholder:text-stone-300 focus:outline-none focus:border-stone-700
            transition-colors duration-150"
        />


        <div className="mt-8 flex flex-col gap-3">
          <button
            onClick={onNext}
            className="w-full py-4 bg-stone-900 text-stone-50 text-sm tracking-widest uppercase"
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

// ── 생년월일 질문 ─────────────────────────────────────────────
function BirthdateQuestion({ question, stepIdx, total, value, onChange, onNext, onBack, direction }) {
  let parsed = { year: '', month: '', day: '' };
  try { if (value) parsed = { ...parsed, ...JSON.parse(value) }; } catch {}
  const { year, month, day } = parsed;

  const monthRef = useRef(null);
  const dayRef = useRef(null);

  function update(field, val) {
    onChange(JSON.stringify({ year, month, day, [field]: val }));
  }

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
          {/* 년도 — 필수 */}
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
          {/* 월 — 선택 */}
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
          {/* 일 — 선택 */}
          <div className="flex flex-col gap-1" style={{ width: 56 }}>
            <span className="text-xs text-stone-400">일 <span className="text-stone-300">(선택)</span></span>
            <div className="flex items-baseline gap-1 border-b border-stone-300 focus-within:border-stone-700 transition-colors duration-150 pb-1.5">
              <input
                ref={dayRef}
                type="text"
                inputMode="numeric"
                maxLength={2}
                value={day}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^0-9]/g, '');
                  update('day', v);
                }}
                placeholder="01"
                className="w-full bg-transparent text-xl text-stone-800 font-light placeholder:text-stone-300 focus:outline-none"
              />
              <span className="text-xs text-stone-400 shrink-0">일</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-stone-400 mt-3 leading-relaxed">
          월·일 입력 시 추후 생일 관련 혜택을 제공해드릴 수 있습니다. (선택 사항)
        </p>

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

// ── 동적 체크박스 질문 (Q3b / Q8b) ──────────────────────────────
function DynamicCheckboxQuestion({ question, stepIdx, total, answer, sourceSelectedIds, suboptions, onToggle, onOtherChange, onNext, onBack, direction }) {
  const dynamicOptions = (sourceSelectedIds ?? []).flatMap((id) => (suboptions ?? {})[id] ?? []);
  const selected = answer.selectedIds;
  const otherSelected = selected.includes('other');
  const max = question.max;
  const [openInfoId, setOpenInfoId] = useState(null);

  function toggleInfo(id) {
    setOpenInfoId((prev) => (prev === id ? null : id));
  }

  function isDisabled(id) {
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
          {dynamicOptions.map((opt) => (
            <OptionButton
              key={opt.id}
              label={opt.label}
              sub={opt.sub}
              info={opt.info}
              selected={selected.includes(opt.id)}
              onToggle={() => onToggle(opt.id)}
              disabled={isDisabled(opt.id)}
              isInfoOpen={openInfoId === opt.id}
              onInfoToggle={() => toggleInfo(opt.id)}
            />
          ))}
          {question.hasOther && (
            <OptionButton
              label="기타"
              selected={otherSelected}
              onToggle={() => onToggle('other')}
              disabled={isDisabled('other')}
            />
          )}
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
          <button
            onClick={onNext}
            className="w-full py-4 bg-stone-900 text-stone-50 text-sm tracking-widest uppercase"
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

function findQuestionIndex(questionId) {
  return QUESTIONS.findIndex((q) => q.id === questionId);
}

function shouldShowQuestion(question, answers) {
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

const ANALYSIS_STEPS = [
  '답변과 유형 정보 정리 중',
  '원하는 인상과 현재 상태 비교 중',
  '막히는 지점과 예산 조건 읽는 중',
  '체형과 착장 사진 기준 정리 중',
  '나만의 스타일 기준 3가지 도출 중',
  '바로 써먹을 코디 공식 정리 중',
  '제품군과 브랜드 추천 정리 중',
  '처방전 마무리 중',
];

// ── 로딩 화면 ─────────────────────────────────────────────────
function LoadingScreen({ done, onDone }) {
  const [pct, setPct] = useState(0);
  const pctRef = useRef(0);
  const timerRef = useRef(null);
  const [stepIdx, setStepIdx] = useState(0);

  // 크롤 단계: 랜덤 tick으로 항상 조금씩 움직임 (절대 멈추지 않음)
  useEffect(() => {
    function tick() {
      const cur = pctRef.current;
      const increment = cur < 70
        ? 0.75 + Math.random() * 0.45
        : cur < 90
          ? 0.32 + Math.random() * 0.24
          : 0.08 + Math.random() * 0.08;
      const delay = cur < 70
        ? 360 + Math.random() * 90
        : cur < 90
          ? 500 + Math.random() * 140
          : 800 + Math.random() * 180;

      const next = Math.min(cur + increment, 99);
      pctRef.current = next;
      setPct(Math.round(next));
      setStepIdx(Math.min(
        Math.floor((next / 100) * ANALYSIS_STEPS.length),
        ANALYSIS_STEPS.length - 1,
      ));

      if (next < 99) timerRef.current = setTimeout(tick, delay);
    }

    timerRef.current = setTimeout(tick, 200);
    return () => clearTimeout(timerRef.current);
  }, []);

  // 완료 단계: API 응답 시 현재 % → 100% (400ms 빠르게)
  useEffect(() => {
    if (!done) return;
    clearTimeout(timerRef.current);
    const startVal = pctRef.current;
    const startTime = Date.now();
    const DURATION = 400;

    function finish() {
      const t = Math.min((Date.now() - startTime) / DURATION, 1);
      const val = Math.round(startVal + (100 - startVal) * t);
      pctRef.current = val;
      setPct(val);
      if (t < 1) timerRef.current = setTimeout(finish, 16);
      else onDone();
    }

    timerRef.current = setTimeout(finish, 16);
    return () => clearTimeout(timerRef.current);
  }, [done]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex-1 flex flex-col justify-center py-8"
    >
      <p className="text-xs tracking-widest text-stone-400 uppercase mb-6">스타일 처방전 작성 중</p>
      <h2
        className="text-2xl font-light text-stone-900 leading-snug mb-8"
        style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.02em' }}
      >
        지금 답변을 바탕으로<br />스타일 처방전을 만들고 있습니다
      </h2>

      {/* Vertical rolling 분석 단계 */}
      <div className="overflow-hidden mb-10" style={{ height: 20 }}>
        <AnimatePresence mode="wait">
          <motion.p
            key={stepIdx}
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -12, opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="text-xs text-stone-500 tracking-wide"
          >
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
          <div
            className="h-px bg-stone-800 transition-none"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </motion.div>
  );
}

// ── 코드 입력 화면 ────────────────────────────────────────────
function CodeGateScreen({ value, onChange, onSubmit, error, loading }) {
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
        <p className="text-xs tracking-[0.28em] text-stone-400 uppercase mb-5">02 STYLE PRESCRIPTION</p>
        <h2
          className="text-2xl font-light text-stone-900 leading-tight mb-3"
          style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.02em' }}
        >
          초대 코드를<br />입력해주세요
        </h2>
        <p className="text-sm text-stone-500 leading-relaxed mb-10">
          스타일 처방은 초대 코드가 있어야 시작할 수 있습니다.
        </p>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && !loading && onSubmit()}
          placeholder="코드 입력"
          autoFocus
          autoCapitalize="characters"
          className="w-full bg-transparent border-b border-stone-300 focus:border-stone-900
            text-base text-stone-900 text-center pb-2 mb-2 focus:outline-none
            transition-colors duration-150 placeholder:text-stone-300 tracking-[0.2em]"
        />
        {error && (
          <p className="text-xs text-red-500 text-center mb-6">{error}</p>
        )}
        {!error && <div className="mb-6" />}
        <button
          onClick={onSubmit}
          disabled={!value.trim() || loading}
          className="w-full py-4 bg-stone-900 text-stone-50 text-sm tracking-widest uppercase
            hover:bg-stone-800 active:bg-stone-700 transition-colors duration-200
            disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {loading ? '확인 중...' : '확인'}
        </button>
      </div>
    </motion.div>
  );
}

// ── 에러 화면 ─────────────────────────────────────────────────
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
        보고서를 생성하지<br />못했습니다
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

// ── 메인 컴포넌트 ─────────────────────────────────────────────
function emptyAnswer() {
  return { selectedIds: [], otherText: '' };
}

export default function PrescriptionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { nickname } = useNickname();
  const { session } = useAuth();
  const { prescription } = useReportStatus();

  // location.state 우선, 없으면 localStorage 유형 결과 사용
  const fromType = location.state?.type ?? (() => {
    try {
      const saved = JSON.parse(localStorage.getItem('vizuden_type'));
      return saved?.code ?? null;
    } catch { return null; }
  })();

  const intendedPhase = 'questions';
  const storedCode = (() => { try { return sessionStorage.getItem('vizuden_access_code') || ''; } catch { return ''; } })();
  const [phase, setPhase] = useState(storedCode ? intendedPhase : 'code');
  const [accessCode, setAccessCode] = useState(storedCode);
  const [codeError, setCodeError] = useState('');
  const [stepIdx, setStepIdx] = useState(0);
  const [answers, setAnswers] = useState(Array(TOTAL).fill(null).map(emptyAnswer));
  const handleNextRef = useRef(null);
  const [textAnswers, setTextAnswers] = useState(Array(TOTAL).fill(''));
  const [fitPics, setFitPics] = useState([]);
  const [fitPicPreviews, setFitPicPreviews] = useState([]);
  const [direction, setDirection] = useState(1);
  const [apiDone, setApiDone] = useState(false);
  const pendingResultRef = useRef(null);

  useEffect(() => {
    if (location.pathname === '/prescription/questions' && prescription.done && prescription.reportId) {
      navigate(`/prescription/result/${prescription.reportId}`, { replace: true });
    }
  }, [prescription.done, prescription.reportId, location.pathname, navigate]);

  useEffect(() => {
    return () => {
      fitPicPreviews.forEach((preview) => {
        if (preview?.url) URL.revokeObjectURL(preview.url);
      });
    };
  }, [fitPicPreviews]);

  const visibleQuestions = QUESTIONS.filter((q) => shouldShowQuestion(q, answers));
  const totalSteps = visibleQuestions.length;
  const currentQ = visibleQuestions[stepIdx] ? resolveQuestion(visibleQuestions[stepIdx], answers) : null;
  const currentQuestionIndex = currentQ ? findQuestionIndex(currentQ.id) : -1;

  useEffect(() => {
    if (stepIdx <= 0) return;
    if (stepIdx >= visibleQuestions.length) {
      setStepIdx(Math.max(visibleQuestions.length - 1, 0));
    }
  }, [stepIdx, visibleQuestions.length]);

  async function handleCodeSubmit() {
    const trimmed = accessCode.trim();
    if (!trimmed) return;
    setCodeError('');
    try {
      try { sessionStorage.setItem('vizuden_access_code', trimmed); } catch {}
      setAccessCode(trimmed);
      setPhase(intendedPhase);
    } catch {
      setCodeError('확인에 실패했습니다. 다시 시도해주세요.');
    }
  }

  function handleToggle(id) {
    const q = currentQ;
    if (!q || currentQuestionIndex === -1) return;
    setAnswers((prev) => {
      const next = prev.map((a) => ({ ...a, selectedIds: [...a.selectedIds] }));
      const cur = next[currentQuestionIndex].selectedIds;
      if (q.type === 'radio') {
        next[currentQuestionIndex].selectedIds = cur.includes(id) ? [] : [id];
      } else {
        next[currentQuestionIndex].selectedIds = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
      }
      return next;
    });
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
    if (currentQuestionIndex === -1) return;
    const next = [...textAnswers];
    next[currentQuestionIndex] = val;
    setTextAnswers(next);
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

    const response = await fetch('/api/identity-fitpic-upload', {
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

    if (!response.ok) throw new Error('fitpic upload session creation failed');
    const payload = await response.json();
    if (!Array.isArray(payload?.uploads) || payload.uploads.length !== fitPics.length) {
      throw new Error('fitpic upload session payload is invalid');
    }

    const uploaded = [];
    for (let idx = 0; idx < payload.uploads.length; idx += 1) {
      const upload = payload.uploads[idx];
      const file = fitPics[idx];
      const putResponse = await fetch(upload.signedUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type || 'image/jpeg',
          'x-upsert': 'false',
        },
        body: file,
      });
      if (!putResponse.ok) throw new Error(`fitpic upload failed for ${file.name}`);

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
    if (q.type === 'text' || q.type === 'influencer') return textAnswers[currentQuestionIndex].trim().length > 0;
    if (q.type === 'fitpic') return fitPics.length > 0;
    return answers[currentQuestionIndex].selectedIds.length > 0;
  }

  function handleNext() {
    if (!canProceed()) return;
    window.scrollTo(0, 0);
    if (stepIdx < totalSteps - 1) {
      setDirection(1); setStepIdx(stepIdx + 1);
    } else {
      setPhase('loading');
      setApiDone(false);
      pendingResultRef.current = null;

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
        if (!shouldShowQuestion(q, answers)) return null;
        if (q.type === 'text') return { question: q.heading, answer: textAnswers[i] };
        if (q.type === 'fitpic') return { question: q.heading, answer: fitPics.length ? `사진 ${fitPics.length}장 첨부` : '' };
        const resolvedQ = resolveQuestion(q, answers);
        return { question: q.heading, selected: resolveLabels(resolvedQ, answers[i].selectedIds), other: answers[i].otherText };
      }).filter(Boolean);

      (async () => {
        try {
          const uploadedFitPics = await uploadFitPics();
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
              code: accessCode,
            }),
          });
          if (response.status === 403) { setPhase('code'); setCodeError('코드가 유효하지 않거나 이미 소진됐습니다.'); return; }
          const result = await response.json();
          const { report, reportId, title } = result;
          if (!report || !reportId) { setPhase('error'); return; }
          const tz = (() => {
            try { return Intl.DateTimeFormat().resolvedOptions().timeZone || null; } catch { return null; }
          })();
          const saveData = {
            fromType: fromType || null,
            report,
            reportId,
            title: title || null,
            preview: typeof report?.direction === 'string' ? report.direction : null,
            savedAt: Date.now(),
            timeZone: tz,
          };
          try {
            writePrescriptionSaved(saveData);
            const prevB = readPrescriptionHistory();
            writePrescriptionHistory([saveData, ...prevB]);
          } catch {}
          pendingResultRef.current = { fromType: fromType || null, report, reportId, title: title || null, navigateTo: `/prescription/result/${reportId}` };
          setApiDone(true);
        } catch {
          setPhase('error');
        }
      })();
    }
  }

  // 항상 최신 handleNext를 참조 — autoAdvance setTimeout 클로저 문제 방지
  handleNextRef.current = handleNext;

  function handleBack() {
    window.scrollTo(0, 0);
    if (stepIdx === 0) {
      navigate('/home');
    } else {
      setDirection(-1);
      setStepIdx(stepIdx - 1);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-6" style={{ backgroundColor: '#F5F2ED' }}>
      {phase === 'code' ? (
        <CodeGateScreen
          value={accessCode}
          onChange={setAccessCode}
          onSubmit={handleCodeSubmit}
          error={codeError}
          loading={false}
        />
      ) : (
      <div className="w-full max-w-sm flex flex-col" style={{ minHeight: '100svh' }}>
        <SiteHeader onLogoClick={() => navigate('/home')} />

        {phase === 'questions' && currentQ && (currentQ.type === 'checkbox' || currentQ.type === 'radio') && (
          <SelectQuestion
            question={currentQ}
            stepIdx={stepIdx}
            total={totalSteps}
            answer={answers[currentQuestionIndex] ?? emptyAnswer()}
            onToggle={handleToggle}
            onOtherChange={handleOtherText}
            onNext={handleNext}
            onBack={handleBack}
            direction={direction}
          />
        )}

        {phase === 'questions' && currentQ && currentQ.type === 'text' && (
          <TextQuestion
            question={currentQ}
            stepIdx={stepIdx}
            total={totalSteps}
            value={textAnswers[currentQuestionIndex] ?? ''}
            onChange={handleTextChange}
            onNext={handleNext}
            onBack={handleBack}
            direction={direction}
            isLast={stepIdx === totalSteps - 1}
          />
        )}

        {phase === 'questions' && currentQ && currentQ.type === 'fitpic' && (
          <FitPicQuestion
            question={currentQ}
            stepIdx={stepIdx}
            total={totalSteps}
            files={fitPics}
            previews={fitPicPreviews}
            onSelectFiles={handleFitPicSelect}
            onRemoveFile={handleFitPicRemove}
            onNext={handleNext}
            onBack={handleBack}
            direction={direction}
            isLast={stepIdx === totalSteps - 1}
          />
        )}

        {phase === 'loading' && (
          <LoadingScreen
            done={apiDone}
            onDone={() => {
              const result = pendingResultRef.current;
              if (result) navigate(result.navigateTo, { state: result });
            }}
          />
        )}

        {phase === 'error' && (
          <ErrorScreen onRetry={() => { setPhase('questions'); setStepIdx(totalSteps - 1); }} />
        )}

        <div className="text-center py-8 mt-auto">
          <p className="text-xs text-stone-400 tracking-widest uppercase">
            &copy; {new Date().getFullYear()} VIZUDEN
          </p>
        </div>
      </div>
      )}
    </div>
  );
}
