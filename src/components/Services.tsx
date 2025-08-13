import { useStore } from '@nanostores/react';
import { currentLanguage } from '../i18n/store';
import { useTranslations } from '../i18n/utils';

export default function Services() {
  const lang = useStore(currentLanguage);
  const { t } = useTranslations(lang);

  const services = [
    {
      key: 'frontend',
      icon: '🌐',
      color: 'blue',
      hoverColor: 'blue-500/50'
    },
    {
      key: 'backend', 
      icon: '⚙️',
      color: 'green',
      hoverColor: 'green-500/50'
    },
    {
      key: 'design',
      icon: '🎨', 
      color: 'purple',
      hoverColor: 'purple-500/50'
    },
    {
      key: 'mobile',
      icon: '📱',
      color: 'orange', 
      hoverColor: 'orange-500/50'
    },
    {
      key: 'saas',
      icon: '☁️',
      color: 'indigo',
      hoverColor: 'indigo-500/50'
    },
    {
      key: 'custom',
      icon: '🛠️',
      color: 'pink',
      hoverColor: 'pink-500/50'
    }
  ];

  return (
    <section 
      id="services" 
      className="py-20 bg-slate-950"
      aria-labelledby="services-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 
            id="services-heading"
            className="text-4xl md:text-5xl font-bold text-white mb-6"
          >
            {t('services.title').split(' ').slice(0, -1).join(' ')}{' '}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {t('services.title').split(' ').slice(-1)[0]}
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            {t('services.subtitle')}
          </p>
          <div 
            className="w-24 h-1 bg-gradient-to-r from-blue-400 to-purple-400 mx-auto rounded-full mt-6"
            aria-hidden="true"
          ></div>
        </div>

        <div 
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          role="list"
          aria-label={lang === 'es' ? "Lista de servicios" : "Services list"}
        >
          {services.map((service) => (
            <div 
              key={service.key}
              className={`group relative bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-8 hover:border-${service.hoverColor} transition-all duration-300 hover:transform hover:scale-105`}
              role="listitem"
              tabIndex={0}
              aria-labelledby={`service-title-${service.key}`}
            >
              <div 
                className={`absolute inset-0 bg-gradient-to-br from-${service.color}-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                aria-hidden="true"
              ></div>
              
              <div className="relative z-10">
                <div 
                  className={`w-16 h-16 bg-${service.color}-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-${service.color}-500/30 transition-colors`}
                  aria-hidden="true"
                >
                  <span className="text-3xl">{service.icon}</span>
                </div>
                
                <h3 
                  id={`service-title-${service.key}`}
                  className="text-2xl font-bold text-white mb-4"
                >
                  {t(`services.items.${service.key}.title`)}
                </h3>
                <p className="text-gray-300 mb-6">
                  {t(`services.items.${service.key}.description`)}
                </p>
                
                <ul 
                  className="space-y-2"
                  aria-label={lang === 'es' ? "Características" : "Features"}
                >
                  {Array.from({ length: 4 }, (_, i) => (
                    <li key={i} className="flex items-center text-gray-400">
                      <span className={`text-${service.color}-400 mr-2`} aria-hidden="true">→</span>
                      {t(`services.items.${service.key}.features.${i}`)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}