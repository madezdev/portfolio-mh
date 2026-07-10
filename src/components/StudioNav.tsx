import { useStore } from '@nanostores/react';
import { currentLanguage } from '../i18n/store';
import { useTranslations } from '../i18n/utils';
import LanguageToggle from './LanguageToggle';

export default function StudioNav() {
  const lang = useStore(currentLanguage);
  const { t } = useTranslations(lang);

  const links = [
    { href: '#services', label: t('nav.services') },
    { href: '#cases', label: t('nav.cases') },
    { href: '#process', label: t('nav.process') },
  ];

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-ink-950/70 backdrop-blur-md border-b border-ink-800">
      <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="#top" className="font-display text-lg font-bold tracking-tight text-fg">
          {t('brand.name')}
        </a>
        <div className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="text-sm text-fg-muted hover:text-fg transition-colors">
              {link.label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <LanguageToggle />
          <a
            href="#contact"
            className="rounded-full bg-ember-500 px-4 py-2 text-sm font-semibold text-ink-950 hover:bg-ember-400 transition-colors"
          >
            {t('nav.contactCta')}
          </a>
        </div>
      </nav>
    </header>
  );
}
