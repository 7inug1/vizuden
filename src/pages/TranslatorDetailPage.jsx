import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import SiteHeader from '../components/SiteHeader';
import TranslatorBeforeAfterCard from '../components/TranslatorBeforeAfterCard';
import TranslatorReviewModal from '../components/TranslatorReviewModal';
import { supabase } from '../lib/supabaseClient';
import { useReportStatus } from '../hooks/useReportStatus';
import { useAuth } from '../context/AuthContext';
import { useNickname } from '../context/NicknameContext';
import { getConsultingStatusLabel } from '../lib/translatorIntake';

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

function ImageLabel({ children }) {
  return (
    <span
      className="absolute top-2 left-2 text-[9px] tracking-widest uppercase px-1.5 py-0.5"
      style={{ backgroundColor: 'rgba(28,25,23,0.6)', color: '#fafaf9' }}
    >
      {children}
    </span>
  );
}

function ReviewCard({ review }) {
  const [expanded, setExpanded] = useState(false);
  const hasBefore = !!review.before_image_url;
  const hasAfter = !!review.after_image_url;
  const hasBoth = hasBefore && hasAfter;
  const hasAny = hasBefore || hasAfter;
  const isLong = review.text.length > 100;

  return (
    <div className="border border-stone-200">
      {hasAny && (
        hasBoth ? (
          <div className="grid grid-cols-2 gap-px" style={{ backgroundColor: '#e7e5e4' }}>
            <div className="relative overflow-hidden bg-stone-100">
              <div className="aspect-[3/4]">
                <img src={review.before_image_url} alt="Before" className="w-full h-full object-cover" />
              </div>
              <ImageLabel>Before</ImageLabel>
            </div>
            <div className="relative overflow-hidden bg-stone-100">
              <div className="aspect-[3/4]">
                <img src={review.after_image_url} alt="After" className="w-full h-full object-cover" />
              </div>
              <ImageLabel>After</ImageLabel>
            </div>
          </div>
        ) : (
          <div className="relative overflow-hidden bg-stone-100" style={{ maxHeight: 280 }}>
            <img
              src={review.before_image_url || review.after_image_url}
              alt=""
              className="w-full object-cover"
              style={{ maxHeight: 280 }}
            />
            <ImageLabel>{hasBefore ? 'Before' : 'After'}</ImageLabel>
          </div>
        )
      )}
      <div className="px-5 py-4">
        <p
          className="text-sm text-stone-700 leading-relaxed mb-1 whitespace-pre-wrap"
          style={!expanded && isLong ? { display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' } : {}}
        >
          {review.text}
        </p>
        {isLong && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-[11px] text-stone-400 hover:text-stone-700 transition-colors mb-3"
          >
            {expanded ? '접기' : '더 보기'}
          </button>
        )}
        {!isLong && <div className="mb-3" />}
        <p className="text-xs text-stone-400">
          {review.reviewer_name || '익명'} · {new Date(review.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
        </p>
      </div>
    </div>
  );
}

export default function TranslatorDetailPage() {
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const { nickname } = useNickname();
  const { prescription } = useReportStatus();
  const [reviews, setReviews] = useState([]);
  const [unlockedIntakeId, setUnlockedIntakeId] = useState(null);
  const [latestIntake, setLatestIntake] = useState(null);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    supabase
      .from('reviews')
      .select('id, text, reviewer_name, before_image_url, after_image_url, created_at')
      .eq('service', 'consulting')
      .eq('approved', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setReviews(data); });
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!user || !supabase) return;

    fetch('/api/translator-intake', {
      headers: { ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}) },
    })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const items = Array.isArray(data?.items) ? data.items : [];
        const unlocked = items.find((item) => item?.review_unlocked && item?.status === 'completed');
        if (unlocked) setUnlockedIntakeId(unlocked.id);
        if (items.length > 0) setLatestIntake(items[0]);
      })
      .catch(() => {});

    supabase
      .from('reviews')
      .select('id')
      .eq('user_id', user.id)
      .eq('service', 'consulting')
      .maybeSingle()
      .then(({ data }) => { if (!cancelled && data) setReviewSubmitted(true); });

    return () => { cancelled = true; };
  }, [session?.access_token, user?.id]);

  const consultingLocked = !prescription.done;

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3 }}
      className="min-h-screen flex flex-col items-center px-6"
      style={{ backgroundColor: '#F5F2ED' }}
    >
      <div className="w-full max-w-sm flex flex-col" style={{ minHeight: '100svh' }}>
        <SiteHeader onLogoClick={() => navigate('/')} />

        <div className="flex-1 flex flex-col py-4 pb-16">
          <button
            type="button"
            onClick={() => navigate('/services')}
            className="text-xs text-stone-400 tracking-wider hover:text-stone-700 transition-colors duration-150 mb-8 text-left"
          >
            ← 서비스 전체보기
          </button>

          <p className="text-xs tracking-[0.28em] text-stone-400 uppercase mb-5">1:1 STYLE COACHING</p>
          <h1
            className="text-2xl font-light text-stone-900 leading-tight mb-3"
            style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.02em' }}
          >
            1:1 스타일 코칭
          </h1>
          <p className="text-sm text-stone-500 leading-relaxed mb-10">
            스타일 처방전에서 찾은 기준을 바탕으로, 옷장 진단부터 쇼핑과 코디 실행까지 1:1로 함께합니다.
          </p>

          <TranslatorBeforeAfterCard className="mb-12" />

          {/* Reviews */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-5">
              <p className="text-xs tracking-[0.28em] text-stone-400 uppercase">Reviews</p>
              {reviewSubmitted ? (
                <p className="text-xs text-stone-400">후기 완료 · 감사합니다</p>
              ) : unlockedIntakeId ? (
                <button
                  type="button"
                  onClick={() => setShowModal(true)}
                  className="text-xs tracking-widest text-stone-900 uppercase border-b border-stone-900 pb-px hover:text-stone-500 hover:border-stone-500 transition-colors"
                >
                  후기 남기기 →
                </button>
              ) : null}
            </div>

            {reviews.length > 0 ? (
              <div className="flex flex-col gap-4">
                {reviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-stone-400 leading-relaxed">아직 공개된 후기가 없습니다.</p>
                {!unlockedIntakeId && !reviewSubmitted && (
                  <p className="text-xs text-stone-300">후기 작성은 컨설팅 완료 후 가능합니다.</p>
                )}
              </div>
            )}
          </div>

          {latestIntake ? (
            <div className="border border-stone-200 px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-xs tracking-widest text-stone-400 uppercase mb-1">신청 완료</p>
                <p className="text-sm text-stone-600">
                  {getConsultingStatusLabel(latestIntake.status)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate(`/consulting/intakes/${latestIntake.id}`)}
                className="text-xs tracking-widest text-stone-500 uppercase hover:text-stone-900 transition-colors shrink-0 ml-4"
              >
                내용 보기 →
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => !consultingLocked && navigate('/translator/questions')}
              disabled={consultingLocked}
              className="w-full py-4 text-sm tracking-widest uppercase transition-colors duration-200
                disabled:bg-stone-200 disabled:text-stone-400 disabled:cursor-not-allowed
                enabled:bg-stone-900 enabled:text-stone-50 enabled:hover:bg-stone-800 enabled:active:bg-stone-700"
            >
              {consultingLocked ? '처방전 완료 후 신청 가능' : '신청하기'}
            </button>
          )}
        </div>

        <div className="text-center py-8">
          <p className="text-xs text-stone-400 tracking-widest uppercase">
            &copy; {new Date().getFullYear()} VIZUDEN
          </p>
        </div>
      </div>

      <AnimatePresence>
        {showModal && user && unlockedIntakeId && (
          <TranslatorReviewModal
            key="review-modal"
            userId={user.id}
            intakeId={unlockedIntakeId}
            defaultName={nickname || user.user_metadata?.name || user.user_metadata?.full_name || ''}
            onClose={() => setShowModal(false)}
            onSubmitted={() => {
              setReviewSubmitted(true);
              setShowModal(false);
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
