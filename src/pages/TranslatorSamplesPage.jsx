import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import SiteHeader from '../components/SiteHeader';
import ComingSoonBadge from '../components/ComingSoonBadge';

const CREAM = '#F5F2ED';

// 설문을 끝까지 마치고 실제로 생성된 보고서. 본인 것이라 그대로 공개한다.
const REAL_REPORT_ID = 'ae7001d7-18c1-4d2a-b85e-44c037d04cfe';

const SAMPLES = [
  {
    id: 'teo-yoo',
    name: '유태오',
    title: '글로벌 노마드',
    description: '독일에서 자란 한국인 배우. 전 세계를 무대로 하는 사람.',
    avatar: '/characters/IDMT.png',
    available: true,
    reelUrl: 'https://www.instagram.com/reel/DZeqaEKgjx7/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==',
  },
  {
    id: 'bong-taegyu',
    name: '봉태규',
    title: '정답 밖의 사람',
    description: '치마를 입고 공식 석상에 섰던 배우. 사회의 기준 대신 자신을 선택한 사람.',
    avatar: '/characters/RDMT.png',
    available: true,
    reelUrl: 'https://www.instagram.com/reel/DZKChlZAVSK/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==',
  },
  {
    id: 'steven-yeun',
    name: '스티븐 연',
    title: '어디에도 속하지 않은 사람',
    description: '한국에선 미국인, 미국에선 동양인. 고군분투하며 자기다운 스타일을 만든 사람.',
    avatar: '/characters/ICMT.png',
    available: true,
    reelUrl: 'https://www.instagram.com/reel/DY6j2dkxDdN/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==',
  },
  {
    id: 'son-seokku',
    name: '손석구',
    title: '눈에 띄지 않으려는 사람',
    description: '16년 무명을 버틴 대스타. 심플·베이직으로 오히려 가장 선명해지는 사람.',
    avatar: '/characters/ICMN.png',
    available: true,
    reelUrl: 'https://www.instagram.com/reel/DZ63MGKgtbe/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==',
  },
];

export default function TranslatorSamplesPage() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen"
      style={{ backgroundColor: CREAM }}
    >
      <div className="w-full max-w-sm mx-auto px-6 flex flex-col">
        <SiteHeader />

        <div className="pt-2 pb-24">

          {/* 헤더 */}
          <div className="mb-8">
            <p className="text-xs tracking-[0.2em] text-stone-400 uppercase mb-2">Sample Reports</p>
            <h1
              className="text-2xl font-normal text-stone-900"
              style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.02em' }}
            >
              샘플 번역서
            </h1>
            <p className="text-sm text-stone-500 mt-2 leading-relaxed">
              실제 번역서가 어떻게 나오는지 먼저 살펴보세요.
            </p>
          </div>


          {/* 샘플 목록 — 가상 인물 */}
          <div className="flex flex-col gap-3">
            {SAMPLES.map((s) => (
              <SampleCard
                key={s.id}
                sample={s}
                onClick={() => s.available && navigate(`/translator/${s.id}`)}
              />
            ))}
          </div>

          {/* 실제 사례 — 위 넷은 인물을 보고 쓴 것이고, 이건 설문을 끝까지 마친
              사람에게 실제로 나온 결과물이다. 둘은 성격이 달라 구분해서 보여준다. */}
          <div className="mt-8">
            <p className="text-[11px] tracking-[0.16em] text-stone-400 uppercase mb-3">
              Real Report
            </p>
            <div
              onClick={() => navigate(`/translator/report/${REAL_REPORT_ID}`)}
              className="flex items-center gap-4 px-4 py-4 rounded-xl bg-white border border-stone-200
                         active:scale-[0.98] transition-transform cursor-pointer"
            >
              <div
                className="w-12 h-12 shrink-0 rounded-full flex items-center justify-center"
                style={{ backgroundColor: '#EFEAE2' }}
              >
                <span className="text-[18px]">📄</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-stone-900" style={{ letterSpacing: '-0.01em' }}>
                  실제 사용자 번역서
                </p>
                <p className="text-[11px] text-stone-400 mb-0.5">jinu gee</p>
                <p className="text-xs text-stone-400 leading-relaxed">
                  25개 질문에 직접 답하고 받은 결과물. 위 샘플과 달리 실제로 생성된 것.
                </p>
              </div>
              <span className="shrink-0 text-stone-300 text-sm">→</span>
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
}

function SampleCard({ sample, onClick }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-4 px-4 py-4 rounded-xl bg-white border border-stone-200 active:scale-[0.98] transition-transform"
      style={{ cursor: sample.available ? 'pointer' : 'default' }}
    >
      <img
        src={sample.avatar}
        alt={sample.name}
        className="w-12 h-12 object-contain shrink-0"
        style={{ opacity: sample.available ? 1 : 0.35 }}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p
            className="text-sm font-semibold text-stone-900"
            style={{ letterSpacing: '-0.01em', opacity: sample.available ? 1 : 0.4 }}
          >
            {sample.name}
          </p>
          {!sample.available && <ComingSoonBadge />}
        </div>
        {sample.title && (
          <p className="text-[11px] text-stone-400 mb-0.5">{sample.title}</p>
        )}
        {sample.description && (
          <p className="text-xs text-stone-400 leading-relaxed">{sample.description}</p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {sample.reelUrl ? (
          <a
            href={sample.reelUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-stone-400 hover:text-stone-700 transition-colors"
            title="Instagram Reel"
          >
            <IconInstagram />
          </a>
        ) : (
          <span className="text-stone-200">
            <IconInstagram />
          </span>
        )}
      </div>
    </div>
  );
}

function IconInstagram() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none"/>
    </svg>
  );
}
