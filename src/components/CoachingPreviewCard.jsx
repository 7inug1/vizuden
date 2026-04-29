const COACHING_ITEMS = [
  { num: '01', label: '옷장 진단', detail: '지금 가진 옷 기준으로 무엇을 남길지 정리' },
  { num: '02', label: '쇼핑 방향', detail: '예산과 부족한 카테고리, 구체적 브랜드 추천' },
  { num: '03', label: '코디 실행', detail: '상황별 코디 공식 + 나만의 기준 완성' },
];

export default function CoachingPreviewCard({ className = '' }) {
  return (
    <div className={`border border-stone-200 bg-stone-50 px-5 py-4 ${className}`}>
      <p className="text-[11px] tracking-[0.22em] text-stone-400 uppercase mb-4">What's Included</p>
      <div className="flex flex-col gap-3 mb-4">
        {COACHING_ITEMS.map((item) => (
          <div key={item.num} className="flex items-start gap-3">
            <span className="text-[10px] font-mono text-stone-300 tracking-wider mt-0.5 shrink-0">{item.num}</span>
            <div>
              <p className="text-sm font-light text-stone-800 leading-snug mb-0.5">{item.label}</p>
              <p className="text-[11px] text-stone-400 leading-relaxed">{item.detail}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="pt-3 border-t border-stone-200 text-xs text-stone-500 leading-relaxed"
        style={{ letterSpacing: '-0.01em' }}>
        처방전 결과를 바탕으로 실제 옷장과 생활에 맞게 1:1로 함께합니다
      </p>
    </div>
  );
}
