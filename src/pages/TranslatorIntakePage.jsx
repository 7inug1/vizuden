import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ImageUp } from 'lucide-react';
import SiteHeader from '../components/SiteHeader';
import { useAuth } from '../context/AuthContext';
import { useNickname } from '../context/NicknameContext';
import { useReportStatus } from '../hooks/useReportStatus';
import { ensureGuestSessionId } from '../lib/storage';
import { startStream } from '../lib/translatorReportStream';
import { NicknameModal } from './HubPage';
import {
  QUESTIONS, ORDER, CHAPTERS, COLOR_CHIPS, STYLE_TIPS, BRAND_LIST, OCCUPATION_TAX,
} from '../data/translatorIntakeQuestions';

// ── helpers ─────────────────────────────────────────────

function isVisible(q, answers) {
  if (!q.cond) return true;
  const v = answers[q.cond];
  return !!(Array.isArray(v) ? v.length > 0 : v && String(v).trim());
}

function hasAnswer(q, answers, fitPics) {
  if (q.type === 'fitpic') return fitPics.length > 0;
  if (q.type === 'bodysize') return !!(answers.height && answers.weight);
  const v = answers[q.id];
  if (q.type === 'occupation') return !!(v?.sub);
  if (Array.isArray(v)) return v.length > 0;
  return !!(v && String(v).trim());
}

function canProceed(q, answers, fitPics = []) {
  if (q.opt || q.type === 'fitpic') return true;
  if (q.type === 'occupation') return !!(answers[q.id]?.sub);
  if (q.type === 'bodysize') {
    return (answers.height || '').length >= 3 && (answers.weight || '').length >= 2;
  }
  if (q.type === 'number') {
    const v = answers[q.id] || '';
    if (q.id === 'height') return v.length >= 3;
    if (q.id === 'weight') return v.length >= 2;
    return v.length > 0;
  }
  if (q.type === 'birthdate') {
    return ((answers[q.id] || '').split('-')[0] || '').length === 4;
  }
  return hasAnswer(q, answers, fitPics);
}

function sanitizeFilename(name) {
  const base = name.toLowerCase().replace(/[^a-z0-9-_]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'fitpic';
  const ext = name.split('.').pop()?.toLowerCase() ?? 'jpg';
  return `${base}.${ext}`;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const slideVariants = {
  enter: (d) => ({ opacity: 0, x: d > 0 ? 24 : -24 }),
  center: { opacity: 1, x: 0 },
  exit: (d) => ({ opacity: 0, x: d > 0 ? -24 : 24 }),
};

// ── question type components ─────────────────────────────

function CheckboxQ({ q, value = [], otherValue = '', onChange, onOtherChange, onTip }) {
  const isColor = q.id === 'colorAffinity' || q.id === 'colorAvoid';
  const isStyle = q.id === 'styleAffinity';
  const max = q.max ?? Infinity;

  function toggle(opt) {
    if (value.includes(opt)) {
      onChange(value.filter((v) => v !== opt));
    } else if (value.length < max) {
      onChange([...value, opt]);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {(q.o || []).map((opt) => {
        const sel = value.includes(opt);
        const chips = isColor && COLOR_CHIPS[opt];
        const tip = isStyle && STYLE_TIPS[opt];
        return (
          <button
            key={opt}
            onClick={() => toggle(opt)}
            className={`flex items-center gap-3 w-full text-left px-4 py-3.5 rounded-xl border text-sm font-medium transition-colors
              ${sel ? 'border-stone-800 bg-[#f6efe6]' : 'border-stone-200 bg-white hover:border-stone-300'}`}
          >
            <span className={`w-5 h-5 rounded-md border-[1.5px] flex-shrink-0 grid place-items-center transition-colors
              ${sel ? 'bg-stone-900 border-stone-900' : 'border-stone-300'}`}>
              {sel && (
                <svg viewBox="0 0 12 12" className="w-3 h-3 fill-none stroke-white stroke-2">
                  <polyline points="2,6 5,9 10,3" />
                </svg>
              )}
            </span>
            <span className="flex-1 leading-snug">{opt}</span>
            {tip && (
              <span
                role="button"
                onClick={(e) => { e.stopPropagation(); onTip?.(opt); }}
                className="text-stone-400 hover:text-stone-700 text-[15px] ml-1 flex-shrink-0 transition-colors"
              >ⓘ</span>
            )}
            {chips && (
              <span className="flex gap-1 ml-auto flex-shrink-0">
                {chips.map((c) => (
                  <span key={c} className="w-3.5 h-3.5 rounded-sm border border-black/10 flex-shrink-0" style={{ background: c }} />
                ))}
              </span>
            )}
          </button>
        );
      })}
      {value.includes('기타') && (
        <input
          className="mt-1 w-full border border-stone-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-stone-400"
          placeholder="직접 입력해주세요"
          value={otherValue}
          onChange={(e) => onOtherChange(e.target.value)}
        />
      )}
    </div>
  );
}

function RadioQ({ q, value, onChange }) {
  return (
    <div className="flex flex-col gap-2">
      {(q.o || []).map((opt) => {
        const sel = value === opt;
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`flex items-center gap-3 w-full text-left px-4 py-3.5 rounded-xl border text-sm font-medium transition-colors
              ${sel ? 'border-stone-800 bg-[#f6efe6]' : 'border-stone-200 bg-white hover:border-stone-300'}`}
          >
            <span className={`w-5 h-5 rounded-full border-[1.5px] flex-shrink-0 grid place-items-center transition-colors
              ${sel ? 'bg-stone-900 border-stone-900' : 'border-stone-300'}`}>
              {sel && <span className="w-2 h-2 rounded-full bg-white" />}
            </span>
            <span className="flex-1 leading-snug">{opt}</span>
          </button>
        );
      })}
    </div>
  );
}

function NumberQ({ q, value, onChange }) {
  const ml = q.id === 'height' ? 3 : q.id === 'weight' ? 3 : 4;
  const ph = q.unit === 'cm' ? '예) 175' : '예) 70';
  return (
    <div className="flex items-center gap-3">
      <input
        type="text" inputMode="numeric" maxLength={ml}
        value={value || ''}
        onChange={(e) => { const n = e.target.value.replace(/[^0-9]/g, '').slice(0, ml); onChange(n); }}
        placeholder={ph}
        className="w-28 border border-stone-200 rounded-xl px-4 py-3.5 text-base bg-white focus:outline-none focus:border-stone-400"
      />
      <span className="text-sm text-stone-400">{q.unit}</span>
    </div>
  );
}

// 키·몸무게 통합 — 데이터는 기존 height/weight 키에 그대로 저장
function BodySizeQ({ answers, onChange }) {
  const box = "w-24 border border-stone-200 rounded-xl px-4 py-3.5 text-base bg-white focus:outline-none focus:border-stone-400";
  return (
    <div className="flex items-center gap-4 flex-wrap">
      <div className="flex items-center gap-3">
        <input type="text" inputMode="numeric" maxLength={3} value={answers.height || ''}
          onChange={(e) => onChange('height', e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
          placeholder="예) 175" className={box} />
        <span className="text-sm text-stone-400">cm</span>
      </div>
      <div className="flex items-center gap-3">
        <input type="text" inputMode="numeric" maxLength={3} value={answers.weight || ''}
          onChange={(e) => onChange('weight', e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
          placeholder="예) 70" className={box} />
        <span className="text-sm text-stone-400">kg</span>
      </div>
    </div>
  );
}

function TextQ({ q, value, onChange }) {
  return (
    <input
      type="text" value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={q.ph || '자유롭게 입력해주세요'}
      className="w-full border border-stone-200 rounded-xl px-4 py-3.5 text-sm bg-white focus:outline-none focus:border-stone-400"
    />
  );
}

function TextareaQ({ q, value, onChange }) {
  function toggleChip(chip) {
    const cur = value || '';
    if (cur.includes(chip)) {
      onChange(cur.replace(chip, '').replace(/\s*\/\s*\/\s*/g, ' / ').replace(/^\s*\/\s*|\s*\/\s*$/g, '').trim());
    } else {
      onChange(cur ? `${cur.trimEnd()} / ${chip}` : chip);
    }
  }

  return (
    <div>
      {q.nudge && (
        <div className="inline-flex items-center gap-1.5 bg-[#f6efe6] border border-[#9A7259] rounded-full px-3 py-1 text-xs font-semibold text-[#9A7259] mb-3">
          ✦ {q.nudge}
        </div>
      )}
      {q.note && <p className="text-xs text-stone-400 mb-3 leading-relaxed">{q.note}</p>}
      <textarea
        rows={4} value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={q.ph || '자유롭게 작성해주세요'}
        className="w-full border border-stone-200 rounded-xl px-4 py-3.5 text-sm bg-white resize-none focus:outline-none focus:border-stone-400"
      />
      {q.o?.length > 0 && (
        <div className="mt-3">
          <p className="text-xs text-stone-400 font-semibold mb-2">해당되는 것 클릭해서 추가</p>
          <div className="flex flex-wrap gap-1.5">
            {q.o.map((chip) => {
              const sel = (value || '').includes(chip);
              return (
                <button key={chip} onClick={() => toggleChip(chip)}
                  className={`px-3 py-1.5 rounded-full border text-xs transition-colors
                    ${sel ? 'bg-stone-900 text-white border-stone-900' : 'border-stone-200 bg-white text-stone-700 hover:border-stone-400'}`}>
                  {chip}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function BirthdateQ({ value, onChange }) {
  const parts = (value || '').split('-');
  const yr = parts[0] || '', mo = parts[1] || '', dy = parts[2] || '';

  function update(y, m, d) {
    const nY = y !== null ? y : yr;
    const nM = m !== null ? m : mo;
    const nD = d !== null ? d : dy;
    onChange([nY, nM, nD].filter(Boolean).join('-'));
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-semibold text-transparent select-none">선택</span>
        <input type="text" inputMode="numeric" maxLength={4} placeholder="1993" value={yr}
          onChange={(e) => { const n = e.target.value.replace(/[^0-9]/g, '').slice(0, 4); update(n, null, null); }}
          className="w-24 border border-stone-200 rounded-xl px-4 py-3.5 text-base bg-white focus:outline-none focus:border-stone-400" />
      </div>
      <span className="text-sm text-stone-400">년</span>
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-semibold text-stone-300 tracking-wide text-center">선택</span>
        <input type="text" inputMode="numeric" maxLength={2} placeholder="6" value={mo}
          onChange={(e) => { const n = e.target.value.replace(/[^0-9]/g, '').slice(0, 2); update(null, n, null); }}
          className="w-16 border border-stone-200 rounded-xl px-4 py-3.5 text-base bg-white focus:outline-none focus:border-stone-400" />
      </div>
      <span className="text-sm text-stone-400">월</span>
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-semibold text-stone-300 tracking-wide text-center">선택</span>
        <input type="text" inputMode="numeric" maxLength={2} placeholder="15" value={dy}
          onChange={(e) => { const n = e.target.value.replace(/[^0-9]/g, '').slice(0, 2); update(null, null, n); }}
          className="w-16 border border-stone-200 rounded-xl px-4 py-3.5 text-base bg-white focus:outline-none focus:border-stone-400" />
      </div>
      <span className="text-sm text-stone-400">일</span>
    </div>
  );
}

function RefInputQ({ q, value, onChange }) {
  const parts = (value || '').split(',').map((s) => s.trim()).filter(Boolean);
  const allChips = q.o || [];
  const PAGE = 12;
  const [page, setPage] = useState(1);
  const shown = q.paginated ? allChips.slice(0, PAGE * page) : allChips;
  const remaining = q.paginated ? allChips.length - shown.length : 0;

  function togChip(name) {
    if (parts.includes(name)) {
      onChange(parts.filter((p) => p !== name).join(', '));
    } else {
      onChange([...parts, name].join(', '));
    }
  }

  return (
    <div>
      <textarea
        rows={2} value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={q.ph || '직접 입력해주세요'}
        className="w-full border border-stone-200 rounded-xl px-4 py-3.5 text-sm bg-white resize-none focus:outline-none focus:border-stone-400 mb-3"
      />
      <p className="text-xs text-stone-400 font-semibold mb-2">잘 안 떠오르면 클릭해서 채우기</p>
      <div className="flex flex-wrap gap-1.5">
        {shown.map((o) => {
          const name = o.split(' — ')[0];
          const sel = parts.includes(name);
          return (
            <button key={o} onClick={() => togChip(name)}
              className={`px-3 py-1.5 rounded-full border text-xs transition-colors
                ${sel ? 'bg-stone-900 text-white border-stone-900' : 'border-stone-200 bg-white text-stone-700 hover:border-stone-400'}`}>
              {o}
            </button>
          );
        })}
      </div>
      {remaining > 0 && (
        <button onClick={() => setPage(p => p + 1)}
          className="mt-2 px-4 py-1.5 rounded-full border border-stone-200 text-xs text-stone-500 hover:border-stone-400 transition-colors">
          더 보기 +{Math.min(PAGE, remaining)}
        </button>
      )}
    </div>
  );
}

function OccupationQ({ value, onChange }) {
  const selected = value || { cat: null, sub: null };

  return (
    <div className="flex flex-col gap-1">
      {OCCUPATION_TAX.map((cat) => {
        const isOpen = selected.cat === cat.id;
        return (
          <div key={cat.id}>
            <button
              onClick={() => onChange({ cat: isOpen ? null : cat.id, sub: null })}
              className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors
                ${isOpen ? 'border-stone-800 bg-stone-900 text-white' : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300'}`}>
              {cat.label}
            </button>
            {isOpen && (
              <div className="flex flex-col gap-1 mt-1 ml-3 mb-1">
                {cat.sub.map((sub) => (
                  <button key={sub}
                    onClick={() => onChange({ cat: cat.id, sub })}
                    className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition-colors
                      ${selected.sub === sub ? 'border-stone-600 bg-stone-800 text-white' : 'border-stone-200 bg-stone-50 text-stone-600 hover:border-stone-300'}`}>
                    {sub}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function FitPicQ({ previews, onSelect, onRemove }) {
  const [isDragging, setIsDragging] = useState(false);
  const maxFiles = 3;
  const isFull = previews.length >= maxFiles;

  function handleFiles(files) {
    const images = Array.from(files).filter((f) => f.type?.startsWith('image/'));
    onSelect(images, maxFiles);
  }

  return (
    <div>
      {!isFull && (
        <label
          onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); if (!e.currentTarget.contains(e.relatedTarget)) setIsDragging(false); }}
          onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
          className={`block w-full border border-dashed rounded-xl px-4 py-7 text-center cursor-pointer transition-colors
            ${isDragging ? 'border-stone-500 bg-stone-50' : 'border-stone-200 hover:border-stone-300'}`}
        >
          <input type="file" accept="image/*" multiple className="hidden"
            onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }} />
          <ImageUp className="w-5 h-5 text-stone-400 mx-auto mb-2" />
          <p className="text-sm text-stone-600">{isDragging ? '여기에 놓아주세요' : '클릭하거나 끌어다 놓으세요'}</p>
          <p className="text-xs text-stone-400 mt-1">최대 {maxFiles}장</p>
        </label>
      )}
      {previews.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {previews.map((p, i) => (
            <div key={p.id} className="border border-stone-200 rounded-lg p-1.5">
              <div className="w-full h-20 bg-stone-50 rounded overflow-hidden flex items-center justify-center">
                <img src={p.url} alt={p.name} className="w-full h-full object-contain" />
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] text-stone-300">{formatBytes(p.size)}</span>
                <button onClick={() => onRemove(i)} className="text-[10px] text-stone-400 hover:text-stone-700 transition-colors">삭제</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function QuestionInput({ q, answers, otherAnswers, fitPics, fitPicPreviews, chipPages, onChange, onOther, onMoreChips, onTip, onFitPicSelect, onFitPicRemove }) {
  const v = answers[q.id];
  const ov = otherAnswers[q.id] || '';

  switch (q.type) {
    case 'checkbox':
      return <CheckboxQ q={q} value={v || []} otherValue={ov} onChange={(val) => onChange(q.id, val)} onOtherChange={(val) => onOther(q.id, val)} onTip={onTip} />;
    case 'radio':
      return <RadioQ q={q} value={v || ''} onChange={(val) => onChange(q.id, val)} />;
    case 'number':
      return <NumberQ q={q} value={v || ''} onChange={(val) => onChange(q.id, val)} />;
    case 'bodysize':
      return <BodySizeQ answers={answers} onChange={onChange} />;
    case 'text':
      return <TextQ q={q} value={v || ''} onChange={(val) => onChange(q.id, val)} />;
    case 'textarea':
      return <TextareaQ q={q} value={v || ''} onChange={(val) => onChange(q.id, val)} />;
    case 'birthdate':
      return <BirthdateQ value={v || ''} onChange={(val) => onChange(q.id, val)} />;
    case 'refInput':
      return <RefInputQ q={q} value={v || ''} onChange={(val) => onChange(q.id, val)} />;
    case 'occupation':
      return <OccupationQ value={v} onChange={(val) => onChange(q.id, val)} />;
    case 'fitpic':
      return <FitPicQ previews={fitPicPreviews} onSelect={onFitPicSelect} onRemove={onFitPicRemove} />;
    default:
      return null;
  }
}

// ── style tip modal ──────────────────────────────────────

function StyleTipModal({ tipKey, onClose }) {
  if (!tipKey) return null;
  const tip = STYLE_TIPS[tipKey];
  if (!tip) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/45" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-base">{tipKey}</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-stone-100 grid place-items-center text-stone-500 text-sm">✕</button>
        </div>
        <div className="w-full aspect-[4/3] rounded-xl bg-stone-100 flex items-center justify-center mb-4">
          {tip.img
            ? <img src={tip.img} alt={tipKey} className="w-full h-full object-cover rounded-xl" />
            : <p className="text-xs text-stone-400">이미지 준비 중</p>}
        </div>
        <p className="text-sm text-stone-600 leading-relaxed mb-3">{tip.desc}</p>
        <p className="text-xs text-stone-400 border-t border-stone-100 pt-3">예) {tip.eg}</p>
      </div>
    </div>
  );
}

// ── chapter nav ──────────────────────────────────────────

function ChapterNav({ answers, fitPics, curChapter, onJump }) {
  return (
    <div className="flex gap-1.5 mb-2" style={{ overflow: 'hidden' }}>
      {ORDER.map((ch) => {
        const qs = QUESTIONS.filter((q) => q.ch === ch);
        const answered = qs.filter((q) => hasAnswer(q, answers, fitPics)).length;
        const total = qs.length;
        const pct = total ? (answered / total) * 100 : 0;
        const done = answered === total && total > 0;
        const isActive = curChapter === ch;

        const labelCls = isActive
          ? 'text-stone-900'
          : done ? 'text-[#9A7259]'
          : answered > 0 ? 'text-stone-500'
          : 'text-stone-300';

        const fillCls = isActive ? 'bg-stone-800' : 'bg-[#9A7259]';

        return (
          <button key={ch} onClick={() => onJump(ch)}
            className="flex-1 min-w-0 text-left">
            <p className={`text-[10px] font-bold text-center mb-1 truncate transition-colors ${labelCls}`}>{CHAPTERS[ch]}</p>
            <div className="h-[3px] bg-stone-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-300 ${fillCls}`} style={{ width: `${pct}%` }} />
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ── step mode ────────────────────────────────────────────

function StepView({ visibleQs, curIdx, direction, answers, otherAnswers, fitPics, fitPicPreviews, chipPages, onAnswer, onOther, onMoreChips, onTip, onFitPicSelect, onFitPicRemove, onPrev, onNext, submitting }) {
  const q = visibleQs[curIdx];
  if (!q) return null;
  const isFirst = curIdx === 0;
  const isLast = curIdx === visibleQs.length - 1;
  const ok = canProceed(q, answers, fitPics);

  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={q.id} custom={direction} variants={slideVariants}
        initial="enter" animate="center" exit="exit"
        transition={{ duration: 0.2, ease: 'easeInOut' }}
      >
        <p className="text-[11px] tracking-[0.14em] uppercase text-[#9A7259] font-semibold mb-2">{CHAPTERS[q.ch]}</p>
        <h2 className="text-xl font-bold text-stone-900 leading-snug mb-1" style={{ letterSpacing: '-0.015em' }}>
          {q.h}
          {q.opt && <span className="ml-2 text-[10px] font-semibold bg-stone-100 text-stone-400 rounded px-1.5 py-0.5 align-middle">선택</span>}
        </h2>
        {q.note && q.type !== 'textarea' && (
          <p className="text-xs text-stone-400 mb-4 leading-relaxed">{q.note}</p>
        )}
        <div className="mt-5 mb-8">
          <QuestionInput
            q={q} answers={answers} otherAnswers={otherAnswers}
            fitPics={fitPics} fitPicPreviews={fitPicPreviews}
            chipPages={chipPages}
            onChange={onAnswer} onOther={onOther} onMoreChips={onMoreChips}
            onTip={onTip} onFitPicSelect={onFitPicSelect} onFitPicRemove={onFitPicRemove}
          />
        </div>
        <div className="flex gap-3">
          <button onClick={onPrev} disabled={isFirst || submitting}
            className="flex-1 py-3.5 rounded-xl border border-stone-200 text-sm font-semibold text-stone-500 disabled:opacity-30 transition-colors hover:border-stone-300">
            이전
          </button>
          <button onClick={onNext} disabled={!ok || submitting}
            className="flex-[2] py-3.5 rounded-xl bg-stone-900 text-white text-sm font-semibold disabled:opacity-30 transition-colors hover:bg-stone-800 flex items-center justify-center gap-2">
            {isLast && submitting && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
            {isLast ? (submitting ? '번역서 만드는 중…' : '번역서 만들기') : '다음'}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── overview mode ────────────────────────────────────────

function OverviewView({ visibleQs, answers, otherAnswers, fitPics, fitPicPreviews, chipPages, openChapters, onAnswer, onOther, onMoreChips, onTip, onFitPicSelect, onFitPicRemove, onToggleChapter, onSubmit, submitting }) {
  const allDone = visibleQs.every((q) => canProceed(q, answers, fitPics));

  return (
    <div>
      {ORDER.map((ch) => {
        const qs = visibleQs.filter((q) => q.ch === ch);
        if (qs.length === 0) return null;
        const answered = qs.filter((q) => hasAnswer(q, answers, fitPics)).length;
        const isOpen = !!openChapters[ch];

        return (
          <div key={ch} className="border border-stone-200 rounded-xl mb-3 overflow-hidden bg-white">
            <button
              onClick={() => onToggleChapter(ch)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-stone-50 transition-colors"
            >
              <span className="font-bold text-sm text-stone-900">{CHAPTERS[ch]}</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-[#9A7259] font-semibold">{answered}/{qs.length}</span>
                <svg className={`w-4 h-4 text-stone-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
            {isOpen && (
              <div className="border-t border-stone-100 px-5 pb-5">
                {qs.map((q, qi) => (
                  <div key={q.id} className={`py-5 ${qi > 0 ? 'border-t border-stone-100' : ''}`}>
                    <p className="text-sm font-semibold text-stone-800 mb-1 leading-snug">
                      {q.h}
                      {q.opt && <span className="ml-2 text-[10px] font-semibold bg-stone-100 text-stone-400 rounded px-1.5 py-0.5 align-middle">선택</span>}
                    </p>
                    {q.note && q.type !== 'textarea' && <p className="text-xs text-stone-400 mb-3 leading-relaxed">{q.note}</p>}
                    <div className="mt-3">
                      <QuestionInput
                        q={q} answers={answers} otherAnswers={otherAnswers}
                        fitPics={fitPics} fitPicPreviews={fitPicPreviews}
                        chipPages={chipPages}
                        onChange={onAnswer} onOther={onOther} onMoreChips={onMoreChips}
                        onTip={onTip} onFitPicSelect={onFitPicSelect} onFitPicRemove={onFitPicRemove}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
      <button
        onClick={onSubmit} disabled={!allDone || submitting}
        className="w-full mt-4 py-4 rounded-xl bg-stone-900 text-white text-sm font-semibold disabled:opacity-30 transition-colors hover:bg-stone-800 flex items-center justify-center gap-2"
      >
        {submitting && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
        {submitting ? '번역서 만드는 중…' : '번역서 만들기'}
      </button>
    </div>
  );
}

// ── gate / status screens ─────────────────────────────────

function CodeGate({ value, onChange, onSubmit, error, loading }) {
  return (
    <div className="max-w-sm mx-auto py-16 text-center">
      <p className="text-xs tracking-[0.28em] text-stone-400 uppercase mb-8">스타일 번역서</p>
      <h1 className="text-2xl font-light text-stone-900 leading-tight mb-2" style={{ fontFamily: 'Georgia, serif' }}>
        설문을 시작합니다
      </h1>
      <p className="text-sm text-stone-500 mb-10 leading-relaxed">발급받은 코드를 입력해주세요.</p>
      <input
        type="text" value={value} onChange={(e) => onChange(e.target.value.toUpperCase())}
        placeholder="VIZUDEN-XXXX"
        className="w-full border border-stone-200 rounded-xl px-4 py-3.5 text-center text-sm tracking-widest mb-2 focus:outline-none focus:border-stone-400"
        onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
      />
      {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
      <button onClick={onSubmit} disabled={loading || !value.trim()}
        className="w-full py-4 bg-stone-900 text-white text-sm tracking-widest font-semibold rounded-xl disabled:opacity-30 transition-colors hover:bg-stone-800 mt-2">
        {loading ? '확인 중…' : '시작하기'}
      </button>
    </div>
  );
}

function PrescriptionGate({ onGo }) {
  return (
    <div className="max-w-sm mx-auto py-16 text-center">
      <p className="text-xs tracking-[0.28em] text-stone-400 uppercase mb-8">스타일 번역서</p>
      <h1 className="text-2xl font-light text-stone-900 mb-3" style={{ fontFamily: 'Georgia, serif' }}>
        처방전이 필요합니다
      </h1>
      <p className="text-sm text-stone-500 mb-10 leading-relaxed">
        스타일 번역서 설문은 처방전 완료 후 이용할 수 있어요.
      </p>
      <button onClick={onGo}
        className="w-full py-4 bg-stone-900 text-white text-sm tracking-widest font-semibold rounded-xl transition-colors hover:bg-stone-800">
        처방전 받으러 가기
      </button>
    </div>
  );
}

function DoneScreen({ intakeId, reportStatus }) {
  const navigate = useNavigate();
  const generating = reportStatus === 'generating';
  const ready = reportStatus === 'ready';
  const failed = reportStatus === 'failed';

  return (
    <div className="max-w-sm mx-auto py-16 text-center">
      <p className="text-4xl mb-6">✓</p>
      <h1 className="text-2xl font-light text-stone-900 mb-3" style={{ fontFamily: 'Georgia, serif' }}>
        설문이 완료됐습니다
      </h1>

      {generating && (
        <p className="text-sm text-stone-500 mb-10 leading-relaxed">
          스타일 번역서를 생성하고 있어요…<br />잠시만 기다려주세요.
        </p>
      )}
      {ready && intakeId && (
        <>
          <p className="text-sm text-stone-500 mb-6 leading-relaxed">
            스타일 번역서가 준비됐어요.
          </p>
          <a
            href={`/translator/report/${intakeId}`}
            className="block w-full py-4 bg-stone-900 text-white text-sm tracking-widest font-semibold rounded-xl transition-colors hover:bg-stone-800 mb-3 text-center no-underline"
          >
            스타일 번역서 보기 →
          </a>
        </>
      )}
      {failed && (
        <p className="text-sm text-red-400 mb-6 leading-relaxed">
          번역서 생성 중 오류가 발생했어요. 나중에 다시 시도해주세요.
        </p>
      )}

      <button onClick={() => navigate('/')}
        className="w-full py-4 border border-stone-300 text-stone-600 text-sm tracking-widest rounded-xl transition-colors hover:border-stone-500">
        홈으로
      </button>
    </div>
  );
}

// ── main page ─────────────────────────────────────────────

const DEV_ANSWERS = {
  impression: ['나다운 스타일이 있어 보이고 싶다', '꾸민 것 없이 자연스러워 보이고 싶다'],
  reference: '유태오, 봉태규',
  refPoint: '군더더기 없는 핏과 차분한 분위기. 화려하지 않은데 기억에 남는 스타일이 끌려요.',
  fashionLevel: '자주 찾아보는 편 — 인스타·유튜브·커뮤니티 즐겨 봄',
  dressCode: '스마트 캐주얼 — 자유롭되 어느 정도 격식',
  tpo: ['일상 외출·약속', '데이트·소개팅', '출근·업무'],
  occupation: { cat: 'it', sub: '프론트엔드' },
  blockers: ['어떻게 매칭해야 할지 모르겠다', '사놓고 안 입는 옷이 쌓인다'],
  wardrobeGap: ['아우터 — 코트·재킷·점퍼', '신발'],
  styleAffinity: ['미니멀·클린', '클래식·포멀'],
  styleAvoid: ['그래픽·로고가 강한 스타일', '컬러·패턴이 화려한 스타일'],
  colorAffinity: ['블랙·화이트·그레이', '베이지·브라운·카멜'],
  colorAvoid: ['라벤더·민트·핑크 (파스텔)'],
  skinTone: '가을 웜톤 — 까무잡잡하거나 구릿빛인 편',
  brandDetail: '르메르, COS, 유니클로',
  height: '178',
  weight: '72',
  bodyType: '표준형 — 특별한 특징 없이 균형 잡힌 편',
  bodyConcern: ['복부가 나온 편이다'],
  birthYear: '1992-03-15',
  changeLevel: '지금 방향 유지하면서 더 잘 입고 싶다',
  signatureKeep: '블랙 계열 기본 아이템',
  budget: '30~50만원',
  finalNote: '출근할 때도 주말에도 무난하게 활용할 수 있는 방향으로 부탁드려요.',
};

export default function TranslatorIntakePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isDev = searchParams.get('dev') === '1';
  const { session } = useAuth();
  const { nickname, setNickname } = useNickname();
  const { prescription, loading: statusLoading } = useReportStatus();
  const guestSessionId = ensureGuestSessionId();

  // gate
  const urlCode = searchParams.get('code') || '';
  const storedCode = (() => { try { return sessionStorage.getItem('vizuden_translator_access_code') || ''; } catch { return ''; } })();
  const initialCode = urlCode || storedCode;
  if (urlCode) { try { sessionStorage.setItem('vizuden_translator_access_code', urlCode); } catch {} }
  const [phase, setPhase] = useState(initialCode ? 'check' : 'code');
  const [accessCode, setAccessCode] = useState(initialCode);
  const [codeError, setCodeError] = useState('');
  const [codeLoading, setCodeLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // survey — localStorage 복원 (dev 모드 제외)
  const DRAFT_KEY = 'vizuden_translator_draft';
  const savedDraft = !isDev && (() => { try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null'); } catch { return null; } })();

  const [answers, setAnswers] = useState(isDev ? DEV_ANSWERS : (savedDraft?.answers ?? {}));
  const [otherAnswers, setOtherAnswers] = useState(savedDraft?.otherAnswers ?? {});
  const [mode, setMode] = useState('step');
  const [curIdx, setCurIdx] = useState(0);
  const [direction, setDirection] = useState(1);
  const [chipPages, setChipPages] = useState({});
  const [activeTip, setActiveTip] = useState(null);
  const [openChapters, setOpenChapters] = useState({});

  // fitpic
  const [fitPics, setFitPics] = useState([]);
  const [fitPicPreviews, setFitPicPreviews] = useState([]);

  useEffect(() => {
    return () => { fitPicPreviews.forEach((p) => { if (p?.url) URL.revokeObjectURL(p.url); }); };
  }, [fitPicPreviews]);

  // 답변 자동 저장 (dev 모드 제외)
  useEffect(() => {
    if (isDev) return;
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ answers, otherAnswers })); } catch {}
  }, [answers, otherAnswers, isDev]);

  /* 입구에서 코드를 묻지 않는다.
   *
   *  코드를 가진 사람만 들어올 수 있으면 방문자는 결과물을 볼 수 없다.
   *  누구나 설문을 시작하고, 하루 한도를 넘겼을 때 제출 단계에서만 코드를 받는다
   *  (서버가 429 를 돌려준다). 코드를 이미 들고 온 경우는 그대로 통과시킨다. */
  useEffect(() => {
    if (statusLoading || phase !== 'check') return;
    setPhase('questions');
  }, [statusLoading, phase]);

  const visibleQs = QUESTIONS.filter((q) => isVisible(q, answers));
  const curQ = visibleQs[curIdx] || visibleQs[0];
  const answeredCount = QUESTIONS.filter((q) => hasAnswer(q, answers, fitPics)).length;

  // ── handlers ──

  function setAnswer(id, val) {
    setAnswers((prev) => ({ ...prev, [id]: val }));
    // if a cond-source changes, re-check curIdx validity
  }

  function setOtherAnswer(id, val) {
    setOtherAnswers((prev) => ({ ...prev, [id]: val }));
  }

  function moreChips(id) {
    setChipPages((prev) => ({ ...prev, [id]: (prev[id] || 1) + 1 }));
  }

  function fitPicSelect(files, maxFiles) {
    const allowed = Math.max(0, maxFiles - fitPics.length);
    const next = files.slice(0, allowed);
    if (!next.length) return;
    setFitPics((prev) => [...prev, ...next]);
    setFitPicPreviews((prev) => [
      ...prev,
      ...next.map((f) => ({ id: `${f.name}-${f.size}-${Math.random()}`, name: f.name, size: f.size, url: URL.createObjectURL(f) })),
    ]);
  }

  function fitPicRemove(idx) {
    setFitPics((prev) => prev.filter((_, i) => i !== idx));
    setFitPicPreviews((prev) => {
      const target = prev[idx];
      if (target?.url) URL.revokeObjectURL(target.url);
      return prev.filter((_, i) => i !== idx);
    });
  }

  function handlePrev() {
    if (curIdx > 0) { setDirection(-1); setCurIdx(curIdx - 1); window.scrollTo(0, 0); }
  }

  function handleNext() {
    if (!canProceed(curQ, answers, fitPics)) return;
    if (curIdx < visibleQs.length - 1) {
      setDirection(1); setCurIdx(curIdx + 1); window.scrollTo(0, 0);
    } else {
      handleSubmit();
    }
  }

  function jumpToChapter(ch) {
    const idx = visibleQs.findIndex((q) => q.ch === ch);
    if (idx !== -1) { setDirection(1); setCurIdx(idx); window.scrollTo(0, 0); }
    if (mode === 'over') {
      setOpenChapters((prev) => ({ ...prev, [ch]: true }));
    }
  }

  function switchMode(m) {
    setMode(m);
    if (m === 'over') {
      // open all chapters
      const all = {};
      ORDER.forEach((ch) => { all[ch] = true; });
      setOpenChapters(all);
    }
    window.scrollTo(0, 0);
  }

  function toggleChapter(ch) {
    setOpenChapters((prev) => ({ ...prev, [ch]: !prev[ch] }));
  }

  async function validateCode() {
    if (isDev) { setPhase('questions'); return; }
    const trimmed = accessCode.trim();
    if (!trimmed) { setCodeError('코드를 입력해주세요.'); return; }
    setCodeLoading(true);
    try {
      const res = await fetch('/api/translator-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: trimmed }),
      });
      const { valid } = await res.json().catch(() => ({ valid: false }));
      if (!valid) { setCodeError('유효하지 않은 코드예요.'); return; }
      try { sessionStorage.setItem('vizuden_translator_access_code', trimmed); } catch {}
      // 한도에 막혀 여기 왔다면 답변이 이미 다 차 있다 — 설문으로 되돌리지 않고
      // 그대로 제출을 잇는다.
      setPhase('questions');
    } catch {
      setCodeError('코드 확인 중 오류가 발생했어요.');
    } finally {
      setCodeLoading(false);
    }
  }

  async function handleSubmit() {
    if (submitting) return;
    setSubmitting(true);
    try {
      const uploadedFitPics = await uploadFitPics();
      const formattedAnswers = QUESTIONS.map((q) => {
        if (!isVisible(q, answers)) return null;
        const v = answers[q.id];
        if (q.type === 'fitpic') return { id: q.id, question: q.h, answer: fitPics.length ? `사진 ${fitPics.length}장` : '' };
        if (q.type === 'bodysize') return { id: q.id, question: q.h, answer: `키 ${answers.height || '-'}cm, 몸무게 ${answers.weight || '-'}kg` };
        if (q.type === 'checkbox') return { id: q.id, question: q.h, selected: v || [], other: otherAnswers[q.id] || '' };
        if (q.type === 'occupation') return { id: q.id, question: q.h, answer: v?.sub || '', other: v?.cat || '' };
        return { id: q.id, question: q.h, answer: typeof v === 'string' ? v : (v || '') };
      }).filter(Boolean);

      const res = await fetch('/api/translator-intake', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-guest-session-id': guestSessionId,
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          answers: formattedAnswers,
          fitPics: uploadedFitPics,
          code: isDev ? 'DEV' : accessCode.trim(),
          prescriptionReportId: isDev ? null : (prescription.reportId || null),
          devMode: isDev,
        }),
      });

      // 하루 한도를 넘겼다 — 이때만 코드를 받는다. 답변은 그대로 남아 있어
      // 코드를 넣으면 이어서 제출된다.
      if (res.status === 429) {
        const payload = await res.json().catch(() => ({}));
        setSubmitting(false);
        setPhase('code');
        setCodeError(
          `오늘 무료 체험 ${payload?.limit ?? 3}회를 다 쓰셨어요. 베타 코드가 있으면 입력해 주세요.`
        );
        return;
      }
      if (res.status === 403) {
        const payload = await res.json().catch(() => ({}));
        setSubmitting(false);
        if (payload?.error === 'prescription_required') { setPhase('prescription_gate'); return; }
        setPhase('code'); setCodeError('코드가 유효하지 않거나 이미 소진됐습니다.'); return;
      }
      if (!res.ok) throw new Error('submit failed');
      const { id } = await res.json();
      try { localStorage.removeItem(DRAFT_KEY); } catch {}
      // navigate 전에 스트림을 미리 시작 → 리포트 페이지에서 GET 왕복/공백 없이 바로 렌더
      startStream(id, session, guestSessionId, nickname);
      navigate(`/translator/report/${id}`);
    } catch {
      setSubmitting(false);
      setPhase('error');
    }
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
        files: fitPics.map((f) => ({ name: sanitizeFilename(f.name), contentType: f.type || 'image/jpeg' })),
      }),
    });
    if (!res.ok) throw new Error('fitpic upload init failed');
    const payload = await res.json();
    if (!Array.isArray(payload?.uploads) || payload.uploads.length !== fitPics.length) throw new Error('invalid upload payload');
    const uploaded = [];
    for (let i = 0; i < payload.uploads.length; i++) {
      const upload = payload.uploads[i];
      const file = fitPics[i];
      const put = await fetch(upload.signedUrl, { method: 'PUT', headers: { 'Content-Type': file.type || 'image/jpeg', 'x-upsert': 'false' }, body: file });
      if (!put.ok) throw new Error(`fitpic upload failed: ${file.name}`);
      uploaded.push({ bucket: upload.bucket, path: upload.path, name: file.name, contentType: file.type || 'image/jpeg', size: file.size });
    }
    return uploaded;
  }

  // ── render ──

  if (statusLoading || phase === 'check') {
    return (
      <div className="min-h-screen bg-[#F5F2ED]">
        <SiteHeader />
        <div className="flex items-center justify-center py-24">
          <div className="w-6 h-6 border-2 border-stone-200 border-t-stone-800 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (phase === 'code') {
    return (
      <div className="min-h-screen bg-[#F5F2ED]">
        <SiteHeader />
        <div className="max-w-lg mx-auto px-5">
          <CodeGate
            value={accessCode}
            onChange={setAccessCode}
            onSubmit={() => {
              if (!accessCode.trim()) return;
              try { sessionStorage.setItem('vizuden_translator_access_code', accessCode.trim()); } catch {}
              validateCode();
            }}
            error={codeError}
            loading={codeLoading}
          />
        </div>
      </div>
    );
  }


  if (phase === 'error') {
    return (
      <div className="min-h-screen bg-[#F5F2ED]">
        <SiteHeader />
        <div className="max-w-lg mx-auto px-5 py-16 text-center">
          <p className="text-stone-500 mb-6">제출 중 오류가 발생했습니다.</p>
          <button onClick={() => setPhase('questions')} className="px-6 py-3 bg-stone-900 text-white text-sm rounded-xl">다시 시도</button>
        </div>
      </div>
    );
  }

  // questions phase
  return (
    <div className="min-h-screen bg-[#F5F2ED]">
      <SiteHeader />
      {/* 문항 진입 시 닉네임 필수 — 없으면 끌 수 없는 모달 */}
      {!nickname && (
        <NicknameModal onSave={(name) => setNickname(name)} />
      )}
      <div className="max-w-[580px] mx-auto px-5 pb-24 pt-6">
        {/* top bar */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] tracking-[0.3em] font-semibold text-stone-400 uppercase">스타일 번역서</p>
          <div className="flex border border-stone-200 rounded-full overflow-hidden bg-white text-[11px] font-semibold">
            <button onClick={() => switchMode('step')}
              className={`px-3 py-1.5 transition-colors ${mode === 'step' ? 'bg-stone-900 text-white' : 'text-stone-400 hover:text-stone-600'}`}>
              한 문항씩
            </button>
            <button onClick={() => switchMode('over')}
              className={`px-3 py-1.5 transition-colors ${mode === 'over' ? 'bg-stone-900 text-white' : 'text-stone-400 hover:text-stone-600'}`}>
              한눈에 보기
            </button>
          </div>
        </div>

        {/* chapter nav */}
        <ChapterNav
          answers={answers} fitPics={fitPics}
          curChapter={mode === 'step' ? curQ?.ch : null}
          onJump={jumpToChapter}
        />

        {/* answered count */}
        <p className="text-[11px] text-stone-400 text-right mb-5">
          응답 {answeredCount} / {QUESTIONS.length}
        </p>

        {/* content */}
        {mode === 'step' ? (
          <StepView
            visibleQs={visibleQs} curIdx={curIdx} direction={direction}
            answers={answers} otherAnswers={otherAnswers}
            fitPics={fitPics} fitPicPreviews={fitPicPreviews}
            chipPages={chipPages}
            onAnswer={setAnswer} onOther={setOtherAnswer} onMoreChips={moreChips}
            onTip={setActiveTip}
            onFitPicSelect={fitPicSelect} onFitPicRemove={fitPicRemove}
            onPrev={handlePrev} onNext={handleNext}
            submitting={submitting}
          />
        ) : (
          <OverviewView
            visibleQs={visibleQs}
            answers={answers} otherAnswers={otherAnswers}
            fitPics={fitPics} fitPicPreviews={fitPicPreviews}
            chipPages={chipPages} openChapters={openChapters}
            onAnswer={setAnswer} onOther={setOtherAnswer} onMoreChips={moreChips}
            onTip={setActiveTip}
            onFitPicSelect={fitPicSelect} onFitPicRemove={fitPicRemove}
            onToggleChapter={toggleChapter}
            onSubmit={handleSubmit}
            submitting={submitting}
          />
        )}
      </div>

      <StyleTipModal tipKey={activeTip} onClose={() => setActiveTip(null)} />
    </div>
  );
}
