import { useState } from 'react';

const STORAGE_KEY = 'noga_demo_banner_dismissed';

/**
 * Dismissible "demo mode" indicator. Ensures no visitor mistakes this
 * portfolio demo for a real store where purchases actually happen.
 * Dismissal is remembered for the browser session only.
 */
export function DemoModeBanner() {
  const [open, setOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return sessionStorage.getItem(STORAGE_KEY) !== '1';
  });

  if (!open) return null;

  const dismiss = () => {
    try {
      sessionStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // ignore storage failures (private mode) — banner simply reappears
    }
    setOpen(false);
  };

  return (
    <div
      role="region"
      aria-label="הודעת מצב הדגמה"
      className="bg-charcoal text-cream"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-2 sm:px-8">
        <p className="text-xs tracking-wide sm:text-sm">
          <span className="text-gold">מצב הדגמה</span>
          <span className="mx-2 opacity-40">·</span>
          אתר תצוגה לפורטפוליו — אין רכישות, תשלומים או הזמנות אמיתיים.
        </p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="סגירת הודעת מצב הדגמה"
          className="shrink-0 rounded-full p-1 text-cream/70 transition-colors hover:text-cream"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M4 4l8 8M12 4l-8 8"
              stroke="currentColor"
              strokeWidth="1.25"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
