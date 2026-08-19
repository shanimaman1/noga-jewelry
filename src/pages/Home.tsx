import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { BRAND, ROUTES, whatsappUrl } from '@/lib/constants';
import { Container } from '@/components/common/Container';
import { Seo } from '@/components/seo/Seo';
import { HeroExperience } from '@/three/hero/HeroExperience';
import { useHeroInViewObserver } from '@/hooks/useHeroInViewObserver';
import { Collections } from '@/components/home/Collections';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { DanaStory } from '@/components/home/DanaStory';
import { WhyNoga } from '@/components/home/WhyNoga';
import { Testimonials } from '@/components/home/Testimonials';
import { GiftGuide } from '@/components/home/GiftGuide';
import { InstagramNewsletter } from '@/components/home/InstagramNewsletter';

/**
 * Home page. Phase 0 lays out the shell with placeholder content.
 * The real-time 3D hero canvas is mounted here in Phase 1b; for now the hero
 * is a static "dark room" section that establishes the mood.
 */
export function Home() {
  // The floating shopping-assistant launcher and WhatsApp FAB hide while
  // this section is on screen — there is no room for them beside the hero
  // at narrow widths — and reveal once the user has scrolled past it. See
  // useHeroInViewObserver and components/layout/FloatingActions.tsx.
  const heroRef = useRef<HTMLElement>(null);
  useHeroInViewObserver(heroRef);

  return (
    <>
      <Seo
        title="תכשיטי יוקרה בעבודת יד בתל אביב"
        description="נוגה - אטלייה תכשיטים בתל אביב. זהב 14/18 קראט בעבודת יד, יהלומים טבעיים ומעבדה. תכשיט אחד שתלבשי כל יום."
        path="/"
      />
      {/* HERO — "The Dark Room": R3F ring, scroll-driven (rotation + light +
          backdrop charcoal→cream). See src/three/hero/HeroExperience.tsx. */}
      <section
        ref={heroRef}
        aria-label="מסך פתיחה"
        className="relative flex min-h-[88vh] items-center justify-center overflow-hidden bg-charcoal text-cream"
      >
        {/* R3F ring — left half on desktop, top band on mobile */}
        <HeroExperience />

        {/* Text occupies the right half on desktop and stacks below the ring
            on mobile, so nothing ever overlaps the ring or the diamond. */}
        <Container className="relative z-10">
          <div className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
            {/* Reserves the ring's space: the top band on mobile (ring is
                absolutely positioned over it), the left column on desktop.
                order-2 on desktop pushes it left — in RTL the first grid item
                lands on the RIGHT, which is where the text belongs. */}
            <div className="h-[38vh] md:order-2 md:h-auto" aria-hidden="true" />

            <div className="text-center md:order-1 md:text-start">
              <p className="text-xs tracking-luxury text-gold">אטלייה · {BRAND.city}</p>
              <h1 className="mt-6 max-w-xl text-3xl font-normal leading-tight tracking-luxury sm:text-5xl">
                {BRAND.tagline}
              </h1>
              <p className="mt-6 max-w-md leading-relaxed text-cream/70 max-md:mx-auto">
                זהב 14 ו-18 קראט בעבודת יד, יהלומים טבעיים ויהלומי מעבדה. כל תכשיט נולד
                בסטודיו בתל אביב.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4 md:justify-start">
                <Link
                  to={ROUTES.catalog}
                  className="rounded-full border border-gold px-8 py-3 text-sm tracking-wide text-cream transition-colors hover:bg-gold hover:text-charcoal"
                >
                  לצפייה בקולקציה
                </Link>
                <a
                  href={whatsappUrl()}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full px-8 py-3 text-sm tracking-wide text-cream/80 underline-offset-4 transition-colors hover:text-cream hover:underline"
                >
                  עזרה בבחירת מתנה
                </a>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <Collections />
      <FeaturedProducts />
      <DanaStory />
      <WhyNoga />
      <Testimonials />
      <GiftGuide />
      <InstagramNewsletter />
    </>
  );
}
