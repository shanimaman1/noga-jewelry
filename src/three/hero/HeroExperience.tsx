import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useMediaQuery } from '@/hooks/useMediaQuery';

// three/fiber/drei load only when this chunk is fetched — never in the entry.
const HeroCanvas = lazy(() => import('./HeroCanvas'));

/**
 * Homepage hero — "The Dark Room" (decision: R3F replaces the earlier Spline
 * scene; @splinetool removed). The ring floats in the left half (desktop) /
 * top band (mobile); the Hebrew copy reads in the other half. Decorative:
 * aria-hidden + pointer-events-none.
 *
 * On scroll: the ring rotates and the backdrop brightens charcoal→cream, so
 * the piece emerges from the dark atelier into everyday light. Scroll drives
 * the 3D through a MotionValue read inside useFrame — no per-frame re-render.
 *
 * prefers-reduced-motion: the canvas is never mounted (three is never even
 * downloaded); a static poster shows instead. IS 5568 compliance.
 */
export function HeroExperience() {
  const reduced = useReducedMotion();
  const mobile = useMediaQuery('(max-width: 767px)');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [mountCanvas, setMountCanvas] = useState(false);
  const [inView, setInView] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);

  const { scrollYProgress } = useScroll({
    target: wrapperRef,
    offset: ['start start', 'end start'],
  });

  // Backdrop behind the ring brightens as the hero scrolls past.
  const backdrop = useTransform(scrollYProgress, [0, 0.85], ['#0A0908', '#F7F4EF']);

  // Defer the heavy canvas until just after first paint (never under reduced
  // motion — the lazy import then never fires).
  useEffect(() => {
    if (reduced) return;
    const t = window.setTimeout(() => setMountCanvas(true), 150);
    return () => window.clearTimeout(t);
  }, [reduced]);

  // Pause rendering when the hero is off-screen or the tab is hidden.
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), {
      rootMargin: '100px',
    });
    io.observe(el);
    const onVis = () => setTabVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  const frameloop = inView && tabVisible ? 'always' : 'never';

  return (
    <div
      ref={wrapperRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 h-[45%] overflow-hidden md:inset-y-0 md:right-auto md:h-full md:w-1/2"
    >
      {/* 1 — Backdrop that brightens on scroll (static charcoal if reduced). */}
      {reduced ? (
        <div className="absolute inset-0 bg-charcoal" />
      ) : (
        <motion.div className="absolute inset-0" style={{ backgroundColor: backdrop }} />
      )}

      {/* 1b — Warm spotlight glow for depth (the "dark room" light pool). */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(60% 55% at 50% 48%, rgba(201,162,39,0.16), rgba(10,9,8,0) 70%)',
        }}
      />

      {/* 2 — R3F ring canvas, faded in once mounted. */}
      {!reduced && mountCanvas && (
        <Suspense fallback={null}>
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            <HeroCanvas progress={scrollYProgress} mobile={mobile} frameloop={frameloop} />
          </motion.div>
        </Suspense>
      )}

      {/* 3 — Feathered edge so the ring half blends into the charcoal section. */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(10,9,8,0)_55%,rgba(10,9,8,0.9)_100%)] md:bg-[linear-gradient(to_right,rgba(10,9,8,0)_55%,rgba(10,9,8,0.85)_100%)]" />
    </div>
  );
}
