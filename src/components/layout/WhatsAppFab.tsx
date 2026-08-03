import { useLocation } from 'react-router-dom';
import { whatsappUrl } from '@/lib/constants';

/**
 * Floating WhatsApp button — the fast path for time-pressured gift buyers.
 * Links to wa.me with an invalid demo number (see constants).
 *
 * Product pages render their own button with the product name prefilled into
 * the message, so this generic one steps aside there.
 */
export function WhatsAppFab() {
  const { pathname } = useLocation();
  if (pathname.startsWith('/product/')) return null;

  return (
    <a
      href={whatsappUrl()}
      target="_blank"
      rel="noreferrer"
      aria-label="פנייה בוואטסאפ"
      className="fixed bottom-5 start-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-gold text-charcoal shadow-lg transition-transform hover:scale-105 focus-visible:scale-105 print:hidden"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2a10 10 0 0 0-8.6 15.05L2 22l5.1-1.33A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.18-1.14l-.3-.18-3.03.79.81-2.95-.2-.31A8.2 8.2 0 1 1 12 20.2Zm4.5-6.14c-.25-.12-1.47-.72-1.7-.8-.23-.09-.4-.13-.56.12-.17.25-.64.8-.79.97-.14.16-.29.18-.54.06a6.7 6.7 0 0 1-3.3-2.9c-.25-.42.25-.39.71-1.31.08-.16.04-.3-.02-.42-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.42h-.48c-.16 0-.42.06-.64.31-.22.25-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.7 2.6 4.12 3.64 1.53.66 2.13.72 2.9.6.46-.06 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.11-.22-.17-.47-.29Z" />
      </svg>
    </a>
  );
}
