import { useStore } from '@nanostores/react';
import { currentLanguage } from '../i18n/store';
import { useTranslations } from '../i18n/utils';

export default function Hero() {
  const lang = useStore(currentLanguage);
  const { t } = useTranslations(lang);

  return (
    <section 
      id="home" 
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      aria-labelledby="hero-heading"
    >
      {/* Background gradient */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950/20 to-purple-950/20"
        aria-hidden="true"
      ></div>
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-4 -left-4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 -right-8 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-700"></div>
        <div className="absolute bottom-8 left-1/3 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="space-y-8">
          {/* Greeting */}
          <div className="animate-fade-in-up">
            <span className="inline-block px-4 py-2 bg-blue-500/20 backdrop-blur-sm border border-blue-400/30 rounded-full text-blue-300 text-sm font-medium mb-6">
              {t('hero.greeting')}
            </span>
          </div>

          {/* Main heading */}
          <h1 
            id="hero-heading"
            className="text-5xl md:text-7xl font-bold leading-tight animate-fade-in-up delay-200"
          >
            <span className="block text-white">{t('hero.title.line1')}</span>
            <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
              {t('hero.title.line2')}
            </span>
            <span className="block text-white">{t('hero.title.line3')}</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed animate-fade-in-up delay-400">
            {(() => {
              const subtitle = t('hero.subtitle');
              const parts = subtitle.split(/\b(React|Node\.js)\b/);
              
              return parts.map((part, index) => {
                if (part === 'React') {
                  return <span key={index} className="text-blue-400 font-semibold" aria-label="React">React</span>;
                } else if (part === 'Node.js') {
                  return <span key={index} className="text-green-400 font-semibold" aria-label="Node.js">Node.js</span>;
                } else {
                  return <span key={index}>{part}</span>;
                }
              });
            })()}
          </p>

          {/* CTA Buttons */}
          <div 
            className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up delay-600"
            role="group"
            aria-label={lang === 'es' ? "Botones de acción principal" : "Main action buttons"}
          >
            <a 
              href="#contact" 
              className="group px-8 py-4 w-[300px] bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-blue-500/25 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900"
              aria-label={lang === 'es' ? "Contáctame para proyectos" : "Contact me for projects"}
            >
              <span className="flex items-center gap-2">
                {t('hero.cta.primary')}
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
            </a>
            
            <a 
              href="#about" 
              className="px-8 py-4 w-[300px] border-2 border-gray-600 text-white font-semibold rounded-xl hover:bg-white hover:text-slate-900 transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-slate-900"
              aria-label={lang === 'es' ? "Conoce más sobre mí" : "Learn more about me"}
            >
              {t('hero.cta.secondary')}
            </a>
          </div>

          {/* Scroll indicator */}
          <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce delay-1000">
            <a 
              href="#about" 
              className="text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:rounded-full p-1"
              aria-label={lang === 'es' ? "Desplazarse hacia abajo para más información" : "Scroll down for more information"}
            >
              <svg 
                className="w-10 h-10" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                aria-hidden="true"
                role="img"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}