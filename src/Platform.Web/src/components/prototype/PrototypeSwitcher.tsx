// PROTOTYPE — throwaway. Floating bottom bar that cycles ?variant= on the current route.
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  variants: { key: string; name: string }[];
  current: string;
}

export function PrototypeSwitcher({ variants, current }: Props) {
  const [params, setParams] = useSearchParams();
  const idx = Math.max(
    0,
    variants.findIndex((v) => v.key === current),
  );

  const go = (delta: number) => {
    const next = variants[(idx + delta + variants.length) % variants.length];
    const p = new URLSearchParams(params);
    p.set('variant', next.key);
    setParams(p, { replace: true });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === 'INPUT' ||
          t.tagName === 'TEXTAREA' ||
          t.tagName === 'SELECT' ||
          t.isContentEditable)
      )
        return;
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (import.meta.env.PROD) return null;

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-2 py-1.5 rounded-full shadow-lg text-[12px] font-mono"
      style={{ backgroundColor: '#111827', color: '#F9FAFB', border: '1px solid #374151' }}
    >
      <button
        onClick={() => go(-1)}
        className="p-1 rounded-full hover:bg-white/10"
        aria-label="Previous variant"
      >
        <ChevronLeft size={14} />
      </button>
      <span className="px-1">
        PROTOTYPE · {variants[idx].key} ({variants[idx].name}) · {idx + 1}/{variants.length}
      </span>
      <button
        onClick={() => go(1)}
        className="p-1 rounded-full hover:bg-white/10"
        aria-label="Next variant"
      >
        <ChevronRight size={14} />
      </button>
    </div>
  );
}
