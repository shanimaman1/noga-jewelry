import { Link } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';
import { Container } from '@/components/common/Container';
import { Seo } from '@/components/seo/Seo';

/** 404 route. */
export function NotFound() {
  return (
    <div className="py-28 sm:py-36">
      <Seo title="הדף לא נמצא" description="הדף שחיפשת לא נמצא." path="/404" />
      <Container className="text-center">
        <p className="text-xs tracking-luxury text-gold">404</p>
        <h1 className="mt-4 text-3xl font-normal sm:text-4xl">הדף לא נמצא</h1>
        <p className="mt-4 text-stone">ייתכן שהקישור השתנה או שהעמוד הוסר.</p>
        <Link
          to={ROUTES.home}
          className="mt-8 inline-block rounded-full border border-charcoal px-8 py-3 text-sm tracking-wide transition-colors hover:bg-charcoal hover:text-cream"
        >
          חזרה לדף הבית
        </Link>
      </Container>
    </div>
  );
}
