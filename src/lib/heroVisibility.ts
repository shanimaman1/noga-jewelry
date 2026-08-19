import { create } from 'zustand';

type HeroVisibilityState = {
  /**
   * True only while a page's hero section is on screen. Pages without a hero
   * never touch this — it stays false there, so the floating actions show
   * normally everywhere except while scrolled to the top of a page that
   * registers one (currently only Home). See `useHeroInViewObserver`.
   */
  heroInView: boolean;
  setHeroInView: (inView: boolean) => void;
};

/**
 * Not persisted: this is page-scroll state, not user data, and must reset to
 * `false` on every navigation so a page without a hero never inherits a
 * stale "hidden" flag from the last page that had one.
 */
export const useHeroVisibility = create<HeroVisibilityState>((set) => ({
  heroInView: false,
  setHeroInView: (inView) => set({ heroInView: inView }),
}));
