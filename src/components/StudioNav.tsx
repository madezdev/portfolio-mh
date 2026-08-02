import { useRef } from 'react';
import { useStore } from '@nanostores/react';
import { currentLanguage } from '../i18n/store';
import { useTranslations } from '../i18n/utils';
import { gsap, ScrollTrigger, useGSAP } from '../lib/gsap';
import { useMagnetic } from '../hooks/useMagnetic';
import LanguageToggle from './LanguageToggle';

export default function StudioNav() {
  const lang = useStore(currentLanguage);
  const { t } = useTranslations(lang);
  const headerRef = useRef<HTMLElement>(null);
  const ctaRef = useMagnetic<HTMLAnchorElement>(0.4);

  const links = [
    { href: '#services', label: t('nav.services') },
    { href: '#cases', label: t('nav.cases') },
    { href: '#process', label: t('nav.process') },
  ];

  // Glass-on-scroll: transparent over the hero, solidifies once you scroll.
  useGSAP(
    () => {
      const el = headerRef.current;
      if (!el) return;
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      gsap.set(el, { backgroundColor: 'rgba(10,10,11,0)', borderColor: 'rgba(38,38,44,0)' });
      ScrollTrigger.create({
        start: 60,
        end: 99999,
        onToggle: (self) =>
          gsap.to(el, {
            backgroundColor: self.isActive ? 'rgba(10,10,11,0.85)' : 'rgba(10,10,11,0)',
            borderColor: self.isActive ? 'rgba(38,38,44,1)' : 'rgba(38,38,44,0)',
            duration: reduce ? 0 : 0.35,
            ease: 'power2.out',
          }),
      });
    },
    { scope: headerRef },
  );

  return (
    <header ref={headerRef} className="fixed inset-x-0 top-0 z-50 border-b border-transparent backdrop-blur-md">
      {/* Three tracks with equal outer columns, so the links land on the page's true
          centre line and read as aligned with the hero. `justify-between` centred them
          in the leftover space instead, which the wide language toggle and CTA pushed
          off-centre by half their excess width over the wordmark. Columns are placed
          explicitly because the links are display:none below md. */}
      <nav className="mx-auto grid h-16 max-w-6xl grid-cols-[1fr_auto_1fr] items-center px-6">
        <a href="#top" className="justify-self-start font-display text-lg font-bold tracking-tight text-fg">
          {t('brand.name')}
        </a>
        <div className="col-start-2 hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="text-sm text-fg-muted transition-colors hover:text-fg">
              {link.label}
            </a>
          ))}
        </div>
        <div className="col-start-3 flex items-center justify-self-end gap-4">
          <LanguageToggle />
          <a
            ref={ctaRef}
            href="#contact"
            // Without nowrap the label is allowed to wrap, so the equal-width outer
            // track squeezes the pill into two lines on narrow desktops instead of
            // claiming the width it needs.
            className="inline-block whitespace-nowrap rounded-full bg-ember-500 px-4 py-2 text-sm font-semibold text-ink-950 transition-colors hover:bg-ember-400"
          >
            {t('nav.contactCta')}
          </a>
        </div>
      </nav>
    </header>
  );
}
