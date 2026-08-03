import { Link } from 'react-router-dom';
import { collections } from '@/data/collections';
import { ROUTES } from '@/lib/constants';
import { Container } from '@/components/common/Container';
import { Reveal } from '@/components/common/Reveal';
import { SectionHeading } from '@/components/common/SectionHeading';
import { CatalogImage } from '@/components/common/CatalogImage';
import { ImageReveal } from '@/components/motion/ImageReveal';

export function Collections() {
  return (
    <section className="bg-cream py-20 sm:py-28" aria-labelledby="collections-title">
      <Container>
        <Reveal>
          <SectionHeading
            kicker="הקולקציה"
            title={<span id="collections-title">ארבע דרכים להתחיל</span>}
          />
        </Reveal>

        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {collections.map((collection, i) => (
            <li key={collection.slug}>
              <Reveal delay={i * 0.06}>
                <Link
                  to={
                    collection.category === 'custom'
                      ? ROUTES.custom
                      : `${ROUTES.catalog}?category=${collection.category}`
                  }
                  className="group block"
                >
                  <ImageReveal delay={i * 0.05} className="rounded-sm">
                    <CatalogImage
                      name={collection.image}
                      alt={collection.imageAlt}
                      className="aspect-[4/5] w-full transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                    />
                  </ImageReveal>
                  <h3 className="mt-5 text-lg text-charcoal transition-colors group-hover:text-gold">
                    {collection.name}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-stone">
                    {collection.description}
                  </p>
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
