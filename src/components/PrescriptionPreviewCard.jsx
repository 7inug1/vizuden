const PRESCRIPTION_SECTIONS = [
  '나의 스타일 방향',
  '핵심 아이템 기준',
  '피해야 할 스타일',
  '코디 조합 방향',
];

export default function PrescriptionPreviewCard({ className = '' }) {
  return (
    <div className={`border border-stone-200 bg-stone-50 px-5 py-4 ${className}`}>
      <p className="text-[11px] tracking-[0.22em] text-stone-400 uppercase mb-4">처방전 미리보기</p>

      <ul className="flex flex-col gap-2.5 mb-4">
        {PRESCRIPTION_SECTIONS.map((section) => (
          <li key={section} className="flex items-center gap-2.5">
            <span className="w-1 h-1 rounded-full bg-stone-300 shrink-0" />
            <span className="text-sm font-light text-stone-700">{section}</span>
          </li>
        ))}
      </ul>

      <p className="pt-3 border-t border-stone-200 text-xs text-stone-500 leading-relaxed"
        style={{ letterSpacing: '-0.01em' }}>
        유형 결과를 바탕으로 나만의 스타일 기준을 한 번에 정리합니다
      </p>
    </div>
  );
}
