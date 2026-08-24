import { useRef } from 'react';
import { BRAND, DEMO_CONTACT_LABEL, ROUTES, STUDIO, whatsappUrl } from '@/lib/constants';
import { Container } from '@/components/common/Container';
import { Seo } from '@/components/seo/Seo';
import { useHeroInViewObserver } from '@/hooks/useHeroInViewObserver';

const encodedAddress = encodeURIComponent(STUDIO.address);
const mapUrl = `https://www.google.com/maps?q=${encodedAddress}&output=embed`;
const wazeUrl = `https://www.waze.com/ul?q=${encodedAddress}&navigate=yes`;

export function Visit() {
  const heroRef = useRef<HTMLElement>(null);
  useHeroInViewObserver(heroRef);

  return (
    <>
      <Seo
        title="ביקור בסטודיו"
        description={`ביקור בסטודיו של נוגה, ${STUDIO.address}. שעות פתיחה, ניווט ותיאום מראש.`}
        path={ROUTES.visit}
      />

      <section
        ref={heroRef}
        className="flex min-h-[52vh] items-center bg-charcoal py-20 text-cream sm:py-28"
      >
        <Container className="max-w-3xl text-center">
          <p className="text-xs tracking-luxury text-gold">נווה צדק · תל אביב</p>
          <h1 className="mt-4 text-3xl font-normal leading-snug sm:text-5xl">
            ביקור בסטודיו
          </h1>
          <p className="mx-auto mt-6 max-w-xl leading-relaxed text-cream/70">
            אפשר לראות את התכשיטים מקרוב, למדוד ולשבת לשיחה שקטה. מומלץ לתאם את
            הביקור מראש כדי שנוכל להקדיש לך זמן.
          </p>
        </Container>
      </section>

      <section className="bg-cream py-16 sm:py-24" aria-labelledby="visit-details-title">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
            <div className="overflow-hidden rounded-sm border border-mist bg-mist/30">
              <iframe
                title={`מפה אל ${STUDIO.address}`}
                src={mapUrl}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="aspect-[4/3] w-full border-0 sm:aspect-[16/10]"
                allowFullScreen
              />
            </div>

            <div>
              <p className="text-xs tracking-luxury text-gold">פרטים</p>
              <h2 id="visit-details-title" className="mt-4 text-2xl sm:text-3xl">
                להגיע לנוגה
              </h2>

              <dl className="mt-8 space-y-7 max-sm:pe-28">
                <div className="border-t border-mist pt-5">
                  <dt className="text-sm text-stone">כתובת</dt>
                  <dd className="mt-2 text-charcoal">{STUDIO.address}</dd>
                  <a
                    href={wazeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-2 text-sm text-charcoal underline underline-offset-4 transition-colors hover:text-gold"
                  >
                    ניווט ב־Waze
                    <svg
                      width="14"
                      height="14"
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
                  </a>
                </div>

                <div className="border-t border-mist pt-5">
                  <dt className="text-sm text-stone">שעות פתיחה</dt>
                  <dd className="mt-3">
                    <ul className="space-y-2 text-sm">
                      {STUDIO.hours.map((row) => (
                        <li key={row.days} className="flex items-center justify-between gap-6">
                          <span className="text-charcoal">{row.days}</span>
                          <span className="text-stone" dir="ltr">
                            {row.hours}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>

                <div className="border-t border-mist pt-5">
                  <dt className="text-sm text-stone">טלפון / WhatsApp</dt>
                  <dd className="mt-2">
                    <a
                      href={whatsappUrl('היי, אשמח לתאם ביקור בסטודיו')}
                      target="_blank"
                      rel="noreferrer"
                      className="text-charcoal underline underline-offset-4 transition-colors hover:text-gold"
                    >
                      <bdi>{BRAND.whatsapp}</bdi>
                    </a>
                  </dd>
                </div>

                <div className="border-t border-mist pt-5">
                  <dt className="text-sm text-stone">אימייל</dt>
                  <dd className="mt-2">
                    <a
                      href={`mailto:${BRAND.email}`}
                      className="text-charcoal underline underline-offset-4 transition-colors hover:text-gold"
                    >
                      {BRAND.email}
                    </a>{' '}
                    <span className="text-sm text-stone">({DEMO_CONTACT_LABEL})</span>
                  </dd>
                </div>

                <div className="border-t border-mist pt-5">
                  <dt className="text-sm text-stone">Instagram</dt>
                  <dd className="mt-2">
                    <a
                      href={`https://instagram.com/${BRAND.instagram}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-charcoal underline underline-offset-4 transition-colors hover:text-gold"
                    >
                      @{BRAND.instagram}
                    </a>{' '}
                    <span className="text-sm text-stone">({DEMO_CONTACT_LABEL})</span>
                  </dd>
                </div>
              </dl>

              <p className="mt-8 rounded-sm border border-mist p-5 text-sm leading-relaxed text-stone max-sm:me-28">
                אפשר להגיע בשעות הפתיחה, אך מומלץ לתאם מראש, במיוחד למדידה,
                התאמה אישית או פגישה על תכשיט בהזמנה.
              </p>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
