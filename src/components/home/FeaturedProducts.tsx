import { Link } from 'react-router-dom';
import { featuredProducts } from '@/data/products';
import { ROUTES } from '@/lib/constants';
import { Container } from '@/components/common/Container';
import { Reveal } from '@/components/common/Reveal';
import { SectionHeading } from '@/components/common/SectionHeading';
import { ProductCard } from '@/components/catalog/ProductCard';

export function FeaturedProducts() {
  return (
    <section className="bg-cream pb-20 sm:pb-28" aria-labelledby="featured-title">
      <Container>
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading
              kicker="נבחרו בקפידה"
              title={<span id="featured-title">פריטים שחוזרים אליהם</span>}
            />
            <Link
              to={ROUTES.catalog}
              className="text-sm tracking-wide text-charcoal underline-offset-4 transition-colors hover:text-gold hover:underline"
            >
              לכל הפריטים
            </Link>
          </div>
        </Reveal>

        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featuredProducts.map((product, i) => (
            <li key={product.slug}>
              <Reveal delay={i * 0.06}>
                <ProductCard product={product} />
              </Reveal>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
