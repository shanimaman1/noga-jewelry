import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import type { AgentAction, AgentBrain, AgentTurn } from '@/lib/agent';
import { createAgentBrain } from '@/lib/agent';
import { defaultVariant, getProduct } from '@/data/products';
import { useCart } from '@/lib/cart/store';
import { ROUTES, whatsappUrl } from '@/lib/constants';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { SizeGuideModal } from '@/components/product/SizeGuideModal';
import { AssistantProductCard } from './AssistantProductCard';

const FOCUSABLE =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

/** Where focus should land once the next turn has rendered. */
type FocusTarget = 'choices' | 'input' | null;

/** Below this width the panel is a modal bottom sheet. Matches Tailwind's `sm`. */
const MOBILE_QUERY = '(max-width: 639px)';

/**
 * Guided shopping assistant — stage 1.
 *
 * This component talks to an `AgentBrain` and nothing else: it never imports
 * the wizard, never reads wizard state, and never branches on which brain it
 * got. Swapping in a stage-2 LLM brain is a change to the factory in
 * `@/lib/agent`, not to this file.
 *
 * Layering: the panel sits at z-41 — deliberately above the WhatsApp FAB
 * (z-40) and below the cart drawer / size-guide modal (z-50), so the assistant
 * can never cover them. Adding to the cart closes this panel and hands over to
 * the drawer, which keeps exactly one focus trap alive at a time.
 *
 * The launcher button carries no positioning classes: it is mounted as a flex
 * item inside FloatingActions, which owns the fixed placement, the pairing
 * with the WhatsApp FAB, and the checkout route hide.
 */
export function ShoppingAssistant() {
  const [open, setOpen] = useState(false);
  const [turn, setTurn] = useState<AgentTurn | null>(null);
  const [pending, setPending] = useState(false);
  const [draft, setDraft] = useState('');
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  const brainRef = useRef<AgentBrain | null>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const choicesRef = useRef<HTMLDivElement>(null);
  const focusAfter = useRef<FocusTarget>(null);

  const navigate = useNavigate();
  const addLine = useCart((state) => state.add);
  const reduced = useReducedMotion();

  const brain = () => (brainRef.current ??= createAgentBrain());

  const runTurn = useCallback(
    async (produce: (brain: AgentBrain) => Promise<AgentTurn>, focus: FocusTarget) => {
      setPending(true);
      focusAfter.current = focus;
      try {
        setTurn(await produce(brain()));
      } finally {
        setPending(false);
      }
    },
    [],
  );

  /* ── open / close ──────────────────────────────────────────────────────── */

  const openPanel = () => {
    setOpen(true);
    // The transcript survives a close, so only greet on a genuinely fresh start.
    if (!turn) void runTurn((b) => b.start(), 'choices');
  };

  /**
   * Dismissing the panel must hand focus back to the launcher. The launcher is
   * unmounted while the panel is open, so its ref is null at the moment of
   * closing — the restore has to wait until it has rendered again, which is why
   * this is a flag plus an effect rather than a direct `.focus()` call.
   *
   * Only *dismissal* sets the flag. Closing to hand over to the cart drawer
   * deliberately does not, so the drawer keeps the focus it just took.
   */
  const restoreFocusOnClose = useRef(false);

  const closePanel = useCallback(() => {
    restoreFocusOnClose.current = true;
    setOpen(false);
  }, []);

  useEffect(() => {
    if (open || !restoreFocusOnClose.current) return;
    restoreFocusOnClose.current = false;
    launcherRef.current?.focus();
  }, [open]);

  /* ── focus + scroll after each turn ────────────────────────────────────── */

  useEffect(() => {
    if (!open || !turn) return;

    logRef.current?.scrollTo({
      top: logRef.current.scrollHeight,
      behavior: reduced ? 'auto' : 'smooth',
    });

    const target = focusAfter.current;
    focusAfter.current = null;
    if (target === 'input') {
      inputRef.current?.focus();
    } else if (target === 'choices') {
      const first = choicesRef.current?.querySelector<HTMLElement>('button');
      (first ?? panelRef.current)?.focus();
    }
  }, [turn, open, reduced]);

  /* ── focus trap, scoped to the panel ──────────────────────────────────────
     Scoped to the panel element rather than `document` on purpose: the cart
     drawer and the size-guide modal both attach document-level Escape/Tab
     handlers, and a second document listener here would fight them. Because
     focus is trapped inside the panel, a container handler sees every key that
     matters — and once the size-guide modal takes focus, this one goes quiet. */

  const onPanelKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closePanel();
      return;
    }
    if (event.key !== 'Tab') return;

    const panel = panelRef.current;
    if (!panel) return;
    const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) => el.offsetParent !== null,
    );
    if (items.length === 0) {
      event.preventDefault();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && (active === first || active === panel)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  /* ── the mobile sheet is modal, so it locks background scroll ──────────────
     The query is read inside the effect and re-read on every change rather than
     held in React state: a stale value here would leave the page unscrollable on
     desktop, so the lock has to follow the viewport, not a render. */

  useEffect(() => {
    if (!open) return;
    const query = window.matchMedia(MOBILE_QUERY);
    const previous = document.body.style.overflow;
    const apply = () => {
      document.body.style.overflow = query.matches ? 'hidden' : previous;
    };
    apply();
    query.addEventListener('change', apply);
    return () => {
      query.removeEventListener('change', apply);
      document.body.style.overflow = previous;
    };
  }, [open]);

  /* ── actions, wired to the real app ───────────────────────────────────── */

  const runAction = (action: AgentAction) => {
    switch (action.kind) {
      case 'view-product':
        setOpen(false);
        navigate(`${ROUTES.product}/${action.slug}${action.karat === 18 ? '?karat=18' : ''}`);
        break;

      case 'add-to-cart': {
        const product = getProduct(action.slug);
        if (!product) return;
        const is18K = action.karat === 18 && product.availableIn18K;
        const effectiveAvailability = is18K ? 'made-to-order' : product.availability;
        if (effectiveAvailability === 'out-of-stock') {
          setOpen(false);
          navigate(`${ROUTES.product}/${product.slug}`);
          return;
        }
        const variant = defaultVariant(product);
        addLine({
          slug: product.slug,
          sku: product.sku,
          name: product.name,
          price: is18K ? product.price18K : product.price,
          image: variant.image,
          metal: variant.id,
          karat: is18K ? 18 : 14,
        });
        // `add` opens the cart drawer; step aside so only one dialog traps focus.
        setOpen(false);
        break;
      }

      case 'size-guide':
        setSizeGuideOpen(true);
        break;

      case 'restart':
        void runTurn((b) => b.start(), 'choices');
        break;

      case 'whatsapp':
        // Rendered as a link, never dispatched through here.
        break;
    }
  };

  const submitDraft = (event: FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || pending) return;
    setDraft('');
    void runTurn((b) => b.send({ type: 'text', text }), 'input');
  };

  /* ── rendering ────────────────────────────────────────────────────────── */

  const lastMessageId = turn?.messages[turn.messages.length - 1]?.id;

  const panel = (
    <>
      {/* Mobile only: the sheet covers most of the viewport, so it gets a scrim.
          On desktop the panel is a corner surface and the page stays visible.
          Gated by CSS alone — a JS breakpoint could go stale on resize and leave
          an invisible click-catcher over the page. */}
      <div
        className="fixed inset-0 z-30 bg-charcoal/40 sm:hidden"
        onClick={closePanel}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="עוזר בחירה"
        tabIndex={-1}
        onKeyDown={onPanelKeyDown}
        /* z-41 sits above the WhatsApp FAB (z-40) so the sheet is not pierced by
           it, and below the cart drawer / size-guide modal (z-50) so those always
           win. The header is also z-40, but the panel is bottom-anchored and its
           height always leaves 9rem clear at the top, so the two never overlap —
           on the shortest viewports it is the `100svh - 9rem` term that binds. */
        className="fixed inset-x-0 bottom-0 z-[41] flex h-[min(82svh,calc(100svh-9rem))] w-full max-w-full min-w-0 flex-col overflow-hidden rounded-t-lg border border-mist bg-cream shadow-xl outline-none sm:inset-x-auto sm:bottom-5 sm:end-5 sm:h-[min(34rem,calc(100svh-9rem))] sm:w-[22rem] sm:rounded-lg"
      >
        <header className="flex w-full min-w-0 shrink-0 items-center gap-2 border-b border-mist px-4 py-3">
          {turn?.canGoBack && (
            <button
              type="button"
              onClick={() => void runTurn((b) => b.back(), 'choices')}
              disabled={pending}
              aria-label="חזרה לשאלה הקודמת"
              className="shrink-0 rounded-full p-1.5 text-stone hover:text-charcoal disabled:opacity-40"
            >
              {/* Points along the reading direction; mirrored under dir=rtl. */}
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
                style={{ transform: 'scaleX(-1)' }}
              >
                <path
                  d="M10 3l-5 5 5 5"
                  stroke="currentColor"
                  strokeWidth="1.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}

          <h2 className="me-auto min-w-0 text-base">עוזר בחירה</h2>

          <button
            type="button"
            onClick={closePanel}
            aria-label="סגירת עוזר הבחירה"
            className="shrink-0 rounded-full p-1.5 text-stone hover:text-charcoal"
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
        </header>

        <div
          ref={logRef}
          role="log"
          aria-live="polite"
          aria-label="שיחה עם עוזר הבחירה"
          className="min-h-0 w-full min-w-0 flex-1 space-y-4 overflow-x-hidden overflow-y-auto px-4 py-4"
        >
          {turn?.messages.map((message) => {
            const isLast = message.id === lastMessageId;
            return (
              <div key={message.id} className="max-w-full min-w-0 space-y-2">
                <p
                  className={
                    message.sender === 'user'
                      ? // Avoid Safari's `fit-content` sizing bug in RTL. The fixed
                        // maximum plus explicit wrapping contains every bubble.
                        'ms-auto block max-w-[85%] whitespace-pre-wrap rounded-lg bg-charcoal px-3 py-2 text-sm text-cream break-words [overflow-wrap:anywhere]'
                      : 'me-auto block max-w-[90%] whitespace-pre-wrap text-sm leading-relaxed text-charcoal break-words [overflow-wrap:anywhere]'
                  }
                >
                  <bdi className="block max-w-full break-words [overflow-wrap:anywhere]">
                    {message.text}
                  </bdi>
                </p>

                {message.recommendations && (
                  <div className="space-y-2">
                    {message.recommendations.map((recommendation) => (
                      <AssistantProductCard
                        key={`${recommendation.slug}-${recommendation.karat ?? 14}`}
                        recommendation={recommendation}
                        onView={(slug, karat) => runAction({ kind: 'view-product', slug, karat })}
                        onAdd={(slug, karat) => runAction({ kind: 'add-to-cart', slug, karat })}
                      />
                    ))}
                  </div>
                )}

                {/* Only the newest question stays answerable — an old step's
                    buttons would contradict the state the brain has moved on to. */}
                {message.choices && isLast && (
                  <div ref={choicesRef} className="flex flex-wrap gap-2 pt-1">
                    {message.choices.map((choice) => (
                      <button
                        key={choice.id}
                        type="button"
                        disabled={pending}
                        onClick={() =>
                          void runTurn(
                            (b) => b.send({ type: 'choice', choiceId: choice.id }),
                            'choices',
                          )
                        }
                        className="rounded-full border border-mist px-3.5 py-1.5 text-sm text-charcoal hover:border-stone disabled:opacity-40"
                      >
                        <bdi>{choice.label}</bdi>
                      </button>
                    ))}
                  </div>
                )}

                {message.actions && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {message.actions.map((action) =>
                      action.kind === 'whatsapp' ? (
                        <a
                          key="whatsapp"
                          href={whatsappUrl(action.message)}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-full border border-mist px-3.5 py-1.5 text-sm text-charcoal hover:border-stone"
                        >
                          דברו איתי בוואטסאפ
                        </a>
                      ) : (
                        <button
                          key={action.kind}
                          type="button"
                          onClick={() => runAction(action)}
                          className="rounded-full border border-mist px-3.5 py-1.5 text-sm text-charcoal hover:border-stone"
                        >
                          {action.kind === 'size-guide' ? 'מדריך מידות' : 'להתחיל מחדש'}
                        </button>
                      ),
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <form
          onSubmit={submitDraft}
          className="flex w-full min-w-0 shrink-0 items-center gap-2 border-t border-mist p-3"
        >
          <label htmlFor="assistant-draft" className="sr-only">
            הודעה לעוזר הבחירה
          </label>
          <input
            id="assistant-draft"
            ref={inputRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            disabled={!turn?.acceptsText || pending}
            placeholder="או כתבו לי שאלה"
            autoComplete="off"
            className="w-0 min-w-0 flex-1 rounded-full border border-mist bg-mist/25 px-3.5 py-2 text-base text-charcoal placeholder:text-stone/70 focus:border-stone focus:outline-none sm:text-sm"
          />
          <button
            type="submit"
            disabled={!draft.trim() || pending}
            aria-label="שליחת ההודעה"
            className="shrink-0 rounded-full bg-charcoal p-2 text-cream disabled:opacity-40"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
              style={{ transform: 'scaleX(-1)' }}
            >
              <path
                d="M10 3l-5 5 5 5"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </form>
      </div>
    </>
  );

  return (
    <>
      {!open && (
        <button
          ref={launcherRef}
          type="button"
          onClick={openPanel}
          aria-label="פתיחת עוזר בחירה"
          className={`z-30 rounded-full border border-mist bg-cream px-4 py-2.5 text-sm text-charcoal shadow-md print:hidden ${
            reduced ? '' : 'transition-colors'
          } hover:border-stone`}
        >
          עוזר בחירה
        </button>
      )}

      {open && createPortal(panel, document.body)}

      {/* The project's existing size guide, reused as-is. */}
      <SizeGuideModal open={sizeGuideOpen} onClose={() => setSizeGuideOpen(false)} />
    </>
  );
}
