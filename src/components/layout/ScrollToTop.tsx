import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Reset scroll to top on route change (SPA navigation). */
export function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, [pathname]);
  return null;
}
