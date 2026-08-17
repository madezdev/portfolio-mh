import type { Language } from '../i18n/translations';
import { useTranslations } from '../i18n/utils';

const SOCIALS = [
  { name: 'GitHub', href: 'https://github.com/madezdev' },
  { name: 'LinkedIn', href: 'https://www.linkedin.com/company/madezdev' },
];

export default function StudioFooter({ lang }: { lang: Language }) {
  const { t } = useTranslations(lang);
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-ink-800 bg-ink-950">
      <div className="max-w-6xl mx-auto px-6 py-14">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
          <div className="max-w-sm">
            <p className="font-display text-lg font-bold text-fg">{t('brand.name')}</p>
            <p className="mt-3 text-sm text-fg-muted">{t('footer.tagline')}</p>
          </div>
          <nav className="flex gap-6" aria-label={t('footer.navTitle')}>
            {SOCIALS.map((s) => (
              <a key={s.name} href={s.href} className="text-sm text-fg-muted hover:text-ember-400 transition-colors" target="_blank" rel="noopener noreferrer">
                {s.name}
              </a>
            ))}
          </nav>
        </div>
        <div className="mt-12 flex flex-col sm:flex-row justify-between gap-2 text-xs text-fg-muted">
          <p>© {year} {t('brand.name')}. {t('footer.rights')}</p>
          <p>{t('footer.builtWith')}</p>
        </div>
      </div>
    </footer>
  );
}
