import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger } from '../lib/gsap';

/**
 * Reveal the `.reveal` children of a section (by id) on scroll, with stagger.
 * Uses GSAP ScrollTrigger (reliable in every browser, unlike CSS scroll-timeline)
 * and honors reduced-motion: when the user prefers reduced motion the elements
 * are never hidden, so they simply render in place.
 */
export function useReveal(sectionId: string) {
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const items = gsap.utils.toArray<HTMLElement>(`#${sectionId} .reveal`);
      if (!items.length) return;
      gsap.set(items, { autoAlpha: 0, y: 40 });
      ScrollTrigger.batch(items, {
        start: 'top 85%',
        onEnter: (els) =>
          gsap.to(els, {
            autoAlpha: 1,
            y: 0,
            duration: 0.7,
            stagger: 0.12,
            ease: 'power3.out',
            overwrite: true,
          }),
      });
    });
  });
}
