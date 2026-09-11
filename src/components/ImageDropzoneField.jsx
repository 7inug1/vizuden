import { useEffect, useMemo, useState } from 'react';
import { ImageUp } from 'lucide-react';

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0B';
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export default function ImageDropzoneField({
  label,
  file,
  onChange,
  onRemove,
  onError,
  maxBytes = 5 * 1024 * 1024,
  compact = false,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handleFiles(files) {
    const nextFile = files?.[0];
    if (!nextFile) return;
    if (!nextFile.type?.startsWith('image/')) {
      onError?.('이미지 파일만 업로드할 수 있습니다');
      return;
    }
    if (nextFile.size > maxBytes) {
      onError?.('이미지는 5MB 이하만 가능합니다');
      return;
    }
    onError?.('');
    onChange?.(nextFile);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs text-stone-400 tracking-wide">{label}</p>
      <label
        onDragEnter={(event) => { event.preventDefault(); event.stopPropagation(); setIsDragging(true); }}
        onDragOver={(event) => { event.preventDefault(); event.stopPropagation(); if (!isDragging) setIsDragging(true); }}
        onDragLeave={(event) => { event.preventDefault(); event.stopPropagation(); if (event.currentTarget.contains(event.relatedTarget)) return; setIsDragging(false); }}
        onDrop={(event) => { event.preventDefault(); event.stopPropagation(); setIsDragging(false); handleFiles(Array.from(event.dataTransfer.files ?? [])); }}
        className="block w-full border cursor-pointer transition-colors duration-150"
        style={{
          borderColor: isDragging ? '#57534e' : '#e7e5e4',
          backgroundColor: isDragging ? 'rgba(28,25,23,0.03)' : 'transparent',
        }}
      >
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => { handleFiles(Array.from(event.target.files ?? [])); event.target.value = ''; }}
        />

        {file ? (
          compact ? (
            <div className="relative">
              <div className="aspect-square overflow-hidden bg-stone-100">
                <img src={previewUrl} alt={file.name} className="w-full h-full object-cover" />
              </div>
              <button
                type="button"
                onClick={(event) => { event.preventDefault(); event.stopPropagation(); onRemove?.(); }}
                className="absolute top-1.5 right-1.5 bg-stone-900 text-stone-50 text-[9px] tracking-wider px-1.5 py-0.5 uppercase"
              >
                삭제
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-14 h-14 shrink-0 overflow-hidden bg-stone-100">
                <img src={previewUrl} alt={file.name} className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-stone-700 truncate">{file.name}</p>
                <p className="text-xs text-stone-400 mt-0.5">{formatBytes(file.size)}</p>
              </div>
              <button
                type="button"
                onClick={(event) => { event.preventDefault(); event.stopPropagation(); onRemove?.(); }}
                className="shrink-0 text-[10px] text-stone-400 hover:text-stone-900 transition-colors"
              >
                삭제
              </button>
            </div>
          )
        ) : (
          compact ? (
            <div className="aspect-square flex flex-col items-center justify-center gap-1.5 text-center">
              <ImageUp className="w-4 h-4 text-stone-300" />
              <p className="text-[10px] text-stone-400 leading-tight px-2">
                {isDragging ? '놓으세요' : '클릭 또는\n끌어다 놓기'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-center px-4 py-5">
              <ImageUp className="w-5 h-5 text-stone-300" />
              <p className="text-sm text-stone-500">
                {isDragging ? '여기에 사진을 놓아주세요' : '클릭하거나 끌어다 놓으세요'}
              </p>
            </div>
          )
        )}
      </label>
    </div>
  );
}
