export default function ProgressBar({ current, total, onLogoClick }) {
  const percent = (current / total) * 100;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <button
          onClick={onLogoClick}
          className="text-xs tracking-widest text-stone-400 uppercase hover:text-stone-700 transition-colors duration-150"
        >
          Vizuden
        </button>
        <span className="text-xs text-stone-400">
          {current} / {total}
        </span>
      </div>
      <div className="w-full h-px bg-stone-200">
        <div
          className="h-px bg-stone-800 transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
