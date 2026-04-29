import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Link as LinkIcon, Shirt, Footprints, Scissors, PanelsTopLeft, Rows3 } from 'lucide-react';
import SiteHeader from '../components/SiteHeader';
import ConsultingBeforeAfterCard from '../components/ConsultingBeforeAfterCard';
import LoginNudgeBlock from '../components/LoginNudgeBlock';
import { StepNumber } from '../components/ServiceStepChrome';
import { types } from '../data/types';
import { typeImages } from '../data/typeImages';
import { readPrescriptionSaved } from '../lib/prescriptionStorage';
import { useAuth } from '../context/AuthContext';

function RecommendBadge() {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      style={{ position: 'absolute', top: '-12px', right: '12px', zIndex: 1 }}
    >
      <div style={{
        display: 'inline-flex', alignItems: 'center',
        padding: '3px 10px', border: '1px solid #1c1917',
        backgroundColor: '#F5F2ED', borderRadius: '999px',
        fontSize: '10px', letterSpacing: '0.08em', color: '#1c1917', whiteSpace: 'nowrap',
      }}>
        추천
      </div>
      <div style={{
        position: 'absolute', bottom: '-6px', right: '20px',
        width: 0, height: 0,
        borderLeft: '5px solid transparent', borderRight: '5px solid transparent',
        borderTop: '6px solid #1c1917',
      }} />
      <div style={{
        position: 'absolute', bottom: '-4px', right: '21px',
        width: 0, height: 0,
        borderLeft: '4px solid transparent', borderRight: '4px solid transparent',
        borderTop: '5px solid #F5F2ED',
      }} />
    </motion.div>
  );
}

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

function splitParagraphs(text) {
  if (!text || typeof text !== 'string') return [];
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/\n/g, ' ').trim())
    .filter(Boolean);
}

function ParagraphBlock({ text, className = '', gapClassName = 'gap-3' }) {
  const paragraphs = splitParagraphs(text);
  if (!paragraphs.length) return null;
  return (
    <div className={`flex flex-col ${gapClassName}`}>
      {paragraphs.map((paragraph, index) => (
        <p key={index} className={className}>
          {paragraph}
        </p>
      ))}
    </div>
  );
}

function normalizeStylePrescription(raw) {
  if (!raw) return null;

  let source = raw;
  if (typeof source === 'string') {
    try {
      source = JSON.parse(source);
    } catch {
      return null;
    }
  }

  if (source?.report && typeof source.report === 'object') source = source.report;
  if (source?.full && typeof source.full === 'object') source = source.full;

  if (source?.direction && Array.isArray(source?.criteria)) {
    return {
      title: source.title ?? null,
      direction: source.direction ?? null,
      criteria: source.criteria ?? [],
      bodyGuide: source.bodyGuide ?? null,
      stylingFormula: source.stylingFormula ?? null,
      recommendations: source.recommendations ?? null,
      legacy: false,
    };
  }

  if (source?.problem?.headline || source?.transformation?.criteria?.length) {
    return {
      legacy: true,
      title: source.title ?? null,
      direction: null,
      criteria: source?.transformation?.criteria ?? [],
      bodyGuide: source?.problem?.headline ?? null,
      stylingFormula: null,
      recommendations: null,
    };
  }

  return null;
}

function categoryMeta(category) {
  const normalized = String(category || '').trim();
  if (normalized.includes('하의')) return { icon: Rows3, label: '하의' };
  if (normalized.includes('상의')) return { icon: Shirt, label: '상의' };
  if (normalized.includes('아우터')) return { icon: PanelsTopLeft, label: '아우터' };
  if (normalized.includes('신발')) return { icon: Footprints, label: '신발' };
  if (normalized.includes('헤어')) return { icon: Scissors, label: '헤어' };
  return { icon: Rows3, label: normalized || '추천' };
}

export default function PrescriptionResultPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { reportId: paramReportId } = useParams();
  const { user } = useAuth();

  const [title, setTitle] = useState(location.state?.title ?? null);
  const [fromType, setFromType] = useState(location.state?.fromType ?? null);
  const [reportId, setReportId] = useState(location.state?.reportId ?? paramReportId ?? null);
  const [report, setReport] = useState(() => normalizeStylePrescription(location.state?.report));
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [redirected, setRedirected] = useState(false);

  useEffect(() => {
    const saved = readPrescriptionSaved();

    const nextTitle = title ?? saved?.title ?? null;
    const nextType = fromType ?? saved?.fromType ?? null;
    const nextReportId = reportId ?? saved?.reportId ?? null;
    const nextReport = report ?? normalizeStylePrescription(saved?.report);

    if (nextTitle !== title) setTitle(nextTitle);
    if (nextType !== fromType) setFromType(nextType);
    if (nextReportId !== reportId) setReportId(nextReportId);
    if (!report && nextReport) setReport(nextReport);

    const targetReportId = paramReportId || nextReportId;
    if (!targetReportId) {
      setRedirected(true);
      navigate('/home', { replace: true });
      return;
    }

    if (report && targetReportId === reportId) return;

    setLoading(true);
    fetch(`/api/prescription-full?reportId=${targetReportId}`)
      .then((response) => response.json().then((data) => ({ ok: response.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data?.error || 'failed');
        const normalized = normalizeStylePrescription(data?.report);
        if (!normalized) throw new Error('invalid report');
        setReport(normalized);
        setTitle(data?.title ?? null);
        setReportId(targetReportId);
      })
      .catch(() => {
        setRedirected(true);
        navigate('/home', { replace: true });
      })
      .finally(() => setLoading(false));
  }, [fromType, navigate, paramReportId, report, reportId, title]);

  const typeResult = useMemo(() => (fromType ? types[fromType] : null), [fromType]);

  async function handleCopyLink() {
    try {
      const url = reportId ? `${window.location.origin}/prescription/result/${reportId}` : window.location.href;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {}
  }

  if (redirected) return null;
  if (loading || !report) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ backgroundColor: '#F5F2ED' }}>
        <p className="text-xs tracking-widest text-stone-400 uppercase">보고서 불러오는 중...</p>
      </div>
    );
  }

  const practicalCategories = Array.isArray(report?.recommendations?.practical?.categories)
    ? report.recommendations.practical.categories
    : [];

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.35 }}
      className="min-h-screen flex flex-col items-center px-6"
      style={{ backgroundColor: '#F5F2ED' }}
    >
      <div className="w-full max-w-sm flex flex-col">
        <SiteHeader onLogoClick={() => navigate('/home')} />

        <div className="flex flex-col py-4 pb-12">
          <div className="flex items-baseline justify-between mb-4">
            <p className="text-[11px] tracking-[0.24em] text-stone-500 font-medium uppercase">VIZUDEN</p>
            <p className="text-[11px] text-stone-400 tracking-[0.18em] uppercase">스타일 처방전</p>
          </div>

          {title && (
            <div className="mb-6">
              <h1
                className="text-xl font-light text-stone-900 leading-snug"
                style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.015em' }}
              >
                {title}
              </h1>
              <div className="border-t border-stone-200 mt-4" />
              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  aria-label={copied ? '링크 복사 완료' : '보고서 링크 복사'}
                  className="p-1 text-stone-400 hover:text-stone-700 transition-colors duration-150"
                >
                  {copied ? <Check className="w-4 h-4" strokeWidth={1.8} /> : <LinkIcon className="w-4 h-4" strokeWidth={1.8} />}
                </button>
              </div>
            </div>
          )}

          {fromType && typeImages[fromType] && (
            <div className="flex justify-center my-4">
              <img src={typeImages[fromType]} alt={typeResult?.nameKo} className="w-44 h-44 object-contain" />
            </div>
          )}

          {report.direction && (
            <section className="mb-8">
              <p className="text-xs tracking-widest text-stone-400 uppercase mb-4">당신의 스타일 방향</p>
              <p className="text-sm text-stone-700 leading-relaxed">{report.direction}</p>
            </section>
          )}

          {!!report.criteria?.length && (
            <section className="mb-8">
              <p className="text-xs tracking-widest text-stone-400 uppercase mb-4">가져가야 할 기준</p>
              <div className="flex flex-col gap-5">
                {report.criteria.map((criterion, index) => (
                  <div key={`${criterion.title}-${index}`}>
                    <p className="text-sm font-medium text-stone-900 leading-snug mb-2">{index + 1}. {criterion.title}</p>
                    <ParagraphBlock text={criterion.detail} className="text-xs text-stone-500 leading-relaxed" gapClassName="gap-2" />
                  </div>
                ))}
              </div>
            </section>
          )}

          {report.bodyGuide && (
            <section className="mb-8">
              <p className="text-xs tracking-widest text-stone-400 uppercase mb-4">체형에 맞는 코디 기준</p>
              <ParagraphBlock text={report.bodyGuide} className="text-sm text-stone-700 leading-relaxed" gapClassName="gap-3" />
            </section>
          )}

          {report.stylingFormula && (
            <section className="mb-8">
              <p className="text-xs tracking-widest text-stone-400 uppercase mb-4">바로 써먹는 스타일 공식</p>
              <ParagraphBlock text={report.stylingFormula.intro} className="text-sm text-stone-700 leading-relaxed mb-4" gapClassName="gap-3" />
              {!!report.stylingFormula.formulas?.length && (
                <div className="flex flex-col gap-4 mb-6">
                  {report.stylingFormula.formulas.map((formula, index) => (
                    <div key={`${formula.title}-${index}`}>
                      <p className="text-sm font-medium text-stone-900 leading-snug mb-2">{index + 1}. {formula.title}</p>
                      <ParagraphBlock text={formula.detail} className="text-xs text-stone-500 leading-relaxed" gapClassName="gap-2" />
                    </div>
                  ))}
                </div>
              )}
              {report.stylingFormula.actionPlan && (
                <div className="border-t border-stone-200 pt-5">
                  <p className="text-xs tracking-widest text-stone-400 uppercase mb-3">실행 계획</p>
                  <div className="flex flex-col gap-4">
                    {[
                      ['이번 주', report.stylingFormula.actionPlan.thisWeek],
                      ['이번 달', report.stylingFormula.actionPlan.thisMonth],
                      ['3개월', report.stylingFormula.actionPlan.threeMonths],
                    ].filter(([, value]) => value).map(([label, value], index) => (
                      <div key={label}>
                        <p className="text-sm font-medium text-stone-900 leading-snug mb-1">{index + 1}. {label}</p>
                        <ParagraphBlock text={value} className="text-xs text-stone-500 leading-relaxed" gapClassName="gap-2" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {!!(report.recommendations?.practical?.intro || practicalCategories.length || report.recommendations?.reference) && (
            <section className="mb-8">
              <p className="text-xs tracking-widest text-stone-400 uppercase mb-4">제품군과 브랜드 추천</p>
              <ParagraphBlock text={report.recommendations?.practical?.intro} className="text-sm text-stone-700 leading-relaxed mb-5" gapClassName="gap-3" />

              {!!practicalCategories.length && (
                <div className="flex flex-col gap-4">
                  {practicalCategories.map((item, index) => {
                    const meta = categoryMeta(item.category);
                    const Icon = meta.icon;
                    return (
                      <div key={`${item.category}-${index}`} className="border border-stone-200 p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Icon className="w-4 h-4 text-stone-500" strokeWidth={1.7} />
                          <p className="text-sm font-medium text-stone-900">{meta.label}</p>
                        </div>
                        <div className="flex flex-col gap-2">
                          {item.keywords && <p className="text-xs text-stone-500 leading-relaxed"><span className="text-stone-900">키워드:</span> {item.keywords}</p>}
                          {item.brands && <p className="text-xs text-stone-500 leading-relaxed"><span className="text-stone-900">브랜드:</span> {item.brands}</p>}
                          {item.match && <ParagraphBlock text={item.match} className="text-xs text-stone-500 leading-relaxed" gapClassName="gap-2" />}
                          {item.effect && <p className="text-xs text-stone-500 leading-relaxed"><span className="text-stone-900">기대되는 인상:</span> {item.effect}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {report.recommendations?.reference && (
                <div className="border-t border-stone-200 pt-5 mt-6">
                  <p className="text-xs tracking-widest text-stone-400 uppercase mb-3">보너스: 더 넓게 참고할 브랜드와 방향</p>
                  <ParagraphBlock text={report.recommendations.reference} className="text-sm text-stone-700 leading-relaxed" gapClassName="gap-3" />
                </div>
              )}
            </section>
          )}

          <div className="border-t border-stone-200 pt-8 pb-6">
            <p className="text-[10px] tracking-[0.3em] text-stone-400 uppercase mb-4">다음 단계</p>
            <div className="mb-6">
              <div className="mb-4">
                <StepNumber n="03" status="active" />
              </div>
              <p className="text-[10px] tracking-[0.22em] text-stone-400 uppercase mb-2">
                Visual Consulting
              </p>
              <h2
                className="text-2xl font-light text-stone-900 leading-tight mb-3"
                style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.02em' }}
              >
                비주얼 컨설팅
              </h2>
              <p className="text-sm text-stone-500 leading-relaxed mb-6" style={{ marginTop: '-0.5rem' }}>
                스타일 처방전에서 찾은 기준을 바탕으로, 옷장 진단부터 쇼핑과 코디 실행까지 1:1로 함께합니다.
              </p>
              <ConsultingBeforeAfterCard />
            </div>
            {!user && (
              <LoginNudgeBlock
                heading="처방전을 저장해두세요"
                sub="창을 닫으면 다시 찾기 어려워요"
                nextPath={reportId ? `/prescription/result/${reportId}` : '/prescription/result'}
              />
            )}
            <div className="relative">
              <RecommendBadge />
              <button
                onClick={() => navigate('/consulting/questions')}
                className="w-full py-4 bg-stone-900 text-stone-50 text-sm tracking-widest uppercase
                  hover:bg-stone-800 active:bg-stone-700 transition-colors duration-200"
              >
                신청하기
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
