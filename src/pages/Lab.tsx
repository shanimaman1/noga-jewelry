import { LabExperience } from '@/three/lab/LabExperience';

/**
 * /lab — Phase 1a isolation route. Full-screen 3D materials & lighting lab,
 * nothing else on the page. Lazy-loaded (default export) so three/drei/leva
 * for this page stay out of the main bundle.
 */
export default function Lab() {
  return <LabExperience />;
}
