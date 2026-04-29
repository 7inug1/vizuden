import { useEffect, useRef } from 'react';

/**
 * content: string 또는 { title, desc } 객체
 * position: 'top' | 'bottom'
 * align: 'left' | 'right' — 툴팁 박스 정렬 (기본: 'left')
 * forceOpen: boolean — 클릭으로 열린 상태
 * onClose: () => void — 외부 클릭 시 닫기 콜백
 */
export default function Tooltip({ content, children, position = 'top', align = 'left', forceOpen = false, onClose, suppressHover = false }) {
  const ref = useRef(null);
  const positionClass = position === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2';
  const alignClass = align === 'right' ? 'right-0' : align === 'center' ? 'left-1/2 -translate-x-1/2' : 'left-0';
  const arrowClass =
    position === 'bottom'
      ? 'bottom-full border-b-stone-900 border-b-4 border-x-4 border-x-transparent border-t-0'
      : 'top-full border-t-stone-900 border-t-4 border-x-4 border-x-transparent border-b-0';
  const arrowAlignClass = align === 'right' ? 'right-3' : align === 'center' ? 'left-1/2 -translate-x-1/2' : 'left-3';

  // 외부 클릭 시 닫기
  useEffect(() => {
    if (!forceOpen || !onClose) return;
    function handle(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        onClose();
      }
    }
    document.addEventListener('click', handle);
    return () => document.removeEventListener('click', handle);
  }, [forceOpen, onClose]);

  const body =
    typeof content === 'string' ? (
      <span>{content}</span>
    ) : (
      <>
        <span className="font-medium text-stone-50 block mb-1">{content?.title}</span>
        <span className="text-stone-300">{content?.desc}</span>
      </>
    );

  return (
    <span ref={ref} className="relative group inline-block">
      {children}
      <span
        className={`absolute ${alignClass} ${positionClass} w-56 px-3 py-2.5
          bg-stone-900 text-xs leading-relaxed z-[80] shadow-[0_10px_28px_rgba(28,25,23,0.28)] ring-1 ring-stone-800/80
          pointer-events-none
          transition-opacity duration-150
          ${forceOpen ? 'opacity-100' : suppressHover ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}
      >
        {body}
        <span className={`absolute ${arrowAlignClass} ${arrowClass} w-0 h-0`} />
      </span>
    </span>
  );
}
