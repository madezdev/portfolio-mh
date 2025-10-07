import { useStore } from '@nanostores/react';
import { currentLanguage } from '../i18n/store';
import { useTranslations } from '../i18n/utils';

export default function About() {
  const lang = useStore(currentLanguage);
  const { t } = useTranslations(lang);

  return (
    <section 
      id="about" 
      className="py-20 bg-slate-900/50"
      aria-labelledby="about-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 
            id="about-heading"
            className="text-4xl md:text-5xl font-bold text-white mb-6"
          >
            {t('about.title').split(' ').slice(0, -1).join(' ')}{' '}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {t('about.title').split(' ').slice(-1)[0]}
            </span>
          </h2>
          <div 
            className="w-24 h-1 bg-gradient-to-r from-blue-400 to-purple-400 mx-auto rounded-full"
            aria-hidden="true"
          ></div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Text content */}
          <div className="space-y-6">
            <div className="space-y-4">
              <p className="text-lg text-gray-300 leading-relaxed">
                {(() => {
                  const description = t('about.description1');
                  const parts = description.split(/\b(Full Stack|UX\/UI)\b/);
                  
                  return parts.map((part, index) => {
                    if (part === 'Full Stack') {
                      return <span key={index} className="text-blue-400 font-semibold" aria-label="Full Stack">Full Stack</span>;
                    } else if (part === 'UX/UI') {
                      return <span key={index} className="text-purple-400 font-semibold" aria-label="UX UI">UX/UI</span>;
                    } else {
                      return <span key={index}>{part}</span>;
                    }
                  });
                })()}
              </p>
              
              <p className="text-lg text-gray-300 leading-relaxed">
                {t('about.description2')}
              </p>
            </div>

            {/* Key points */}
            <div className="grid md:grid-cols-2 gap-6 mt-8" aria-label={lang === 'es' ? "Principales características" : "Key features"}>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center" aria-hidden="true">
                  <span className="text-blue-400 text-lg">💻</span>
                </div>
                <div>
                  <h3 className="text-white font-semibold">{t('about.points.development.title')}</h3>
                  <p className="text-gray-400 text-sm">{t('about.points.development.desc')}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center" aria-hidden="true">
                  <span className="text-purple-400 text-lg">🎨</span>
                </div>
                <div>
                  <h3 className="text-white font-semibold">{t('about.points.design.title')}</h3>
                  <p className="text-gray-400 text-sm">{t('about.points.design.desc')}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center" aria-hidden="true">
                  <span className="text-green-400 text-lg">🚀</span>
                </div>
                <div>
                  <h3 className="text-white font-semibold">{t('about.points.performance.title')}</h3>
                  <p className="text-gray-400 text-sm">{t('about.points.performance.desc')}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center" aria-hidden="true">
                  <span className="text-orange-400 text-lg">🤝</span>
                </div>
                <div>
                  <h3 className="text-white font-semibold">{t('about.points.collaboration.title')}</h3>
                  <p className="text-gray-400 text-sm">{t('about.points.collaboration.desc')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Visual element */}
          <div className="relative">
            <div className="relative bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
              {/* Profile image placeholder */}
              <div 
                className="w-48 h-48 mx-auto bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-6xl mb-6"
                role="img"
                aria-label={lang === 'es' ? "Emoji de desarrollador" : "Developer emoji"}
              >
                <img 
                src="/mh.png" 
                alt="Profile" 
                className="w-full h-full object-cover rounded-full"
                />
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-white">6+</div>
                  <div className="text-sm text-gray-400">{t('about.stats.experience')}</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">50+</div>
                  <div className="text-sm text-gray-400">{t('about.stats.projects')}</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">24/7</div>
                  <div className="text-sm text-gray-400">{t('about.stats.availability')}</div>
                </div>
              </div>
            </div>

            {/* Floating elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-500/20 rounded-full blur-xl"></div>
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-purple-500/20 rounded-full blur-xl"></div>
          </div>
        </div>
      </div>
    </section>
  );
}