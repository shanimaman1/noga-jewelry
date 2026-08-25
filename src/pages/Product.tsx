import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import type { GoldKarat, Metal } from '@/types/catalog';
import { METAL_LABELS } from '@/types/catalog';
import { getProduct, products } from '@/data/products';
import { ringSizes, necklaceLengths, braceletLengths } from '@/data/sizes';
import { ROUTES, whatsappUrl } from '@/lib/constants';
import { formatPrice, installmentNote } from '@/lib/format';
import { useCart } from '@/lib/cart/store';
import { Container } from '@/components/common/Container';
import { Reveal } from '@/components/common/Reveal';
import { ProductCard } from '@/components/catalog/ProductCard';
import { AvailabilityStatus } from '@/components/catalog/AvailabilityStatus';
import { Gallery } from '@/components/product/Gallery';
import { TrustStrip } from '@/components/product/TrustStrip';
import { SizeGuideModal } from '@/components/product/SizeGuideModal';
import { Seo } from '@/components/seo/Seo';
import { productImage } from '@/data/products';
import { SITE_URL } from '@/lib/seo';
import { stoneDescription } from '@/lib/productMaterials';
import {
  careServiceText,
  resizingPolicyText,
  specialOrderReturnsText,
} from '@/lib/servicePolicies';
import {
  DELIVERY_TIMES,
  SHIPPING,
  availabilityDetail,
  schemaAvailability,
  shippingCostText,
} from '@/lib/fulfillment';
import { NotFound } from './NotFound';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function Product() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const product = slug ? getProduct(slug) : undefined;

  if (!product) return <NotFound />;
  const initialKarat: GoldKarat =
    searchParams.get('karat') === '18' && product.availableIn18K ? 18 : 14;
  return <ProductView key={`${product.slug}-${initialKarat}`} product={product} initialKarat={initialKarat} />;
}

function ProductView({
  product,
  initialKarat,
}: {
  product: NonNullable<ReturnType<typeof getProduct>>;
  initialKarat: GoldKarat;
}) {
  const add = useCart((s) => s.add);
  const [metal, setMetal] = useState<Metal>(product.metals[0].id);
  const [karat, setKarat] = useState<GoldKarat>(initialKarat);
  const variant = product.metals.find((m) => m.id === metal) ?? product.metals[0];
  const [size, setSize] = useState<string>('');
  const [sizeError, setSizeError] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [added, setAdded] = useState(false);
  const [restockOpen, setRestockOpen] = useState(false);
  const [restockEmail, setRestockEmail] = useState('');
  const [restockError, setRestockError] = useState('');
  const [restockSent, setRestockSent] = useState(false);
  const restockAreaRef = useRef<HTMLDivElement>(null);
  const restockInputRef = useRef<HTMLInputElement>(null);

  // Size options depend on the category; earrings have none.
  const sizeOptions = useMemo(() => {
    if (product.category === 'rings') return ringSizes.map((r) => r.size);
    if (product.category === 'necklaces') return necklaceLengths;
    if (product.category === 'bracelets') return braceletLengths;
    return [];
  }, [product.category]);

  const sizeLabel = product.category === 'rings' ? 'מידה' : 'אורך';
  const needsSize = sizeOptions.length > 0;
  const selectedPrice = karat === 18 && product.availableIn18K ? product.price18K : product.price;
  const selectedAvailability = karat === 18 ? 'made-to-order' : product.availability;

  // Clear the "added" confirmation when the selection changes.
  useEffect(() => setAdded(false), [metal, karat, size]);

  const related = products
    .filter((p) => p.slug !== product.slug && p.category === product.category)
    .concat(products.filter((p) => p.slug !== product.slug && p.category !== product.category))
    .slice(0, 4);

  const handleAdd = () => {
    if (selectedAvailability === 'out-of-stock') return;
    if (needsSize && !size) {
      setSizeError(true);
      return;
    }
    setSizeError(false);
    add({
      slug: product.slug,
      sku: product.sku,
      name: product.name,
      price: selectedPrice,
      image: variant.image,
      metal,
      karat,
      size: size || undefined,
    });
    setAdded(true);
  };

  const openRestock = (scroll = false) => {
    setRestockOpen(true);
    window.requestAnimationFrame(() => {
      if (scroll) restockAreaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      restockInputRef.current?.focus();
    });
  };

  const handleRestock = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = restockEmail.trim();
    if (!EMAIL_RE.test(email)) {
      setRestockError('כתובת המייל לא נראית תקינה');
      restockInputRef.current?.focus();
      return;
    }

    // DEMO ONLY — no request leaves the browser. In production this would
    // subscribe the shopper through the store inventory system, with EmailJS
    // / Formspree or a server endpoint delivering the confirmation.
    setRestockError('');
    setRestockSent(true);
  };

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    sku: product.sku,
    description: product.shortDescription,
    image: `${SITE_URL}${productImage(variant.image, 'full')}`,
    brand: { '@type': 'Brand', name: 'NOGA Fine Jewelry' },
    category: product.category,
    offers: {
      '@type': 'Offer',
      price: selectedPrice,
      priceCurrency: 'ILS',
      availability: schemaAvailability[selectedAvailability],
      url: `${SITE_URL}${ROUTES.product}/${product.slug}`,
    },
  };

  return (
    <>
      <Seo
        title={product.name}
        description={product.shortDescription}
        path={`${ROUTES.product}/${product.slug}`}
        image={productImage(variant.image, 'full')}
        type="product"
        jsonLd={productJsonLd}
      />
      <div className="py-10 sm:py-16">
        <Container>
          {/* Breadcrumb */}
          <nav aria-label="מיקום באתר" className="text-xs text-stone">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link to={ROUTES.home} className="hover:text-gold">
                  בית
                </Link>
              </li>
              <li aria-hidden="true">·</li>
              <li>
                <Link to={ROUTES.catalog} className="hover:text-gold">
                  קטלוג
                </Link>
              </li>
              <li aria-hidden="true">·</li>
              <li aria-current="page" className="text-charcoal">
                {product.name}
              </li>
            </ol>
          </nav>

          <div className="mt-8 grid gap-10 md:grid-cols-2 md:gap-14">
            {/* Gallery — shows the real photograph of the selected metal */}
            <Gallery variant={variant} name={product.name} has3D={product.has3D} />

            {/* Details */}
            <div>
              <h1 className="text-3xl sm:text-4xl">{product.name}</h1>
              <p className="mt-2 text-xs text-stone">
                מספר קטלוגי: <bdi>{product.sku}</bdi>
              </p>
              <p className="mt-4 text-xl text-charcoal">{formatPrice(selectedPrice)}</p>
              <p className="mt-1 text-sm text-stone">{installmentNote()}</p>
              <div className="mt-4">
                <AvailabilityStatus availability={selectedAvailability} prominent />
                <p className="mt-2 text-sm leading-relaxed text-stone">
                  {availabilityDetail(selectedAvailability)}
                </p>
              </div>

              <p className="mt-6 leading-relaxed text-stone">{product.shortDescription}</p>

              {/* Metal — a selector only when more than one metal is genuinely
                  photographed; otherwise just state the metal. */}
              {product.metals.length > 1 ? (
                <fieldset className="mt-8">
                  <legend className="text-sm text-charcoal">
                    מתכת<span className="text-stone"> · {METAL_LABELS[metal]}</span>
                  </legend>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {product.metals.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setMetal(option.id)}
                        aria-pressed={metal === option.id}
                        className={`rounded-full border px-5 py-2 text-sm transition-colors ${
                          metal === option.id
                            ? 'border-gold text-charcoal'
                            : 'border-mist text-stone hover:border-stone'
                        }`}
                      >
                        {METAL_LABELS[option.id]}
                      </button>
                    ))}
                  </div>
                </fieldset>
              ) : (
                <p className="mt-8 text-sm text-charcoal">
                  מתכת<span className="text-stone"> · {METAL_LABELS[metal]}</span>
                </p>
              )}

              {product.availableIn18K ? (
                <fieldset className="mt-8">
                  <legend className="text-sm text-charcoal">
                    קראט<span className="text-stone"> · {karat} קראט</span>
                  </legend>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {([14, 18] as const).map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setKarat(option)}
                        aria-pressed={karat === option}
                        className={`rounded-full border px-5 py-2 text-sm transition-colors ${
                          karat === option
                            ? 'border-gold text-charcoal'
                            : 'border-mist text-stone hover:border-stone'
                        }`}
                      >
                        {option} קראט
                      </button>
                    ))}
                  </div>
                  {karat === 18 && (
                    <p className="mt-3 text-sm leading-relaxed text-stone">
                      זו הזמנה מיוחדת בזהב 18 קראט. יש להוסיף {DELIVERY_TIMES.madeToOrder}.
                    </p>
                  )}
                </fieldset>
              ) : (
                <p className="mt-4 text-sm leading-relaxed text-stone">
                  {product.eighteenKExclusionReason}
                </p>
              )}

              {/* Size selector */}
              {needsSize && (
                <fieldset className="mt-8">
                  <div className="flex items-center justify-between gap-4">
                    <legend className="text-sm text-charcoal">{sizeLabel}</legend>
                    {product.category === 'rings' && (
                      <button
                        type="button"
                        onClick={() => setGuideOpen(true)}
                        className="text-sm text-stone underline underline-offset-4 transition-colors hover:text-gold"
                      >
                        מדריך מידות
                      </button>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {sizeOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => {
                          setSize(option);
                          setSizeError(false);
                        }}
                        aria-pressed={size === option}
                        className={`min-w-12 rounded-full border px-4 py-2 text-sm transition-colors ${
                          size === option
                            ? 'border-gold text-charcoal'
                            : 'border-mist text-stone hover:border-stone'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                  {sizeError && (
                    <p role="alert" className="mt-3 text-sm text-red-800">
                      צריך לבחור {sizeLabel} לפני ההוספה לעגלה
                    </p>
                  )}
                  {product.category === 'rings' && (
                    <p className="mt-3 text-sm leading-relaxed text-stone">
                      {resizingPolicyText()}
                    </p>
                  )}
                </fieldset>
              )}

              {selectedAvailability === 'made-to-order' && (
                <section className="mt-8 rounded-sm border border-mist p-4" aria-labelledby="special-order-note">
                  <h2 id="special-order-note" className="text-sm text-charcoal">חשוב לפני ההזמנה</h2>
                  <p className="mt-2 text-sm leading-relaxed text-stone">
                    {specialOrderReturnsText()}
                  </p>
                  <Link
                    to={ROUTES.returnsService}
                    className="mt-3 inline-block text-sm text-stone underline underline-offset-4 transition-colors hover:text-charcoal"
                  >
                    למדיניות המלאה
                  </Link>
                </section>
              )}

              {/* Purchase / restock action */}
              <div ref={restockAreaRef} className="mt-8">
                {selectedAvailability === 'out-of-stock' ? (
                  restockSent ? (
                    <p
                      role="status"
                      className="rounded-sm border border-gold/50 p-4 text-sm leading-relaxed text-charcoal"
                    >
                      קיבלנו את הכתובת. זו הדגמה בלבד, ולא נשלח מייל בפועל.
                    </p>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => openRestock()}
                        aria-expanded={restockOpen}
                        className="w-full rounded-full border border-charcoal px-8 py-4 text-sm tracking-wide text-charcoal transition-colors hover:bg-charcoal hover:text-cream"
                      >
                        עדכנו אותי כשחוזר למלאי
                      </button>
                      {restockOpen && (
                        <form onSubmit={handleRestock} noValidate className="mt-4">
                          <label htmlFor="restock-email" className="block text-sm text-charcoal">
                            אימייל לעדכון
                          </label>
                          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                            <input
                              id="restock-email"
                              ref={restockInputRef}
                              type="email"
                              inputMode="email"
                              autoComplete="email"
                              dir="ltr"
                              value={restockEmail}
                              onChange={(event) => {
                                setRestockEmail(event.target.value);
                                setRestockError('');
                              }}
                              aria-invalid={restockError ? true : undefined}
                              aria-describedby={restockError ? 'restock-error' : undefined}
                              placeholder="your@email.com"
                              className={`min-w-0 flex-1 rounded-md border bg-transparent px-4 py-3 text-charcoal placeholder:text-stone/50 focus:outline-none ${
                                restockError ? 'border-red-700' : 'border-mist focus:border-gold'
                              }`}
                            />
                            <button
                              type="submit"
                              className="rounded-full bg-charcoal px-7 py-3 text-sm text-cream transition-colors hover:bg-charcoal/90"
                            >
                              בדיקת כתובת
                            </button>
                          </div>
                          {restockError && (
                            <p id="restock-error" role="alert" className="mt-2 text-xs text-red-800">
                              {restockError}
                            </p>
                          )}
                          <p className="mt-2 text-xs text-stone">
                            מצב הדגמה - הכתובת אינה נשלחת ולא נשמרת.
                          </p>
                        </form>
                      )}
                    </>
                  )
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleAdd}
                      className="w-full rounded-full bg-charcoal px-8 py-4 text-sm tracking-wide text-cream transition-colors hover:bg-charcoal/90"
                    >
                      הוסף לעגלה
                    </button>
                    <p role="status" className="mt-3 min-h-5 text-center text-sm text-stone">
                      {added && (
                        <>
                          הפריט נוסף לעגלה.{' '}
                          <Link to={ROUTES.cart} className="text-charcoal underline underline-offset-4">
                            למעבר לעגלה
                          </Link>
                        </>
                      )}
                    </p>
                  </>
                )}
              </div>

              {selectedAvailability !== 'out-of-stock' && (
              <section className="mt-8 border-t border-mist pt-6" aria-labelledby="delivery-times-title">
                <h2 id="delivery-times-title" className="text-base text-charcoal">
                  מסירה ואיסוף
                </h2>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex gap-3">
                    <dt className="w-28 shrink-0 text-stone">משלוח לבית</dt>
                    <dd className="text-charcoal">
                      {DELIVERY_TIMES.home} · {shippingCostText(SHIPPING.home)}
                    </dd>
                  </div>
                  <div className="flex gap-3">
                    <dt className="w-28 shrink-0 text-stone">איסוף מהסטודיו</dt>
                    <dd className="text-charcoal">
                      {DELIVERY_TIMES.collection} · חינם
                    </dd>
                  </div>
                </dl>
                {selectedAvailability === 'made-to-order' && (
                  <p className="mt-4 text-sm leading-relaxed text-stone">
                    לפריט זה יש להוסיף {DELIVERY_TIMES.madeToOrder}; לאחר מכן חל זמן המסירה שבחרת.
                  </p>
                )}
              </section>
              )}

              <Link
                to={ROUTES.visit}
                className="mt-4 inline-block text-sm text-stone underline underline-offset-4 transition-colors hover:text-charcoal"
              >
                לראות את התכשיט באטלייה
              </Link>

              <div className="mt-4">
                <TrustStrip stones={product.stones} availability={selectedAvailability} />
              </div>

              {/* Materials & care */}
              <section className="mt-8">
                <h2 className="text-base text-charcoal">חומרים ופרטים</h2>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex gap-3">
                    <dt className="w-28 shrink-0 text-stone">מתכת</dt>
                    <dd className="text-charcoal">
                      זהב {karat} קראט מלא ({METAL_LABELS[metal]}).
                    </dd>
                  </div>
                  <div className="flex gap-3">
                    <dt className="w-28 shrink-0 text-stone">משקל זהב</dt>
                    <dd className="text-charcoal">כ־{product.goldWeightGrams} גרם</dd>
                  </div>
                  <div className="flex gap-3">
                    <dt className="w-28 shrink-0 text-stone">אבנים</dt>
                    <dd className="text-charcoal">{stoneDescription(product.stones)}</dd>
                  </div>
                  <div className="flex gap-3">
                    <dt className="w-28 shrink-0 text-stone">ייצור</dt>
                    <dd className="text-charcoal">
                      עבודת יד בסטודיו בתל אביב. {availabilityDetail(selectedAvailability)}
                    </dd>
                  </div>
                  <div className="flex gap-3">
                    <dt className="w-28 shrink-0 text-stone">טיפוח</dt>
                    <dd className="text-charcoal">
                      להסיר לפני מקלחת וים. לניקוי, מים פושרים וסבון עדין, ולייבש במטלית רכה. {careServiceText()}
                    </dd>
                  </div>
                </dl>
              </section>
            </div>
          </div>
        </Container>
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <section className="bg-cream pb-20 sm:pb-28" aria-labelledby="related-title">
          <Container>
            <Reveal>
              <h2 id="related-title" className="text-2xl sm:text-3xl">
                מוצרים דומים
              </h2>
            </Reveal>
            <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((item, i) => (
                <li key={item.slug}>
                  <Reveal delay={i * 0.06}>
                    <ProductCard product={item} />
                  </Reveal>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}

      {/* Sticky add-to-cart on mobile */}
      <div className="sticky bottom-0 z-30 border-t border-mist bg-cream/95 px-5 py-3 backdrop-blur md:hidden">
        <div className="flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-charcoal">{product.name}</p>
            <p className="text-sm text-stone">{formatPrice(selectedPrice)}</p>
          </div>
          {selectedAvailability === 'out-of-stock' ? (
            <button
              type="button"
              onClick={() => openRestock(true)}
              className="shrink-0 rounded-full border border-charcoal px-5 py-3 text-sm text-charcoal"
            >
              עדכנו אותי
            </button>
          ) : (
            <button
              type="button"
              onClick={handleAdd}
              className="shrink-0 rounded-full bg-charcoal px-7 py-3 text-sm tracking-wide text-cream"
            >
              הוסף לעגלה
            </button>
          )}
        </div>
      </div>

      {/* Product-specific WhatsApp */}
      <a
        href={whatsappUrl(`היי, אשמח לפרטים על ${product.name}`)}
        target="_blank"
        rel="noreferrer"
        aria-label={`שאלה על ${product.name} בוואטסאפ`}
        className="fixed bottom-20 start-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-gold text-charcoal shadow-lg transition-transform hover:scale-105 md:bottom-5"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2a10 10 0 0 0-8.6 15.05L2 22l5.1-1.33A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.18-1.14l-.3-.18-3.03.79.81-2.95-.2-.31A8.2 8.2 0 1 1 12 20.2Zm4.5-6.14c-.25-.12-1.47-.72-1.7-.8-.23-.09-.4-.13-.56.12-.17.25-.64.8-.79.97-.14.16-.29.18-.54.06a6.7 6.7 0 0 1-3.3-2.9c-.25-.42.25-.39.71-1.31.08-.16.04-.3-.02-.42-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.42h-.48c-.16 0-.42.06-.64.31-.22.25-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.7 2.6 4.12 3.64 1.53.66 2.13.72 2.9.6.46-.06 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.11-.22-.17-.47-.29Z" />
        </svg>
      </a>

      <SizeGuideModal open={guideOpen} onClose={() => setGuideOpen(false)} />
    </>
  );
}
